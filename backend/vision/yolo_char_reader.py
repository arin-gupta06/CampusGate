import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple, List, Dict
from ultralytics import YOLO

from backend.vision.ocr_reader import IndianPlateNormalizer

LOOKALIKE_CHAR_TO_DIGIT = {
    "O": "0", "D": "0", "Q": "0", "U": "0",
    "I": "1", "L": "1", "T": "7", "J": "1",
    "Z": "2", "S": "5", "B": "8", "G": "6", "A": "4"
}

LOOKALIKE_DIGIT_TO_CHAR = {
    "0": "O", "1": "I", "7": "T", "2": "Z",
    "5": "S", "8": "B", "6": "G", "4": "A"
}


class YOLOCharacterEngine:
    """
    Two-stage ANPR Stage 2: Character-level detection, angle deskewing,
    and 2D spatial assembly for standard / normal cameras (CCTV, webcams, RTSP).
    
    Includes Normal Camera Compensations:
      - Unsharp edge-masking to defeat H.264 video compression blur
      - Anti-glare gamma decompression for headlight reflection / whiteout
      - Leftmost HSRP 'IND' strip suppression
      - Positional Syntax Prior Disambiguation (Letter vs Digit slots)
    """
    def __init__(self, weights_path: Optional[str] = None):
        if weights_path is None:
            default_weights = Path(__file__).resolve().parent / "weights" / "char_detector.pt"
            weights_path = str(default_weights)
        
        self.weights_path = weights_path
        print(f"[*] Loading YOLO Character Recognizer from: {Path(weights_path).name}...")
        self.model = YOLO(self.weights_path)
        print(f"[✓] YOLO Character Recognizer loaded with {len(self.model.names)} character classes!")

    @staticmethod
    def deskew_plate(crop: np.ndarray) -> np.ndarray:
        """
        Detects plate tilt angle and rotates image to be horizontally aligned.
        Ensures characters are upright even when captured from angled gate cameras.
        """
        if crop is None or crop.size == 0:
            return crop

        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        coords = np.column_stack(np.where(thresh > 0))
        
        if len(coords) < 60:
            return crop

        rect = cv2.minAreaRect(coords)
        angle = rect[-1]

        # Normalize angle to [-45, 45]
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle

        # Only apply rotation if angle is noticeable
        if 2.5 < abs(angle) < 40.0:
            h, w = crop.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(crop, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            return rotated

        return crop

    @staticmethod
    def apply_normal_camera_enhancements(crop: np.ndarray) -> np.ndarray:
        """
        Applies image restoration tailored for normal cameras:
          1. Anti-glare gamma adjustment for headlight blooming
          2. Unsharp masking to counteract H.264/H.265 compression softness
          3. CLAHE local contrast enhancement
        """
        h, w = crop.shape[:2]
        # 1. Resize to optimal character height (min 90px)
        if h < 90:
            scale = 90.0 / h
            img = cv2.resize(crop, (int(w * scale), 90), interpolation=cv2.INTER_CUBIC)
        else:
            img = crop.copy()

        # 2. De-glare for normal cameras without IR filters
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        sat_ratio = np.count_nonzero(gray >= 240) / max(gray.size, 1)
        if sat_ratio > 0.18:
            # Headlight glare detected: apply gamma compression to restore character strokes
            inv_gamma = 1.0 / 1.75
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
            img = cv2.LUT(img, table)

        # 3. CLAHE Local Contrast Boost
        if len(img.shape) == 3:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # 4. Unsharp Masking for Compression Softness
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        sharpened = cv2.addWeighted(img, 1.45, gaussian, -0.45, 0)

        return sharpened

    @staticmethod
    def apply_syntax_position_priors(raw_string: str) -> str:
        """
        Applies Indian plate positional grammar priors to disambiguate lookalike characters:
        Position 0, 1: State code letters (e.g. DL, MH, MP)
        Position 2, 3: District code digits (e.g. 01, 07)
        Position 4, 5: Series letters (e.g. AB)
        Position 6..9: Unique 4-digit number
        """
        cleaned = "".join([c for c in raw_string.upper() if c.isalnum()])
        if len(cleaned) < 8 or len(cleaned) > 11:
            return raw_string

        chars = list(cleaned)
        # Position 0 & 1 must be letters
        for pos in (0, 1):
            if pos < len(chars) and chars[pos].isdigit():
                chars[pos] = LOOKALIKE_DIGIT_TO_CHAR.get(chars[pos], chars[pos])

        # Position 2 & 3 must be digits
        for pos in (2, 3):
            if pos < len(chars) and not chars[pos].isdigit():
                chars[pos] = LOOKALIKE_CHAR_TO_DIGIT.get(chars[pos], chars[pos])

        # Last 4 characters must be digits
        for pos in range(max(4, len(chars) - 4), len(chars)):
            if not chars[pos].isdigit():
                chars[pos] = LOOKALIKE_CHAR_TO_DIGIT.get(chars[pos], chars[pos])

        return "".join(chars)

    def assemble_characters_2d(self, detected_chars: List[Dict], plate_width: int, plate_height: int) -> str:
        """
        Assembles characters in reading order with:
          1. Left-edge HSRP blue "IND" strip suppression
          2. NMS horizontal overlap deduplication
          3. Single-row and Two-row (motorcycle/scooter) spatial sorting
        """
        if not detected_chars:
            return ""

        # Suppress leftmost characters if they land in the HSRP "IND" blue band (< 11% width)
        # only when total detected characters >= 10
        filtered = []
        for c in detected_chars:
            cx = (c["x1"] + c["x2"]) / 2.0
            if len(detected_chars) >= 10 and cx < (0.11 * plate_width):
                continue  # Skip HSRP "IND" hologram / strip detection
            filtered.append(c)

        if not filtered:
            filtered = detected_chars

        # NMS by horizontal overlap
        cleaned_chars = []
        sorted_x = sorted(filtered, key=lambda c: c["x1"])
        for c in sorted_x:
            if not cleaned_chars:
                cleaned_chars.append(c)
                continue
            prev = cleaned_chars[-1]
            x_overlap = min(c["x2"], prev["x2"]) - max(c["x1"], prev["x1"])
            min_w = min(c["x2"] - c["x1"], prev["x2"] - prev["x1"])
            if x_overlap > 0.50 * min_w:
                if c["conf"] > prev["conf"]:
                    cleaned_chars[-1] = c
            else:
                cleaned_chars.append(c)

        if not cleaned_chars:
            return ""

        y_centers = [(c["y1"] + c["y2"]) / 2.0 for c in cleaned_chars]
        min_y, max_y = min(y_centers), max(y_centers)

        # Two-row plate test (vertical spread > 35% of plate height)
        if (max_y - min_y) > 0.35 * plate_height and len(cleaned_chars) >= 6:
            mid_y = (min_y + max_y) / 2.0
            row1 = [c for c in cleaned_chars if (c["y1"] + c["y2"]) / 2.0 < mid_y]
            row2 = [c for c in cleaned_chars if (c["y1"] + c["y2"]) / 2.0 >= mid_y]
            row1.sort(key=lambda c: c["x1"])
            row2.sort(key=lambda c: c["x1"])
            raw = "".join(c["char"] for c in row1) + "".join(c["char"] for c in row2)
        else:
            cleaned_chars.sort(key=lambda c: c["x1"])
            raw = "".join(c["char"] for c in cleaned_chars)

        # Apply positional grammar priors
        return self.apply_syntax_position_priors(raw)

    def read_plate(self, crop: np.ndarray, conf_threshold: float = 0.22) -> Tuple[Optional[str], Optional[str], float, bool, List[Dict]]:
        """
        Full real-time ANPR recognition pipeline tuned for normal cameras:
        1. Automatic deskewing / tilt rectification
        2. Normal camera restoration (Unsharp mask, Anti-glare, CLAHE)
        3. YOLO character bounding box detection
        4. 2D spatial assembly (with HSRP suppression & 2-row handling)
        5. Positional grammar priors & Indian plate syntax verification
        """
        if crop is None or crop.size == 0:
            return None, None, 0.0, False, []

        # 1. Perspective tilt rectification (deskewing)
        deskewed = self.deskew_plate(crop)

        # 2. Normal camera restoration (Anti-glare, CLAHE, Unsharp masking)
        final_input = self.apply_normal_camera_enhancements(deskewed)
        input_h, input_w = final_input.shape[:2]

        # 3. Run YOLO Character Prediction
        results = self.model.predict(final_input, conf=conf_threshold, verbose=False)[0]

        if results.boxes is None or len(results.boxes) == 0:
            return None, None, 0.0, False, []

        detected_chars = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            char_str = self.model.names.get(cls_id, "")
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

            box_h = y2 - y1
            box_w = x2 - x1

            # Ignore tiny noise dots (height < 20% of plate height)
            if box_h >= 0.20 * input_h and box_w >= 4:
                detected_chars.append({
                    "char": char_str,
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "conf": conf,
                    "cls_id": cls_id
                })

        if not detected_chars:
            return None, None, 0.0, False, []

        # 4. 2D Spatial Assembly with HSRP suppression & syntax priors
        raw_text = self.assemble_characters_2d(detected_chars, input_w, input_h)
        avg_conf = sum(c["conf"] for c in detected_chars) / len(detected_chars)

        # 5. Syntax validation & normalization
        normalized, is_valid, ptype = IndianPlateNormalizer.validate_and_normalize(raw_text)

        # Mirror-proof fallback
        if not is_valid and len(raw_text) >= 4:
            rev_norm, rev_valid, rev_ptype = IndianPlateNormalizer.validate_and_normalize(raw_text[::-1])
            if rev_valid:
                normalized, is_valid, ptype = rev_norm, rev_valid, rev_ptype

        return raw_text, normalized, round(avg_conf, 3), is_valid, detected_chars


# Global singleton
_yolo_char_instance = None

def get_yolo_char_engine(weights_path: Optional[str] = None) -> YOLOCharacterEngine:
    global _yolo_char_instance
    if _yolo_char_instance is None:
        _yolo_char_instance = YOLOCharacterEngine(weights_path)
    return _yolo_char_instance
