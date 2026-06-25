from sqlalchemy import ForeignKey, Text, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class Notification(Base, TimestampMixin):
    """Внутриигровое уведомление пользователя по событиям системы (раздел 6.4)."""

    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE")
    )

    message: Mapped[str] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)

    user = relationship("User", back_populates="notifications")