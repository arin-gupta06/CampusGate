"""
Automated Handoff Expiry Sweeper.
Runs as a periodic background daemon task (default: every 60 seconds).
Transitions unobserved handoffs whose travel window has passed to EXPIRED / UNRESOLVED
without requiring manual operator API triggers.
"""

import asyncio
import logging
from typing import Optional

from backend.core.database import SessionLocal
from backend.reconciliation.engine import ReconciliationEngine
from backend.core.cache import cache

logger = logging.getLogger("campusgate.sweeper")


class HandoffSweeper:
    def __init__(self, interval_seconds: int = 60):
        self.interval_seconds = interval_seconds
        self._task: Optional[asyncio.Task] = None
        self._is_running = False

    async def _sweep_loop(self):
        logger.info(f"Handoff Sweeper background loop started (interval: {self.interval_seconds}s).")
        while self._is_running:
            try:
                await asyncio.sleep(self.interval_seconds)
                self.sweep_once()
            except asyncio.CancelledError:
                logger.info("Handoff Sweeper loop received cancellation request.")
                break
            except Exception as e:
                logger.error(f"Error during periodic handoff sweep: {e}", exc_info=True)

    def sweep_once(self) -> int:
        """
        Executes a single sweep pass against the database.
        Returns the number of stale handoffs transitioned to EXPIRED.
        """
        db = SessionLocal()
        try:
            engine = ReconciliationEngine(db)
            expired_count = engine.expire_stale_handoffs()
            if expired_count > 0:
                logger.info(f"Automated Sweeper: Transitioned {expired_count} stale handoffs to EXPIRED/UNRESOLVED.")
                cache.delete("cache:audit_summary")
            return expired_count
        except Exception as e:
            logger.error(f"Failed to sweep stale handoffs: {e}", exc_info=True)
            return 0
        finally:
            db.close()

    def start(self) -> None:
        """Starts the periodic background task."""
        if self._is_running:
            return
        self._is_running = True
        self._task = asyncio.create_task(self._sweep_loop())

    def stop(self) -> None:
        """Stops and cancels the background sweeper task."""
        self._is_running = False
        if self._task and not self._task.done():
            self._task.cancel()


# Global sweeper singleton
handoff_sweeper = HandoffSweeper(interval_seconds=60)

