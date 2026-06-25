from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from medical_assistant.dependencies.db import get_db
from medical_assistant.repositories.user import UserRepository
from medical_assistant.repositories.patient import PatientRepository
from medical_assistant.repositories.doctor import DoctorRepository
from medical_assistant.repositories.complaint import ComplaintRepository
from medical_assistant.repositories.audit_log import AuditLogRepository
from medical_assistant.repositories.doctor_workspace import DoctorWorkspaceRepository
from medical_assistant.repositories.password_reset import PasswordResetRepository
from medical_assistant.repositories.patient_workspace import PatientWorkspaceRepository
from medical_assistant.repositories.admin_control import AdminControlRepository

"""
Модуль провайдеров репозиториев (Dependency Injection).

Этот модуль содержит функции-зависимости (dependencies) для FastAPI, которые:
1. Извлекают сессию базы данных из контекста запроса через `get_db`.
2. Инициализируют соответствующие репозитории этой сессией.
3. Предоставляют готовые интерфейсы для работы с данными в эндпоинтах.

Это позволяет изолировать логику работы с БД от роутеров и упрощает тестирование.
"""


async def get_user_repo(session: AsyncSession = Depends(get_db)):
    return UserRepository(session)


async def get_patient_repo(session: AsyncSession = Depends(get_db)):
    return PatientRepository(session)


async def get_doctor_repo(session: AsyncSession = Depends(get_db)):
    return DoctorRepository(session)


async def get_complaint_repo(session: AsyncSession = Depends(get_db)):
    return ComplaintRepository(session)


async def get_audit_log_repo(session: AsyncSession = Depends(get_db)):
    return AuditLogRepository(session)


async def get_password_reset_repo(session: AsyncSession = Depends(get_db)):
    return PasswordResetRepository(session)


async def get_doctor_workspace_repo(session: AsyncSession = Depends(get_db)):
    return DoctorWorkspaceRepository(session)


async def get_patient_workspace_repo(session: AsyncSession = Depends(get_db)):
    return PatientWorkspaceRepository(session)


async def get_admin_control_repo(session: AsyncSession = Depends(get_db)):
    return AdminControlRepository(session)