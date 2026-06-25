from sqlalchemy import ForeignKey, Text
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
    structured_data: Mapped[dict] = mapped_column(JSONB)
    ai_summary: Mapped[str] = mapped_column(Text)

    patient = relationship("Patient", back_populates="complaints")
    appointments = relationship("Appointment", back_populates="complaint")
    prescriptions = relationship("Prescription", back_populates="complaint")