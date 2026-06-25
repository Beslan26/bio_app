from datetime import date
from sqlalchemy import String, Date, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class License(Base):
    """Справочник лицензий для проверки допуска врача к работе."""

    __tablename__ = "licenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    license_number: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    issue_date: Mapped[date | None] = mapped_column(Date)
    expiry_date: Mapped[date | None] = mapped_column(Date)
    issuer: Mapped[str | None] = mapped_column(String)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
