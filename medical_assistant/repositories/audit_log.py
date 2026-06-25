from medical_assistant.models.auth.audit_log import AuditLog
from sqlalchemy.ext.asyncio import AsyncSession


class AuditLogRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, **data) -> AuditLog:
        log_entry = AuditLog(**data)
        self.session.add(log_entry)
        await self.session.commit()
        await self.session.refresh(log_entry)
        return log_entry
