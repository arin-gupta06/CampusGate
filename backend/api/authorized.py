from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.auth import get_current_user
from backend.models.authorized import AuthorizedVehicle
from backend.schemas.authorized import (
    AuthorizedVehicleCreate,
    AuthorizedVehicleUpdate,
    AuthorizedVehicleResponse
)
from backend.vision.ocr_reader import IndianPlateNormalizer

router = APIRouter(prefix="/api/authorized", tags=["Authorized Registry"])


def _require_operator(user: Dict[str, Any]) -> str:
    role = (user.get("role") or "").lower()
    if role not in ["admin", "guard"] and not user.get("is_superadmin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Role '{role}' cannot modify authorized vehicle registry."
        )
    return role


@router.get("", response_model=List[AuthorizedVehicleResponse])
def list_authorized_vehicles(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    query = db.query(AuthorizedVehicle)
    role = (current_user.get("role") or "").lower()
    is_admin_or_guard = role in ["admin", "guard"] or current_user.get("is_superadmin")
    if not is_admin_or_guard:
        # Non-operators can only view vehicles registered to their own identity
        user_name = current_user.get("name") or ""
        query = query.filter(AuthorizedVehicle.owner_name == user_name)

    if search:
        query = query.filter(AuthorizedVehicle.registration_number.ilike(f"%{search}%"))
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=AuthorizedVehicleResponse)
def register_authorized_vehicle(
    payload: AuthorizedVehicleCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    raw_plate = payload.registration_number or payload.plate_number
    if not raw_plate:
        raise HTTPException(status_code=400, detail="Registration plate number is required")

    clean_plate = IndianPlateNormalizer.clean_text(raw_plate)
    existing = db.query(AuthorizedVehicle).filter(AuthorizedVehicle.registration_number == clean_plate).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Vehicle '{clean_plate}' is already registered")

    data = payload.model_dump(exclude={"plate_number"})
    data["registration_number"] = clean_plate

    role = (current_user.get("role") or "").lower()
    if role not in ["admin", "guard"] and not current_user.get("is_superadmin"):
        # Enforce that regular users register under their own identity
        data["owner_name"] = current_user.get("name", data.get("owner_name"))
        data["owner_role"] = current_user.get("role", "student")
        data["department"] = current_user.get("department", data.get("department"))

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
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator(current_user)
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
def delete_authorized_vehicle(
    registration_number: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    _require_operator(current_user)
    clean_plate = IndianPlateNormalizer.clean_text(registration_number)
    record = db.query(AuthorizedVehicle).filter(AuthorizedVehicle.registration_number == clean_plate).first()
    if not record:
        raise HTTPException(status_code=404, detail=f"Vehicle '{clean_plate}' not found in registry")

    db.delete(record)
    db.commit()
    return {"status": "deleted", "registration_number": clean_plate}
