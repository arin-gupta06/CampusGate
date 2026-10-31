import time
import cv2
import logging
import uuid
from pathlib import Path
from typing import Optional, Tuple, Callable
from datetime import datetime

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.models.camera import Camera
from backend.models.observation import VehicleObservation, PlateReading
from backend.models.entry import VehicleEntryEvent
from backend.models.authorized import AuthorizedVehicle
from backend.reconciliation.engine import ReconciliationEngine
from backend.vision.tracker import CameraVisionTracker, VirtualEntryLine
from backend.vision.frame_snapshot import capture_frame_snapshot

logger = logging.getLogger("campusgate.ingestion")


def _resolve_device() -> str:
    try:
        if cv2.cuda.getCudaEnabledDeviceCount() > 0:
            return "cuda:0"
    except Exception:
        pass
    return "cpu"


class StreamIngestionWorker:
    """
    Tier-2 Stream Ingestion Worker adhering to Blueprint §3.
    Reads RTSP streams or video files, freezes sampled frames into immutable
    snapshots, post-processes ONLY the snapshots (core rule), and reliably
    records observations, crossings, and cross-camera events in Postgres.
    """
    def __init__(
        self,
        camera_id: str,
        stream_source: str,
        target_fps: float = 6.0,
        entry_line: Optional[Tuple[Tuple[int, int], Tuple[int, int]]] = None,
        event_callback: Optional[Callable[[dict], None]] = None
    ):
        self.camera_id = camera_id
        self.stream_source = stream_source
        self.target_fps = target_fps
        self.frame_interval = 1.0 / max(target_fps, 1.0)
        self.event_callback = event_callback
        self.is_running = False

        # Virtual entry line
        vline = None
        if entry_line:
            vline = VirtualEntryLine(entry_line[0], entry_line[1], "INBOUND")

        # Initialize vision tracker (snapshot-first post-processing engine)
        self.tracker = CameraVisionTracker(
            camera_id=camera_id,
            weights_path=settings.WEIGHTS_PATH,
            entry_line=vline,
            conf_threshold=settings.DETECTION_CONF_THRESHOLD,
            device=_resolve_device(),
            enable_ocr=True
        )

        # Storage directory for crops
        self.crops_dir = settings.BASE_DIR / "backend" / "static" / "crops"
        self.crops_dir.mkdir(parents=True, exist_ok=True)

    def run(self, max_frames: Optional[int] = None):
        """Main capture and ingestion loop (capture -> snapshot -> post-process)."""
        self.is_running = True
        logger.info(f"Starting stream worker for [{self.camera_id}] from: {self.stream_source}")

        # Convert numeric string (e.g. "0") or int to device index for laptop webcam testing
        source = int(self.stream_source) if str(self.stream_source).strip().isdigit() else self.stream_source
        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            logger.error(f"Failed to open video source: {self.stream_source}")
            return

        frame_idx = 0
        last_frame_time = time.time()

        try:
            while self.is_running and cap.isOpened():
                ret, live_frame = cap.read()
                if not ret:
                    logger.info(f"End of stream reached for [{self.camera_id}].")
                    break

                now = time.time()
                elapsed = now - last_frame_time
                if elapsed < self.frame_interval:
                    # Skip frame to maintain target processing FPS
                    continue

                last_frame_time = now
                frame_idx += 1

                # CORE RULE: freeze the live frame into an immutable snapshot,
                # then post-process ONLY the snapshot copy.
                try:
                    snapshot = capture_frame_snapshot(
                        live_frame, self.camera_id, frame_idx, source="live"
                    )
                except ValueError:
                    continue
                results = self.tracker.process_snapshot(snapshot)
                self._handle_tracker_results(results)

                if max_frames and frame_idx >= max_frames:
                    break

        finally:
            cap.release()
            self.is_running = False
            logger.info(f"Stopped stream worker for [{self.camera_id}].")

    def _handle_tracker_results(self, results: dict):
        """Persists observations and entry events to PostgreSQL."""
        db = SessionLocal()
        try:
            camera = db.query(Camera).filter(Camera.id == self.camera_id).first()
            if not camera:
                return

            now = datetime.utcnow()
            obs_dict = {}

            # 1. Record observations & plate readings
            for obs_info in results["observations"]:
                plate_crop_info = obs_info.get("plate_crop_info")
                crop_path_str = None

                if plate_crop_info and plate_crop_info.get("crop") is not None:
                    # Save plate crop to file storage
                    crop_filename = f"crop_{self.camera_id}_{obs_info['track_id']}_{uuid.uuid4().hex[:6]}.jpg"
                    crop_full_path = self.crops_dir / crop_filename
                    cv2.imwrite(str(crop_full_path), plate_crop_info["crop"])
                    crop_path_str = f"static/crops/{crop_filename}"

                obs = VehicleObservation(
                    camera_id=self.camera_id,
                    track_session_id=obs_info["session_id"],
                    local_track_id=obs_info["track_id"],
                    captured_at=now,
                    plate_crop_path=crop_path_str,
                    vehicle_conf=obs_info.get("vehicle_conf", 0.0),
                    plate_conf=(plate_crop_info.get("conf") if plate_crop_info else None),
                    direction=obs_info.get("direction"),
                    crossing_status="CROSSED" if obs_info.get("has_crossed") else "APPROACHING"
                )
                db.add(obs)
                db.flush()
                obs_dict[obs_info["track_id"]] = obs

                # Add plate reading if OCR produced text this snapshot, or a
                # locked consensus exists from earlier snapshots in the track.
                plate_reading = None
                raw_text = None
                if plate_crop_info:
                    raw_text = plate_crop_info.get("raw_ocr") or plate_crop_info.get("normalized_plate")
                if plate_crop_info and raw_text:
                    plate_reading = PlateReading(
                        observation_id=obs.id,
                        raw_text=raw_text,
                        normalized_text=plate_crop_info.get("normalized_plate"),
                        confidence=plate_crop_info.get("ocr_conf", 0.0),
                        crop_quality_score=plate_crop_info.get("quality_score", 0.0),
                        is_valid_format=plate_crop_info.get("is_valid_format", False)
                    )
                    db.add(plate_reading)
                    db.flush()

                # If camera is downstream, evaluate against pending handoffs
                if camera.physical_role == "DOWNSTREAM":
                    reconcile_engine = ReconciliationEngine(db)
                    match_result = reconcile_engine.evaluate_downstream_observation(obs, plate_reading)
                    if match_result.get("matched") and self.event_callback:
                        self.event_callback({
                            "type": "HANDOFF_RECONCILED",
                            "camera_id": self.camera_id,
                            "match": match_result
                        })

            # 2. Record Entry Crossing Events
            for event in results["events"]:
                if event["event_type"] == "ENTRY_CROSSED" and camera.physical_role == "ENTRY":
                    plate = event.get("plate")
                    is_valid = event.get("is_valid_format", False)
                    obs = obs_dict.get(event["track_id"])

                    identity_status = "IDENTIFIED" if (plate and is_valid) else "HANDOFF_PENDING"
                    authorization_state = "REVIEW_REQUIRED"

                    if plate and is_valid:
                        auth_rec = db.query(AuthorizedVehicle).filter(
                            AuthorizedVehicle.registration_number == plate,
                            AuthorizedVehicle.is_active == True
                        ).first()
                        authorization_state = "AUTHORIZED" if auth_rec else "NOT_MATCHED"

                    entry = VehicleEntryEvent(
                        registration_number=plate if is_valid else None,
                        first_observed_at=now,
                        entry_confirmed_at=now,
                        identity_status=identity_status,
                        authorization_state=authorization_state,
                        resolution_method="DIRECT_ENTRY_OCR" if (plate and is_valid) else None,
                        primary_camera_id=self.camera_id,
                        primary_observation_id=obs.id if obs else None
                    )
                    db.add(entry)
                    db.commit()
                    db.refresh(entry)

                    # If plate is unreadable, trigger handoff creation
                    if not (plate and is_valid):
                        reconcile_engine = ReconciliationEngine(db)
                        reconcile_engine.create_pending_handoff(entry, self.camera_id, obs.id if obs else "")

                    # Broadcast event
                    if self.event_callback:
                        self.event_callback({
                            "type": "ENTRY_EVENT",
                            "entry_id": entry.id,
                            "camera_id": self.camera_id,
                            "plate": entry.registration_number,
                            "identity_status": entry.identity_status,
                            "authorization_state": entry.authorization_state
                        })

            db.commit()
        except Exception as e:
            logger.error(f"Error persisting tracker results: {e}", exc_info=True)
            db.rollback()
        finally:
            db.close()
