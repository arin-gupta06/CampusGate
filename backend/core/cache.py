"""
Resilient Caching Utility.
Provides Redis-backed caching with automatic in-memory TTL fallback.
Ensures high-frequency queries (like Dashboard summary tallies) never stress PostgreSQL.
"""

import json
import time
import logging
from typing import Optional, Any, Dict

from backend.core.config import settings

logger = logging.getLogger("campusgate.cache")


class ResilientCache:
    def __init__(self, redis_url: Optional[str] = None):
        self.redis = None
        self._in_memory: Dict[str, tuple[str, float]] = {}  # {key: (json_str, expire_timestamp)}

        url = redis_url or getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
        try:
            import redis
            client = redis.Redis.from_url(url, decode_responses=True, socket_timeout=1.0)
            client.ping()
            self.redis = client
            logger.info(f"Connected to Redis cache at: {url}")
        except Exception as e:
            logger.warning(f"Redis cache unavailable ({e}). Using in-memory TTL cache fallback.")
            self.redis = None

    def get_json(self, key: str) -> Optional[Dict[str, Any]]:
        """Retrieves and deserializes JSON from Redis or in-memory fallback."""
        if self.redis:
            try:
                raw = self.redis.get(key)
                if raw:
                    return json.loads(raw)
                return None
            except Exception as e:
                logger.warning(f"Redis get_json error for {key}: {e}")

        # In-memory fallback
        item = self._in_memory.get(key)
        if not item:
            return None
        val_str, expire_at = item
        if time.time() > expire_at:
            self._in_memory.pop(key, None)
            return None
        try:
            return json.loads(val_str)
        except Exception:
            return None

    def set_json(self, key: str, value: Dict[str, Any], ttl_seconds: int = 15) -> bool:
        """Serializes and caches JSON with a strict TTL in seconds."""
        try:
            val_str = json.dumps(value)
        except Exception as e:
            logger.error(f"Failed to serialize value for cache key {key}: {e}")
            return False

        if self.redis:
            try:
                self.redis.setex(key, ttl_seconds, val_str)
                return True
            except Exception as e:
                logger.warning(f"Redis set_json error for {key}: {e}")

        # In-memory fallback
        # Clean expired items if dictionary grows beyond 1000 items
        if len(self._in_memory) > 1000:
            now = time.time()
            self._in_memory = {k: v for k, v in self._in_memory.items() if v[1] > now}

        self._in_memory[key] = (val_str, time.time() + ttl_seconds)
        return True

    def delete(self, key: str) -> None:
        """Invalidates a cache key."""
        if self.redis:
            try:
                self.redis.delete(key)
            except Exception as e:
                logger.warning(f"Redis delete error for {key}: {e}")
        self._in_memory.pop(key, None)


# Global cache instance
cache = ResilientCache()

