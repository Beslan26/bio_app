import enum
from sqlalchemy import Enum, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class PrescriptionKind(enum.Enum):
    """Тип формального медицинского назначения."""

    drug = "drug"
    procedure = "procedure"


class Prescription(Base, TimestampMixin):
    """Формальное назначение врача (лекарство или процедура), привязанное к контексту приёма при необходимости."""

    __tablename__ = "prescriptions"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    appointment_id: Mapped[int | None] = mapped_column(ForeignKey("appointments.id", ondelete="SET NULL"))
    complaint_id: Mapped[int | None] = mapped_column(ForeignKey("complaints.id", ondelete="SET NULL"))
    kind: Mapped[PrescriptionKind] = mapped_column(Enum(PrescriptionKind), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)

    doctor = relationship("Doctor", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")
    appointment = relationship("Appointment", back_populates="prescriptions")
    complaint = relationship("Complaint", back_populates="prescriptions")
