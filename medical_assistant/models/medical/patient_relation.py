from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class PatientRelation(Base):
    """Связь между пациентами для учета семейного анамнеза."""

    __tablename__ = "patient_relations"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id_1: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    patient_id_2: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"))
    relation_type: Mapped[str] = mapped_column(String, nullable=False)
