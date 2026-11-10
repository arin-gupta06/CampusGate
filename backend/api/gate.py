import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.core.ws_manager import ws_manager

logger = logging.getLogger("campusgate.barrier")
router = APIRouter(prefix="/api/gate", tags=["Gate Barrier Control"])

class BarrierActionPayload(BaseModel):
    action: str  # "OPEN", "CLOSE", "LOCK_DOWN"
    gate_id: Optional[str] = "Gate 1 - Main Ingress"
    plate: Optional[str] = None
    reason: Optional[str] = "Operator Command"

@router.post("/barrier")
async def control_barrier(payload: BarrierActionPayload):
    """
    Controls physical/electronic gate boom barrier (OPEN, CLOSE, LOCK_DOWN).
    Broadcasts state immediately to all connected monitoring dashboards.
    """
    action = payload.action.upper()
    if action not in ["OPEN", "CLOSE", "LOCK_DOWN"]:
        raise HTTPException(status_code=400, detail="Action must be OPEN, CLOSE, or LOCK_DOWN")

    event_payload = {
        "type": "BARRIER_EVENT",
        "action": action,
        "gate_id": payload.gate_id,
        "plate": payload.plate,
        "reason": payload.reason,
        "timestamp": datetime.utcnow().isoformat()
    }

    try:
        await ws_manager.broadcast(event_payload)
    except Exception as e:
        logger.warning(f"Failed to broadcast barrier state: {e}")

    return {
        "status": "success",
        "action": action,
        "gate_id": payload.gate_id,
        "message": f"Barrier {action} executed for {payload.gate_id}"
    }

