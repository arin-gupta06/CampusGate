"""
Campus Gate - Specialized ANPR Data Augmentation Engine
======================================================
Generates realistic Indian license plates and applies gate-environment augmentations:
  1. Synthetic Indian HSRP & Standard Plates with Ground-Truth Character Bounding Boxes
  2. Perspective Tilt & Deskewing simulation (gate camera pitch & yaw up to 35°)
  3. Night-Time Headlight Glare Injection (radial blooming)
  4. Directional Motion Blur (simulating approaching vehicles)
  5. Canopy Shadow Gradients (harsh outdoor contrast)
  6. Blue "IND" HSRP Strip & Chromium Hologram Artifacts
"""

import random
import math
from typing import List, Dict, Tuple, Optional, Any
import numpy as np
import cv2

INDIAN_STATES = [
    "DL", "MH", "KA", "TN", "UP", "HR", "MP", "GJ", "RJ", "WB",
    "AP", "TS", "KL", "PB", "BR", "CH", "UK", "OD", "JH", "GA"
]

ALPHANUMERIC = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
CHAR_TO_ID = {c: i for i, c in enumerate(ALPHANUMERIC)}


class SyntheticIndianPlateGenerator:
    """
    Renders realistic Indian license plates with exact pixel coordinates for each character,
    outputting image arrays and YOLO-formatted bounding boxes.
    """
    def __init__(self, font_scale: float = 1.0, thickness: int = 2):
        self.font = cv2.FONT_HERSHEY_DUPLEX
        self.font_scale = font_scale
        self.thickness = thickness

    def generate_plate_number(self) -> Tuple[str, str, str, str]:
        state = random.choice(INDIAN_STATES)
        district = f"{random.randint(1, 45):02d}"
        series_len = random.choice([1, 2])
        series = "".join(random.choice("ABCDEFGHJKLMNPRSTUVWXYZ") for _ in range(series_len))
        unique_num = f"{random.randint(1000, 9999)}"
        return state, district, series, unique_num

    def render_plate(self, width: int = 340, height: int = 80) -> Tuple[np.ndarray, str, List[Dict[str, Any]]]:
        """
        Renders an Indian HSRP-style plate image and character bounding boxes.
        Returns:
            plate_img: np.ndarray (BGR)
            plate_text: str
            character_boxes: list of {"char": str, "cls_id": int, "bbox": [x1, y1, x2, y2]}
        """
        state, district, series, num = self.generate_plate_number()
        full_text = f"{state}{district}{series}{num}"

        # 1. Base plate canvas (white or commercial yellow)
        is_commercial = (random.random() < 0.15)
        bg_color = (0, 220, 245) if is_commercial else (248, 248, 248)  # BGR
        plate = np.full((height, width, 3), bg_color, dtype=np.uint8)

        # 2. Black outer border line
        border_thickness = random.randint(2, 3)
        cv2.rectangle(plate, (2, 2), (width - 3, height - 3), (25, 25, 25), border_thickness)

        # 3. Blue "IND" band on the left for HSRP (85% of modern Indian plates)
        has_hsrp = (random.random() < 0.85)
        left_offset = 12
        if has_hsrp:
            blue_w = int(width * 0.10)
            # Blue strip
            plate[4:height-4, 4:blue_w] = (180, 70, 15)  # Navy Blue in BGR
            # Ashoka Chakra chrome circle
            cx, cy = blue_w // 2, height // 2 - 10
            cv2.circle(plate, (cx, cy), 6, (210, 210, 210), -1)
            # "IND" text in white
            cv2.putText(plate, "IND", (cx - 10, cy + 22), cv2.FONT_HERSHEY_SIMPLEX, 0.28, (255, 255, 255), 1, cv2.LINE_AA)
            left_offset = blue_w + 10

        # 4. Spatially position each character with ground-truth boxes
        available_w = (width - 10) - left_offset
        num_chars = len(full_text)
        char_slot_w = available_w / num_chars

        char_boxes = []
        text_color = (15, 15, 15)

        for idx, ch in enumerate(full_text):
            slot_x1 = left_offset + idx * char_slot_w
            slot_x2 = slot_x1 + char_slot_w

            # Measure text size
            (tw, th), baseline = cv2.getTextSize(ch, self.font, 1.05, self.thickness)
            cx = int(slot_x1 + (char_slot_w - tw) / 2.0)
            cy = int((height + th) / 2.0)

            # Draw character
            cv2.putText(plate, ch, (cx, cy), self.font, 1.05, text_color, self.thickness, cv2.LINE_AA)

            # Record tight character bounding box
            pad_x = 2
            pad_y = 3
            bx1 = max(0, cx - pad_x)
            by1 = max(0, cy - th - pad_y)
            bx2 = min(width - 1, cx + tw + pad_x)
            by2 = min(height - 1, cy + baseline + pad_y)

            char_boxes.append({
                "char": ch,
                "cls_id": CHAR_TO_ID.get(ch, 0),
                "bbox": [bx1, by1, bx2, by2]
            })

        return plate, full_text, char_boxes


class GateEnvironmentAugmentor:
    """
    Applies realistic gate surveillance artifacts to plate crops or full frames:
      - Perspective distortion (angled gate cameras)
      - Night-time headlight glare bursts
      - Directional motion blur
      - Canopy shadow gradients
    """
    @staticmethod
    def apply_perspective_tilt(
        image: np.ndarray,
        yaw_angle: float = 18.0,
        pitch_angle: float = 12.0
    ) -> np.ndarray:
        """
        Simulates overhead and side-angle gate camera perspectives.
        """
        h, w = image.shape[:2]
        pts1 = np.float32([[0, 0], [w, 0], [0, h], [w, h]])

        # Randomize perspective jitter
        dx = int(w * math.sin(math.radians(yaw_angle)) * 0.4)
        dy = int(h * math.sin(math.radians(pitch_angle)) * 0.3)

        pts2 = np.float32([
            [max(0, dx), max(0, dy)],
            [min(w, w - dx // 2), 0],
            [0, h],
            [w, min(h, h - dy)]
        ])

        matrix = cv2.getPerspectiveTransform(pts1, pts2)
        warped = cv2.warpPerspective(image, matrix, (w, h), borderMode=cv2.BORDER_REPLICATE)
        return warped

    @staticmethod
    def inject_headlight_glare(
        image: np.ndarray,
        intensity: float = 0.65,
        radius_ratio: float = 0.35
    ) -> np.ndarray:
        """
        Simulates blinding headlight or spotlight glare commonly encountered at night.
        """
        h, w = image.shape[:2]
        glare_mask = np.zeros((h, w), dtype=np.float32)

        # Place glare near one edge (e.g. adjacent headlight)
        cx = random.choice([int(w * 0.15), int(w * 0.85)])
        cy = int(h * random.uniform(0.3, 0.7))
        radius = int(min(h, w) * radius_ratio)

        y_coords, x_coords = np.ogrid[:h, :w]
        dist_from_center = np.sqrt((x_coords - cx)**2 + (y_coords - cy)**2)

        # 2D Gaussian bloom
        glare_mask = np.exp(- (dist_from_center**2) / (2.0 * (radius**2)))
        glare_mask = cv2.GaussianBlur(glare_mask, (0, 0), sigmaX=radius * 0.5)

        glare_bgr = np.dstack([glare_mask * 255.0] * 3).astype(np.float32)

        # Additive blending with saturation
        result = cv2.addWeighted(image.astype(np.float32), 1.0, glare_bgr, intensity, 0.0)
        return np.clip(result, 0, 255).astype(np.uint8)

    @staticmethod
    def apply_directional_motion_blur(
        image: np.ndarray,
        kernel_size: int = 7,
        angle: float = 10.0
    ) -> np.ndarray:
        """
        Simulates vehicle motion blur as it approaches or rolls through the gate.
        """
        if kernel_size <= 1:
            return image

        kernel = np.zeros((kernel_size, kernel_size), dtype=np.float32)
        center = kernel_size // 2

        # Draw a line along the angle
        rad = math.radians(angle)
        dx = math.cos(rad) * (kernel_size / 2.0)
        dy = math.sin(rad) * (kernel_size / 2.0)

        pt1 = (int(center - dx), int(center - dy))
        pt2 = (int(center + dx), int(center + dy))
        cv2.line(kernel, pt1, pt2, 1.0, 1)

        total = np.sum(kernel)
        if total > 0:
            kernel /= total

        return cv2.filter2D(image, -1, kernel)

    @staticmethod
    def apply_canopy_shadow(image: np.ndarray) -> np.ndarray:
        """
        Simulates harsh overhead roof/gate shadow cutting across the vehicle plate.
        """
        h, w = image.shape[:2]
        # Diagonal gradient mask
        x_grad = np.linspace(0.4, 1.0, w, dtype=np.float32)
        y_grad = np.linspace(0.5, 1.0, h, dtype=np.float32)
        gradient = np.outer(y_grad, x_grad)

        shadow_bgr = np.dstack([gradient] * 3)
        shadowed = (image.astype(np.float32) * shadow_bgr)
        return np.clip(shadowed, 0, 255).astype(np.uint8)

    @classmethod
    def apply_random_pipeline(cls, image: np.ndarray) -> np.ndarray:
        """
        Randomly combines gate artifacts for end-to-end robust data augmentation.
        """
        aug = image.copy()
        if random.random() < 0.60:
            aug = cls.apply_perspective_tilt(aug, yaw_angle=random.uniform(5, 25), pitch_angle=random.uniform(5, 20))
        if random.random() < 0.40:
            aug = cls.inject_headlight_glare(aug, intensity=random.uniform(0.4, 0.75))
        if random.random() < 0.35:
            aug = cls.apply_directional_motion_blur(aug, kernel_size=random.choice([5, 7, 9]))
        if random.random() < 0.45:
            aug = cls.apply_canopy_shadow(aug)
        return aug
