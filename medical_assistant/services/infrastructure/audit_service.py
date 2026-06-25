"""Сервис неизменяемого аудита безопасности и compliance."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.auth.audit_log import AuditLog
from medical_assistant.repositories.audit_log import AuditLogRepository


class AuditService:
    """
    Независимый слой аудита: только создание и чтение записей.

    Записи не предусматривают update/delete на уровне сервиса (иммутабельность).
    """

    def __init__(self, session: AsyncSession):
        """Инициализирует сервис сессией и репозиторием audit_logs."""
        self.session = session
        self.repo = AuditLogRepository(session)

    async def log(
        self,
        *,
        user_id: int | None,
        action: str,
        entity_type: str,
        entity_id: str,
    ) -> AuditLog:
        """Создаёт новую неизменяемую запись аудита."""
        return await self.repo.create(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
        )

    async def search(
        self,
        *,
        action: str | None = None,
        entity_type: str | None = None,
        user_id: int | None = None,
        limit: int = 200,
    ) -> list[AuditLog]:
        """Возвращает журнал аудита с фильтрами для административного просмотра."""
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
        if action:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
        if entity_type:
            stmt = stmt.where(AuditLog.entity_type == entity_type)
        if user_id is not None:
            stmt = stmt.where(AuditLog.user_id == user_id)
        stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
