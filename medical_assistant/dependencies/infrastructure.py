"""DI-провайдеры инфраструктурных сервисов для FastAPI."""

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.dependencies.db import get_db
from medical_assistant.services.infrastructure import (
    AIService,
    AnalyticsService,
    AuditService,
    FileStorageService,
    NotificationService,
    SearchService,
)


def get_ai_service() -> AIService:
    """Возвращает singleton-подобный экземпляр AI-сервиса без сессии БД."""
    return AIService()


async def get_notification_service(session: AsyncSession = Depends(get_db)) -> NotificationService:
    """Создаёт сервис уведомлений, привязанный к сессии текущего запроса."""
    return NotificationService(session)


async def get_storage_service() -> FileStorageService:
    """Возвращает сервис файлового хранилища."""
    return FileStorageService()


async def get_analytics_service(session: AsyncSession = Depends(get_db)) -> AnalyticsService:
    """Создаёт сервис аналитики для агрегации метрик пациента."""
    return AnalyticsService(session)


async def get_search_service(session: AsyncSession = Depends(get_db)) -> SearchService:
    """Создаёт сервис поиска по медицинским и пользовательским сущностям."""
    return SearchService(session)


async def get_audit_service(session: AsyncSession = Depends(get_db)) -> AuditService:
    """Создаёт сервис неизменяемого аудита."""
    return AuditService(session)
