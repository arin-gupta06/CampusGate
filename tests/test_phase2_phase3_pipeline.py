import time
import numpy as np
import pytest
from backend.ingestion.motion_filter import MotionPreFilter


def test_motion_pre_filter_detects_movement():
    filter_gate = MotionPreFilter(min_motion_ratio=0.01, hold_frames=3)

    # Frame 1: Blank black frame (initialization)
    f1 = np.zeros((180, 320, 3), dtype=np.uint8)
    assert filter_gate.evaluate_motion(f1) is True

    # Frame 2: Identical blank frame -> NO motion!
    f2 = np.zeros((180, 320, 3), dtype=np.uint8)
    assert filter_gate.evaluate_motion(f2) is False

    # Frame 3: Significant movement (white rectangle simulating car entrance)
    f3 = np.zeros((180, 320, 3), dtype=np.uint8)
    f3[40:140, 80:240] = 255  # ~30% of pixels changed
    assert filter_gate.evaluate_motion(f3) is True

    # Frame 4: Identical frame to f3 -> Hysteresis hold should keep it active!
    assert filter_gate.evaluate_motion(f3) is True


def test_motion_pre_filter_never_drops_active_tracks():
    filter_gate = MotionPreFilter()

    # Even with an identical frame, if has_active_tracks=True, it MUST return True!
    f1 = np.zeros((180, 320, 3), dtype=np.uint8)
    filter_gate.evaluate_motion(f1)
    assert filter_gate.evaluate_motion(f1, has_active_tracks=True) is True

