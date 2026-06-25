from datetime import datetime
from sqlalchemy import String, Enum, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from medical_assistant.database.base import Base, TimestampMixin


class UserRole(enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"


class AccountStatus(enum.Enum):
    active = "active"
    deactivated = "deactivated"
    blocked = "blocked"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str | None] = mapped_column(String, unique=True)
    phone: Mapped[str | None] = mapped_column(String)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus),
        nullable=False,
        default=AccountStatus.active,
    )
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    patient = relationship("Patient", back_populates="user", uselist=False)
    doctor = relationship("Doctor", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")