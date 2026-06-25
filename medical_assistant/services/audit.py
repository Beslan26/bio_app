from medical_assistant.repositories.audit_log import AuditLogRepository
from medical_assistant.services.infrastructure.audit_service import AuditService


async def log_action(
    audit_logs: AuditLogRepository,
    *,
    user_id: int | None,
    action: str,
    entity_type: str,
    entity_id: str,
) -> None:
    """Делегирует запись аудита в AuditService (неизменяемый журнал)."""
    service = AuditService(audit_logs.session)
    await service.log(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    )
