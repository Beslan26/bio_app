from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class DoctorPatient(Base, TimestampMixin):
    __tablename__ = "doctor_patient"
    __table_args__ = (
        UniqueConstraint("doctor_id", "patient_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(
        ForeignKey("doctors.id", ondelete="CASCADE")
    )
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE")
    )

    doctor = relationship("Doctor", back_populates="patients")
    patient = relationship("Patient", back_populates="doctors")