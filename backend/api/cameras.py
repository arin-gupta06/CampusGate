from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.camera import Camera, CameraTopology
from backend.schemas.camera import (
    CameraCreate,
    CameraUpdate,
    CameraResponse,
    TopologyCreate,
    TopologyUpdate,
    TopologyResponse,
)

router = APIRouter(prefix="/api/cameras", tags=["Cameras & Topology"])

# --- Topology Routes (Placed before /{camera_id} to avoid path collision) ---

@router.get("/topology", response_model=List[TopologyResponse])
def list_topology(db: Session = Depends(get_db)):
    return db.query(CameraTopology).all()

@router.post("/topology", response_model=TopologyResponse)
def create_topology(payload: TopologyCreate, db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db)
):
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
def delete_topology(topology_id: int, db: Session = Depends(get_db)):
    topo = db.query(CameraTopology).filter(CameraTopology.id == topology_id).first()
    if not topo:
        raise HTTPException(status_code=404, detail=f"Topology route with ID {topology_id} not found")

    db.delete(topo)
    db.commit()
    return {"status": "deleted", "id": topology_id}

# --- Camera Routes ---

@router.get("", response_model=List[CameraResponse])
def list_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()

@router.post("", response_model=CameraResponse)
def create_camera(payload: CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(Camera).filter(Camera.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Camera with ID '{payload.id}' already exists")
    camera = Camera(**payload.model_dump())
    db.add(camera)
    db.commit()
    return camera

@router.patch("/{camera_id}", response_model=CameraResponse)
def update_camera(
    camera_id: str,
    payload: CameraUpdate,
    db: Session = Depends(get_db)
):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)

    db.commit()
    db.refresh(camera)
    return camera

@router.delete("/{camera_id}")
def delete_camera(camera_id: str, db: Session = Depends(get_db)):
    camera = db.query(Camera).filter(Camera.id == camera_id).first()
    if not camera:
        raise HTTPException(status_code=404, detail=f"Camera with ID '{camera_id}' not found")

    db.delete(camera)
    db.commit()
    return {"status": "deleted", "id": camera_id}
