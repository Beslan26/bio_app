from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class Investigation(Base, TimestampMixin):
    """Исследование (анализ, скан): может быть привязано к записи медкарты или только к пациенту."""

    __tablename__ = "investigations"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    medical_record_id: Mapped[int | None] = mapped_column(
        ForeignKey("medical_records.id", ondelete="SET NULL"),
    )
    investigation_type: Mapped[str] = mapped_column(String, nullable=False)
    file_path: Mapped[str] = mapped_column(String, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    patient = relationship("Patient", back_populates="investigations")
    medical_record = relationship("MedicalRecord", back_populates="investigations")
