import cv2
import numpy as np
from typing import Tuple, Dict, Any

class PlateQualityGate:
    """
    Evaluates license plate crops before OCR according to Campus Gate Blueprint §4.3.
    Replaces brittle single-threshold checks with multi-factor quality scoring:
      - Resolution (width & height)
      - Aspect ratio (Indian plates standard ~2.0 - 5.0)
      - Blur sharpness (Laplacian variance)
      - Contrast / illumination (standard deviation of grayscale intensities)
    """

    def __init__(
        self,
        min_width: int = 50,
        min_height: int = 16,
        min_aspect_ratio: float = 1.3,
        max_aspect_ratio: float = 6.0,
        blur_threshold: float = 40.0,
        contrast_threshold: float = 20.0,
        passing_score_threshold: float = 0.40
    ):
        self.min_width = min_width
        self.min_height = min_height
        self.min_aspect_ratio = min_aspect_ratio
        self.max_aspect_ratio = max_aspect_ratio
        self.blur_threshold = blur_threshold
        self.contrast_threshold = contrast_threshold
        self.passing_score_threshold = passing_score_threshold

    def evaluate_crop(self, crop: np.ndarray, detector_conf: float = 1.0) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Evaluates a BGR plate image crop.
        Returns:
            passed (bool): Whether crop passes quality requirements
            quality_score (float): Normalized score between 0.0 and 1.0
            metrics (dict): Diagnostic metrics
        """
        if crop is None or crop.size == 0:
            return False, 0.0, {"error": "Empty crop"}

        h, w = crop.shape[:2]
        aspect_ratio = w / max(h, 1)

        # 1. Dimension Score (0 - 1)
        width_score = min(w / 120.0, 1.0)
        height_score = min(h / 35.0, 1.0)
        dim_score = (width_score + height_score) / 2.0

        # 2. Aspect ratio validity
        aspect_valid = self.min_aspect_ratio <= aspect_ratio <= self.max_aspect_ratio
        aspect_score = 1.0 if aspect_valid else 0.3

        # 3. Blur detection via Laplacian Variance
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        blur_score = min(laplacian_var / 150.0, 1.0)

        # 4. Contrast detection via intensity standard deviation
        contrast_std = float(np.std(gray))
        contrast_score = min(contrast_std / 50.0, 1.0)

        # 5. Composite weighted quality score
        quality_score = (
            0.25 * dim_score +
            0.15 * aspect_score +
            0.30 * blur_score +
            0.15 * contrast_score +
            0.15 * float(detector_conf)
        )
        quality_score = round(max(0.0, min(1.0, quality_score)), 3)

        passed = (
            w >= self.min_width and
            h >= self.min_height and
            aspect_valid and
            quality_score >= self.passing_score_threshold
        )

        metrics = {
            "width": w,
            "height": h,
            "aspect_ratio": round(aspect_ratio, 2),
            "laplacian_var": round(laplacian_var, 2),
            "contrast_std": round(contrast_std, 2),
            "detector_conf": round(float(detector_conf), 3),
            "quality_score": quality_score,
            "passed": passed
        }

        return passed, quality_score, metrics
