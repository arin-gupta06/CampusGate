from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.models.authorized import AuthorizedVehicle
from backend.schemas.authorized import (
    AuthorizedVehicleCreate,
    AuthorizedVehicleUpdate,
    AuthorizedVehicleResponse
)
from backend.vision.ocr_reader import IndianPlateNormalizer

router = APIRouter(prefix="/api/authorized", tags=["Authorized Registry"])

@router.get("", response_model=List[AuthorizedVehicleResponse])
def list_authorized_vehicles(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AuthorizedVehicle)
    if search:
        query = query.filter(AuthorizedVehicle.registration_number.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()

@router.post("", response_model=AuthorizedVehicleResponse)
def register_authorized_vehicle(payload: AuthorizedVehicleCreate, db: Session = Depends(get_db)):
    raw_plate = payload.registration_number or payload.plate_number
    if not raw_plate:
        raise HTTPException(status_code=400, detail="Registration plate number is required")

    clean_plate = IndianPlateNormalizer.clean_text(raw_plate)
    existing = db.query(AuthorizedVehicle).filter(AuthorizedVehicle.registration_number == clean_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle '{clean_plate}' is already registered")

    data = payload.model_dump(exclude={"plate_number"})
    data["registration_number"] = clean_plate
    record = AuthorizedVehicle(**data)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.get("/check/{registration_number}")
def check_plate_authorization(registration_number: str, db: Session = Depends(get_db)):
    clean_plate = IndianPlateNormalizer.clean_text(registration_number)
    record = db.query(AuthorizedVehicle).filter(
        AuthorizedVehicle.registration_number == clean_plate,
        AuthorizedVehicle.is_active == True
    ).first()

    if record:
        return {
            "authorized": True,
            "plate": clean_plate,
            "owner": record.owner_name,
            "role": record.owner_role,
            "department": record.department
        }
    return {
        "authorized": False,
        "plate": clean_plate,
        "detail": "No active authorization record found"
    }

@router.patch("/{registration_number}", response_model=AuthorizedVehicleResponse)
def update_authorized_vehicle(
    registration_number: str,
    payload: AuthorizedVehicleUpdate,
    db: Session = Depends(get_db)
):
    clean_plate = IndianPlateNormalizer.clean_text(registration_number)
    record = db.query(AuthorizedVehicle).filter(AuthorizedVehicle.registration_number == clean_plate).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Vehicle '{clean_plate}' not found in registry")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record

@router.delete("/{registration_number}")
def delete_authorized_vehicle(registration_number: str, db: Session = Depends(get_db)):
    clean_plate = IndianPlateNormalizer.clean_text(registration_number)
    record = db.query(AuthorizedVehicle).filter(AuthorizedVehicle.registration_number == clean_plate).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Vehicle '{clean_plate}' not found in registry")

    db.delete(record)
    db.commit()
    return {"status": "deleted", "registration_number": clean_plate}
