from pydantic import BaseModel
from datetime import date
from typing import Optional


class PatientProfileResponse(BaseModel):
    birth_date: date
    sex: str
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None


class PatientProfileUpdate(BaseModel):
    birth_date: Optional[date] = None
    sex: Optional[str] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[float] = None