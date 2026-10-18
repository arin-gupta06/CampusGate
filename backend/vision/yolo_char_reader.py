import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Tuple, List, Dict
from ultralytics import YOLO

from backend.vision.ocr_reader import IndianPlateNormalizer

class YOLOCharacterEngine:
    """
    Two-stage ANPR stage 2: Robust Character-level detection, angle deskewing,
    and 2D spatial assembly for real-time surveillance feeds at steep or skewed angles.
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
        # Adaptive thresholding to isolate plate borders and characters
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

        # Only apply rotation if angle is noticeable to avoid over-correcting straight plates
        if 2.5 < abs(angle) < 40.0:
            h, w = crop.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(crop, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
            return rotated

        return crop

    @staticmethod
    def assemble_characters_2d(detected_chars: List[Dict], plate_height: int) -> str:
        """
        Assembles characters in correct reading order for:
        1. Standard single-row horizontal plates
        2. Tilted / angled plates
        3. Two-row plates (motorcycles, scooters, square rear commercial plates)
        """
        if not detected_chars:
            return ""

        # Remove duplicate bounding boxes (NMS by horizontal overlap)
        cleaned_chars = []
        # Sort by x1 first
        sorted_x = sorted(detected_chars, key=lambda c: c["x1"])
        for c in sorted_x:
            if not cleaned_chars:
                cleaned_chars.append(c)
                continue
            prev = cleaned_chars[-1]
            # Check overlap: if x centers are within 50% character width and y overlaps
            x_overlap = min(c["x2"], prev["x2"]) - max(c["x1"], prev["x1"])
            min_w = min(c["x2"] - c["x1"], prev["x2"] - prev["x1"])
            if x_overlap > 0.5 * min_w:
                # Keep the one with higher confidence
                if c["conf"] > prev["conf"]:
                    cleaned_chars[-1] = c
            else:
                cleaned_chars.append(c)

        if not cleaned_chars:
            return ""

        y_centers = [(c["y1"] + c["y2"]) / 2.0 for c in cleaned_chars]
        min_y, max_y = min(y_centers), max(y_centers)

        # If vertical spread is > 35% of plate height, treat as 2-row plate
        if (max_y - min_y) > 0.35 * plate_height and len(cleaned_chars) >= 6:
            mid_y = (min_y + max_y) / 2.0
            row1 = [c for c in cleaned_chars if (c["y1"] + c["y2"]) / 2.0 < mid_y]
            row2 = [c for c in cleaned_chars if (c["y1"] + c["y2"]) / 2.0 >= mid_y]
            row1.sort(key=lambda c: c["x1"])
            row2.sort(key=lambda c: c["x1"])
            return "".join(c["char"] for c in row1) + "".join(c["char"] for c in row2)
        else:
            # Single row: sort left-to-right
            cleaned_chars.sort(key=lambda c: c["x1"])
            return "".join(c["char"] for c in cleaned_chars)

    def read_plate(self, crop: np.ndarray, conf_threshold: float = 0.22) -> Tuple[Optional[str], Optional[str], float, bool, List[Dict]]:
        """
        Full real-time multi-angle recognition pipeline:
        1. Automatic deskewing / tilt rectification
        2. Upscaling & CLAHE contrast boost (for side lighting/glare)
        3. YOLO character bounding box detection
        4. 2D spatial assembly (single-row + two-row support)
        5. Indian plate syntax normalization & verification
        """
        if crop is None or crop.size == 0:
            return None, None, 0.0, False, []

        # 1. Perspective tilt rectification (deskewing)
        deskewed = self.deskew_plate(crop)

        ch, cw = deskewed.shape[:2]
        # 2. Resize to optimal character height (min 90px)
        if ch < 90:
            scale = 90.0 / ch
            processed_crop = cv2.resize(deskewed, (int(cw * scale), 90), interpolation=cv2.INTER_CUBIC)
        else:
            processed_crop = deskewed

        # 3. CLAHE contrast enhancement for harsh outdoor lighting / glare
        if len(processed_crop.shape) == 3:
            lab = cv2.cvtColor(processed_crop, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            final_input = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        else:
            final_input = processed_crop

        # 4. Run YOLO Character Prediction
        results = self.model.predict(final_input, conf=conf_threshold, verbose=False)[0]

        if results.boxes is None or len(results.boxes) == 0:
            return None, None, 0.0, False, []

        input_h = final_input.shape[0]
        detected_chars = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            char_str = self.model.names.get(cls_id, "")
            x1, y1, x2, y2 = [int(v) for v in box.xyxy[0].tolist()]

            box_h = y2 - y1
            box_w = x2 - x1

            # Ignore tiny noise / emblem dots (e.g. height < 20% of plate height)
            if box_h >= 0.22 * input_h and box_w >= 4:
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

        # 5. 2D Spatial Assembly (handles 1-row, 2-row, and angled plates)
        raw_text = self.assemble_characters_2d(detected_chars, input_h)
        avg_conf = sum(c["conf"] for c in detected_chars) / len(detected_chars)

        # 6. Syntax validation & normalization
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
