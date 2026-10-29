import cv2
import numpy as np
from typing import Tuple, Dict, Any, Optional

class PlateQualityGate:
    """
    Evaluates license plate crops before OCR / Character Detection.
    Optimized for Standard / Normal Cameras (Webcams, Standard CCTV & IP Cameras):
      - Handles wide-angle digital zoom constraints (calibrated min resolution)
      - Anti-glare headlight & reflection detection
      - Speed-bump sweetspot bonus (grants high confidence during deceleration / stopped state)
      - H.264 compression noise tolerance
    """

    def __init__(
        self,
        min_width: int = 24,
        min_height: int = 10,
        focal_min_height: int = 12,        # Relaxed for distant plates
        focal_min_width: int = 28,         # Relaxed for distant plates
        min_aspect_ratio: float = 0.85,    # Supports two-row square motorcycle & auto plates
        max_aspect_ratio: float = 6.8,     # Supports long horizontal strip plates
        blur_threshold: float = 24.0,      # Relaxed for low-light & high-speed exposure
        contrast_threshold: float = 14.0,
        passing_score_threshold: float = 0.28  # Allows harsh lighting & night plates through
    ):
        self.min_width = min_width
        self.min_height = min_height
        self.focal_min_height = focal_min_height
        self.focal_min_width = focal_min_width
        self.min_aspect_ratio = min_aspect_ratio
        self.max_aspect_ratio = max_aspect_ratio
        self.blur_threshold = blur_threshold
        self.contrast_threshold = contrast_threshold
        self.passing_score_threshold = passing_score_threshold

    def classify_focal_zone(self, w: int, h: int) -> str:
        """
        Determines the optical focal zone based on plate bounding box dimensions.
        """
        if h < self.focal_min_height or w < self.focal_min_width:
            return "ZONE_FAR"  # Distant approach: track only, wait until closer
        elif w > 520:
            return "ZONE_CLOSE_UP"  # Vehicle right at gate / close camera view: ideal for OCR!
        else:
            return "ZONE_FOCAL_SWEETSPOT"

    def evaluate_crop(
        self,
        crop: np.ndarray,
        detector_conf: float = 1.0,
        vehicle_speed: Optional[float] = None
    ) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Evaluates a BGR plate image crop from a normal camera feed.
        
        Args:
            crop: BGR plate image array
            detector_conf: YOLO detection confidence score
            vehicle_speed: Optional pixel speed (px/frame) from spatio-temporal tracker
            
        Returns:
            passed (bool): Whether crop passes basic quality requirements
            quality_score (float): Normalized score between 0.0 and 1.0
            metrics (dict): Diagnostic metrics including focal_zone and should_trigger_char_reader
        """
        if crop is None or crop.size == 0:
            return False, 0.0, {
                "error": "Empty crop",
                "focal_zone": "INVALID",
                "should_trigger_char_reader": False,
                "glare_detected": False
            }

        h, w = crop.shape[:2]
        aspect_ratio = w / max(h, 1)
        focal_zone = self.classify_focal_zone(w, h)

        # 1. Dimension Score (0 - 1) calibrated for normal CCTV
        width_score = min(w / 110.0, 1.0)
        height_score = min(h / 32.0, 1.0)
        dim_score = (width_score + height_score) / 2.0

        # 2. Aspect ratio validity
        aspect_valid = self.min_aspect_ratio <= aspect_ratio <= self.max_aspect_ratio
        aspect_score = 1.0 if aspect_valid else 0.3

        # 3. Blur detection via Laplacian Variance
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        blur_score = min(laplacian_var / 120.0, 1.0)

        # 4. Contrast detection via intensity standard deviation
        contrast_std = float(np.std(gray))
        contrast_score = min(contrast_std / 45.0, 1.0)

        # 5. Normal Camera Glare / Headlight Saturation Check
        # Normal cameras without IR filters wash out near headlights
        sat_pixels = np.count_nonzero(gray >= 242)
        sat_ratio = sat_pixels / max(gray.size, 1)
        glare_detected = (sat_ratio > 0.30)
        glare_penalty = 0.20 if glare_detected else 0.0

        # 6. Normal Camera Speed-Bump Sweetspot Bonus
        # When vehicle crawls or stops at gate (< 3.5 px/frame), shutter motion blur drops to zero!
        is_speed_bump_sweetspot = (vehicle_speed is not None and vehicle_speed <= 3.5)
        sweetspot_bonus = 0.15 if is_speed_bump_sweetspot else 0.0

        # 7. Composite weighted quality score
        quality_score = (
            0.25 * dim_score +
            0.15 * aspect_score +
            0.25 * blur_score +
            0.15 * contrast_score +
            0.10 * float(detector_conf) -
            glare_penalty +
            sweetspot_bonus
        )
        quality_score = round(max(0.0, min(1.0, quality_score)), 3)

        # Required blur threshold can be lower if vehicle is stationary/crawling
        effective_blur_thresh = (self.blur_threshold * 0.70) if is_speed_bump_sweetspot else self.blur_threshold

        passed = (
            w >= self.min_width and
            h >= self.min_height and
            aspect_valid and
            quality_score >= self.passing_score_threshold
        )

        should_trigger_char_reader = (
            passed and
            focal_zone in ("ZONE_FOCAL_SWEETSPOT", "ZONE_CLOSE_UP") and
            laplacian_var >= effective_blur_thresh
        )

        metrics = {
            "width": w,
            "height": h,
            "aspect_ratio": round(aspect_ratio, 2),
            "laplacian_var": round(laplacian_var, 2),
            "contrast_std": round(contrast_std, 2),
            "detector_conf": round(float(detector_conf), 3),
            "glare_detected": glare_detected,
            "saturation_ratio": round(sat_ratio, 3),
            "is_speed_bump_sweetspot": is_speed_bump_sweetspot,
            "quality_score": quality_score,
            "focal_zone": focal_zone,
            "should_trigger_char_reader": should_trigger_char_reader,
            "passed": passed
        }

        return passed, quality_score, metrics
