from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base, TimestampMixin


class SystemConfig(Base, TimestampMixin):
    """Хранилище системных параметров и мастер-данных словарей."""

    __tablename__ = "system_configs"

    id: Mapped[int] = mapped_column(primary_key=True)
    key: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(String)
