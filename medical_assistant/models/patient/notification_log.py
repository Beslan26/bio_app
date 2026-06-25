from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base, TimestampMixin


class NotificationLog(Base, TimestampMixin):
    """Журнал доставки уведомлений пациенту по каналам связи."""

    __tablename__ = "notification_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    trigger_event: Mapped[str] = mapped_column(String, nullable=False)
    channel: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
