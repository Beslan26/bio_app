from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class Specialization(Base):
    """Медицинская специализация для профиля врача и AI-маршрутизации."""

    __tablename__ = "specializations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String)
    category: Mapped[str | None] = mapped_column(String)
