import re
import cv2
import numpy as np
from typing import Optional, Tuple, Dict, List
from collections import defaultdict
import logging

logger = logging.getLogger("campusgate.vision.ocr")

INDIAN_STATE_CODES = {
    "AN", "AP", "AR", "AS", "BR", "CH", "CG", "DD", "DL", "DN", "GA", "GJ",
    "HR", "HP", "JH", "JK", "KA", "KL", "LA", "LD", "MH", "ML", "MN", "MP",
    "MZ", "NL", "OD", "PB", "PY", "RJ", "SK", "TN", "TR", "TS", "UK", "UP", "WB"
}

# Standard Indian Plate Regex: State (2 letters) + District (1-2 digits) + Series (0-3 letters) + Number (4 digits)
STANDARD_PLATE_REGEX = re.compile(r"^([A-Z]{2})([0-9]{1,2})([A-Z]{0,3})([0-9]{4})$")
# Bharat Series: Year (2 digits) + BH + Number (4 digits) + Letters (1-2 letters)
BHARAT_SERIES_REGEX = re.compile(r"^([0-9]{2})BH([0-9]{4})([A-Z]{1,2})$")

CHAR_TO_DIGIT = {"O": "0", "I": "1", "Z": "2", "S": "5", "B": "8", "G": "6", "Q": "0"}
DIGIT_TO_CHAR = {"0": "O", "1": "I", "2": "Z", "5": "S", "8": "B", "6": "G"}

class IndianPlateNormalizer:
    @staticmethod
    def clean_text(raw_text: str) -> str:
        """Removes spaces, dots, hyphens, and non-alphanumeric characters."""
        if not raw_text:
            return ""
        return re.sub(r"[^A-Za-z0-9]", "", raw_text).upper()

    @classmethod
    def validate_and_normalize(cls, raw_text: str) -> Tuple[Optional[str], bool, str]:
        """
        Validates and attempts contextual correction for Indian registration numbers.
        Returns:
            normalized_plate (str or None)
            is_valid (bool)
            pattern_type (str): 'STANDARD', 'BHARAT', or 'UNKNOWN'
        """
        cleaned = cls.clean_text(raw_text)
        if len(cleaned) < 6 or len(cleaned) > 12:
            return cleaned if cleaned else None, False, "UNKNOWN"

        # Check Bharat series first
        bh_match = BHARAT_SERIES_REGEX.match(cleaned)
        if bh_match:
            return cleaned, True, "BHARAT"

        # Check Standard format
        std_match = STANDARD_PLATE_REGEX.match(cleaned)
        if std_match:
            state = std_match.group(1)
            if state in INDIAN_STATE_CODES:
                return cleaned, True, "STANDARD"

        # Attempt heuristic positional corrections
        corrected = list(cleaned)
        # Position 0 & 1 must be letters (State code)
        if len(corrected) >= 2:
            if corrected[0] in DIGIT_TO_CHAR:
                corrected[0] = DIGIT_TO_CHAR[corrected[0]]
            if corrected[1] in DIGIT_TO_CHAR:
                corrected[1] = DIGIT_TO_CHAR[corrected[1]]

        # Last 4 characters should be digits
        if len(corrected) >= 8:
            for i in range(len(corrected) - 4, len(corrected)):
                if corrected[i] in CHAR_TO_DIGIT:
                    corrected[i] = CHAR_TO_DIGIT[corrected[i]]

        candidate = "".join(corrected)
        std_match_corr = STANDARD_PLATE_REGEX.match(candidate)
        if std_match_corr and std_match_corr.group(1) in INDIAN_STATE_CODES:
            return candidate, True, "STANDARD_CORRECTED"

        return cleaned, False, "UNVERIFIED"

class PlateReadingAggregator:
    """
    Accumulates multi-frame readings for a single vehicle track session.
    Prevents single-frame jitter or misreads from determining vehicle identity.
    """
    def __init__(self, track_session_id: str):
        self.track_session_id = track_session_id
        self.readings: List[Dict] = []
        self.plate_scores = defaultdict(float)

    def add_reading(self, raw_text: str, confidence: float, quality_score: float):
        normalized, is_valid, pattern_type = IndianPlateNormalizer.validate_and_normalize(raw_text)
        weight = confidence * quality_score * (1.5 if is_valid else 0.5)

        self.readings.append({
            "raw_text": raw_text,
            "normalized": normalized,
            "confidence": confidence,
            "quality_score": quality_score,
            "is_valid": is_valid,
            "weight": weight
        })

        if normalized:
            self.plate_scores[normalized] += weight

    def get_consensus(self) -> Tuple[Optional[str], float, bool]:
        """
        Returns the top-voted plate number, average confidence, and validity status.
        """
        if not self.plate_scores:
            return None, 0.0, False

        top_plate = max(self.plate_scores.items(), key=lambda item: item[1])[0]
        matching_readings = [r for r in self.readings if r["normalized"] == top_plate]
        avg_conf = sum(r["confidence"] for r in matching_readings) / max(len(matching_readings), 1)
        is_valid = any(r["is_valid"] for r in matching_readings)

        return top_plate, round(avg_conf, 3), is_valid

class EasyOCRPlateEngine:
    """
    Wraps EasyOCR inference with image preprocessing and Indian plate normalization.
    """
    def __init__(self, use_gpu: bool = True):
        import easyocr
        import torch
        gpu_available = use_gpu and torch.cuda.is_available()
        logger.info(f"Initializing EasyOCR reader (GPU: {gpu_available})...")
        self.reader = easyocr.Reader(['en'], gpu=gpu_available, verbose=False)

    def preprocess_crop(self, crop: np.ndarray) -> np.ndarray:
        """Applies grayscale conversion, bilateral filter, and adaptive contrast."""
        if crop is None or crop.size == 0:
            return crop

        # Resize to minimum height of 64px for clearer character recognition
        h, w = crop.shape[:2]
        if h < 64:
            scale = 64.0 / h
            crop = cv2.resize(crop, (int(w * scale), 64), interpolation=cv2.INTER_CUBIC)

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        # Bilateral filter removes noise while keeping edges sharp
        filtered = cv2.bilateralFilter(gray, 9, 75, 75)
        # Adaptive thresholding
        thresh = cv2.adaptiveThreshold(
            filtered, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        return filtered

    def read_plate(self, crop: np.ndarray) -> Tuple[Optional[str], Optional[str], float, bool]:
        """
        Runs OCR on a license plate crop.
        Returns:
            raw_text (str or None)
            normalized_plate (str or None)
            confidence (float)
            is_valid_format (bool)
        """
        if crop is None or crop.size == 0:
            return None, None, 0.0, False

        processed = self.preprocess_crop(crop)
        results = self.reader.readtext(
            processed,
            allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -",
            paragraph=False
        )

        if not results:
            # Retry on original crop without filter
            results = self.reader.readtext(crop, allowlist="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ -")

        if not results:
            return None, None, 0.0, False

        # Sort by confidence and take best or concatenate
        texts = []
        confidences = []
        for bbox, text, conf in results:
            if conf > 0.20:
                texts.append(text)
                confidences.append(float(conf))

        raw_text = " ".join(texts).strip()
        avg_conf = sum(confidences) / max(len(confidences), 1) if confidences else 0.0

        normalized, is_valid, ptype = IndianPlateNormalizer.validate_and_normalize(raw_text)
        return raw_text, normalized, round(avg_conf, 3), is_valid

# Singleton pattern for OCR engine
_ocr_engine_instance = None

def get_ocr_engine() -> EasyOCRPlateEngine:
    global _ocr_engine_instance
    if _ocr_engine_instance is None:
        _ocr_engine_instance = EasyOCRPlateEngine()
    return _ocr_engine_instance
