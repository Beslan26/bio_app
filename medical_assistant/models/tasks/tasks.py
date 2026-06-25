from sqlalchemy import ForeignKey, String, Text, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class Task(Base, TimestampMixin):
    """Назначение врача пациенту (доменная сущность PatientTask из раздела 6)."""

    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"))
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"))

    title: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(Text)
    start_date: Mapped[str] = mapped_column(Date)
    end_date: Mapped[str] = mapped_column(Date)

    doctor = relationship("Doctor", back_populates="tasks")
    patient = relationship("Patient", back_populates="tasks")
    entries = relationship("TaskEntry", back_populates="task")