from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from medical_assistant.database.base import Base, TimestampMixin


class MedicalCard(Base, TimestampMixin):
    """Корневой контейнер PHR: одна медицинская карта на пациента (1:1 с профилем пациента)."""

    __tablename__ = "medical_cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(
        ForeignKey("patients.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )

    patient = relationship("Patient", back_populates="medical_card")
    records = relationship("MedicalRecord", back_populates="medical_card")
