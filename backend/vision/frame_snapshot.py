"""Campus Gate - Frame Snapshot Capture + Post-Processing.

Core architectural rule enforced here (Blueprint Tier-2 / Tier-3 split):

  1. CAPTURE  : Grab a frame from the live source and immediately freeze it
     into an immutable ``FrameSnapshot`` (deep copy + timestamps + ids).
  2. POST-PROCESS: Run ALL vision work (YOLO detect/track, quality gate,
     character reading, aggregation) ONLY against the snapshot copy.

Live-feed frames must NEVER be passed directly to a detector, cropped for
OCR, or mutated with overlays before detection. Display overlays are drawn
on a separate display copy after post-processing returns.

This module is deliberately dependency-light (numpy + cv2 + stdlib) so the
capture contract can be unit-tested without torch/ultralytics installed.
"""

from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np


@dataclass
class FrameSnapshot:
    """Immutable frozen copy of one captured frame.

    Attributes:
        snapshot_id: Stable unique id for this snapshot.
        camera_id: Logical camera id (e.g. CAM-GATE-01, LAPTOP-WEBCAM).
        frame_idx: Monotonic capture sequence number.
        captured_at: UTC wall-clock capture time (event time).
        perf_ts: monotonic perf-counter timestamp for latency measurement.
        image: Deep-copied BGR frame. Post-processors must treat it as
            read-only and copy again before drawing.
        width / height: Snapshot dimensions.
        source: Capture origin label (live/file/test).
    """

    snapshot_id: str
    camera_id: str
    frame_idx: int
    captured_at: datetime
    perf_ts: float
    image: np.ndarray
    width: int
    height: int
    source: str = "live"
    meta: Dict[str, Any] = field(default_factory=dict)


def capture_frame_snapshot(
    frame: np.ndarray,
    camera_id: str,
    frame_idx: int,
    source: str = "live",
) -> FrameSnapshot:
    """Freeze a live frame into an immutable snapshot (deep copy).

    Raises:
        ValueError: If frame is None or empty.
    """
    if frame is None or not isinstance(frame, np.ndarray) or frame.size == 0:
        raise ValueError("capture_frame_snapshot: empty frame cannot be snapshotted")
    frozen = frame.copy()  # deep copy: later live/display mutation can't leak in
    h, w = frozen.shape[:2]
    # Make the snapshot buffer read-only so accidental in-place drawing fails fast.
    try:
        frozen.flags.writeable = False
    except Exception:
        pass
    return FrameSnapshot(
        snapshot_id=f"snap_{camera_id}_{frame_idx}_{uuid.uuid4().hex[:8]}",
        camera_id=camera_id,
        frame_idx=int(frame_idx),
        captured_at=datetime.now(timezone.utc),
        perf_ts=time.perf_counter(),
        image=frozen,
        width=int(w),
        height=int(h),
        source=source,
    )


def writable_snapshot_view(snapshot: FrameSnapshot) -> np.ndarray:
    """Return a writable deep copy of the snapshot image for processing.

    The snapshot's own buffer stays read-only; every post-processing stage
    works on this copy, never on the live feed frame.
    """
    view = snapshot.image.copy()
    try:
        view.flags.writeable = True
    except Exception:
        pass
    return view


# ---------------------------------------------------------------------------
# Plate-type aware crop preparation shared by every post-processing path.
# ---------------------------------------------------------------------------

# Vehicle class-name hints accepted by the flexible detector mapping.
VEHICLE_CLASS_HINTS = (
    "car", "vehicle", "truck", "bus", "van", "jeep", "tuktuk", "auto",
    "motor", "bike", "scooter", "cycle", "lorry", "tempo",
)

# Plate class-name hints accepted by the flexible detector mapping.
PLATE_CLASS_HINTS = ("plate", "numberplate", "number_plate", "license", "licence", "reg")


def is_plate_class(cls_id: int, cls_name: str) -> bool:
    """Flexible plate-class check covering single-class and multi-class heads."""
    name = (cls_name or "").lower().replace(" ", "").replace("-", "_")
    if any(h in name for h in PLATE_CLASS_HINTS):
        return True
    # Legacy two-class head: 0 = vehicle, 1 = plate.
    if cls_id == 1:
        return True
    # Single-class plate-only head (only class id 0 named plate-like or generic).
    if cls_id == 0 and (name in ("", "0", "plate", "licenseplate") or "plate" in name):
        return True
    return False


def is_vehicle_class(cls_id: int, cls_name: str) -> bool:
    """Flexible vehicle-class check that never steals plate boxes."""
    if is_plate_class(cls_id, cls_name):
        return False
    name = (cls_name or "").lower()
    if any(h in name for h in VEHICLE_CLASS_HINTS):
        return True
    # Legacy two-class head default: class 0 (non-plate) is a vehicle.
    if cls_id == 0:
        return True
    return False


def padded_plate_crop(
    snapshot_view: np.ndarray,
    box: List[int],
    pad_x_ratio: float = 0.12,
    pad_y_ratio: float = 0.18,
) -> np.ndarray:
    """Extract a contextually padded plate crop from a snapshot view.

    Padding preserves tilted-plate corners and two-row plate edges that a
    tight box would clip. Works on the writable snapshot copy only.
    """
    h, w = snapshot_view.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in box]
    pw = max(1, x2 - x1)
    ph = max(1, y2 - y1)
    pad_x = int(pw * pad_x_ratio)
    pad_y = int(ph * pad_y_ratio)
    return snapshot_view[
        max(0, y1 - pad_y):min(h, y2 + pad_y),
        max(0, x1 - pad_x):min(w, x2 + pad_x),
    ].copy()


def upscale_small_crop(crop: np.ndarray, min_h: int = 90, min_w: int = 180) -> np.ndarray:
    """Super-resolve small/distant crops so every plate type stays readable.

    Small crops (distant gate approach, bikes, two-row plates) are upscaled
    with cubic interpolation plus mild unsharp masking to defeat H.264
    softness before character reading.
    """
    if crop is None or crop.size == 0:
        return crop
    ch, cw = crop.shape[:2]
    if ch < min_h or cw < min_w:
        scale = max(2.2, float(min_h) / max(ch, 1))
        crop = cv2.resize(
            crop, (int(cw * scale), int(ch * scale)), interpolation=cv2.INTER_CUBIC
        )
        g = cv2.GaussianBlur(crop, (0, 0), 2.0)
        crop = cv2.addWeighted(crop, 1.45, g, -0.45, 0)
    return crop


def deblur_motion_crop(crop):
    """Aggressive deblur for motion-blurred moving-vehicle crops.

    LAB-space CLAHE restores washed-out stroke contrast and a strong
    unsharp mask (gain 1.8) re-tightens edges smeared along the motion
    direction. Used as a single bounded retry when the crop meters as
    blurry and the first read failed; never on the live frame.
    """
    import cv2
    if crop is None or crop.size == 0:
        return crop
    img = crop.copy()
    if len(img.shape) == 3:
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        cl = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(l)
        img = cv2.cvtColor(cv2.merge((cl, a, b)), cv2.COLOR_LAB2BGR)
    g = cv2.GaussianBlur(img, (0, 0), 3.0)
    return cv2.addWeighted(img, 1.8, g, -0.8, 0)


def central_zoom_roi(
    snapshot_view: np.ndarray, margin_ratio: float = 0.12
) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
    """Central digital-zoom ROI for distant plates missed at full frame."""
    h, w = snapshot_view.shape[:2]
    zx1, zy1 = int(w * margin_ratio), int(h * margin_ratio)
    zx2, zy2 = int(w * (1.0 - margin_ratio)), int(h * (1.0 - margin_ratio))
    return snapshot_view[zy1:zy2, zx1:zx2].copy(), (zx1, zy1, zx2, zy2)


def vehicle_lower_crop(
    snapshot_view: np.ndarray, veh_box: List[int], top_skip_ratio: float = 0.40
) -> Optional[Tuple[np.ndarray, Tuple[int, int]]]:
    """Lower-vehicle cascade crop (bumper/trunk band where plates live)."""
    vh, vw = snapshot_view.shape[:2]
    vx1, vy1, vx2, vy2 = [int(v) for v in veh_box]
    if (vx2 - vx1) < 80 or (vy2 - vy1) < 60:
        return None
    crop_y1 = max(0, int(vy1 + top_skip_ratio * (vy2 - vy1)))
    crop = snapshot_view[crop_y1:min(vh, vy2), max(0, vx1):min(vw, vx2)].copy()
    if crop.size == 0:
        return None
    gaussian = cv2.GaussianBlur(crop, (0, 0), 2.0)
    sharp = cv2.addWeighted(crop, 1.40, gaussian, -0.40, 0)
    return sharp, (max(0, vx1), crop_y1)
