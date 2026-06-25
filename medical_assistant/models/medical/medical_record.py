import enum
from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class MedicalRecordKind(enum.Enum):
    """Вид клинической записи в рамках медицинской карты."""

    diagnosis = "diagnosis"
    clinical_note = "clinical_note"


class MedicalRecord(Base, TimestampMixin):
    """Единичное клиническое событие в истории болезни (диагноз или клиническая заметка)."""

    __tablename__ = "medical_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    medical_card_id: Mapped[int] = mapped_column(
        ForeignKey("medical_cards.id", ondelete="CASCADE"),
        nullable=False,
    )
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    record_kind: Mapped[MedicalRecordKind] = mapped_column(
        Enum(MedicalRecordKind),
        nullable=False,
    )
    title: Mapped[str | None] = mapped_column(String)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    medical_card = relationship("MedicalCard", back_populates="records")
    doctor = relationship("Doctor", back_populates="medical_records")
    patient = relationship("Patient", back_populates="medical_records")
    investigations = relationship("Investigation", back_populates="medical_record")
