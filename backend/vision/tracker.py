import uuid
from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import cv2
from pathlib import Path
from ultralytics import YOLO

from backend.vision.quality_gate import PlateQualityGate
from backend.vision.ocr_reader import PlateReadingAggregator, IndianPlateNormalizer, get_ocr_engine

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
            # Check direction using 2D cross product with line orientation
            cross_dir = np.cross(r, s)
            direction = self.direction_name if cross_dir > 0 else "OUTBOUND"
            return True, direction

        return False, None

class CameraVisionTracker:
    """
    Per-camera vehicle and license plate tracking engine.
    Integrates YOLO11 fine-tuned weights, ByteTrack, Plate Quality Gating, and Entry Crossing.
    """
    def __init__(
        self,
        camera_id: str,
        weights_path: Path,
        entry_line: Optional[VirtualEntryLine] = None,
        conf_threshold: float = 0.35,
        device: str = "cpu",
        enable_ocr: bool = True
    ):
        self.camera_id = camera_id
        self.weights_path = weights_path
        self.entry_line = entry_line or VirtualEntryLine((0, 360), (640, 360), "INBOUND")
        self.conf_threshold = conf_threshold
        self.device = device
        
        self.model = YOLO(str(weights_path))
        self.quality_gate = PlateQualityGate()
        self.ocr_engine = get_ocr_engine() if enable_ocr else None
        
        # State tracking per track_id: {track_id: {session_id, positions, aggregator, crossed}}
        self.tracks: Dict[int, Dict[str, Any]] = {}

    def process_frame(self, frame: np.ndarray, frame_idx: int = 0) -> Dict[str, Any]:
        """
        Processes a single video frame.
        Returns detections, active tracks, crossing events, and plate crops.
        """
        h, w = frame.shape[:2]
        
        # Run YOLO with ByteTrack persistence
        results = self.model.track(
            source=frame,
            conf=self.conf_threshold,
            device=self.device,
            persist=True,
            tracker="bytetrack.yaml",
            verbose=False
        )[0]

        vehicles_in_frame = []
        plates_in_frame = []

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

        events = []
        active_observations = []

        # Update vehicle tracks
        for veh in vehicles_in_frame:
            track_id = veh["track_id"]
            if track_id is None:
                continue

            bx1, by1, bx2, by2 = veh["box"]
            bottom_center = ((bx1 + bx2) / 2.0, float(by2))

            if track_id not in self.tracks:
                self.tracks[track_id] = {
                    "session_id": f"sess_{self.camera_id}_{track_id}_{uuid.uuid4().hex[:8]}",
                    "positions": [bottom_center],
                    "aggregator": PlateReadingAggregator(str(track_id)),
                    "has_crossed": False,
                    "direction": None,
                    "plate_crops": []
                }
            else:
                self.tracks[track_id]["positions"].append(bottom_center)

            track_info = self.tracks[track_id]
            positions = track_info["positions"]

            # Line crossing test
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

            # Associate plate detection to vehicle box (plate inside vehicle bbox)
            associated_plate_crop = None
            for pl in plates_in_frame:
                px1, py1, px2, py2 = pl["box"]
                # Plate center lies inside or near vehicle box
                pcx, pcy = (px1 + px2) / 2.0, (py1 + py2) / 2.0
                if bx1 <= pcx <= bx2 and by1 <= pcy <= by2:
                    crop = frame[max(0, py1):min(h, py2), max(0, px1):min(w, px2)]
                    if crop.size > 0:
                        passed, qscore, metrics = self.quality_gate.evaluate_crop(crop, pl["conf"])
                        raw_ocr, norm_ocr, ocr_conf, is_valid = None, None, 0.0, False
                        if passed and self.ocr_engine:
                            raw_ocr, norm_ocr, ocr_conf, is_valid = self.ocr_engine.read_plate(crop)
                            if raw_ocr:
                                track_info["aggregator"].add_reading(raw_ocr, ocr_conf, qscore)

                        associated_plate_crop = {
                            "crop": crop,
                            "box": [px1, py1, px2, py2],
                            "conf": pl["conf"],
                            "passed_quality": passed,
                            "quality_score": qscore,
                            "metrics": metrics,
                            "raw_ocr": raw_ocr,
                            "normalized_plate": norm_ocr,
                            "ocr_conf": ocr_conf,
                            "is_valid_format": is_valid
                        }
                    break

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
