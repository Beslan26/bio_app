from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class TaskEntry(Base, TimestampMixin):
    """Результат выполнения задачи пациентом (доменная сущность TaskResult из раздела 6)."""

    __tablename__ = "task_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    task_id: Mapped[int] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE")
    )

    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    value: Mapped[str] = mapped_column(Text)
    patient_comment: Mapped[str | None] = mapped_column(Text)
    last_edited_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    task = relationship("Task", back_populates="entries")