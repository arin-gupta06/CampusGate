import numpy as np
import pytest
from pathlib import Path
from backend.ingestion.grabber import (
    BaseFrameGrabber,
    ThreadedRTSPGrabber,
    DirectFrameGrabber,
    GrabberFactory,
)
from backend.ingestion.crop_manager import (
    compute_crop_accuracy,
    HybridCropManager,
)


def test_grabber_factory_selection():
    # RTSP and RTSPS URLs must produce ThreadedRTSPGrabber
    rtsp_grabber = GrabberFactory.create("rtsp://admin:pass@192.168.1.100:554/stream1")
    assert isinstance(rtsp_grabber, ThreadedRTSPGrabber)
    assert rtsp_grabber.rtsp_url.startswith("rtsp://")

    # Local webcam device index or string "0" must produce DirectFrameGrabber
    webcam_grabber = GrabberFactory.create(0)
    assert isinstance(webcam_grabber, DirectFrameGrabber)
    assert webcam_grabber.source == 0

    webcam_str_grabber = GrabberFactory.create("1")
    assert isinstance(webcam_str_grabber, DirectFrameGrabber)
    assert webcam_str_grabber.source == 1

    # Local video files must produce DirectFrameGrabber
    file_grabber = GrabberFactory.create("test_video.mp4")
    assert isinstance(file_grabber, DirectFrameGrabber)
    assert file_grabber.source == "test_video.mp4"


def test_compute_crop_accuracy_ranking():
    low_quality_crop = {
        "ocr_conf": 0.20,
        "quality_score": 0.30,
        "conf": 0.40,
        "is_valid_format": False,
        "is_latched": False,
    }
    high_quality_crop = {
        "ocr_conf": 0.95,
        "quality_score": 0.88,
        "conf": 0.92,
        "is_valid_format": True,
        "is_latched": True,
    }

    low_score = compute_crop_accuracy(low_quality_crop)
    high_score = compute_crop_accuracy(high_quality_crop)

    assert high_score > low_score
    assert high_score > 1.0  # Due to valid format and latched bonuses


def test_hybrid_crop_manager_retention_and_persistence(tmp_path: Path):
    manager = HybridCropManager(redis_url=None, disk_dir=tmp_path)

    # Fake 100x40 BGR plate image
    dummy_crop_low = np.zeros((40, 100, 3), dtype=np.uint8)
    dummy_crop_high = np.ones((40, 100, 3), dtype=np.uint8) * 255

    # 1. First low quality crop arrives
    ref1 = manager.update_best_crop(
        camera_id="CAM-GATE-01",
        track_id=42,
        plate_crop_info={
            "crop": dummy_crop_low,
            "ocr_conf": 0.25,
            "quality_score": 0.30,
            "conf": 0.40,
            "is_valid_format": False,
        }
    )
    assert ref1 == "crop:CAM-GATE-01:42"
    first_bytes = manager.get_crop_bytes(ref1)
    assert first_bytes is not None

    # 2. Lower quality crop arrives for same track -> should NOT overwrite
    ref2 = manager.update_best_crop(
        camera_id="CAM-GATE-01",
        track_id=42,
        plate_crop_info={
            "crop": dummy_crop_low,
            "ocr_conf": 0.10,
            "quality_score": 0.15,
            "conf": 0.20,
            "is_valid_format": False,
        }
    )
    assert ref2 == "crop:CAM-GATE-01:42"
    assert manager.get_crop_bytes(ref2) == first_bytes

    # 3. High quality crop arrives for same track -> should overwrite
    ref3 = manager.update_best_crop(
        camera_id="CAM-GATE-01",
        track_id=42,
        plate_crop_info={
            "crop": dummy_crop_high,
            "ocr_conf": 0.95,
            "quality_score": 0.90,
            "conf": 0.95,
            "is_valid_format": True,
        }
    )
    assert ref3 == "crop:CAM-GATE-01:42"
    high_bytes = manager.get_crop_bytes(ref3)
    assert high_bytes is not None
    assert high_bytes != first_bytes

    # 4. Audit Persistence: export to disk only when requested
    audit_file = "audit_review_42.jpg"
    disk_path = manager.persist_to_disk_for_audit(ref3, audit_file)
    assert disk_path == f"static/crops/{audit_file}"
    assert (tmp_path / audit_file).exists()
    assert (tmp_path / audit_file).stat().st_size > 0

