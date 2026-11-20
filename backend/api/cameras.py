import time
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.auth import get_current_user
from backend.models.camera import Camera, CameraTopology
from backend.schemas.camera import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    TopologyCreate,
    TopologyUpdate,
    TopologyResponse,
)
from backend.ingestion.stream_pool import (
    camera_stream_pool,
    probe_camera_connection,
    normalize_stream_source,
    validate_stream_source_security,
)

router = APIRouter(prefix="/api/cameras", tags=["Cameras & Topology"])


def _require_operator_role(current_user: Dict[str, Any]) -> str:
    """Enforces that the invoking user has administrative or guard privileges."""
    role = (current_user.get("role") or "").lower()
    if role not in ["admin", "guard"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{role}' is not authorized to modify camera infrastructure."
        )
    return role


class CameraConnectionTestPayload(BaseModel):
    stream_url: str
    timeout: Optional[float] = 3.0


# --- Live Stream & Connection Testing Endpoints ---

@router.post("/test-connection")
def test_camera_connection(
    payload: CameraConnectionTestPayload,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Probes an RTSP stream URL or Network Camera IP with zero UI freeze.
    Performs security check, socket pre-flight, and frame capture diagnostics.
    """
    _require_operator_role(current_user)
    return probe_camera_connection(payload.stream_url, timeout_seconds=payload.timeout or 3.0)


@router.get("/{camera_id}/frame")
def get_camera_live_frame(camera_id: str, db: Session = Depends(get_db)):
    """
    Returns the latest single live JPEG frame snapshot for a registered camera.
    Falls back gracefully to a surveillance HUD test frame if camera is offline.
    """
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found")

    if cam.stream_url:
        camera_stream_pool.register_camera(cam.id, cam.stream_url, cam.name)

    jpeg_bytes = camera_stream_pool.get_frame_jpeg_bytes(camera_id, quality=80)
    return Response(
        content=jpeg_bytes,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


@router.get("/{camera_id}/stream")
def stream_camera_mjpeg(camera_id: str, db: Session = Depends(get_db)):
    """
    Streams live low-latency MJPEG video for any registered camera.
    Embeddable in any web browser via standard <img> tag.
    """
    cam = db.query(Camera).filter(Camera.id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found")

    if cam.stream_url:
        camera_stream_pool.register_camera(cam.id, cam.stream_url, cam.name)

    def frame_generator():
        target_delay = 1.0 / 20.0  # ~20 FPS stream
        while True:
            jpeg_bytes = camera_stream_pool.get_frame_jpeg_bytes(camera_id, quality=70)
            if jpeg_bytes:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + jpeg_bytes + b"\r\n"
                )
            time.sleep(target_delay)

    return StreamingResponse(
        frame_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


# --- Topology Routes ---

@router.get("/topology", response_model=List[TopologyResponse])
def list_topology(db: Session = Depends(get_db)):
    return db.query(CameraTopology).all()


@router.post("/topology", response_model=TopologyResponse)
def create_topology(
    payload: TopologyCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator_role(current_user)
    source = db.query(Camera).filter(Camera.id == payload.source_camera_id).first()
    dest = db.query(Camera).filter(Camera.id == payload.destination_camera_id).first()
    if not source or not dest:
        raise HTTPException(status_code=404, detail="Source or Destination camera ID not found")

    topo = CameraTopology(**payload.model_dump())
    db.add(topo)
    db.commit()
    return topo


@router.patch("/topology/{topology_id}", response_model=TopologyResponse)
def update_topology(
    topology_id: int,
    payload: TopologyUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator_role(current_user)
    topo = db.query(CameraTopology).filter(CameraTopology.id == topology_id).first()
    if not topo:
        raise HTTPException(status_code=404, detail=f"Topology route with ID {topology_id} not found")

    update_data = payload.model_dump(exclude_unset=True)

    new_min = update_data.get("expected_travel_time_min", topo.expected_travel_time_min)
    new_max = update_data.get("expected_travel_time_max", topo.expected_travel_time_max)
    if new_min > new_max:
        raise HTTPException(
            status_code=400,
            detail="expected_travel_time_min cannot be greater than expected_travel_time_max"
        )

    for field, value in update_data.items():
        setattr(topo, field, value)

    db.commit()
    db.refresh(topo)
    return topo


@router.delete("/topology/{topology_id}")
def delete_topology(
    topology_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator_role(current_user)
    topo = db.query(CameraTopology).filter(CameraTopology.id == topology_id).first()
    if not topo:
        raise HTTPException(status_code=404, detail=f"Topology route with ID {topology_id} not found")

    db.delete(topo)
    db.commit()
    return {"status": "deleted", "id": topology_id}


# --- Camera CRUD Routes ---

@router.get("", response_model=List[CameraResponse])
def list_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()


@router.post("", response_model=CameraResponse)
def create_camera(
    payload: CameraCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator_role(current_user)
    existing = db.query(Camera).filter(Camera.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Camera with ID '{payload.id}' already exists")

    data = payload.model_dump()
    if data.get("stream_url"):
        validate_stream_source_security(data["stream_url"])
        data["stream_url"] = normalize_stream_source(data["stream_url"])

    camera = Camera(**data)
    db.add(camera)
    db.commit()
    db.refresh(camera)

    if camera.stream_url:
        camera_stream_pool.register_camera(camera.id, camera.stream_url, camera.name)

    return camera


@router.patch("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: str,
    payload: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator_role(current_user)
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "stream_url" in update_data and update_data["stream_url"]:
        validate_stream_source_security(update_data["stream_url"])
        update_data["stream_url"] = normalize_stream_source(update_data["stream_url"])

    for field, value in update_data.items():
        setattr(camera, field, value)

    db.commit()
    db.refresh(camera)

    if camera.stream_url:
        camera_stream_pool.register_camera(camera.id, camera.stream_url, camera.name)

    return camera


@router.delete("/{camera_id}")
def delete_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator_role(current_user)
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found")

    camera_stream_pool.unregister_camera(camera_id)
    db.delete(camera)
    db.commit()
    return {"status": "deleted", "id": camera_id}
