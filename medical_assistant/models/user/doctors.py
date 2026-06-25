import enum
from datetime import datetime
from sqlalchemy import String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class DoctorVerificationStatus(enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class Doctor(Base, TimestampMixin):
    __tablename__ = "doctors"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True
    )

    license_number: Mapped[str] = mapped_column(String, unique=True)
    sex: Mapped[str] = mapped_column(String)
    specialty: Mapped[str] = mapped_column(String)
    bio: Mapped[str | None] = mapped_column(String)
    work_hours: Mapped[str | None] = mapped_column(String)
    contact_info: Mapped[str | None] = mapped_column(String)
    sub_specializations: Mapped[str | None] = mapped_column(String)
    verification_status: Mapped[DoctorVerificationStatus] = mapped_column(
        Enum(DoctorVerificationStatus),
        nullable=False,
        default=DoctorVerificationStatus.pending,
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    user = relationship("User", back_populates="doctor")
    patients = relationship("DoctorPatient", back_populates="doctor")
    tasks = relationship("Task", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")
    medical_records = relationship("MedicalRecord", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")