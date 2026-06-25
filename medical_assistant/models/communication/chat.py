from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base, TimestampMixin


class CommunicationThread(Base, TimestampMixin):
    """Диалог между врачом и пациентом в защищенном контуре приложения."""

    __tablename__ = "communication_threads"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id"), nullable=False)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class ChatMessage(Base, TimestampMixin):
    """Сообщение в диалоге с поддержкой контекстных метаданных."""

    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    thread_id: Mapped[int] = mapped_column(ForeignKey("communication_threads.id", ondelete="CASCADE"), nullable=False)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    message_metadata: Mapped[dict | None] = mapped_column("metadata", JSONB)
