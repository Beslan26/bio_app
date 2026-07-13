from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class ComplaintCreateText(BaseModel):
    text: str


class ComplaintResponse(BaseModel):
    id: int
    source: str
    raw_text: str
    extracted_facts: List[str]  # Теперь это обязательное поле ответа
    ai_summary: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True} # Для Pydantic v2


class ClinicalComplaintResponse(BaseModel):
    """Схема ответа жалобы для фронтенда доктора."""
    id: int
    patient_id: int
    # Конвертируем raw_text из БД в description для доктора
    description: str = Field(validation_alias="raw_text")
    created_at: datetime
    patient_full_name: Optional[str] = None
    severity_level: Optional[str] = "medium"

    model_config = {"from_attributes": True}