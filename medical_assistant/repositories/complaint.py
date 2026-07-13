from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from medical_assistant.models.medical.complaints import Complaint


class ComplaintRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, **data) -> Complaint:
        item = Complaint(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get_by_patient_id(self, patient_id: int) -> list[Complaint]:
        """Возвращает список жалоб конкретного пациента."""
        result = await self.session.execute(
            select(Complaint)
            .where(Complaint.patient_id == patient_id)
            .order_by(Complaint.created_at.desc())  # Сортировка по свежим записям
        )
        return list(result.scalars().all())
