from sqlalchemy import ForeignKey, String, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base


class LabFile(Base):
    __tablename__ = "lab_files"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE")
    )

    file_path: Mapped[str] = mapped_column(String)
    uploaded_at: Mapped[str] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    patient = relationship("Patient", back_populates="lab_files")