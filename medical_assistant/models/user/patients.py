from sqlalchemy import Date, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from medical_assistant.database.base import Base, TimestampMixin


class Sex(enum.Enum):
    male = "male"
    female = "female"
    other = "other"


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True
    )

    birth_date: Mapped[str | None] = mapped_column(Date)
    sex: Mapped[Sex | None] = mapped_column(Enum(Sex))
    full_name: Mapped[str | None] = mapped_column(String)
    gender: Mapped[str | None] = mapped_column(String)
    blood_type: Mapped[str | None] = mapped_column(String)
    contact_details: Mapped[str | None] = mapped_column(String)
    emergency_contact: Mapped[str | None] = mapped_column(String)

    user = relationship("User", back_populates="patient")
    complaints = relationship("Complaint", back_populates="patient")
    lab_files = relationship("LabFile", back_populates="patient")
    tasks = relationship("Task", back_populates="patient")
    doctors = relationship("DoctorPatient", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    medical_card = relationship("MedicalCard", back_populates="patient", uselist=False)
    medical_records = relationship("MedicalRecord", back_populates="patient")
    investigations = relationship("Investigation", back_populates="patient")
    prescriptions = relationship("Prescription", back_populates="patient")