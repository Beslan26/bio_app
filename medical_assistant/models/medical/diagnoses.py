import enum
from sqlalchemy import String, Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base, TimestampMixin


class DiagnosisType(enum.Enum):
    """Тип диагноза в рамках лечебного процесса."""

    preliminary = "preliminary"
    final = "final"


class Diagnosis(Base, TimestampMixin):
    """Клиническая запись диагноза врача по пациенту."""

    __tablename__ = "diagnoses"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    diagnosis_text: Mapped[str] = mapped_column(Text, nullable=False)
    icd_code: Mapped[str | None] = mapped_column(String)
    type: Mapped[DiagnosisType] = mapped_column(
        Enum(DiagnosisType),
        nullable=False,
        default=DiagnosisType.preliminary,
    )
    consultation_notes: Mapped[str | None] = mapped_column(Text)
    recommendation: Mapped[str | None] = mapped_column(Text)
