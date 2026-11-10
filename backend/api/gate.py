import logging
from datetime import datetime
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.core.ws_manager import ws_manager
from backend.core.auth import get_current_user

logger = logging.getLogger("campusgate.barrier")
router = APIRouter(prefix="/api/gate", tags=["Gate Barrier Control"])

class BarrierActionPayload(BaseModel):
    action: str  # "OPEN", "CLOSE", "LOCK_DOWN"
    gate_id: Optional[str] = "Gate 1 - Main Ingress"
    plate: Optional[str] = None
    reason: Optional[str] = "Operator Command"

def verify_barrier_access(current_user: Dict[str, Any]) -> str:
    """Validates that the invoking user possesses physical barrier actuation privileges."""
    user_role = (current_user.get("role") or "").lower()
    if user_role not in ["guard", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{user_role}' is not authorized to actuate gate barriers."
        )
    return user_role

@router.post("/barrier")
async def control_barrier(
    payload: BarrierActionPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Controls physical/electronic gate boom barrier (OPEN, CLOSE, LOCK_DOWN).
    Requires 'guard' or 'admin' role. Broadcasts state to all connected monitoring dashboards.
    """
    verify_barrier_access(current_user)

    action = payload.action.upper()
    if action not in ["OPEN", "CLOSE", "LOCK_DOWN"]:
        raise HTTPException(status_code=400, detail="Action must be OPEN, CLOSE, or LOCK_DOWN")

    operator_tag = f"{payload.reason} (by {current_user.get('name', 'Operator')} <{current_user.get('email', 'unknown')}>)"

    event_payload = {
        "type": "BARRIER_EVENT",
        "action": action,
        "gate_id": payload.gate_id,
        "plate": payload.plate,
        "reason": operator_tag,
        "operator": current_user.get("email"),
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

