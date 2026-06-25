from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class LicenseProof(Base):
    """Доказательство лицензии врача для процесса административной верификации."""

    __tablename__ = "license_proofs"

    id: Mapped[int] = mapped_column(primary_key=True)
    doctor_id: Mapped[int] = mapped_column(ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    file_url: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="valid")
    reviewer_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    review_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
