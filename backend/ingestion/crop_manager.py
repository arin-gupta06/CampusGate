"""
Hybrid Crop Manager:
Combines in-memory / Redis TTL storage with 'Single Best Crop' retention.
Eliminates disk I/O bottlenecks and disk flooding from multi-frame tracking.
"""

import logging
import cv2
import numpy as np
from pathlib import Path
from typing import Optional, Dict, Tuple
from datetime import datetime

from backend.core.config import settings

logger = logging.getLogger("campusgate.crops")


def compute_crop_accuracy(plate_crop_info: dict) -> float:
    """
    Computes a composite accuracy score for a plate crop.
    Weights OCR confidence, crop visual quality, plate detector confidence,
    and syntactic format validity.
    """
    ocr_conf = float(plate_crop_info.get("ocr_conf") or 0.0)
    q_score = float(plate_crop_info.get("quality_score") or 0.0)
    plate_conf = float(plate_crop_info.get("conf") or 0.0)
    
    # Bonuses for verified syntax and aggregator consensus latch
    valid_bonus = 0.50 if plate_crop_info.get("is_valid_format") else 0.0
    latched_bonus = 0.25 if plate_crop_info.get("is_latched") else 0.0

    return (ocr_conf * 0.45) + (q_score * 0.30) + (plate_conf * 0.25) + valid_bonus + latched_bonus


class HybridCropManager:
    """
    Hybrid Crop Storage & Retention Engine:
    1. Keeps ONLY the single highest-accuracy crop per vehicle track session.
    2. Stores active crops in Redis with a 24-hour TTL (zero disk writes on normal vehicles).
    3. Has an automatic in-memory fallback if Redis is not running.
    4. Persists the best crop to disk ONLY when an audit/security event demands long-term archiving.
    """

    def __init__(
        self,
        redis_url: Optional[str] = None,
        disk_dir: Optional[Path] = None,
        ttl_seconds: int = 86400  # 24 hours
    ):
        self.ttl_seconds = ttl_seconds
        self.disk_dir = disk_dir or (settings.BASE_DIR / "backend" / "static" / "crops")
        self.disk_dir.mkdir(parents=True, exist_ok=True)

        self.redis = None
        self._in_memory_cache: Dict[str, bytes] = {}
        self._best_scores: Dict[str, float] = {}

        # Attempt Redis connection gracefully
        url = redis_url or getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis
            client = redis.Redis.from_url(url, decode_responses=False, socket_timeout=1.0)
            client.ping()
            self.redis = client
            logger.info(f"Connected to Redis for crop storage at: {url}")
        except Exception as e:
            logger.warning(
                f"Redis unavailable ({e}). Falling back to bounded in-memory cache for crops."
            )
            self.redis = None

    def update_best_crop(
        self,
        camera_id: str,
        track_id: int,
        plate_crop_info: dict
    ) -> Optional[str]:
        """
        Evaluates the incoming crop. If it is sharper and higher confidence
        than the previous crop for this vehicle track, it updates the stored crop.
        Returns the crop reference key (e.g. 'crop:CAM-GATE-01:10042').
        """
        crop_img = plate_crop_info.get("crop")
        if crop_img is None or not isinstance(crop_img, np.ndarray) or crop_img.size == 0:
            return None

        track_key = f"{camera_id}:{track_id}"
        new_score = compute_crop_accuracy(plate_crop_info)
        current_best_score = self._best_scores.get(track_key, -1.0)

        crop_ref = f"crop:{track_key}"

        # If we already have an equal or higher quality crop for this car, discard this frame's crop
        if new_score <= current_best_score:
            return crop_ref

        # Encode to compressed JPEG in memory (avoids disk writes)
        success, buffer = cv2.imencode(".jpg", crop_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        if not success:
            return None

        jpeg_bytes = buffer.tobytes()
        self._best_scores[track_key] = new_score

        # Store in Redis with TTL or in-memory fallback
        if self.redis:
            try:
                self.redis.setex(crop_ref, self.ttl_seconds, jpeg_bytes)
            except Exception as e:
                logger.warning(f"Failed to write crop to Redis: {e}")
                self._in_memory_cache[crop_ref] = jpeg_bytes
        else:
            # Keep cache bounded to 2000 most recent crops in memory
            if len(self._in_memory_cache) > 2000:
                oldest_key = next(iter(self._in_memory_cache))
                self._in_memory_cache.pop(oldest_key, None)
            self._in_memory_cache[crop_ref] = jpeg_bytes

        return crop_ref

    def get_crop_bytes(self, crop_ref: str) -> Optional[bytes]:
        """Retrieves raw JPEG bytes from Redis or in-memory cache."""
        if self.redis:
            try:
                data = self.redis.get(crop_ref)
                if data:
                    return data
            except Exception as e:
                logger.warning(f"Redis get failed: {e}")

        # Fallback to in-memory cache
        return self._in_memory_cache.get(crop_ref)

    def persist_to_disk_for_audit(self, crop_ref: Optional[str], filename: str) -> Optional[str]:
        """
        Persists the best-captured crop from Redis to disk ONLY when an
        incident, unauthorized vehicle, or REVIEW_REQUIRED event requires
        permanent evidence archiving.
        """
        if not crop_ref:
            return None

        jpeg_bytes = self.get_crop_bytes(crop_ref)
        if not jpeg_bytes:
            return None

        try:
            full_path = self.disk_dir / filename
            with open(full_path, "wb") as f:
                f.write(jpeg_bytes)
            return f"static/crops/{filename}"
        except Exception as e:
            logger.error(f"Failed to persist audit crop to disk: {e}")
            return None


# Global singleton instance for the backend
crop_manager = HybridCropManager()

