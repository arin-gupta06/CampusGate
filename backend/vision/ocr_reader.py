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

CHAR_TO_DIGIT = {"O": "0", "Q": "0", "D": "0", "I": "1", "L": "1", "Z": "7", "T": "7", "S": "5", "B": "8", "G": "6", "A": "4"}
DIGIT_TO_CHAR = {"0": "O", "1": "I", "7": "Z", "5": "S", "8": "B", "6": "G", "4": "A", "2": "Z"}

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
        Handles HSRP badges (IND, 1ND, ID, ROM prefixes), character confusions (O/0, Z/7, etc.)
        Returns:
            normalized_plate (str or None)
            is_valid (bool)
            pattern_type (str): 'STANDARD', 'STANDARD_CORRECTED', 'BHARAT', or 'UNKNOWN'
        """
        cleaned = cls.clean_text(raw_text)
        if len(cleaned) < 5:
            return cleaned if cleaned else None, False, "UNKNOWN"

        # Direct match check
        if STANDARD_PLATE_REGEX.match(cleaned) and cleaned[:2] in INDIAN_STATE_CODES:
            return cleaned, True, "STANDARD"
        if BHARAT_SERIES_REGEX.match(cleaned):
            return cleaned, True, "BHARAT"

        # Bharat Series contextual correction: Year (2 digits) + BH (or 8H/BM/8M/8B/BB) + Number (4 digits) + Letters (1-2 letters)
        # Handles noisy / lookalike reads: e.g. "228H6517N", "22BM6517A", "22BH65171", "EZ22BH6517K", "228A"
        bh_match = re.search(r"([0-9ZSOBI]{2})([8B][HM8B])([0-9OQDIZLTSBGA]{4})([A-Z0-9]{1,2})", cleaned)
        if bh_match:
            raw_yr, raw_code, raw_digits, raw_suffix = bh_match.groups()
            norm_yr = "".join(CHAR_TO_DIGIT.get(c, c) for c in raw_yr)
            norm_dig = "".join(CHAR_TO_DIGIT.get(c, c) for c in raw_digits)
            norm_suf = "".join(DIGIT_TO_CHAR.get(c, c) for c in raw_suffix)
            bh_candidate = f"{norm_yr}BH{norm_dig}{norm_suf}"
            if BHARAT_SERIES_REGEX.match(bh_candidate):
                return bh_candidate, True, "BHARAT_CORRECTED"

        # Strip prefixes like IND, 1ND, ID, ROM, 7D by locating state code
        start_idx = -1
        for st in INDIAN_STATE_CODES:
            pos = cleaned.find(st)
            if pos != -1 and (start_idx == -1 or pos < start_idx):
                start_idx = pos

        candidate = cleaned[start_idx:] if start_idx != -1 else cleaned

        # Standard plate format correction: State(2) + District(1-2) + Series(0-3) + Number(4)
        if len(candidate) >= 7 and candidate[:2] in INDIAN_STATE_CODES:
            state = candidate[:2]
            rest = candidate[2:]

            # Last 4 characters must be digits
            last4_raw = rest[-4:]
            last4 = "".join(CHAR_TO_DIGIT.get(c, c) if not c.isdigit() else c for c in last4_raw)

            middle = rest[:-4]
            dist_digits = ""
            series_letters = ""

            for c in middle:
                if len(dist_digits) < 2 and (c.isdigit() or c in CHAR_TO_DIGIT):
                    dist_digits += CHAR_TO_DIGIT.get(c, c)
                else:
                    series_letters += DIGIT_TO_CHAR.get(c, c) if c.isdigit() else c

            if len(dist_digits) == 1 and dist_digits in ["1", "2", "3", "4", "5", "6", "7", "8", "9"]:
                dist_digits = "0" + dist_digits

            full_candidate = state + dist_digits + series_letters + last4
            if STANDARD_PLATE_REGEX.match(full_candidate):
                return full_candidate, True, "STANDARD_CORRECTED"

        return candidate, False, "UNVERIFIED"

class PlateReadingAggregator:
    """
    Accumulates multi-frame readings for a single vehicle track session.
    Prevents single-frame jitter or misreads from determining vehicle identity.
    """
    def __init__(self, track_session_id: str, quorum_threshold: int = 3, dominance_ratio: float = 1.8):
        self.track_session_id = track_session_id
        self.readings: List[Dict] = []
        self.plate_scores = defaultdict(float)
        self.quorum_threshold = quorum_threshold
        self.dominance_ratio = dominance_ratio
        self.is_latched = False
        self.latched_plate: Optional[str] = None
        self.latched_conf: float = 0.0

    def add_reading(self, raw_text: str, confidence: float, quality_score: float, engine_source: str = "YOLO"):
        # If already latched with high confidence and valid syntax, reject minor noisy fluctuations
        if self.is_latched:
            return

        normalized, is_valid, pattern_type = IndianPlateNormalizer.validate_and_normalize(raw_text)
        # Priority weighting: prioritize YOLO Character Engine (1.5x) over EasyOCR fallback (0.75x)
        engine_bonus = 1.5 if engine_source == "YOLO" else 0.75
        weight = confidence * quality_score * (1.8 if is_valid else 0.4) * engine_bonus

        self.readings.append({
            "raw_text": raw_text,
            "normalized": normalized,
            "confidence": confidence,
            "quality_score": quality_score,
            "is_valid": is_valid,
            "engine_source": engine_source,
            "weight": weight
        })

        if normalized:
            self.plate_scores[normalized] += weight

        # Evaluate latching condition immediately upon new reading
        self._check_latch_condition()

    def _check_latch_condition(self):
        """
        Locks in the consensus plate once statistical quorum and dominance margins are achieved.
        Prevents flickering when vehicle sits idling in front of gate.
        """
        if self.is_latched or len(self.readings) < self.quorum_threshold:
            return

        top_plate, avg_conf, is_valid = self._compute_consensus()
        if not top_plate or not is_valid:
            return

        # Check dominance ratio against 2nd candidate
        sorted_scores = sorted(self.plate_scores.items(), key=lambda x: x[1], reverse=True)
        top_score = self.plate_scores.get(top_plate, 0.0)

        runner_up_score = 0.0
        for cand, score in sorted_scores:
            if cand != top_plate:
                runner_up_score = score
                break

        # If top candidate dominates runner-up by dominance ratio and has >= quorum_threshold readings
        matching_count = sum(1 for r in self.readings if r.get("normalized") == top_plate or is_valid)
        margin = (top_score / runner_up_score) if runner_up_score > 0 else 999.0

        if matching_count >= self.quorum_threshold and margin >= self.dominance_ratio:
            self.is_latched = True
            self.latched_plate = top_plate
            self.latched_conf = avg_conf

    def _compute_consensus(self) -> Tuple[Optional[str], float, bool]:
        """
        Internal consensus calculator using Positional Character-Slot Alignment as first-class,
        combining whole-string Bayesian weights with slot-by-slot character frequency.
        """
        if not self.readings:
            return None, 0.0, False

        # Filter valid or high-probability candidates (standard & Bharat plates are 9 or 10 alphanumeric chars)
        valid_candidates = [r for r in self.readings if r.get("is_valid") and r.get("normalized")]
        candidates = valid_candidates if valid_candidates else [r for r in self.readings if r.get("normalized") and len(r["normalized"]) in (8, 9, 10, 11)]

        if candidates:
            # Determine dominant length (e.g., 10 characters for standard private/commercial, 9 for early series)
            lengths = [len(r["normalized"]) for r in candidates]
            dominant_len = max(set(lengths), key=lengths.count)
            aligned = [r for r in candidates if len(r["normalized"]) == dominant_len]

            # 1. Positional Character-Slot Vector Alignment
            reconstructed_chars = []
            slot_confidences = []
            for idx in range(dominant_len):
                char_votes = defaultdict(float)
                for r in aligned:
                    char_votes[r["normalized"][idx]] += r["weight"]
                best_char, best_char_weight = max(char_votes.items(), key=lambda x: x[1])
                reconstructed_chars.append(best_char)
                total_slot_weight = sum(char_votes.values())
                slot_confidences.append(best_char_weight / max(total_slot_weight, 1e-4))

            slot_reconstructed = "".join(reconstructed_chars)
            norm_str, is_valid, _ = IndianPlateNormalizer.validate_and_normalize(slot_reconstructed)

            if is_valid:
                avg_conf = sum(slot_confidences) / max(len(slot_confidences), 1)
                return norm_str, round(avg_conf, 3), True

        # Fallback to whole-string highest score if slot alignment did not produce valid RTO syntax
        if self.plate_scores:
            top_plate = max(self.plate_scores.items(), key=lambda item: item[1])[0]
            matching_readings = [r for r in self.readings if r.get("normalized") == top_plate]
            avg_conf = sum(r["confidence"] for r in matching_readings) / max(len(matching_readings), 1)
            is_valid = any(r.get("is_valid", False) for r in matching_readings)
            return top_plate, round(avg_conf, 3), is_valid

        return None, 0.0, False

    def get_consensus(self) -> Tuple[Optional[str], float, bool]:
        """
        Returns the top-voted plate number, average confidence, and validity status.
        If track is latched, returns the locked-in stable identity.
        """
        if self.is_latched and self.latched_plate:
            return self.latched_plate, self.latched_conf, True

        return self._compute_consensus()

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
