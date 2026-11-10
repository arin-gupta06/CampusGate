from typing import Optional
from datetime import datetime
from pydantic import BaseModel, model_validator

class AuthorizedVehicleBase(BaseModel):
    registration_number: Optional[str] = None
    plate_number: Optional[str] = None
    owner_name: str
    owner_role: str = "FACULTY"
    department: Optional[str] = None
    vehicle_type: str = "CAR"
    valid_until: Optional[datetime] = None
    is_active: bool = True
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_registration_number(cls, values):
        if isinstance(values, dict):
            reg = values.get("registration_number") or values.get("plate_number")
            if reg:
                values["registration_number"] = reg
                values["plate_number"] = reg
        return values

class AuthorizedVehicleCreate(AuthorizedVehicleBase):
    pass

class AuthorizedVehicleUpdate(BaseModel):
    owner_name: Optional[str] = None
    owner_role: Optional[str] = None
    department: Optional[str] = None
    vehicle_type: Optional[str] = None
    valid_until: Optional[datetime] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None

class AuthorizedVehicleResponse(AuthorizedVehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
