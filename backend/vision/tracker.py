import uuid
import time
import math
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import cv2
from pathlib import Path
from ultralytics import YOLO

from backend.vision.quality_gate import PlateQualityGate
from backend.vision.ocr_reader import PlateReadingAggregator, IndianPlateNormalizer, get_ocr_engine
from backend.vision.spatio_temporal_matcher import SpatioTemporalPlateMatcher
from backend.vision.frame_snapshot import (
    FrameSnapshot,
    capture_frame_snapshot,
    writable_snapshot_view,
    is_plate_class,
    is_vehicle_class,
    padded_plate_crop,
    upscale_small_crop,
    deblur_motion_crop,
    central_zoom_roi,
    vehicle_lower_crop,
)
try:
    from backend.vision.yolo_char_reader import get_yolo_char_engine, YOLOCharacterEngine
    YOLO_CHAR_AVAILABLE = True
except Exception:
    YOLO_CHAR_AVAILABLE = False


class VirtualEntryLine:
    """
    Computes vector intersection to detect when a vehicle crosses an entry line.
    """
    def __init__(self, p1: Tuple[int, int], p2: Tuple[int, int], direction_name: str = "INBOUND"):
        self.p1 = np.array(p1, dtype=float)
        self.p2 = np.array(p2, dtype=float)
        self.direction_name = direction_name

    def has_crossed(self, prev_pos: Tuple[float, float], curr_pos: Tuple[float, float]) -> Tuple[bool, Optional[str]]:
        """
        Determines if line segment (prev_pos, curr_pos) intersects virtual line segment (p1, p2).
        """
        if prev_pos is None or curr_pos is None:
            return False, None

        p = self.p1
        r = self.p2 - self.p1
        q = np.array(prev_pos, dtype=float)
        s = np.array(curr_pos, dtype=float) - q

        r_cross_s = np.cross(r, s)
        q_minus_p = q - p
        q_minus_p_cross_r = np.cross(q_minus_p, r)

        if abs(r_cross_s) < 1e-6:
            return False, None  # Collinear or parallel

        t = np.cross(q_minus_p, s) / r_cross_s
        u = q_minus_p_cross_r / r_cross_s

        if 0.0 <= t <= 1.0 and 0.0 <= u <= 1.0:
            cross_dir = np.cross(r, s)
            direction = self.direction_name if cross_dir > 0 else "OUTBOUND"
            return True, direction

        return False, None


# Offset keeping standalone plate-track ids clear of ByteTrack vehicle ids.
PLATE_TRACK_ID_OFFSET = 100000

# Minimum OCR confidence for a reading to count as track evidence. Below this
# floor the observation is preserved (detection + crop) but the text is not
# fed to the identity aggregator, so the track honestly reports READING
# instead of locking onto a low-confidence misread.
READ_MIN_CONFIDENCE = 0.30


class CameraVisionTracker:
    """
    Production-grade Per-Camera Vehicle and License Plate Tracking Engine.

    SNAPSHOT-FIRST CONTRACT (core rule): all vision work runs ONLY against an
    immutable FrameSnapshot copy. Capture loops must freeze each live frame
    with capture_frame_snapshot() and call process_snapshot(). The legacy
    process_frame() wrapper does exactly that internally, so no caller can
    accidentally run detection on a live/display-mutated frame.

    Incorporates:
      1. Spatio-Temporal Merging (Delta-velocity matching & relative anchor offset)
      2. Multi-Object / Multi-Plate Disambiguation via Hungarian Assignment
      3. Standalone Plate Tracks (plates with no visible vehicle: handheld,
         phone-screen, paper, or missed-vehicle cases are still captured)
      4. Permissive OCR attempts on EVERY passed crop (focal zone weights the
         reading, never blocks it) so all plate types resolve
      5. 2-3 snapshot-frame lock via fast quorum latch in PlateReadingAggregator
      6. Cascaded Vehicle-Crop Zoom + Central Zoom for Far Distance Detection
      7. Resilient Dual-Tier ANPR: Primary YOLO Character Engine + Standby EasyOCR Fallback with Auto-Recovery
    """
    def __init__(
        self,
        camera_id: str,
        weights_path: Path,
        entry_line: Optional[VirtualEntryLine] = None,
        conf_threshold: float = 0.35,
        device: str = "cpu",
        enable_ocr: bool = True,
        engine_type: str = "yolo",
        imgsz: int = 640,
        ocr_min_interval: float = 0.12,
        enable_central_zoom: bool = True
    ):
        self.camera_id = camera_id
        self.weights_path = Path(weights_path)
        self.entry_line = entry_line or VirtualEntryLine((0, 360), (640, 360), "INBOUND")
        self.conf_threshold = conf_threshold
        self.device = device
        self.engine_type = engine_type.lower()
        self.enable_ocr = enable_ocr
        self.imgsz = imgsz
        self.ocr_min_interval = ocr_min_interval
        self.enable_central_zoom = enable_central_zoom

        self.model = YOLO(str(weights_path))
        self.quality_gate = PlateQualityGate()
        self.matcher = SpatioTemporalPlateMatcher()

        # Dual-Tier Engine Architecture: YOLO Primary + EasyOCR Standby
        self.yolo_engine = None
        self.easyocr_engine = None
        self.last_yolo_retry_time = 0.0

        if enable_ocr:
            # 1. Initialize fallback engine so character reading is never dead
            try:
                self.easyocr_engine = get_ocr_engine()
            except Exception:
                pass

            # 2. Initialize primary YOLO Character Engine
            if self.engine_type == "yolo":
                self._try_load_yolo_engine()

        # State tracking per vehicle track_id:
        # {track_id: {session_id, positions, aggregator, has_crossed, direction, last_known_plate, ...}}
        self.tracks: Dict[int, Dict[str, Any]] = {}

        # Standalone plate tracks for plates with no associated vehicle.
        # {plate_id: {id, box, center, velocity, conf, aggregator, resolved_plate, ...}}
        self.plate_tracks: Dict[int, Dict[str, Any]] = {}
        self._next_plate_id = 1

    def _try_load_yolo_engine(self) -> bool:
        """Attempts to initialize or recover YOLO Character Engine without crashing."""
        if self.yolo_engine is not None:
            return True
        try:
            from backend.vision.yolo_char_reader import get_yolo_char_engine
            char_weights = self.weights_path.parent / "char_detector.pt"
            if not char_weights.exists():
                char_weights = Path(__file__).resolve().parent / "weights" / "char_detector.pt"
            self.yolo_engine = get_yolo_char_engine(str(char_weights) if char_weights.exists() else None)
            return True
        except Exception:
            return False

    def _maybe_recover_yolo_engine(self):
        """Auto-recovery: periodically retry loading YOLO when unavailable."""
        if self.yolo_engine is None and self.engine_type == "yolo":
            now_t = time.time()
            if now_t - self.last_yolo_retry_time > 6.0:
                self.last_yolo_retry_time = now_t
                self._try_load_yolo_engine()

    def _calculate_track_velocity(self, positions: List[Tuple[float, float]], window: int = 4) -> Tuple[float, float]:
        """Calculates smoothed pixel displacement per frame over recent observations."""
        if len(positions) < 2:
            return (0.0, 0.0)
        k = min(len(positions) - 1, window)
        curr = positions[-1]
        past = positions[-1 - k]
        return ((curr[0] - past[0]) / float(k), (curr[1] - past[1]) / float(k))

    def _cascade_vehicle_crop_zoom(self, view: np.ndarray, veh_box: List[int]) -> Optional[Dict[str, Any]]:
        """
        Cascaded Far-Distance Zoom on a SNAPSHOT view (never the live frame):
        When a vehicle is detected far away but plate was missed in full-frame,
        crops the lower 60% of the vehicle at native resolution and runs plate detector.
        """
        zoom_input = vehicle_lower_crop(view, veh_box)
        if zoom_input is None:
            return None
        veh_lower_crop_sharp, (crop_x1, crop_y1) = zoom_input

        # Predict plate inside zoomed crop with lower threshold
        zoom_res = self.model.predict(veh_lower_crop_sharp, conf=0.22, imgsz=self.imgsz, verbose=False)[0]
        if zoom_res.boxes is not None and len(zoom_res.boxes) > 0:
            for zbox in zoom_res.boxes:
                zcls = int(zbox.cls[0])
                zconf = float(zbox.conf[0])
                zname = self.model.names.get(zcls, "")
                if is_plate_class(zcls, zname):
                    zx1, zy1, zx2, zy2 = [int(v) for v in zbox.xyxy[0].tolist()]
                    return {
                        "box": [crop_x1 + zx1, crop_y1 + zy1, crop_x1 + zx2, crop_y1 + zy2],
                        "conf": zconf,
                        "source": "CASCADE_ZOOM"
                    }
        return None

    def _central_zoom_fallback(self, view: np.ndarray) -> List[Dict[str, Any]]:
        """Central digital-zoom pass on a SNAPSHOT view for distant plates."""
        found: List[Dict[str, Any]] = []
        roi, (zx1, zy1, _, _) = central_zoom_roi(view)
        if roi.size == 0:
            return found
        zoom_res = self.model.predict(
            roi, conf=max(0.14, self.conf_threshold - 0.05), imgsz=self.imgsz, verbose=False
        )[0]
        if zoom_res.boxes is not None and len(zoom_res.boxes) > 0:
            for zbox in zoom_res.boxes:
                zcls = int(zbox.cls[0])
                zconf = float(zbox.conf[0])
                zname = self.model.names.get(zcls, "")
                if is_plate_class(zcls, zname):
                    bx1, by1, bx2, by2 = [int(v) for v in zbox.xyxy[0].tolist()]
                    found.append({
                        "box": [zx1 + bx1, zy1 + by1, zx1 + bx2, zy1 + by2],
                        "conf": zconf,
                        "source": "ZOOM"
                    })
        return found

    def _read_plate_crop(self, read_crop: np.ndarray) -> Tuple[Optional[str], Optional[str], float, bool, str]:
        """Dual-tier character read: YOLO primary, EasyOCR standby fallback only.

        Returns (raw_text, normalized, confidence, is_valid, engine_label).
        """
        self._maybe_recover_yolo_engine()
        raw_ocr, norm_ocr, ocr_conf, is_valid = None, None, 0.0, False

        yolo_succeeded = False
        if self.yolo_engine:
            try:
                raw_ocr, norm_ocr, ocr_conf, is_valid, _ = self.yolo_engine.read_plate(read_crop)
                if raw_ocr and len(raw_ocr) >= 4:
                    yolo_succeeded = True
            except Exception:
                yolo_succeeded = False

        if not yolo_succeeded and self.easyocr_engine:
            try:
                e_raw, e_norm, e_conf, e_valid = self.easyocr_engine.read_plate(read_crop)
                # Deskew retry for tilted/angled plates: only when the plain
                # read failed or is short, keep the better result.
                if YOLO_CHAR_AVAILABLE and (not e_raw or len(e_raw) < 8 or not e_valid):
                    try:
                        deskewed = YOLOCharacterEngine.rectify_perspective_and_deskew(read_crop)
                    except Exception:
                        deskewed = None
                    if deskewed is not None and deskewed.size > 0:
                        d_raw, d_norm, d_conf, d_valid = self.easyocr_engine.read_plate(deskewed)
                        if d_raw and ((d_valid and not e_valid) or len(d_raw) > len(e_raw or "")):
                            e_raw, e_norm, e_conf, e_valid = d_raw, d_norm, d_conf, d_valid
                if e_raw and len(e_raw) >= 4:
                    raw_ocr, norm_ocr, ocr_conf, is_valid = e_raw, e_norm, e_conf, e_valid
            except Exception:
                pass

        engine_label = "YOLO" if yolo_succeeded else "EASYOCR"
        return raw_ocr, norm_ocr, ocr_conf, is_valid, engine_label

    def _process_plate_for_track(
        self,
        view: np.ndarray,
        plate_box: List[int],
        plate_conf: float,
        track_info: Dict[str, Any],
        vehicle_speed: Optional[float],
        now_wall: float,
        match_type: str = "SPATIO_TEMPORAL",
        match_cost: float = 0.0
    ) -> Optional[Dict[str, Any]]:
        """Runs quality gate + throttled dual-tier OCR for one plate crop.

        Works only on the snapshot view. Updates the track aggregator and
        consensus in place. Returns the plate_crop_info dict (or None).
        """
        px1, py1, px2, py2 = [int(v) for v in plate_box]
        padded = padded_plate_crop(view, [px1, py1, px2, py2])
        if padded.size == 0:
            return None

        passed, qscore, metrics = self.quality_gate.evaluate_crop(
            padded, plate_conf, vehicle_speed=vehicle_speed
        )
        track_info["last_quality"] = qscore
        track_info["focal_zone"] = metrics.get("focal_zone", "UNKNOWN")

        raw_ocr, norm_ocr, ocr_conf, is_valid = None, None, 0.0, False

        # LATCHED SKIP (efficiency): an already-locked identity needs no more
        # OCR. Return the cached consensus cheaply instead of burning CPU/GPU
        # on every snapshot while the vehicle idles at the gate.
        if track_info.get("aggregator") is not None and track_info["aggregator"].is_latched:
            latched_plate, latched_conf, _ = track_info["aggregator"].get_consensus()
            track_info["last_known_plate"] = latched_plate
            track_info["is_latched"] = True
            return {
                "crop": padded.copy(),
                "box": [px1, py1, px2, py2],
                "conf": plate_conf,
                "passed_quality": passed,
                "quality_score": qscore,
                "focal_zone": metrics.get("focal_zone", "UNKNOWN"),
                "should_trigger_char_reader": metrics.get("should_trigger_char_reader", False),
                "should_attempt_ocr": metrics.get("should_attempt_ocr", False),
                "metrics": metrics,
                "raw_ocr": None,
                "normalized_plate": latched_plate,
                "ocr_conf": latched_conf,
                "is_valid_format": True,
                "is_latched": True,
                "readings_count": len(track_info["aggregator"].readings),
                "match_type": match_type,
                "match_cost": match_cost
            }

        # PERMISSIVE OCR POLICY: every passed crop gets a read attempt (any
        # focal zone, any plate type). Zone only affects weighting downstream.
        should_read = (
            self.enable_ocr
            and metrics.get("should_attempt_ocr", False)
            and (now_wall - track_info.get("last_ocr_time", 0.0) >= self.ocr_min_interval)
        )
        if should_read:
            track_info["last_ocr_time"] = now_wall
            read_crop = upscale_small_crop(padded)
            raw_ocr, norm_ocr, ocr_conf, is_valid, engine_label = self._read_plate_crop(read_crop)
            # Second-chance wide retry: detector boxes on long-strip or tilted
            # plates can clip end/corner characters. When the first read is
            # short or invalid, retry once on a wider context crop and keep
            # the better result (valid beats invalid, longer beats shorter).
            if raw_ocr and (not is_valid or len(raw_ocr) < 9):
                box_aspect = (px2 - px1) / max(py2 - py1, 1)
                wide_pad_x = 0.50 if box_aspect > 3.5 else 0.35
                wide = padded_plate_crop(view, [px1, py1, px2, py2],
                                         pad_x_ratio=wide_pad_x, pad_y_ratio=0.30)
                if wide.size > 0 and wide.shape[1] > padded.shape[1]:
                    w_raw, w_norm, w_conf, w_valid, w_eng = self._read_plate_crop(
                        upscale_small_crop(wide)
                    )
                    if w_raw and ((w_valid and not is_valid) or len(w_raw) > len(raw_ocr)):
                        raw_ocr, norm_ocr, ocr_conf, is_valid, engine_label = (
                            w_raw, w_norm, w_conf, w_valid, w_eng
                        )
            # Motion-deblur retry: fast vehicles smear strokes along the travel
            # direction. When the crop meters blurry and the read is poor,
            # retry once on a deblurred representation and keep the better.
            if (not raw_ocr or not is_valid or len(raw_ocr) < 9) and metrics.get(
                    "laplacian_var", 999.0) < self.quality_gate.blur_threshold:
                d_raw, d_norm, d_conf, d_valid, d_eng = self._read_plate_crop(
                    deblur_motion_crop(read_crop)
                )
                if d_raw and ((d_valid and not is_valid) or len(d_raw) > len(raw_ocr or "")):
                    raw_ocr, norm_ocr, ocr_conf, is_valid, engine_label = (
                        d_raw, d_norm, d_conf, d_valid, d_eng
                    )
            if raw_ocr and ocr_conf >= READ_MIN_CONFIDENCE:
                track_info["aggregator"].add_reading(raw_ocr, ocr_conf, qscore, engine_source=engine_label)

        # Refresh consensus every snapshot so locks surface within 2-3 frames.
        consensus_str, consensus_conf, consensus_valid = track_info["aggregator"].get_consensus()
        if consensus_str:
            track_info["last_known_plate"] = consensus_str
        elif (norm_ocr or raw_ocr) and is_valid and ocr_conf >= READ_MIN_CONFIDENCE:
            track_info["last_known_plate"] = norm_ocr or raw_ocr
        track_info["is_latched"] = track_info["aggregator"].is_latched

        return {
            "crop": padded.copy(),
            "box": [px1, py1, px2, py2],
            "conf": plate_conf,
            "passed_quality": passed,
            "quality_score": qscore,
            "focal_zone": metrics.get("focal_zone", "UNKNOWN"),
            "should_trigger_char_reader": metrics.get("should_trigger_char_reader", False),
            "should_attempt_ocr": metrics.get("should_attempt_ocr", False),
            "metrics": metrics,
            "raw_ocr": raw_ocr,
            "normalized_plate": track_info.get("last_known_plate"),
            "ocr_conf": ocr_conf,
            "is_valid_format": consensus_valid or is_valid,
            "is_latched": track_info["aggregator"].is_latched,
            "readings_count": len(track_info["aggregator"].readings),
            "match_type": match_type,
            "match_cost": match_cost
        }

    def _match_standalone_plates(self, detections: List[Dict[str, Any]], now_wall: float) -> List[int]:
        """Velocity-predicted + IoU matching of standalone plates to plate tracks.

        Returns the visible plate-track ids for this snapshot.
        """
        visible: List[int] = []
        for det in detections:
            pbx = det["box"]
            pcx = (pbx[0] + pbx[2]) / 2.0
            pcy = (pbx[1] + pbx[3]) / 2.0
            pw = max(1, pbx[2] - pbx[0])
            ph = max(1, pbx[3] - pbx[1])

            best_pid = None
            best_score = float("inf")
            for pid, t in self.plate_tracks.items():
                dt = max(0.001, now_wall - t["last_seen"])
                pred_cx = t["center"][0] + t["velocity"][0] * dt
                pred_cy = t["center"][1] + t["velocity"][1] * dt
                dist = math.hypot(pcx - pred_cx, pcy - pred_cy)

                tb = t["box"]
                ix1 = max(pbx[0], tb[0])
                iy1 = max(pbx[1], tb[1])
                ix2 = min(pbx[2], tb[2])
                iy2 = min(pbx[3], tb[3])
                inter_area = max(0, ix2 - ix1) * max(0, iy2 - iy1)
                union_area = (pw * ph) + ((tb[2] - tb[0]) * (tb[3] - tb[1])) - inter_area
                iou = inter_area / union_area if union_area > 0 else 0.0

                max_allowed_dist = max(175.0, 3.2 * pw)
                if iou > 0.15 or dist < max_allowed_dist:
                    match_cost = dist - (iou * 120.0)
                    if match_cost < best_score:
                        best_score = match_cost
                        best_pid = pid

            if best_pid is not None:
                t = self.plate_tracks[best_pid]
                dt = max(0.001, now_wall - t["last_seen"])
                inst_vx = (pcx - t["center"][0]) / dt
                inst_vy = (pcy - t["center"][1]) / dt
                t["velocity"] = (
                    0.65 * t["velocity"][0] + 0.35 * inst_vx,
                    0.65 * t["velocity"][1] + 0.35 * inst_vy
                )
                t["box"] = pbx
                t["center"] = (pcx, pcy)
                t["conf"] = det["conf"]
                t["source"] = det.get("source", "FULL_FRAME")
                t["last_seen"] = now_wall
                visible.append(best_pid)
            else:
                pid = self._next_plate_id
                self._next_plate_id += 1
                self.plate_tracks[pid] = {
                    "id": pid,
                    "session_id": f"sess_{self.camera_id}_plate_{pid}_{uuid.uuid4().hex[:8]}",
                    "box": pbx,
                    "center": (pcx, pcy),
                    "velocity": (0.0, 0.0),
                    "conf": det["conf"],
                    "source": det.get("source", "FULL_FRAME"),
                    "aggregator": PlateReadingAggregator(f"plate_{self.camera_id}_{pid}"),
                    "last_known_plate": None,
                    "is_latched": False,
                    "last_quality": 0.0,
                    "focal_zone": "UNKNOWN",
                    "last_ocr_time": 0.0,
                    "last_seen": now_wall
                }
                visible.append(pid)

        # Purge dead standalone tracks older than 2.5 seconds.
        stale = [pid for pid, t in self.plate_tracks.items() if now_wall - t["last_seen"] > 2.5]
        for pid in stale:
            del self.plate_tracks[pid]
        return [pid for pid in visible if pid in self.plate_tracks]

    def process_frame(self, frame: np.ndarray, frame_idx: int = 0) -> Dict[str, Any]:
        """Legacy entry point: freezes the live frame into a snapshot, then post-processes.

        No detection ever runs on the passed live frame directly.
        """
        snapshot = capture_frame_snapshot(frame, self.camera_id, frame_idx, source="live")
        return self.process_snapshot(snapshot)

    @staticmethod
    def _fuse_plate_detections(detections):
        """Fuses overlapping plate boxes into one full-span box per plate.

        The detector can emit several overlapping boxes for one physical
        plate: nested duplicates on standard plates, or left/right fragments
        on long-strip commercial plates. Pure NMS keeps one fragment and clips
        characters; union-merge instead joins same-plate boxes (strong
        vertical overlap plus horizontal intersection) into their bounding
        union with the max confidence. Adjacent vehicles' plates (side by side
        with a gap, or bumper-to-bumper vertically separated) never merge.
        """
        if len(detections) < 2:
            return list(detections)
        fused = [dict(d) for d in sorted(detections, key=lambda d: d["conf"], reverse=True)]
        changed = True
        while changed:
            changed = False
            out = []
            used = [False] * len(fused)
            for i, det in enumerate(fused):
                if used[i]:
                    continue
                x1, y1, x2, y2 = det["box"]
                for j in range(i + 1, len(fused)):
                    if used[j]:
                        continue
                    ox1, oy1, ox2, oy2 = fused[j]["box"]
                    iw = min(x2, ox2) - max(x1, ox1)
                    ih = min(y2, oy2) - max(y1, oy1)
                    if iw <= 0 or ih <= 0:
                        continue
                    min_h = min(y2 - y1, oy2 - oy1)
                    min_w = min(x2 - x1, ox2 - ox1)
                    same_plate = (
                        ih >= 0.4 * max(min_h, 1)
                        and iw >= 0.2 * max(min_w, 1)
                    )
                    if same_plate:
                        x1, y1 = min(x1, ox1), min(y1, oy1)
                        x2, y2 = max(x2, ox2), max(y2, oy2)
                        det["conf"] = max(det["conf"], fused[j]["conf"])
                        used[j] = True
                        changed = True
                det["box"] = [x1, y1, x2, y2]
                out.append(det)
                used[i] = True
            fused = out
        return fused

    def process_snapshot(self, snapshot: FrameSnapshot) -> Dict[str, Any]:
        """
        Canonical post-processing path. Runs the full pipeline ONLY against the
        immutable snapshot copy:
          1. YOLO tracking with ByteTrack on vehicles + plates.
          2. Spatio-Temporal Merging to pair plates with vehicles.
          3. Cascade + central zoom recovery for missed/distant plates.
          4. Standalone plate tracks for vehicle-less plates (all plate types).
          5. Permissive quality-gated character reading with 2-3 frame lock.
        """
        view = writable_snapshot_view(snapshot)
        h, w = view.shape[:2]
        now_wall = time.time()

        try:
            results = self.model.track(
                source=view,
                conf=self.conf_threshold,
                imgsz=self.imgsz,
                device=self.device,
                persist=True,
                tracker="bytetrack.yaml",
                verbose=False
            )[0]
        except Exception:
            try:
                results = self.model.predict(
                    source=view, conf=self.conf_threshold, imgsz=self.imgsz, verbose=False
                )[0]
            except Exception:
                return {
                    "camera_id": self.camera_id,
                    "frame_idx": snapshot.frame_idx,
                    "snapshot_id": snapshot.snapshot_id,
                    "observations": [],
                    "events": [],
                    "vehicles": [],
                    "plates": []
                }

        vehicles_in_frame: List[Dict[str, Any]] = []
        plates_in_frame: List[Dict[str, Any]] = []

        if results.boxes is not None and len(results.boxes) > 0:
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                cls_name = self.model.names.get(cls_id, str(cls_id))
                xyxy = [int(v) for v in box.xyxy[0].tolist()]

                if is_plate_class(cls_id, cls_name):
                    plates_in_frame.append({"box": xyxy, "conf": conf, "source": "FULL_FRAME"})
                elif is_vehicle_class(cls_id, cls_name):
                    track_id = int(box.id[0]) if box.id is not None else None
                    vehicles_in_frame.append({"track_id": track_id, "box": xyxy, "conf": conf})

        # Central zoom recovery when full-frame detection found no plates.
        if not plates_in_frame and self.enable_central_zoom:
            try:
                plates_in_frame.extend(self._central_zoom_fallback(view))
            except Exception:
                pass

        # One full-span box per physical plate: fuse nested duplicates and
        # long-strip fragments so no characters are clipped before OCR.
        plates_in_frame = self._fuse_plate_detections(plates_in_frame)

        # 1. Update vehicle tracks & compute velocity vectors
        track_velocities: Dict[int, Tuple[float, float]] = {}
        active_track_ids: List[int] = []

        for veh in vehicles_in_frame:
            track_id = veh["track_id"]
            if track_id is None:
                continue

            active_track_ids.append(track_id)
            bx1, by1, bx2, by2 = veh["box"]
            bottom_center = ((bx1 + bx2) / 2.0, float(by2))

            if track_id not in self.tracks:
                self.tracks[track_id] = {
                    "session_id": f"sess_{self.camera_id}_{track_id}_{uuid.uuid4().hex[:8]}",
                    "positions": [bottom_center],
                    "aggregator": PlateReadingAggregator(f"{self.camera_id}_{track_id}"),
                    "has_crossed": False,
                    "direction": None,
                    "last_known_plate": None,
                    "is_latched": False,
                    "last_quality": 0.0,
                    "focal_zone": "UNKNOWN",
                    "last_ocr_time": 0.0,
                    "last_seen": now_wall
                }
            else:
                self.tracks[track_id]["positions"].append(bottom_center)
                self.tracks[track_id]["positions"] = self.tracks[track_id]["positions"][-30:]
                self.tracks[track_id]["last_seen"] = now_wall

            track_velocities[track_id] = self._calculate_track_velocity(self.tracks[track_id]["positions"])

        # Purge vehicle tracks unseen for 30s (bounded memory on long runs).
        stale_v = [tid for tid, t in self.tracks.items() if now_wall - t.get("last_seen", now_wall) > 30.0]
        for tid in stale_v:
            del self.tracks[tid]

        # Prune stale anchors from matcher
        self.matcher.prune_stale_anchors(active_track_ids)

        # 2. Spatio-Temporal Merging: Optimal 1-to-1 Hungarian Matching
        matches, unassigned_plates = self.matcher.match(
            vehicles=vehicles_in_frame,
            plates=plates_in_frame,
            track_velocities=track_velocities
        )

        # Index matches by vehicle_track_id
        matched_plates_by_veh: Dict[int, Any] = {m.vehicle_track_id: m for m in matches}

        # 3. Cascaded Far-Distance Zoom for approaching vehicles with missing plates
        for veh in vehicles_in_frame:
            tid = veh["track_id"]
            if tid is not None and tid not in matched_plates_by_veh:
                try:
                    zoomed_plate = self._cascade_vehicle_crop_zoom(view, veh["box"])
                except Exception:
                    zoomed_plate = None
                if zoomed_plate:
                    zoom_matches, _ = self.matcher.match(
                        vehicles=[veh],
                        plates=[zoomed_plate],
                        track_velocities=track_velocities
                    )
                    if zoom_matches:
                        matched_plates_by_veh[tid] = zoom_matches[0]

        events = []
        active_observations = []
        vehicles_out: List[Dict[str, Any]] = []
        plates_out: List[Dict[str, Any]] = []

        # 4. Vehicle observations, line crossing, and plate reading
        for veh in vehicles_in_frame:
            track_id = veh["track_id"]
            if track_id is None or track_id not in self.tracks:
                continue

            track_info = self.tracks[track_id]
            positions = track_info["positions"]
            bottom_center = positions[-1]

            # Virtual Line Crossing Check
            if not track_info["has_crossed"] and len(positions) >= 2:
                crossed, direction = self.entry_line.has_crossed(positions[-2], positions[-1])
                if crossed:
                    track_info["has_crossed"] = True
                    track_info["direction"] = direction
                    consensus_plate, avg_conf, is_valid = track_info["aggregator"].get_consensus()
                    events.append({
                        "event_type": "ENTRY_CROSSED",
                        "camera_id": self.camera_id,
                        "track_id": track_id,
                        "session_id": track_info["session_id"],
                        "direction": direction,
                        "position": bottom_center,
                        "plate": consensus_plate,
                        "plate_conf": avg_conf,
                        "is_valid_format": is_valid
                    })

            # Associated plate crop (post-processed from the snapshot view only)
            associated_plate_crop = None
            if track_id in matched_plates_by_veh:
                m = matched_plates_by_veh[track_id]
                v_vel = track_velocities.get(track_id, (0.0, 0.0))
                v_speed = float(np.hypot(v_vel[0], v_vel[1]))
                associated_plate_crop = self._process_plate_for_track(
                    view, m.plate_box, m.plate_conf, track_info,
                    vehicle_speed=v_speed, now_wall=now_wall,
                    match_type=m.match_type, match_cost=m.cost
                )
                if associated_plate_crop is not None:
                    plates_out.append({
                        "id": f"V{track_id}",
                        "box": associated_plate_crop["box"],
                        "conf": associated_plate_crop["conf"],
                        "resolved": track_info.get("last_known_plate"),
                        "is_valid": associated_plate_crop["is_valid_format"],
                        "is_latched": associated_plate_crop["is_latched"],
                        "readings_count": associated_plate_crop["readings_count"],
                        "focal_zone": associated_plate_crop["focal_zone"],
                        "source": "vehicle",
                        "vehicle_track_id": track_id
                    })

            vehicles_out.append({
                "track_id": track_id,
                "box": veh["box"],
                "conf": veh["conf"],
                "plate": track_info.get("last_known_plate"),
                "is_latched": track_info.get("is_latched", False)
            })

            active_observations.append({
                "camera_id": self.camera_id,
                "track_id": track_id,
                "track_kind": "vehicle",
                "session_id": track_info["session_id"],
                "vehicle_box": veh["box"],
                "vehicle_conf": veh["conf"],
                "has_crossed": track_info["has_crossed"],
                "direction": track_info["direction"],
                "plate_crop_info": associated_plate_crop
            })

        # 5. Standalone plate tracks (no vehicle required): captures handheld,
        # phone-screen, paper, bike/auto two-row, and missed-vehicle plates.
        standalone_all = list(unassigned_plates)
        if not vehicles_in_frame:
            # No vehicles at all: every detected plate is standalone.
            standalone_all = list(plates_in_frame)
        elif unassigned_plates:
            standalone_all = list(unassigned_plates)
        else:
            standalone_all = []

        if standalone_all:
            visible_pids = list(dict.fromkeys(
                self._match_standalone_plates(standalone_all, now_wall)
            ))
            for pid in visible_pids:
                p_info = self.plate_tracks[pid]
                pvx, pvy = p_info["velocity"]
                p_speed = float(math.hypot(pvx, pvy))
                # Velocity is px/sec here; normalize to px/frame-ish for the gate.
                crop_info = self._process_plate_for_track(
                    view, p_info["box"], p_info["conf"], p_info,
                    vehicle_speed=min(p_speed / 30.0, 50.0), now_wall=now_wall,
                    match_type="STANDALONE_PLATE", match_cost=0.0
                )
                if crop_info is None:
                    continue
                plates_out.append({
                    "id": f"P{pid}",
                    "box": crop_info["box"],
                    "conf": crop_info["conf"],
                    "resolved": p_info.get("last_known_plate"),
                    "is_valid": crop_info["is_valid_format"],
                    "is_latched": crop_info["is_latched"],
                    "readings_count": crop_info["readings_count"],
                    "focal_zone": crop_info["focal_zone"],
                    "source": p_info.get("source", "FULL_FRAME"),
                    "plate_track_id": pid
                })
                active_observations.append({
                    "camera_id": self.camera_id,
                    "track_id": PLATE_TRACK_ID_OFFSET + pid,
                    "track_kind": "plate_standalone",
                    "session_id": p_info["session_id"],
                    "vehicle_box": None,
                    "vehicle_conf": 0.0,
                    "has_crossed": False,
                    "direction": None,
                    "plate_crop_info": crop_info
                })

        # Latched-region suppression: an unlatched plate overlapping a LOCKED
        # plate's box is a detector fragment of the same physical plate, not a
        # second plate. Hide it so the display and downstream consumers see one
        # identity per plate (the locked one). Does not affect observations.
        def _iou(a, b):
            ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
            ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
            inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
            if inter <= 0:
                return 0.0
            ua = max(1, a[2] - a[0]) * max(1, a[3] - a[1])
            ub = max(1, b[2] - b[0]) * max(1, b[3] - b[1])
            return inter / float(ua + ub - inter)

        latched_boxes = [pl["box"] for pl in plates_out if pl.get("is_latched")]
        if latched_boxes:
            plates_out = [
                pl for pl in plates_out
                if pl.get("is_latched") or all(
                    _iou(pl["box"], lb) < 0.3 for lb in latched_boxes)
            ]

        return {
            "camera_id": self.camera_id,
            "frame_idx": snapshot.frame_idx,
            "snapshot_id": snapshot.snapshot_id,
            "observations": active_observations,
            "events": events,
            "vehicles": vehicles_out,
            "plates": plates_out
        }
