import time
import cv2
import logging
import uuid
import queue
import threading
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
from backend.ingestion.grabber import GrabberFactory
from backend.ingestion.crop_manager import crop_manager
from backend.ingestion.motion_filter import MotionPreFilter
from backend.core.cache import cache

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

        # Decoupled Producer-Consumer queue for non-blocking database writes
        self.db_queue: queue.Queue = queue.Queue(maxsize=1000)
        self._db_thread: Optional[threading.Thread] = None

        # Lightweight motion pre-filter to skip YOLO on empty roads (P-03)
        self.motion_filter = MotionPreFilter()

    def run(self, max_frames: Optional[int] = None):
        """Main capture and ingestion loop (capture -> snapshot -> post-process)."""
        self.is_running = True
        logger.info(f"Starting stream worker for [{self.camera_id}] from: {self.stream_source}")

        # Start background DB writer thread (Producer-Consumer pattern)
        self._db_thread = threading.Thread(target=self._db_consumer_loop, daemon=True)
        self._db_thread.start()

        # Initialize grabber adapter (Threaded RTSP grabber or Direct webcam/file grabber)
        grabber = GrabberFactory.create(self.stream_source)
        if not grabber.start():
            logger.error(f"Failed to open video source: {self.stream_source}")
            self.is_running = False
            return

        frame_idx = 0
        last_frame_time = time.time()

        try:
            while self.is_running and grabber.is_opened():
                ret, live_frame, frame_time = grabber.read()
                if not ret or live_frame is None:
                    # Brief yield if waiting for stream packets
                    time.sleep(0.01)
                    continue

                now = time.time()
                elapsed = now - last_frame_time
                if elapsed < self.frame_interval:
                    # Yield CPU slice to prevent 100% busy-wait core spinning
                    time.sleep(0.005)
                    continue

                last_frame_time = now
                frame_idx += 1

                # Motion pre-filter check: skip heavy YOLO on empty roads (P-03)
                has_active_tracks = bool(self.tracker.tracks) if hasattr(self.tracker, "tracks") else False
                if not self.motion_filter.evaluate_motion(live_frame, has_active_tracks=has_active_tracks):
                    time.sleep(0.005)
                    continue

                # CORE RULE: freeze the live frame into an immutable snapshot,
                # then post-process ONLY the snapshot copy.
                try:
                    snapshot = capture_frame_snapshot(
                        live_frame, self.camera_id, frame_idx, source="live"
                    )
                except ValueError:
                    continue
                results = self.tracker.process_snapshot(snapshot)

                # Non-blocking handoff: push to DB consumer queue immediately
                try:
                    self.db_queue.put_nowait(results)
                except queue.Full:
                    logger.warning(f"Database write queue full for [{self.camera_id}]. Dropping backlogged frame.")

                if max_frames and frame_idx >= max_frames:
                    break

        finally:
            grabber.stop()
            self.is_running = False
            if self._db_thread and self._db_thread.is_alive():
                self._db_thread.join(timeout=2.0)
            logger.info(f"Stopped stream worker for [{self.camera_id}].")

    def _db_consumer_loop(self):
        """
        Background Consumer Thread:
        Drains tracker results from db_queue and commits them to PostgreSQL.
        Completely isolates the real-time frame ingestion loop from database latency.
        """
        logger.info(f"Database async consumer thread started for [{self.camera_id}].")
        while self.is_running or not self.db_queue.empty():
            try:
                results = self.db_queue.get(timeout=0.2)
            except queue.Empty:
                continue

            try:
                self._handle_tracker_results(results)
            except Exception as e:
                logger.error(f"Error persisting tracker results in consumer thread: {e}", exc_info=True)
            finally:
                self.db_queue.task_done()

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
                    # Retains ONLY the single best-accuracy crop in Redis/Memory
                    crop_path_str = crop_manager.update_best_crop(
                        camera_id=self.camera_id,
                        track_id=obs_info["track_id"],
                        plate_crop_info=plate_crop_info
                    )

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

                    # If case requires operator review or is unauthorized, persist best crop to disk for audit
                    if (identity_status == "REVIEW_REQUIRED" or authorization_state != "AUTHORIZED") and obs and obs.plate_crop_path:
                        audit_filename = f"review_{self.camera_id}_{event['track_id']}_{uuid.uuid4().hex[:6]}.jpg"
                        disk_path = crop_manager.persist_to_disk_for_audit(obs.plate_crop_path, audit_filename)
                        if disk_path:
                            obs.plate_crop_path = disk_path

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

                    # Invalidate summary cache so dashboard reflects new entry immediately
                    cache.delete("cache:audit_summary")

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

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Campus Gate - Camera Stream Ingestion Worker")
    parser.add_argument("--camera-id", required=True, help="Camera ID (e.g. CAM-GATE-01)")
    parser.add_argument("--source", required=True, help="RTSP URL, device index (0), or video file")
    parser.add_argument("--fps", type=float, default=6.0, help="Target processing FPS (default: 6.0)")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    worker = StreamIngestionWorker(camera_id=args.camera_id, stream_source=args.source, target_fps=args.fps)
    try:
        worker.run()
    except KeyboardInterrupt:
        logger.info(f"Worker for [{args.camera_id}] stopped by user.")
