from datetime import datetime
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.communication.chat import ChatMessage, CommunicationThread
from medical_assistant.models.medical.appointments import Appointment
from medical_assistant.models.medical.complaints import Complaint
from medical_assistant.models.medical.diagnoses import Diagnosis
from medical_assistant.models.tasks.tasks import Task
from medical_assistant.models.user.doctors import Doctor
from medical_assistant.models.user.licenses import License
from medical_assistant.models.user.patients import Patient
from medical_assistant.models.user.user import User


class DoctorWorkspaceRepository:
    """Репозиторий клинического рабочего пространства врача."""

    def __init__(self, session: AsyncSession):
        """Инициализирует репозиторий асинхронной сессией БД."""
        self.session = session

    async def get_doctor_by_user_id(self, user_id: int) -> Doctor | None:
        """Возвращает профиль врача по идентификатору пользователя."""
        result = await self.session.execute(select(Doctor).where(Doctor.user_id == user_id))
        return result.scalar_one_or_none()

    async def get_valid_license(self, license_number: str) -> License | None:
        """Проверяет наличие и валидность лицензии врача во внутреннем реестре."""
        result = await self.session.execute(
            select(License).where(
                and_(License.license_number == license_number, License.is_valid.is_(True))
            )
        )
        return result.scalar_one_or_none()

    async def update_doctor_profile(self, doctor: Doctor, **data) -> Doctor:
        """Обновляет редактируемые поля профиля врача."""
        for key, value in data.items():
            setattr(doctor, key, value)
        await self.session.commit()
        await self.session.refresh(doctor)
        return doctor

    async def list_active_patients(self, doctor_id: int) -> list[Patient]:
        """Возвращает пациентов, у которых есть активные назначения от врача."""
        stmt = (
            select(Patient)
            .join(Task, Task.patient_id == Patient.id)
            .where(Task.doctor_id == doctor_id, Task.end_date >= datetime.utcnow().date())
            .distinct()
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def list_inbox_complaints(self, limit: int = 50) -> list[Complaint]:
        """Возвращает очередь новых жалоб пациентов для первичного разбора."""
        stmt = select(Complaint).order_by(Complaint.created_at.desc()).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create_appointment(self, **data) -> Appointment:
        """Создает прием в календаре врача."""
        item = Appointment(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_appointments(self, doctor_id: int) -> list[Appointment]:
        """Возвращает список приемов врача, начиная с ближайших."""
        result = await self.session.execute(
            select(Appointment)
            .where(Appointment.doctor_id == doctor_id)
            .order_by(Appointment.start_time.asc())
        )
        return list(result.scalars().all())

    async def create_diagnosis(self, **data) -> Diagnosis:
        """Создает клиническую запись диагноза."""
        item = Diagnosis(**data)
        self.session.add(item)
        await self.session.commit()
        await self.session.refresh(item)
        return item

    async def list_diagnoses(self, patient_id: int) -> list[Diagnosis]:
        """Возвращает историю диагнозов пациента."""
        result = await self.session.execute(
            select(Diagnosis)
            .where(Diagnosis.patient_id == patient_id)
            .order_by(Diagnosis.created_at.desc())
        )
        return list(result.scalars().all())

    async def create_task(self, **data) -> Task:
        """Создает задачу-трекер для пациента."""
        task = Task(**data)
        self.session.add(task)
        await self.session.commit()
        await self.session.refresh(task)
        return task

    async def list_tasks(self, doctor_id: int) -> list[Task]:
        """Возвращает задачи, созданные конкретным врачом."""
        result = await self.session.execute(
            select(Task).where(Task.doctor_id == doctor_id).order_by(Task.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_or_create_thread(self, doctor_id: int, patient_id: int) -> CommunicationThread:
        """Находит чат врача с пациентом или создает новый диалог."""
        result = await self.session.execute(
            select(CommunicationThread).where(
                CommunicationThread.doctor_id == doctor_id,
                CommunicationThread.patient_id == patient_id,
            )
        )
        thread = result.scalar_one_or_none()
        if thread:
            return thread

        thread = CommunicationThread(doctor_id=doctor_id, patient_id=patient_id, last_message_at=datetime.utcnow())
        self.session.add(thread)
        await self.session.commit()
        await self.session.refresh(thread)
        return thread

    async def create_message(self, **data) -> ChatMessage:
        """Создает сообщение в диалоге врача и пациента."""
        message = ChatMessage(**data)
        self.session.add(message)
        await self.session.commit()
        await self.session.refresh(message)
        return message

    async def list_messages(self, thread_id: int) -> list[ChatMessage]:
        """Возвращает сообщения диалога в хронологическом порядке."""
        result = await self.session.execute(
            select(ChatMessage)
            .where(ChatMessage.thread_id == thread_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return list(result.scalars().all())

    async def list_patients_by_query(self, query: str) -> list[Patient]:
        """Ищет пациентов по email пользователя для фильтрации списка врача."""
        stmt = (
            select(Patient)
            .join(User, User.id == Patient.user_id)
            .where(User.email.ilike(f"%{query}%"))
            .limit(50)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
