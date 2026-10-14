from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AuthorizedVehicleBase(BaseModel):
    registration_number: str
    owner_name: str
    owner_role: str = "FACULTY"
    department: Optional[str] = None
    vehicle_type: str = "CAR"
    valid_until: Optional[datetime] = None
    is_active: bool = True
    notes: Optional[str] = None

class AuthorizedVehicleCreate(AuthorizedVehicleBase):
    pass

class AuthorizedVehicleResponse(AuthorizedVehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
