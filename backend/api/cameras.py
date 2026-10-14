from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.camera import Camera, CameraTopology
from backend.schemas.camera import CameraCreate, CameraResponse, TopologyCreate, TopologyResponse

router = APIRouter(prefix="/api/cameras", tags=["Cameras & Topology"])

@router.get("", response_model=List[CameraResponse])
def list_cameras(db: Session = Depends(get_db)):
    return db.query(Camera).all()

@router.post("", response_model=CameraResponse)
def create_camera(payload: CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(Camera).filter(Camera.id == payload.id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Camera with ID '{payload.id}' already exists")
    camera = Camera(**payload.dict())
    db.add(camera)
    db.commit()
    db.refresh(camera)
    return camera

@router.get("/topology", response_model=List[TopologyResponse])
def list_topology(db: Session = Depends(get_db)):
    return db.query(CameraTopology).all()

@router.post("/topology", response_model=TopologyResponse)
def create_topology(payload: TopologyCreate, db: Session = Depends(get_db)):
    source = db.query(Camera).filter(Camera.id == payload.source_camera_id).first()
    dest = db.query(Camera).filter(Camera.id == payload.destination_camera_id).first()
    if not source or not dest:
        raise HTTPException(status_code=404, detail="Source or Destination camera ID not found")
        
    topo = CameraTopology(**payload.dict())
    db.add(topo)
    db.commit()
    db.refresh(topo)
    return topo
