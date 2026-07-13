from typing import List, Optional
from sqlalchemy import ForeignKey, Text, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class Complaint(Base, TimestampMixin):
    """Первичная жалоба пациента с AI-структурированными данными (поток консультации, раздел 6.3)."""

    __tablename__ = "complaints"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE")
    )

    raw_text: Mapped[str] = mapped_column(Text)

    source: Mapped[str] = mapped_column(String(50))  # text | voice
    extracted_facts: Mapped[List[str]] = mapped_column(JSONB) # Список фактов от ИИ

    structured_data: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)
    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    patient = relationship("Patient", back_populates="complaints")
    appointments = relationship("Appointment", back_populates="complaint")
    prescriptions = relationship("Prescription", back_populates="complaint")