from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class PatientSocialData(Base):
    """Социально-бытовой контекст пациента для клинической оценки рисков."""

    __tablename__ = "patient_social_data"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), unique=True)
    workplace: Mapped[str | None] = mapped_column(String)
    residence_type: Mapped[str | None] = mapped_column(String)
    environment_hazards: Mapped[str | None] = mapped_column(String)
