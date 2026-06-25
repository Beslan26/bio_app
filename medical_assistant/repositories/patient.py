from datetime import date

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.user.patients import Patient, Sex


class PatientRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    model = Patient

    async def create(
        self,
        *,
        user_id: int,
        birth_date: date | None = None,
        sex: Sex | None = None,
    ) -> Patient:
        patient = Patient(
            user_id=user_id,
            birth_date=birth_date,
            sex=sex,
        )

        self.session.add(patient)
        await self.session.commit()
        await self.session.refresh(patient)

        return patient

    async def get_by_user_id(self, user_id: int) -> Patient | None:
        """
        Получает профиль пациента по ID пользователя.

        Выполняет запрос к базе данных и возвращает объект Patient,
        связанный с переданным user_id. Если профиль пациента не найден,
        возвращается None.

        Args:
            user_id (int): ID пользователя.

        Returns:
            Patient | None: Объект пациента, если найден, иначе None.
        """

        stmt = select(Patient).where(Patient.user_id == user_id)

        result = await self.session.execute(stmt)
        patient = result.scalar_one_or_none()

        return patient

    async def update_by_user_id(self, user_id: int, data: dict):
        """
        Обновляет профиль пациента по ID пользователя.

        Находит запись пациента, связанную с указанным user_id,
        и обновляет поля значениями из словаря data.
        Обновляются только те поля, которые переданы в data.

        Args:
            user_id (int): ID пользователя.
            data (dict): Словарь с полями для обновления и их новыми значениями.

        Returns:
            Patient | None: Обновлённый объект пациента, если найден, иначе None.

        Примечание:
            Предполагается, что ключи в data соответствуют полям модели Patient.
            Валидация входных данных должна выполняться до вызова этого метода.
        """
        query = (
            update(self.model)
            .where(self.model.user_id == user_id)
            .values(**data)
            .returning(self.model)  # Возвращаем обновленный объект (только для PostgreSQL)
        )

        result = await self.session.execute(query)
        await self.session.commit()

        # Получаем обновленную запись
        updated_obj = result.scalar_one_or_none()

        if not updated_obj:
            raise HTTPException(status_code=404, detail="Patient profile not found")

        return updated_obj
