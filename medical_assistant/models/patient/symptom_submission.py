from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base, TimestampMixin


class SymptomSubmission(Base, TimestampMixin):
    """История жалоб пациента с AI-разбором и статусом обработки."""

    __tablename__ = "symptom_submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    input_type: Mapped[str] = mapped_column(String, nullable=False)
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)
    audio_url: Mapped[str | None] = mapped_column(String)
    transcription: Mapped[str | None] = mapped_column(Text)
    ai_results_json: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String, default="processing", nullable=False)
