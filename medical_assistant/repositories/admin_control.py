from datetime import datetime, timezone
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.admin.admin_action import AdminAction
from medical_assistant.models.admin.license_proof import LicenseProof
from medical_assistant.models.admin.system_config import SystemConfig
from medical_assistant.models.auth.audit_log import AuditLog
from medical_assistant.models.medical.appointments import Appointment
from medical_assistant.models.patient.symptom_submission import SymptomSubmission
from medical_assistant.models.user.doctors import Doctor, DoctorVerificationStatus
from medical_assistant.models.user.specializations import Specialization
from medical_assistant.models.user.user import AccountStatus, User, UserRole


class AdminControlRepository:
    """Репозиторий для административной плоскости управления системой."""

    def __init__(self, session: AsyncSession):
        """Инициализирует репозиторий с активной сессией базы данных."""
        self.session = session

    async def list_users(self, role: UserRole | None = None, status: AccountStatus | None = None) -> list[User]:
        """Возвращает список пользователей с фильтрацией по роли и статусу."""
        stmt = select(User)
        if role:
            stmt = stmt.where(User.role == role)
        if status:
            stmt = stmt.where(User.status == status)
        result = await self.session.execute(stmt.order_by(User.created_at.desc()))
        return list(result.scalars().all())

    async def get_user(self, user_id: int) -> User | None:
        """Возвращает пользователя по идентификатору."""
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def update_user_role_status(
        self,
        user: User,
        *,
        role: UserRole | None = None,
        status: AccountStatus | None = None,
    ) -> User:
        """Обновляет роль и/или статус учетной записи пользователя."""
        if role is not None:
            user.role = role
        if status is not None:
            user.status = status
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def hard_delete_user(self, user_id: int) -> None:
        """Выполняет безвозвратное удаление учетной записи пользователя."""
        await self.session.execute(delete(User).where(User.id == user_id))
        await self.session.commit()

    async def create_admin_action(self, **data) -> AdminAction:
        """Фиксирует действие администратора в отдельном журнале."""
        item = AdminAction(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_pending_doctors(self) -> list[Doctor]:
        """Возвращает список врачей со статусом ожидания верификации."""
        result = await self.session.execute(
            select(Doctor).where(Doctor.verification_status == DoctorVerificationStatus.pending)
        )
        return list(result.scalars().all())

    async def set_doctor_verification_status(
        self,
        doctor: Doctor,
        status: DoctorVerificationStatus,
    ) -> Doctor:
        """Обновляет статус верификации врача и дату подтверждения."""
        doctor.verification_status = status
        doctor.verified_at = datetime.now(timezone.utc) if status == DoctorVerificationStatus.verified else None
        await self.session.commit()
        await self.session.refresh(doctor)
        return doctor

    async def get_doctor_by_id(self, doctor_id: int) -> Doctor | None:
        """Возвращает профиль врача по идентификатору."""
        result = await self.session.execute(select(Doctor).where(Doctor.id == doctor_id))
        return result.scalar_one_or_none()

    async def create_license_proof(self, **data) -> LicenseProof:
        """Создает запись о документе подтверждения лицензии врача."""
        item = LicenseProof(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def review_license_proof(self, proof: LicenseProof, reviewer_id: int, status_value: str) -> LicenseProof:
        """Проставляет статус проверки загруженного документа лицензии."""
        proof.reviewer_id = reviewer_id
        proof.status = status_value
        proof.review_date = datetime.now(timezone.utc)
        await self.session.commit()
        await self.session.refresh(proof)
        return proof

    async def get_license_proof(self, proof_id: int) -> LicenseProof | None:
        """Возвращает документ подтверждения лицензии по идентификатору."""
        result = await self.session.execute(select(LicenseProof).where(LicenseProof.id == proof_id))
        return result.scalar_one_or_none()

    async def list_license_proofs(self, doctor_id: int | None = None) -> list[LicenseProof]:
        """Возвращает список документов лицензий, опционально по конкретному врачу."""
        stmt = select(LicenseProof).order_by(LicenseProof.id.desc())
        if doctor_id is not None:
            stmt = stmt.where(LicenseProof.doctor_id == doctor_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_or_update_specialization(
        self,
        name: str,
        description: str | None,
        category: str | None,
    ) -> Specialization:
        """Создает или обновляет запись словаря медицинских специализаций."""
        result = await self.session.execute(select(Specialization).where(Specialization.name == name))
        item = result.scalar_one_or_none()
        if item:
            item.description = description
            item.category = category
        else:
            item = Specialization(name=name, description=description, category=category)
            self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_specializations(self) -> list[Specialization]:
        """Возвращает список специализаций для справочника платформы."""
        result = await self.session.execute(select(Specialization).order_by(Specialization.name.asc()))
        return list(result.scalars().all())

    async def create_or_update_system_config(self, key: str, value: str, description: str | None) -> SystemConfig:
        """Создает или обновляет системный параметр по ключу."""
        result = await self.session.execute(select(SystemConfig).where(SystemConfig.key == key))
        cfg = result.scalar_one_or_none()
        if cfg:
            cfg.value = value
            cfg.description = description
        else:
            cfg = SystemConfig(key=key, value=value, description=description)
            self.session.add(cfg)
        await self.session.commit()
        await self.session.refresh(cfg)
        return cfg

    async def list_system_configs(self) -> list[SystemConfig]:
        """Возвращает список всех системных параметров."""
        result = await self.session.execute(select(SystemConfig).order_by(SystemConfig.key.asc()))
        return list(result.scalars().all())

    async def search_audit_logs(self, action: str | None = None, entity_type: str | None = None) -> list[AuditLog]:
        """Возвращает глобальный аудит с фильтрацией по действию и типу сущности."""
        from medical_assistant.services.infrastructure.audit_service import AuditService

        service = AuditService(self.session)
        return await service.search(action=action, entity_type=entity_type)

    async def get_system_health_snapshot(self) -> dict:
        """Собирает базовые метрики здоровья API и очередей доменной логики."""
        users_count = await self.session.scalar(select(func.count(User.id)))
        pending_doctors = await self.session.scalar(
            select(func.count(Doctor.id)).where(Doctor.verification_status == DoctorVerificationStatus.pending)
        )
        complaint_queue = await self.session.scalar(
            select(func.count(SymptomSubmission.id)).where(SymptomSubmission.status == "processing")
        )
        active_appointments = await self.session.scalar(
            select(func.count(Appointment.id)).where(Appointment.status == "scheduled")
        )
        return {
            "users_total": int(users_count or 0),
            "pending_doctors": int(pending_doctors or 0),
            "processing_submissions": int(complaint_queue or 0),
            "scheduled_appointments": int(active_appointments or 0),
        }
