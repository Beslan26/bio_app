from datetime import time
from sqlalchemy import Boolean, Time, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class UserPreferences(Base):
    """Пользовательские настройки каналов и тихих часов уведомлений."""

    __tablename__ = "user_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    enable_email: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    enable_push: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    quiet_hours_start: Mapped[time | None] = mapped_column(Time)
    quiet_hours_end: Mapped[time | None] = mapped_column(Time)
