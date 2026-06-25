from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base, TimestampMixin


class PatientDocument(Base, TimestampMixin):
    """Документ пациента в личном медицинском архиве (PHR)."""

    __tablename__ = "patient_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String)
