from unittest.mock import patch
import pytest
from fastapi import HTTPException
from pathlib import Path

from backend.ingestion.stream_pool import (
    normalize_stream_source,
    validate_stream_source_security,
    generate_fallback_frame,
    camera_stream_pool,
)
from backend.api.cameras import _require_operator_role
from backend.api.vision import get_plate_crop
from backend.core.config import settings

def test_stream_source_normalization():
    """Verify smart auto-formatting of raw IPs, ports, and credentials."""
    # Raw IP without port
    assert normalize_stream_source("192.168.1.100") == "rtsp://192.168.1.100:554/stream1"
    
    # IP with explicit RTSP port
    assert normalize_stream_source("192.168.1.100:554") == "rtsp://192.168.1.100:554"
    
    # IP with credentials
    assert normalize_stream_source("admin:pass@192.168.1.100") == "rtsp://admin:pass@192.168.1.100:554/stream1"
    
    # HTTP video stream
    assert normalize_stream_source("192.168.1.100:8080/video") == "http://192.168.1.100:8080/video"
    
    # Full RTSP URL preserved
    assert normalize_stream_source("rtsp://cam.local:554/live") == "rtsp://cam.local:554/live"
    
    # Local webcam index
    assert normalize_stream_source("0") == "0"
    assert normalize_stream_source(1) == "1"

def test_stream_source_security_rejections():
    """Verify protection against SSRF, cloud metadata exfiltration, and command injection."""
    # Disallowed dangerous schemes
    with pytest.raises(HTTPException) as exc:
        validate_stream_source_security("file:///etc/passwd")
    assert exc.value.status_code == 400
    assert "strictly prohibited" in exc.value.detail

    # Cloud metadata SSRF
    with pytest.raises(HTTPException) as exc:
        validate_stream_source_security("http://169.254.169.254/latest/meta-data/")
    assert exc.value.status_code == 400
    assert "cloud instance metadata" in exc.value.detail

    # Command injection characters
    with pytest.raises(HTTPException) as exc:
        validate_stream_source_security("rtsp://192.168.1.10; rm -rf /")
    assert exc.value.status_code == 400
    assert "disallowed characters" in exc.value.detail

def test_camera_operator_rbac():
    """Guards and Admins are permitted to manage cameras; viewers/students are blocked."""
    assert _require_operator_role({"role": "guard"}) == "guard"
    assert _require_operator_role({"role": "admin"}) == "admin"

    with pytest.raises(HTTPException) as exc:
        _require_operator_role({"role": "student"})
    assert exc.value.status_code == 403

    with pytest.raises(HTTPException) as exc:
        _require_operator_role({"role": "viewer"})
    assert exc.value.status_code == 403

def test_camera_stream_pool_fallback_frame():
    """Verify live feed generates resilient fallback HUD frames when camera is offline."""
    camera_stream_pool.register_camera("CAM-TEST-OFFLINE", "rtsp://10.255.255.1:554/test", "Test Gate Cam")
    has_frame, frame, ts = camera_stream_pool.get_latest_frame("CAM-TEST-OFFLINE")
    
    assert frame is not None
    assert frame.shape == (360, 640, 3)
    
    jpeg_bytes = camera_stream_pool.get_frame_jpeg_bytes("CAM-TEST-OFFLINE")
    assert len(jpeg_bytes) > 100
    assert jpeg_bytes[:2] == b'\xff\xd8'  # Valid JPEG magic bytes

def test_crop_path_traversal_prevention():
    """Verify that path traversal in get_plate_crop is blocked with HTTP 403."""
    with pytest.raises(HTTPException) as exc:
        get_plate_crop("static/../../../../../../windows/system32/cmd.exe")
    assert exc.value.status_code == 403
    assert "Access denied" in exc.value.detail

