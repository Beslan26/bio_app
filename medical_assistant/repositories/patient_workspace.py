from datetime import datetime, timedelta, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.medical.diagnoses import Diagnosis
from medical_assistant.models.patient.consents import Consent
from medical_assistant.models.patient.health_snapshot import HealthSnapshot
from medical_assistant.models.patient.notification_log import NotificationLog
from medical_assistant.models.patient.patient_document import PatientDocument
from medical_assistant.models.patient.symptom_submission import SymptomSubmission
from medical_assistant.models.patient.user_preferences import UserPreferences
from medical_assistant.models.tasks.task_entries import TaskEntry
from medical_assistant.models.tasks.tasks import Task
from medical_assistant.models.user.patients import Patient


class PatientWorkspaceRepository:
    """Репозиторий пользовательского пространства пациента."""

    def __init__(self, session: AsyncSession):
        """Инициализирует репозиторий асинхронной сессией SQLAlchemy."""
        self.session = session

    async def get_patient_by_user_id(self, user_id: int) -> Patient | None:
        """Возвращает профиль пациента по идентификатору пользователя."""
        result = await self.session.execute(select(Patient).where(Patient.user_id == user_id))
        return result.scalar_one_or_none()

    async def update_patient(self, patient: Patient, **data) -> Patient:
        """Обновляет редактируемые поля анкеты пациента."""
        for key, value in data.items():
            setattr(patient, key, value)
        await self.session.commit()
        await self.session.refresh(patient)
        return patient

    async def create_consent(self, **data) -> Consent:
        """Создает запись о подписанном согласии."""
        item = Consent(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_consents(self, user_id: int) -> list[Consent]:
        """Возвращает историю подписанных согласий пользователя."""
        result = await self.session.execute(
            select(Consent).where(Consent.user_id == user_id).order_by(Consent.signed_at.desc())
        )
        return list(result.scalars().all())

    async def create_submission(self, **data) -> SymptomSubmission:
        """Сохраняет новую жалобу пациента для обработки AI."""
        item = SymptomSubmission(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_submissions(self, patient_id: int) -> list[SymptomSubmission]:
        """Возвращает историю жалоб пациента."""
        result = await self.session.execute(
            select(SymptomSubmission)
            .where(SymptomSubmission.patient_id == patient_id)
            .order_by(SymptomSubmission.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_document(self, **data) -> PatientDocument:
        """Добавляет документ в персональное хранилище пациента."""
        item = PatientDocument(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_documents(self, patient_id: int) -> list[PatientDocument]:
        """Возвращает документы пациента в обратной хронологии."""
        result = await self.session.execute(
            select(PatientDocument)
            .where(PatientDocument.patient_id == patient_id)
            .order_by(PatientDocument.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_diagnoses(self, patient_id: int) -> list[Diagnosis]:
        """Возвращает неизменяемые врачебные диагнозы пациента."""
        result = await self.session.execute(
            select(Diagnosis).where(Diagnosis.patient_id == patient_id).order_by(Diagnosis.created_at.desc())
        )
        return list(result.scalars().all())

    async def list_active_tasks(self, patient_id: int) -> list[Task]:
        """Возвращает активные задачи пациента на текущую дату."""
        today = datetime.now(timezone.utc).date()
        result = await self.session.execute(
            select(Task).where(Task.patient_id == patient_id, Task.start_date <= today, Task.end_date >= today)
        )
        return list(result.scalars().all())

    async def create_task_entry(self, **data) -> TaskEntry:
        """Создает запись выполнения задачи пациентом."""
        item = TaskEntry(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get_task_entry(self, entry_id: int) -> TaskEntry | None:
        """Возвращает запись выполнения по ее идентификатору."""
        result = await self.session.execute(select(TaskEntry).where(TaskEntry.id == entry_id))
        return result.scalar_one_or_none()

    async def update_task_entry_with_window(self, entry: TaskEntry, value: str, patient_comment: str | None) -> TaskEntry:
        """Обновляет запись задачи, если не истекло 24 часа с момента создания."""
        now = datetime.now(timezone.utc)
        if entry.timestamp.tzinfo is None:
            created_time = entry.timestamp.replace(tzinfo=timezone.utc)
        else:
            created_time = entry.timestamp
        if now - created_time > timedelta(hours=24):
            raise ValueError("Editing window has expired")
        entry.value = value
        entry.patient_comment = patient_comment
        entry.last_edited_at = now
        await self.session.commit()
        await self.session.refresh(entry)
        return entry

    async def create_or_replace_snapshot(self, patient_id: int, key_metrics_json: dict) -> HealthSnapshot:
        """Создает новый снимок метрик пациента для быстрого дашборда."""
        item = HealthSnapshot(
            patient_id=patient_id,
            key_metrics_json=key_metrics_json,
            generated_at=datetime.now(timezone.utc),
        )
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def get_preferences(self, user_id: int) -> UserPreferences | None:
        """Возвращает настройки уведомлений пользователя."""
        result = await self.session.execute(select(UserPreferences).where(UserPreferences.user_id == user_id))
        return result.scalar_one_or_none()

    async def upsert_preferences(self, user_id: int, **data) -> UserPreferences:
        """Создает или обновляет настройки уведомлений пользователя."""
        existing = await self.get_preferences(user_id)
        if existing:
            for key, value in data.items():
                setattr(existing, key, value)
            await self.session.commit()
            await self.session.refresh(existing)
            return existing

        item = UserPreferences(user_id=user_id, **data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def create_notification_log(self, **data) -> NotificationLog:
        """Создает запись журнала уведомлений."""
        item = NotificationLog(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_notification_logs(self, user_id: int) -> list[NotificationLog]:
        """Возвращает историю уведомлений пользователя."""
        result = await self.session.execute(
            select(NotificationLog).where(NotificationLog.user_id == user_id).order_by(NotificationLog.created_at.desc())
        )
        return list(result.scalars().all())
