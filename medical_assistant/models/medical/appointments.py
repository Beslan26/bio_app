import enum
from datetime import datetime
from sqlalchemy import DateTime, Enum, ForeignKey, Text, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class AppointmentStatus(enum.Enum):
    """Статусы жизненного цикла приема."""

    scheduled = "scheduled"
    completed = "completed"
    no_show = "no_show"
    cancelled = "cancelled"


class Appointment(Base, TimestampMixin):
    """Календарная запись приема между врачом и пациентом."""

    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    complaint_id: Mapped[int | None] = mapped_column(ForeignKey("complaints.id"))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[AppointmentStatus] = mapped_column(
        Enum(AppointmentStatus),
        nullable=False,
        default=AppointmentStatus.scheduled,
    )
    patient_priority: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)

    doctor = relationship("Doctor", back_populates="appointments")
    patient = relationship("Patient", back_populates="appointments")
    complaint = relationship("Complaint", back_populates="appointments")
    prescriptions = relationship("Prescription", back_populates="appointment")
