from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column

from medical_assistant.database.base import Base


class HealthMetric(Base):
    """Точка измерения медицинского показателя пациента."""

    __tablename__ = "health_metrics"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    metric_type: Mapped[str] = mapped_column(String, nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str | None] = mapped_column(String)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
