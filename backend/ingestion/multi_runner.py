"""
Multi-Process Camera Supervisor Runner.
Launches and supervises stream ingestion workers in isolated OS processes,
bypassing the Python Global Interpreter Lock (GIL) and leveraging all CPU cores.
"""

import sys
import time
import logging
import multiprocessing
import signal
from typing import List, Dict, Optional

from backend.core.database import SessionLocal
from backend.models.camera import Camera
from backend.ingestion.stream_worker import StreamIngestionWorker

logger = logging.getLogger("campusgate.multirunner")


def _run_worker_process(camera_id: str, stream_source: str, target_fps: float):
    """Entrypoint executed inside each isolated OS process."""
    logging.basicConfig(
        level=logging.INFO,
        format=f"%(asctime)s [%(levelname)s] [PID {multiprocessing.current_process().pid}] [CAM {camera_id}]: %(message)s"
    )
    worker = StreamIngestionWorker(
        camera_id=camera_id,
        stream_source=stream_source,
        target_fps=target_fps
    )
    try:
        worker.run()
    except KeyboardInterrupt:
        pass


class MultiCameraSupervisor:
    """
    Supervises N camera stream ingestion processes concurrently.
    Each camera feed runs with its own Python interpreter and memory footprint.
    """

    def __init__(self, target_fps: float = 6.0):
        self.target_fps = target_fps
        self.processes: Dict[str, multiprocessing.Process] = {}
        self.is_running = False

    def start_camera(self, camera_id: str, stream_source: str) -> bool:
        if camera_id in self.processes and self.processes[camera_id].is_alive():
            logger.warning(f"Camera process for [{camera_id}] is already running.")
            return False

        p = multiprocessing.Process(
            target=_run_worker_process,
            args=(camera_id, stream_source, self.target_fps),
            name=f"Worker-{camera_id}",
            daemon=True
        )
        p.start()
        self.processes[camera_id] = p
        logger.info(f"Launched isolated OS process (PID {p.pid}) for camera [{camera_id}].")
        return True

    def stop_camera(self, camera_id: str) -> None:
        p = self.processes.get(camera_id)
        if p and p.is_alive():
            p.terminate()
            p.join(timeout=2.0)
            logger.info(f"Stopped process for camera [{camera_id}].")

    def run_all_active_cameras(self):
        """Discovers all active cameras from database and runs them."""
        db = SessionLocal()
        try:
            cameras = db.query(Camera).filter(Camera.is_active == True).all()
            if not cameras:
                logger.warning("No active cameras found in database to launch.")
                return

            self.is_running = True
            logger.info(f"Supervisor starting {len(cameras)} camera workers in isolated processes...")
            for cam in cameras:
                source = cam.stream_url or "0"
                self.start_camera(cam.id, source)

            # Supervision loop
            while self.is_running:
                time.sleep(2.0)
                for cam_id, p in list(self.processes.items()):
                    if not p.is_alive():
                        logger.warning(f"Process for camera [{cam_id}] exited with code {p.exitcode}.")
        finally:
            db.close()
            self.stop_all()

    def stop_all(self):
        self.is_running = False
        for cam_id, p in self.processes.items():
            if p.is_alive():
                p.terminate()
                p.join(timeout=1.0)
        self.processes.clear()
        logger.info("All camera worker processes terminated.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [SUPERVISOR]: %(message)s")
    supervisor = MultiCameraSupervisor()

    def handle_signal(sig, frame):
        logger.info("Shutdown signal received. Stopping all camera processes...")
        supervisor.stop_all()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    supervisor.run_all_active_cameras()

