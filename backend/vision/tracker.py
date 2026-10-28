import uuid
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import cv2
from pathlib import Path
from ultralytics import YOLO

from backend.vision.quality_gate import PlateQualityGate
from backend.vision.ocr_reader import PlateReadingAggregator, IndianPlateNormalizer, get_ocr_engine
from backend.vision.spatio_temporal_matcher import SpatioTemporalPlateMatcher
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


class CameraVisionTracker:
    """
    Production-grade Per-Camera Vehicle and License Plate Tracking Engine.
    Incorporates:
      1. Spatio-Temporal Merging (Delta-velocity matching & relative anchor offset)
      2. Multi-Object / Multi-Plate Disambiguation via Hungarian Assignment
      3. Focal Zone Resolution Gating (suppresses distant character hallucinations)
      4. Cascaded Vehicle-Crop Zoom for Far Distance Detection
      5. YOLO Character Engine with Indian Plate Syntax Verification
    """
    def __init__(
        self,
        camera_id: str,
        weights_path: Path,
        entry_line: Optional[VirtualEntryLine] = None,
        conf_threshold: float = 0.35,
        device: str = "cpu",
        enable_ocr: bool = True,
        engine_type: str = "yolo"
    ):
        self.camera_id = camera_id
        self.weights_path = weights_path
        self.entry_line = entry_line or VirtualEntryLine((0, 360), (640, 360), "INBOUND")
        self.conf_threshold = conf_threshold
        self.device = device
        self.engine_type = engine_type.lower()
        
        self.model = YOLO(str(weights_path))
        self.quality_gate = PlateQualityGate()
        self.matcher = SpatioTemporalPlateMatcher()
        
        # Load Character Recognition Engine
        if enable_ocr:
            if self.engine_type == "yolo" and YOLO_CHAR_AVAILABLE:
                char_weights = weights_path.parent / "char_detector.pt"
                if not char_weights.exists():
                    char_weights = Path(__file__).resolve().parent / "weights" / "char_detector.pt"
                self.char_engine = get_yolo_char_engine(str(char_weights) if char_weights.exists() else None)
            else:
                self.char_engine = get_ocr_engine()
        else:
            self.char_engine = None
        
        # State tracking per track_id:
        # {track_id: {session_id, positions, aggregator, has_crossed, direction, plate_crops, last_known_plate}}
        self.tracks: Dict[int, Dict[str, Any]] = {}

    def _calculate_track_velocity(self, positions: List[Tuple[float, float]], window: int = 4) -> Tuple[float, float]:
        """Calculates smoothed pixel displacement per frame over recent observations."""
        if len(positions) < 2:
            return (0.0, 0.0)
        k = min(len(positions) - 1, window)
        curr = positions[-1]
        past = positions[-1 - k]
        return ((curr[0] - past[0]) / float(k), (curr[1] - past[1]) / float(k))

    def _cascade_vehicle_crop_zoom(self, frame: np.ndarray, veh_box: List[int]) -> Optional[Dict[str, Any]]:
        """
        Cascaded Far-Distance Zoom:
        When a vehicle is detected far away but plate was missed in full-frame,
        crops the lower 60% of the vehicle at native resolution and runs plate detector.
        """
        vh, vw = frame.shape[:2]
        vx1, vy1, vx2, vy2 = veh_box
        v_w = vx2 - vx1
        v_h = vy2 - vy1

        if v_w < 80 or v_h < 60:
            return None  # Too tiny even for vehicle zoom

        # Crop lower 60% of vehicle (where bumper and plate are located)
        crop_y1 = max(0, int(vy1 + 0.40 * v_h))
        crop_y2 = min(vh, vy2)
        crop_x1 = max(0, vx1)
        crop_x2 = min(vw, vx2)

        veh_lower_crop = frame[crop_y1:crop_y2, crop_x1:crop_x2]
        # Unsharp mask to combat normal camera H.264 compression softness
        gaussian = cv2.GaussianBlur(veh_lower_crop, (0, 0), 2.0)
        veh_lower_crop_sharp = cv2.addWeighted(veh_lower_crop, 1.40, gaussian, -0.40, 0)

        # Predict plate inside zoomed crop with lower threshold
        zoom_res = self.model.predict(veh_lower_crop_sharp, conf=0.22, verbose=False)[0]
        if zoom_res.boxes is not None and len(zoom_res.boxes) > 0:
            for zbox in zoom_res.boxes:
                zcls = int(zbox.cls[0])
                zconf = float(zbox.conf[0])
                zname = self.model.names.get(zcls, "")
                if zcls == 1 or "plate" in zname.lower():
                    zx1, zy1, zx2, zy2 = [int(v) for v in zbox.xyxy[0].tolist()]
                    # Map back to full-frame coordinates
                    global_px1 = crop_x1 + zx1
                    global_py1 = crop_y1 + zy1
                    global_px2 = crop_x1 + zx2
                    global_py2 = crop_y1 + zy2
                    return {
                        "box": [global_px1, global_py1, global_px2, global_py2],
                        "conf": zconf,
                        "source": "CASCADE_ZOOM"
                    }
        return None

    def process_frame(self, frame: np.ndarray, frame_idx: int = 0) -> Dict[str, Any]:
        """
        Processes a single video frame:
          1. Runs YOLO tracking with ByteTrack on vehicles.
          2. Runs Spatio-Temporal Merging to pair plates with vehicles.
          3. Applies Focal Zone Gating to trigger character detection at peak resolution.
        """
        h, w = frame.shape[:2]

        results = self.model.track(
            source=frame,
            conf=self.conf_threshold,
            device=self.device,
            persist=True,
            tracker="bytetrack.yaml",
            verbose=False
        )[0]

        vehicles_in_frame: List[Dict[str, Any]] = []
        plates_in_frame: List[Dict[str, Any]] = []

        if results.boxes is not None and len(results.boxes) > 0:
            for box in results.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = [int(v) for v in box.xyxy[0].tolist()]
                track_id = int(box.id[0]) if box.id is not None else None

                if cls_id == 0:  # Vehicle
                    vehicles_in_frame.append({
                        "track_id": track_id,
                        "box": xyxy,
                        "conf": conf
                    })
                elif cls_id == 1:  # License Plate
                    plates_in_frame.append({
                        "box": xyxy,
                        "conf": conf
                    })

        # 1. Update tracks & compute velocity vectors
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
                    "aggregator": PlateReadingAggregator(str(track_id)),
                    "has_crossed": False,
                    "direction": None,
                    "last_known_plate": None,
                    "plate_crops": []
                }
            else:
                self.tracks[track_id]["positions"].append(bottom_center)

            track_velocities[track_id] = self._calculate_track_velocity(self.tracks[track_id]["positions"])

        # Prune stale anchors from matcher
        self.matcher.prune_stale_anchors(active_track_ids)

        # 2. Spatio-Temporal Merging: Optimal 1-to-1 Hungarian Matching
        matches, unassigned_plates = self.matcher.match(
            vehicles=vehicles_in_frame,
            plates=plates_in_frame,
            track_velocities=track_velocities
        )

        # Index matches by vehicle_track_id
        matched_plates_by_veh: Dict[int, Any] = {
            m.vehicle_track_id: m for m in matches
        }

        # 3. Cascaded Far-Distance Zoom for approaching vehicles with missing plates
        for veh in vehicles_in_frame:
            tid = veh["track_id"]
            if tid is not None and tid not in matched_plates_by_veh:
                zoomed_plate = self._cascade_vehicle_crop_zoom(frame, veh["box"])
                if zoomed_plate:
                    # Fabricate match from zoom
                    matches.append(
                        self.matcher.match(
                            vehicles=[veh],
                            plates=[zoomed_plate],
                            track_velocities=track_velocities
                        )[0][0] if self.matcher.match([veh], [zoomed_plate])[0] else None
                    )
                    if matches and matches[-1]:
                        matched_plates_by_veh[tid] = matches[-1]

        events = []
        active_observations = []

        # 4. Process observations, line crossing, and focal-zone character detection
        for veh in vehicles_in_frame:
            track_id = veh["track_id"]
            if track_id is None:
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

            # Process associated plate crop
            associated_plate_crop = None
            if track_id in matched_plates_by_veh:
                m = matched_plates_by_veh[track_id]
                px1, py1, px2, py2 = m.plate_box
                crop = frame[max(0, py1):min(h, py2), max(0, px1):min(w, px2)]

                if crop.size > 0:
                    v_vel = track_velocities.get(track_id, (0.0, 0.0))
                    v_speed = float(np.hypot(v_vel[0], v_vel[1]))
                    passed, qscore, metrics = self.quality_gate.evaluate_crop(
                        crop, m.plate_conf, vehicle_speed=v_speed
                    )
                    raw_ocr, norm_ocr, ocr_conf, is_valid = None, None, 0.0, False

                    # FOCAL ZONE GATING:
                    # Trigger character recognition only when plate enters optimal resolution
                    if metrics.get("should_trigger_char_reader", False) and self.char_engine:
                        if isinstance(self.char_engine, YOLOCharacterEngine) or hasattr(self.char_engine, "assemble_characters_2d"):
                            # YOLO Character Engine
                            raw_ocr, norm_ocr, ocr_conf, is_valid, _ = self.char_engine.read_plate(crop)
                        else:
                            # EasyOCR fallback
                            raw_ocr, norm_ocr, ocr_conf, is_valid = self.char_engine.read_plate(crop)

                        if raw_ocr:
                            track_info["aggregator"].add_reading(raw_ocr, ocr_conf, qscore)
                            track_info["last_known_plate"] = norm_ocr or raw_ocr

                    associated_plate_crop = {
                        "crop": crop,
                        "box": [px1, py1, px2, py2],
                        "conf": m.plate_conf,
                        "passed_quality": passed,
                        "quality_score": qscore,
                        "focal_zone": metrics.get("focal_zone", "UNKNOWN"),
                        "should_trigger_char_reader": metrics.get("should_trigger_char_reader", False),
                        "metrics": metrics,
                        "raw_ocr": raw_ocr,
                        "normalized_plate": norm_ocr or track_info.get("last_known_plate"),
                        "ocr_conf": ocr_conf,
                        "is_valid_format": is_valid,
                        "match_type": m.match_type,
                        "match_cost": m.cost
                    }

            active_observations.append({
                "camera_id": self.camera_id,
                "track_id": track_id,
                "session_id": track_info["session_id"],
                "vehicle_box": veh["box"],
                "vehicle_conf": veh["conf"],
                "has_crossed": track_info["has_crossed"],
                "direction": track_info["direction"],
                "plate_crop_info": associated_plate_crop
            })

        return {
            "camera_id": self.camera_id,
            "frame_idx": frame_idx,
            "observations": active_observations,
            "events": events
        }
