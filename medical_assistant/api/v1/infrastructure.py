"""API-обёртки над инфраструктурными helper-сервисами (раздел 7 SPEC)."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from medical_assistant.dependencies.auth import get_current_user, require_roles
from medical_assistant.dependencies.infrastructure import (
    get_ai_service,
    get_analytics_service,
    get_audit_service,
    get_notification_service,
    get_search_service,
    get_storage_service,
)
from medical_assistant.models.user.doctors import DoctorVerificationStatus
from medical_assistant.models.user.user import UserRole
from medical_assistant.schemas.infrastructure import (
    FileUploadResponse,
    GlobalSearchRequest,
    GlobalSearchResponse,
    NotifyRequest,
)
from medical_assistant.services.infrastructure import AIService
from medical_assistant.services.infrastructure.analytics_service import AnalyticsService
from medical_assistant.services.infrastructure.audit_service import AuditService
from medical_assistant.services.infrastructure.base import NotificationChannel
from medical_assistant.services.infrastructure.notification_service import NotificationService
from medical_assistant.services.infrastructure.search_service import SearchService
from medical_assistant.services.infrastructure.storage_service import FileStorageService

router = APIRouter(prefix="/infrastructure", tags=["infrastructure"])


@router.get("/health")
async def infrastructure_health():
    """Базовая проверка доступности инфраструктурного слоя."""
    return {"status": "ok", "services": ["notification", "ai", "storage", "analytics", "search", "audit"]}


@router.post("/search", response_model=GlobalSearchResponse)
async def global_search(
    payload: GlobalSearchRequest,
    _user=Depends(require_roles(UserRole.admin, UserRole.doctor)),
    search: SearchService = Depends(get_search_service),
):
    """Объединённый поиск по пациентам, врачам и медицинской истории."""
    verification = None
    if payload.verification_status:
        try:
            verification = DoctorVerificationStatus(payload.verification_status)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification_status") from exc

    result = await search.global_search(
        payload.query,
        symptom_tag=payload.symptom_tag,
        verification_status=verification,
        urgency=payload.urgency,
    )
    return GlobalSearchResponse(**result)


@router.get("/analytics/patient/{patient_id}")
async def patient_analytics(
    patient_id: int,
    user=Depends(get_current_user),
    analytics: AnalyticsService = Depends(get_analytics_service),
):
    """Возвращает агрегированные данные для графиков PHR пациента."""
    if user.role not in (UserRole.patient, UserRole.doctor, UserRole.admin):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
    return await analytics.build_patient_dashboard(patient_id)


@router.post("/files/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    _user=Depends(get_current_user),
    storage: FileStorageService = Depends(get_storage_service),
):
    """Загружает медицинский файл с валидацией типа и размера."""
    data = await file.read()
    content_type = file.content_type or "application/octet-stream"
    try:
        stored = await storage.upload(
            key=file.filename,
            data=data,
            filename=file.filename,
            content_type=content_type,
        )
        url = await storage.get_download_url(stored.key)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return FileUploadResponse(
        key=stored.key,
        path=stored.path,
        size_bytes=stored.size_bytes,
        download_url=url,
    )


@router.post("/notifications/send")
async def send_notification(
    payload: NotifyRequest,
    _admin=Depends(require_roles(UserRole.admin)),
    notifications: NotificationService = Depends(get_notification_service),
):
    """Отправляет уведомление по шаблону (административный/системный контур)."""
    del _admin
    try:
        channel = NotificationChannel(payload.channel)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid channel") from exc

    body = notifications.render_template(payload.template_key, payload.context)
    log = await notifications.send_now(
        user_id=payload.user_id,
        channel=channel,
        recipient=payload.recipient,
        subject=payload.template_key,
        body=body,
        trigger_event=payload.trigger_event,
    )
    return {"notification_log_id": log.id, "status": log.status}


@router.get("/audit")
async def search_audit(
    action: str | None = None,
    entity_type: str | None = None,
    user_id: int | None = None,
    _admin=Depends(require_roles(UserRole.admin)),
    audit: AuditService = Depends(get_audit_service),
):
    """Поиск по глобальному журналу аудита (только для администратора)."""
    del _admin
    items = await audit.search(action=action, entity_type=entity_type, user_id=user_id)
    return [
        {
            "id": i.id,
            "user_id": i.user_id,
            "action": i.action,
            "entity_type": i.entity_type,
            "entity_id": i.entity_id,
            "created_at": i.created_at,
        }
        for i in items
    ]


@router.post("/ai/analyze")
async def analyze_text(
    text: str,
    _user=Depends(get_current_user),
    ai: AIService = Depends(get_ai_service),
):
    """Выполняет AI-разбор текста жалобы (симптомы, триаж, специалисты)."""
    structured = await ai.analyze_complaint(text)
    return ai.to_ai_results_json(structured)
