"""
CampusGate - Active Camera Stream Pool & Stream Prober Module
=============================================================
Manages live video frame grabbers for registered cameras, provides
low-latency MJPEG streaming, dynamic fallback frame generation,
intelligent RTSP/IP URL normalization, and connection health diagnostics.
"""

import os
import re
import cv2
import time
import socket
import base64
import logging
import threading
import numpy as np
from urllib.parse import urlparse
from typing import Dict, Optional, Tuple, Union
from fastapi import HTTPException, status

from backend.ingestion.grabber import (
    BaseFrameGrabber,
    ThreadedRTSPGrabber,
    DirectFrameGrabber,
    GrabberFactory,
)

logger = logging.getLogger("campusgate.stream_pool")

# Ensure OpenCV/FFmpeg timeouts are enforced globally for network streams
os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp|timeout;3000000|stimeout;3000000")

# Disallowed SSRF destinations (Cloud metadata and link-local services)
BLOCKED_SSRF_HOSTS = {
    "169.254.169.254",
    "metadata.google.internal",
    "metadata.internal",
    "100.100.100.200",  # Alibaba metadata
}

DISALLOWED_SCHEMES = {"file", "gopher", "dict", "ftp", "ldap", "tftp", "php"}


def validate_stream_source_security(source: Union[str, int]) -> None:
    """
    Validates stream source against SSRF, command injection, and dangerous schemes.
    """
    if isinstance(source, int) or str(source).strip().isdigit():
        return  # Local webcam device index (0, 1, 2) is safe

    src_str = str(source).strip()

    # Block command injection characters & null bytes
    if any(c in src_str for c in [";", "&", "|", "`", "$", "\n", "\r", "\0"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stream source contains invalid or disallowed characters."
        )

    # Check URI scheme if present
    if "://" in src_str:
        scheme = src_str.split("://")[0].lower()
        if scheme in DISALLOWED_SCHEMES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"URI scheme '{scheme}://' is strictly prohibited for security."
            )
        if scheme not in ["rtsp", "rtsps", "http", "https"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported stream scheme '{scheme}'. Must be rtsp://, rtsps://, or http(s)://."
            )

        # Parse host for metadata SSRF protection
        try:
            parsed = urlparse(src_str)
            host = (parsed.hostname or "").lower()
            if host in BLOCKED_SSRF_HOSTS or host.startswith("169.254."):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Access to cloud instance metadata service is prohibited."
                )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            logger.warning(f"Error parsing stream URL '{src_str}': {e}")


def normalize_stream_source(source: Union[str, int]) -> str:
    """
    Intelligently normalizes user inputs into standard RTSP or HTTP URLs.
    Handles:
      - Raw IPs: '192.168.1.100' -> 'rtsp://192.168.1.100:554/stream1'
      - IP with Port: '192.168.1.100:554' -> 'rtsp://192.168.1.100:554'
      - IP with HTTP Port or /video: '192.168.1.100:8080/video' -> 'http://192.168.1.100:8080/video'
      - IP with credentials: 'admin:pass@192.168.1.50' -> 'rtsp://admin:pass@192.168.1.50:554/stream1'
      - Standard URLs: 'rtsp://...', 'http://...' -> preserved
      - Local Webcams: '0', 0 -> 0
    """
    if isinstance(source, int):
        return str(source)

    src = str(source).strip()
    if not src:
        return "0"

    # Numeric device index
    if src.isdigit():
        return str(int(src))

    # Existing local video file
    if src.lower().endswith((".mp4", ".avi", ".mkv", ".mov", ".m4v")):
        return src

    # Already has protocol
    if "://" in src:
        validate_stream_source_security(src)
        return src

    validate_stream_source_security(src)

    # Detect if it's an HTTP web stream (port 80, 8080, 8000, 5000, or has /video, /mjpeg, /mjpg)
    lower_src = src.lower()
    is_http = any(
        sub in lower_src
        for sub in [":8080", ":8000", ":80/", "/video", "/mjpeg", "/mjpg", "/webcam"]
    )

    if is_http:
        return f"http://{src}"

    # Default to RTSP for IP cameras
    if ":" in src.split("@")[-1].split("/")[0]:
        # Port is already specified (e.g. 192.168.1.100:554)
        return f"rtsp://{src}"
    
    # Bare IP or user:pass@IP without port: default to standard RTSP port and stream
    if "/" in src:
        return f"rtsp://{src}"
    return f"rtsp://{src}:554/stream1"


def generate_fallback_frame(camera_name: str = "Camera Feed", status_text: str = "SIGNAL STANDBY") -> np.ndarray:
    """
    Generates a high-tech surveillance HUD test frame when the physical camera is offline
    or connecting, preventing broken browser image icons.
    """
    w, h = 640, 360
    frame = np.zeros((h, w, 3), dtype=np.uint8)
    frame[:] = (15, 23, 42)  # Dark slate background

    # Subtle grid lines
    for x in range(0, w, 40):
        cv2.line(frame, (x, 0), (x, h), (30, 41, 59), 1)
    for y in range(0, h, 40):
        cv2.line(frame, (0, y), (w, y), (30, 41, 59), 1)

    # Center crosshair
    cx, cy = w // 2, h // 2
    cv2.circle(frame, (cx, cy), 36, (56, 189, 248), 1)
    cv2.line(frame, (cx - 45, cy), (cx + 45, cy), (56, 189, 248), 1)
    cv2.line(frame, (cx, cy - 45), (cx, cy + 45), (56, 189, 248), 1)

    # Header and Camera Name
    cv2.putText(frame, f"CAMPUSGATE NODE: {camera_name.upper()}", (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.65, (248, 250, 252), 2, cv2.LINE_AA)

    # Timestamp
    now_str = time.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(frame, f"TIMESTAMP: {now_str}", (20, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (148, 163, 184), 1, cv2.LINE_AA)

    # Status Banner
    color = (239, 68, 68) if "FAIL" in status_text or "OFFLINE" in status_text else (16, 185, 129)
    cv2.rectangle(frame, (20, h - 50), (w - 20, h - 20), (30, 41, 59), -1)
    cv2.rectangle(frame, (20, h - 50), (w - 20, h - 20), color, 1)
    cv2.putText(frame, f"STATUS: {status_text}", (30, h - 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1, cv2.LINE_AA)

    return frame


def probe_camera_connection(stream_source: str, timeout_seconds: float = 3.0) -> dict:
    """
    Tests and probes a camera IP or RTSP URL with rapid failover.
    Performs:
      1. Normalization & Security check.
      2. Fast TCP pre-flight check if host:port detected.
      3. OpenCV frame capture probe with 3s timeout.
      4. Captures 1 frame, calculates latency, resolution, FPS, and Base64 thumbnail.
    """
    norm_url = normalize_stream_source(stream_source)
    validate_stream_source_security(norm_url)

    start_time = time.time()
    protocol = "LOCAL_DEVICE"
    if norm_url.startswith("rtsp://") or norm_url.startswith("rtsps://"):
        protocol = "RTSP"
    elif norm_url.startswith("http://") or norm_url.startswith("https://"):
        protocol = "HTTP/MJPEG"

    # Fast TCP pre-flight socket check for network cameras
    if protocol in ["RTSP", "HTTP/MJPEG"]:
        try:
            parsed = urlparse(norm_url)
            host = parsed.hostname
            default_port = 554 if protocol == "RTSP" else 80
            port = parsed.port or default_port
            if host and host not in ["localhost", "127.0.0.1"]:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(min(timeout_seconds, 1.8))
                try:
                    s.connect((host, port))
                finally:
                    s.close()
        except socket.timeout:
            return {
                "success": False,
                "normalized_url": norm_url,
                "protocol": protocol,
                "latency_ms": round((time.time() - start_time) * 1000, 1),
                "error": f"Connection timed out while contacting {host}:{port}.",
                "diagnostics": [
                    f"Verify camera at {host} is powered on and connected to the campus network.",
                    f"Ensure port {port} is not blocked by a local firewall or subnet router.",
                    "Verify RTSP is enabled in the camera's internal configuration portal."
                ]
            }
        except Exception as e:
            logger.info(f"Socket pre-check note: {e}")

    # Initialize OpenCV probe with timeout property
    timeout_ms = int(timeout_seconds * 1000)
    cap = None
    try:
        if protocol == "RTSP":
            cap = cv2.VideoCapture(
                norm_url,
                cv2.CAP_FFMPEG,
                [
                    cv2.CAP_PROP_OPEN_TIMEOUT_MSEC, timeout_ms,
                    cv2.CAP_PROP_READ_TIMEOUT_MSEC, timeout_ms,
                ]
            )
        else:
            source_val = int(norm_url) if norm_url.isdigit() else norm_url
            cap = cv2.VideoCapture(source_val)

        if not cap or not cap.isOpened():
            latency = round((time.time() - start_time) * 1000, 1)
            return {
                "success": False,
                "normalized_url": norm_url,
                "protocol": protocol,
                "latency_ms": latency,
                "error": "Failed to open video stream.",
                "diagnostics": [
                    "Double check authentication credentials in the URL (rtsp://user:pass@ip:port/...).",
                    "Verify the RTSP stream path (e.g. /stream1, /h264Preview_01_main, /live).",
                    "Ensure no other service has an exclusive lock on the camera."
                ]
            }

        ret, frame = cap.read()
        latency = round((time.time() - start_time) * 1000, 1)

        if not ret or frame is None:
            return {
                "success": False,
                "normalized_url": norm_url,
                "protocol": protocol,
                "latency_ms": latency,
                "error": "Stream opened, but returned no video frames.",
                "diagnostics": [
                    "The video codec may not be supported (H.264 is strongly recommended).",
                    "The camera sensor may be starting up or in sleep mode."
                ]
            }

        h, w = frame.shape[:2]
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        # Generate lightweight JPEG preview thumbnail
        preview_h = 240
        preview_w = int(w * (preview_h / max(h, 1)))
        thumb = cv2.resize(frame, (preview_w, preview_h))
        ret_enc, thumb_buf = cv2.imencode(".jpg", thumb, [cv2.IMWRITE_JPEG_QUALITY, 70])
        b64_thumb = ""
        if ret_enc:
            b64_thumb = f"data:image/jpeg;base64,{base64.b64encode(thumb_buf).decode('utf-8')}"

        return {
            "success": True,
            "normalized_url": norm_url,
            "protocol": protocol,
            "resolution": f"{w}x{h}",
            "fps": round(fps, 1),
            "latency_ms": latency,
            "frame_captured": True,
            "preview_thumbnail": b64_thumb
        }
    except Exception as e:
        latency = round((time.time() - start_time) * 1000, 1)
        return {
            "success": False,
            "normalized_url": norm_url,
            "protocol": protocol,
            "latency_ms": latency,
            "error": str(e),
            "diagnostics": ["An unexpected error occurred while probing stream."]
        }
    finally:
        if cap:
            cap.release()


class CameraStreamPool:
    """
    Singleton Camera Stream Pool managing live grabber instances.
    Provides non-blocking frames for MJPEG feeds, snapshots, and background inference.
    """
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(CameraStreamPool, cls).__new__(cls)
                cls._instance._grabbers: Dict[str, BaseFrameGrabber] = {}
                cls._instance._sources: Dict[str, str] = {}
                cls._instance._names: Dict[str, str] = {}
                cls._instance._pool_lock = threading.Lock()
        return cls._instance

    def register_camera(self, camera_id: str, stream_url: str, name: str = "") -> None:
        """Registers a camera source into the pool."""
        norm_source = normalize_stream_source(stream_url)
        with self._pool_lock:
            self._sources[camera_id] = norm_source
            self._names[camera_id] = name or camera_id
            # If source changed, stop existing grabber
            existing = self._grabbers.get(camera_id)
            if existing:
                try:
                    existing.stop()
                except Exception:
                    pass
                del self._grabbers[camera_id]

    def unregister_camera(self, camera_id: str) -> None:
        """Removes a camera from the stream pool and releases its grabber."""
        with self._pool_lock:
            self._sources.pop(camera_id, None)
            self._names.pop(camera_id, None)
            grabber = self._grabbers.pop(camera_id, None)
            if grabber:
                try:
                    grabber.stop()
                except Exception:
                    pass

    def get_latest_frame(self, camera_id: str) -> Tuple[bool, np.ndarray, float]:
        """
        Retrieves the latest live frame from the camera's active grabber.
        If grabber is offline, generates a real-time HUD placeholder frame.
        """
        grabber = None
        source = None
        name = camera_id

        with self._pool_lock:
            grabber = self._grabbers.get(camera_id)
            source = self._sources.get(camera_id)
            name = self._names.get(camera_id, camera_id)

        # Lazy initialize grabber on first frame demand
        if grabber is None and source is not None:
            try:
                new_grabber = GrabberFactory.create(source)
                if new_grabber.start():
                    with self._pool_lock:
                        self._grabbers[camera_id] = new_grabber
                    grabber = new_grabber
            except Exception as e:
                logger.warning(f"Could not open live grabber for {camera_id}: {e}")

        if grabber and grabber.is_opened():
            ret, frame, capture_time = grabber.read()
            if ret and frame is not None:
                return True, frame, capture_time

        # Fallback HUD frame
        fallback = generate_fallback_frame(name, "CONNECTING / RTSP SEARCH...")
        return False, fallback, time.time()

    def get_frame_jpeg_bytes(self, camera_id: str, quality: int = 75) -> bytes:
        """Encodes latest frame to JPEG bytes for HTTP responses."""
        _, frame, _ = self.get_latest_frame(camera_id)
        ret, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, quality])
        if ret:
            return buf.tobytes()
        return b""


camera_stream_pool = CameraStreamPool()

