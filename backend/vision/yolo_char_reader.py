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
    def rectify_perspective_and_deskew(crop: np.ndarray) -> np.ndarray:
        """
        Omni-Angle Rectification:
        1. 4-Point Trapezoidal Perspective Warp: Detects quad corners of angled gate cameras
           (rectifies yaw & pitch trapezoids).
        2. Planar Roll Angle Deskewing: Uses minAreaRect to rotate upright (up to +-35 deg).
        """
        if crop is None or crop.size == 0:
            return crop

        h, w = crop.shape[:2]
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop

        # 1. Perspective Quadrilateral Warp for Angled Cameras
        try:
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            edged = cv2.Canny(blurred, 40, 180)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            dilated = cv2.dilate(edged, kernel, iterations=1)
            contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            best_quad = None
            max_area = 0
            for c in contours:
                area = cv2.contourArea(c)
                if area > 0.35 * (w * h):
                    peri = cv2.arcLength(c, True)
                    approx = cv2.approxPolyDP(c, 0.045 * peri, True)
                    if len(approx) == 4 and cv2.isContourConvex(approx):
                        if area > max_area:
                            max_area = area
                            best_quad = approx

            if best_quad is not None:
                pts = best_quad.reshape(4, 2).astype("float32")
                # Order points: top-left, top-right, bottom-right, bottom-left
                s = pts.sum(axis=1)
                tl = pts[np.argmin(s)]
                br = pts[np.argmax(s)]
                diff = np.diff(pts, axis=1)
                tr = pts[np.argmin(diff)]
                bl = pts[np.argmax(diff)]

                ordered_pts = np.array([tl, tr, br, bl], dtype="float32")
                target_w = max(w, 240)
                target_h = max(h, 80)
                dst = np.array([
                    [0, 0],
                    [target_w - 1, 0],
                    [target_w - 1, target_h - 1],
                    [0, target_h - 1]
                ], dtype="float32")
                M = cv2.getPerspectiveTransform(ordered_pts, dst)
                warped = cv2.warpPerspective(crop, M, (target_w, target_h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                return warped
        except Exception:
            pass

        # 2. Planar Roll Deskewing Fallback
        try:
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
            y_indices, x_indices = np.where(thresh > 0)
            if len(x_indices) >= 50:
                coords = np.column_stack((x_indices, y_indices))
                rect = cv2.minAreaRect(coords)
                (center_x, center_y), (width, height), angle = rect

                if width < height:
                    angle = angle + 90.0 if angle < 0 else angle - 90.0

                while angle < -45.0:
                    angle += 90.0
                while angle > 45.0:
                    angle -= 90.0

                if 2.0 < abs(angle) < 35.0:
                    center = (w // 2, h // 2)
                    M = cv2.getRotationMatrix2D(center, angle, 1.0)
                    rotated = cv2.warpAffine(crop, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
                    return rotated
        except Exception:
            pass

        return crop

    @staticmethod
    def apply_lighting_invariant_enhancements(crop: np.ndarray, mode: str = "STANDARD") -> np.ndarray:
        """
        Adapts to ANY shade of lighting:
          - Deep shadow / Low light / Night: Adaptive gamma expansion + dynamic range stretch
          - Extreme Glare / Headlight Wash: Anti-blooming gamma compression
          - Electric Vehicle (Green) & Rental (Black) plates: Inverted polarity enhancement
          - Low-contrast / Faded: Multi-scale CLAHE & Unsharp sharpening
        """
        h, w = crop.shape[:2]
        # Normalize character resolution to optimal height (min 90px)
        if h < 90:
            scale = 90.0 / h
            img = cv2.resize(crop, (int(w * scale), 90), interpolation=cv2.INTER_CUBIC)
        else:
            img = crop.copy()

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        mean_brightness = float(np.mean(gray))
        sat_ratio = np.count_nonzero(gray >= 238) / max(gray.size, 1)

        # 1. Low-Light / Night / Deep Shadow Boost
        if mean_brightness < 78.0 or mode == "NIGHT_BOOST":
            gamma = 0.52 if mean_brightness < 45 else 0.65
            inv_gamma = 1.0 / gamma
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
            img = cv2.LUT(img, table)

        # 2. Glare / Headlight Reflection / Overexposed Sunlight
        elif sat_ratio > 0.14 or mean_brightness > 192.0 or mode == "ANTI_GLARE":
            inv_gamma = 1.0 / 1.85
            table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype("uint8")
            img = cv2.LUT(img, table)

        # 3. Inverted Contrast (EV Green Plates, Rental Black Plates)
        if mode == "INVERTED":
            img = cv2.bitwise_not(img)

        # 4. Local Contrast Boost via CLAHE in LAB space
        if len(img.shape) == 3:
            lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=2.6, tileGridSize=(8, 8))
            cl = clahe.apply(l)
            limg = cv2.merge((cl, a, b))
            img = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # 5. High-Frequency Edge Sharpening for Compression Blur
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        sharpened = cv2.addWeighted(img, 1.45, gaussian, -0.45, 0)

        return sharpened

    @staticmethod
    def apply_syntax_position_priors(raw_string: str) -> str:
        """
        Applies positional syntax priors to disambiguate lookalike characters:
        - Bharat Series (22BH1234AA): Preserves 'BH' code without corrupting.
        - Standard Indian Plates (8-10 chars): Disambiguates letters vs digits per slot.
        """
        cleaned = "".join([c for c in raw_string.upper() if c.isalnum()])
        if len(cleaned) < 8 or len(cleaned) > 11:
            return raw_string

        # Bharat Series: 2 digits + BH + 4 digits + 1-2 letters
        if "BH" in cleaned[1:4]:
            return cleaned

        chars = list(cleaned)
        # Position 0 & 1 must be letters (State code)
        for pos in (0, 1):
            if pos < len(chars) and chars[pos].isdigit():
                chars[pos] = LOOKALIKE_DIGIT_TO_CHAR.get(chars[pos], chars[pos])

        # Position 2 & 3 must be digits (District code)
        for pos in (2, 3):
            if pos < len(chars) and not chars[pos].isdigit():
                chars[pos] = LOOKALIKE_CHAR_TO_DIGIT.get(chars[pos], chars[pos])

        # Last 4 characters must be digits
        for pos in range(max(4, len(chars) - 4), len(chars)):
            if not chars[pos].isdigit():
                chars[pos] = LOOKALIKE_CHAR_TO_DIGIT.get(chars[pos], chars[pos])

        return "".join(chars)

    @staticmethod
    def _dedup_row_characters(char_list: List[Dict]) -> List[Dict]:
        """Horizontal NMS deduplication within a single row."""
        if not char_list:
            return []
        sorted_x = sorted(char_list, key=lambda c: c["x1"])
        deduped = []
        for c in sorted_x:
            if not deduped:
                deduped.append(c)
                continue
            prev = deduped[-1]
            x_overlap = min(c["x2"], prev["x2"]) - max(c["x1"], prev["x1"])
            min_w = min(c["x2"] - c["x1"], prev["x2"] - prev["x1"])
            if min_w > 0 and x_overlap > 0.48 * min_w:
                if c["conf"] > prev["conf"]:
                    deduped[-1] = c
            else:
                deduped.append(c)
        return deduped

    def assemble_characters_2d(self, detected_chars: List[Dict], plate_width: int, plate_height: int) -> str:
        """
        Assembles characters in reading order across ALL plate types:
          - Single-Row Long Plates (Private white, Commercial yellow, EV green)
          - Two-Row Stacked Plates (Motorcycles, Scooters, Autos, Cabs, Square mounts)
          - Bharat Series (BH)
        """
        if not detected_chars:
            return ""

        # Suppress extraneous leftmost "IND" badge detections only when > 10 chars are found
        filtered = []
        if len(detected_chars) > 10:
            for c in detected_chars:
                cx = (c["x1"] + c["x2"]) / 2.0
                if cx < (0.08 * plate_width) and c["char"] in ("I", "N", "D", "1"):
                    continue
                filtered.append(c)
        else:
            filtered = list(detected_chars)

        if not filtered:
            filtered = detected_chars

        # Determine if plate is Two-Row (vertical spread of centers > 25% of plate height)
        y_centers = [(c["y1"] + c["y2"]) / 2.0 for c in filtered]
        min_y, max_y = min(y_centers), max(y_centers)
        vertical_spread = max_y - min_y

        if vertical_spread > 0.25 * plate_height and len(filtered) >= 4:
            mid_y = (min_y + max_y) / 2.0
            row1_raw = [c for c in filtered if (c["y1"] + c["y2"]) / 2.0 < mid_y]
            row2_raw = [c for c in filtered if (c["y1"] + c["y2"]) / 2.0 >= mid_y]

            row1 = self._dedup_row_characters(row1_raw)
            row2 = self._dedup_row_characters(row2_raw)
            raw = "".join(c["char"] for c in row1) + "".join(c["char"] for c in row2)
        else:
            cleaned = self._dedup_row_characters(filtered)
            raw = "".join(c["char"] for c in cleaned)

        return self.apply_syntax_position_priors(raw)

    def _predict_single_image(self, input_img: np.ndarray, conf_threshold: float) -> Tuple[Optional[str], Optional[str], float, bool, List[Dict]]:
        """Inference helper for a single preprocessed representation."""
        input_h, input_w = input_img.shape[:2]
        results = self.model.predict(input_img, conf=conf_threshold, verbose=False)[0]

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

            # Preserve characters across both single-row (tall) and two-row stacked (compact) plates
            if box_h >= 10 and box_w >= 4 and box_h >= 0.08 * input_h:
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

        raw_text = self.assemble_characters_2d(detected_chars, input_w, input_h)
        avg_conf = sum(c["conf"] for c in detected_chars) / len(detected_chars)
        normalized, is_valid, ptype = IndianPlateNormalizer.validate_and_normalize(raw_text)

        # Mirror / Selfie mode test
        if not is_valid and len(raw_text) >= 4:
            rev_norm, rev_valid, rev_ptype = IndianPlateNormalizer.validate_and_normalize(raw_text[::-1])
            if rev_valid:
                normalized, is_valid, ptype = rev_norm, rev_valid, rev_ptype

        return raw_text, normalized, round(avg_conf, 3), is_valid, detected_chars

    def read_plate(self, crop: np.ndarray, conf_threshold: float = 0.20) -> Tuple[Optional[str], Optional[str], float, bool, List[Dict]]:
        """
        Omni-Plate Recognition Pipeline:
        Captures any type of plate, in every angle and any shade of light.
        - Multi-angle 4-point perspective warp & tilt deskewing
        - Adaptive shadow, glare, and inverted contrast compensation
        - Two-row and single-row spatial reading
        - Multi-pass resilience: tries alternate lighting representation if primary pass is unverified
        """
        if crop is None or crop.size == 0:
            return None, None, 0.0, False, []

        try:
            # 1. Perspective & Angle Rectification
            rectified = self.rectify_perspective_and_deskew(crop)

            # 2. Pass 1: Standard Adaptive Lighting
            pass1_img = self.apply_lighting_invariant_enhancements(rectified, mode="STANDARD")
            raw1, norm1, conf1, valid1, chars1 = self._predict_single_image(pass1_img, conf_threshold)

            # If Pass 1 gave a verified format or long high-confidence string, return it immediately
            if valid1 or (raw1 and len(raw1) >= 8 and conf1 >= 0.65):
                return raw1, norm1, conf1, valid1, chars1

            # 3. Pass 2 (Challenging Shade / EV / Rental / Shadow Fallback):
            # Inspect image characteristics to choose optimal complementary mode
            gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY) if len(crop.shape) == 3 else crop
            mean_b = float(np.mean(gray))

            if mean_b < 110:
                # Dark background: Inverts white-on-dark (Green EV, Black Rental, Night shadow) into crisp black-on-white
                alt_mode = "INVERTED"
            elif mean_b > 185:
                alt_mode = "ANTI_GLARE"
            else:
                alt_mode = "INVERTED"

            pass2_img = self.apply_lighting_invariant_enhancements(rectified, mode=alt_mode)
            raw2, norm2, conf2, valid2, chars2 = self._predict_single_image(pass2_img, conf_threshold=0.15)

            # Select best pass between the two
            if valid2 and not valid1:
                return raw2, norm2, conf2, valid2, chars2
            elif (raw2 and not raw1) or (raw2 and len(raw2) > len(raw1 or "")):
                return raw2, norm2, conf2, valid2, chars2

            return raw1, norm1, conf1, valid1, chars1
        except Exception:
            return None, None, 0.0, False, []


# Global singleton
_yolo_char_instance = None

def get_yolo_char_engine(weights_path: Optional[str] = None) -> YOLOCharacterEngine:
    global _yolo_char_instance
    if _yolo_char_instance is None:
        _yolo_char_instance = YOLOCharacterEngine(weights_path)
    return _yolo_char_instance
