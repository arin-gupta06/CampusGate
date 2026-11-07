"""
Adapter Design Pattern for Video Capture and Frame Ingestion.
Decouples StreamIngestionWorker from concrete stream protocols and hardware.
"""

from abc import ABC, abstractmethod
import logging
import threading
import time
import cv2
import numpy as np
from typing import Tuple, Optional, Union

logger = logging.getLogger("campusgate.grabber")


class BaseFrameGrabber(ABC):
    """
    Target Interface for all video frame grabbers.
    Provides a uniform start/read/stop/is_opened contract.
    """

    @abstractmethod
    def start(self) -> bool:
        """Initializes and opens the video stream."""
        pass

    @abstractmethod
    def read(self) -> Tuple[bool, Optional[np.ndarray], float]:
        """
        Retrieves the next available frame.
        Returns:
            Tuple of (success_flag, frame_ndarray_or_None, capture_timestamp)
        """
        pass

    @abstractmethod
    def stop(self) -> None:
        """Stops capture and releases all hardware/socket resources."""
        pass

    @abstractmethod
    def is_opened(self) -> bool:
        """Returns True if the underlying capture resource is active and open."""
        pass


class ThreadedRTSPGrabber(BaseFrameGrabber):
    """
    Adapter for RTSP / IP Network Cameras.
    Runs a lightweight background daemon thread that drains the RTSP buffer
    continuously. Guarantees that read() always returns the latest real-time frame
    with zero network lag, preventing OpenCV buffer starvation or latency buildup.
    """

    def __init__(self, rtsp_url: str):
        self.rtsp_url = rtsp_url
        self.cap: Optional[cv2.VideoCapture] = None
        self._latest_frame: Optional[np.ndarray] = None
        self._latest_time: float = 0.0
        self._is_running = False
        self._lock = threading.Lock()
        self._thread: Optional[threading.Thread] = None

    def start(self) -> bool:
        logger.info(f"Opening RTSP stream with Threaded Grabber: {self.rtsp_url}")
        self.cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
        
        # Request OpenCV to keep only the latest 1 frame in internal buffer
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

        if not self.cap.isOpened():
            logger.error(f"Failed to open RTSP stream: {self.rtsp_url}")
            return False

        self._is_running = True
        self._thread = threading.Thread(target=self._drain_loop, daemon=True)
        self._thread.start()
        logger.info(f"RTSP background drain thread started for: {self.rtsp_url}")
        return True

    def _drain_loop(self):
        """Continuously pulls frames as fast as the camera sends them to prevent lag."""
        while self._is_running and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                logger.warning(f"RTSP stream read dropped for: {self.rtsp_url}")
                time.sleep(0.05)
                continue

            with self._lock:
                self._latest_frame = frame
                self._latest_time = time.time()

            # Minimal yield to keep CPU healthy
            time.sleep(0.002)

    def read(self) -> Tuple[bool, Optional[np.ndarray], float]:
        with self._lock:
            if self._latest_frame is None:
                return False, None, 0.0
            return True, self._latest_frame.copy(), self._latest_time

    def stop(self) -> None:
        self._is_running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1.0)
        if self.cap:
            self.cap.release()
            self.cap = None
        logger.info(f"Threaded RTSP grabber stopped for: {self.rtsp_url}")

    def is_opened(self) -> bool:
        return self._is_running and (self.cap is not None and self.cap.isOpened())


class DirectFrameGrabber(BaseFrameGrabber):
    """
    Adapter for Local USB Webcams and Video Files (.mp4, .avi).
    Performs direct, synchronous reading. Does not drop frames, ensuring full
    reproducibility during offline tests, benchmarks, and local webcam development.
    """

    def __init__(self, source: Union[str, int]):
        # Convert numeric string ("0") or int to device index
        self.source = int(source) if str(source).strip().isdigit() else source
        self.cap: Optional[cv2.VideoCapture] = None

    def start(self) -> bool:
        logger.info(f"Opening Direct Grabber for source: {self.source}")
        self.cap = cv2.VideoCapture(self.source)
        if not self.cap.isOpened():
            logger.error(f"Failed to open source: {self.source}")
            return False
        return True

    def read(self) -> Tuple[bool, Optional[np.ndarray], float]:
        if not self.cap or not self.cap.isOpened():
            return False, None, 0.0

        ret, frame = self.cap.read()
        return ret, frame, time.time()

    def stop(self) -> None:
        if self.cap:
            self.cap.release()
            self.cap = None
        logger.info(f"Direct grabber stopped for source: {self.source}")

    def is_opened(self) -> bool:
        return self.cap is not None and self.cap.isOpened()


class GrabberFactory:
    """
    Factory that inspects the stream source and instantiates the appropriate
    BaseFrameGrabber adapter.
    """

    @staticmethod
    def create(source: Union[str, int]) -> BaseFrameGrabber:
        src_str = str(source).strip().lower()
        
        # Network RTSP / RTSPS / HTTP streams -> Threaded buffer-draining grabber
        if src_str.startswith("rtsp://") or src_str.startswith("rtsps://") or src_str.startswith("http://") or src_str.startswith("https://"):
            return ThreadedRTSPGrabber(str(source))

        # Local webcam index or video file -> Direct synchronous grabber
        return DirectFrameGrabber(source)

