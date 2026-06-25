from sqlalchemy import and_, select
from sqlalchemy.orm import joinedload
from sqlalchemy.ext.asyncio import AsyncSession
from medical_assistant.models.user.doctors import Doctor, DoctorVerificationStatus
from medical_assistant.models.user.licenses import License


class DoctorRepository:
    """Репозиторий для управления доступом и данными врачей."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
            self,
            *,
            user_id: int,
            license_number: str,
            sex: str,
            specialty: str,
            verified: bool = True
    ) -> Doctor:
        """
        Создает профиль врача, привязанный к существующему пользователю.
        """
        # Теперь мы просто создаем объект Doctor, так как User уже создан в сервисе
        new_doctor = Doctor(
            user_id=user_id,
            license_number=license_number,
            sex=sex,
            specialty=specialty,
            verification_status=(
                DoctorVerificationStatus.verified
                if verified
                else DoctorVerificationStatus.pending
            ),
            verified_at=None,
        )

        self.session.add(new_doctor)
        # Используем commit, чтобы сохранить изменения в базе
        await self.session.commit()
        # refresh нужен, чтобы подтянуть сгенерированные БД поля (например, id)
        await self.session.refresh(new_doctor)

        return new_doctor

    async def get_by_license(self, license_number: str) -> Doctor | None:
        """
        Ищет врача по лицензии вместе с данными аккаунта для проверки пароля.
        """
        stmt = (
            select(Doctor)
            .options(joinedload(Doctor.user))  # Загружаем связанные данные пользователя
            .where(Doctor.license_number == license_number)
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int) -> Doctor | None:
        stmt = select(Doctor).where(Doctor.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_valid_license(self, license_number: str) -> License | None:
        stmt = select(License).where(
            and_(License.license_number == license_number, License.is_valid.is_(True))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
