from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File

from medical_assistant.dependencies.auth import require_roles
from medical_assistant.dependencies.repos import get_audit_log_repo, get_patient_workspace_repo
from medical_assistant.models.user.user import UserRole
from medical_assistant.repositories.audit_log import AuditLogRepository
from medical_assistant.repositories.patient_workspace import PatientWorkspaceRepository
from medical_assistant.schemas.patient_workspace import (
    ConsentCreateRequest,
    ConsentResponse,
    HealthSnapshotResponse,
    NotificationLogResponse,
    PatientDocumentCreateRequest,
    PatientDocumentResponse,
    PatientProfileResponse,
    PatientProfileUpdateRequest,
    PreferencesResponse,
    PreferencesUpdateRequest,
    SubmissionResponse,
    SubmissionTextRequest,
    TaskEntryCreateRequest,
    TaskEntryResponse,
    TaskEntryUpdateRequest,
    TaskItemResponse,
)
from medical_assistant.dependencies.infrastructure import get_ai_service, get_analytics_service
from medical_assistant.services.audit import log_action
from medical_assistant.services.infrastructure.ai_service import AIService
from medical_assistant.services.infrastructure.analytics_service import AnalyticsService

router = APIRouter(prefix="/patient/workspace", tags=["patient-workspace"])


async def _get_patient_context(
    current_user=Depends(require_roles(UserRole.patient)),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает связку пользователь+профиль пациента для личного кабинета."""
    patient = await workspace.get_patient_by_user_id(current_user.id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient profile not found")
    return current_user, patient


@router.get("/profile", response_model=PatientProfileResponse)
async def get_profile(ctx=Depends(_get_patient_context)):
    """Возвращает расширенный профиль пациента."""
    _, patient = ctx
    return PatientProfileResponse(
        id=patient.id,
        user_id=patient.user_id,
        full_name=patient.full_name,
        birth_date=patient.birth_date,
        gender=patient.gender,
        blood_type=patient.blood_type,
        contact_details=patient.contact_details,
        emergency_contact=patient.emergency_contact,
    )


@router.patch("/profile", response_model=PatientProfileResponse)
async def update_profile(
    payload: PatientProfileUpdateRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Обновляет контактные и медицинские данные анкеты пациента."""
    _, patient = ctx
    updated = await workspace.update_patient(patient, **payload.model_dump(exclude_unset=True))
    return PatientProfileResponse(
        id=updated.id,
        user_id=updated.user_id,
        full_name=updated.full_name,
        birth_date=updated.birth_date,
        gender=updated.gender,
        blood_type=updated.blood_type,
        contact_details=updated.contact_details,
        emergency_contact=updated.emergency_contact,
    )


@router.post("/consents", response_model=ConsentResponse)
async def sign_consent(
    payload: ConsentCreateRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Подписывает согласие пользователя и сохраняет версию документа."""
    user, _ = ctx
    item = await workspace.create_consent(
        user_id=user.id,
        consent_type=payload.consent_type,
        version=payload.version,
        ip_address=payload.ip_address,
        signed_at=datetime.now(timezone.utc),
    )
    return ConsentResponse(
        id=item.id,
        consent_type=item.consent_type,
        version=item.version,
        signed_at=item.signed_at,
        ip_address=item.ip_address,
    )


@router.get("/consents", response_model=list[ConsentResponse])
async def list_consents(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает историю подписанных юридических согласий."""
    user, _ = ctx
    items = await workspace.list_consents(user.id)
    return [
        ConsentResponse(
            id=item.id,
            consent_type=item.consent_type,
            version=item.version,
            signed_at=item.signed_at,
            ip_address=item.ip_address,
        )
        for item in items
    ]


@router.post("/submissions/text", response_model=SubmissionResponse)
async def submit_text_complaint(
    payload: SubmissionTextRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
    ai: AIService = Depends(get_ai_service),
):
    """Создает текстовую жалобу и прикладывает базовый AI-разбор симптомов."""
    _, patient = ctx
    structured = await ai.analyze_complaint(payload.raw_content)
    ai_results = ai.to_ai_results_json(structured)
    item = await workspace.create_submission(
        patient_id=patient.id,
        input_type="text",
        raw_content=payload.raw_content,
        transcription=None,
        ai_results_json=ai_results,
        status="processing",
    )
    return SubmissionResponse(
        id=item.id,
        input_type=item.input_type,
        raw_content=item.raw_content,
        transcription=item.transcription,
        ai_results_json=item.ai_results_json,
        status=item.status,
        created_at=item.created_at,
    )


@router.post("/submissions/voice", response_model=SubmissionResponse)
async def submit_voice_complaint(
    file: UploadFile = File(...),
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
    ai: AIService = Depends(get_ai_service),
):
    """Создает голосовую жалобу на основе загруженного аудиофайла."""
    _, patient = ctx
    audio_bytes = await file.read()
    transcription = await ai.transcribe_audio(audio_bytes)
    structured = await ai.analyze_complaint(transcription)
    ai_results = ai.to_ai_results_json(structured)
    item = await workspace.create_submission(
        patient_id=patient.id,
        input_type="audio",
        raw_content=transcription,
        audio_url=file.filename,
        transcription=transcription,
        ai_results_json=ai_results,
        status="processing",
    )
    return SubmissionResponse(
        id=item.id,
        input_type=item.input_type,
        raw_content=item.raw_content,
        transcription=item.transcription,
        ai_results_json=item.ai_results_json,
        status=item.status,
        created_at=item.created_at,
    )


@router.get("/submissions", response_model=list[SubmissionResponse])
async def list_submissions(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает историю поданных пациентом жалоб."""
    _, patient = ctx
    items = await workspace.list_submissions(patient.id)
    return [
        SubmissionResponse(
            id=item.id,
            input_type=item.input_type,
            raw_content=item.raw_content,
            transcription=item.transcription,
            ai_results_json=item.ai_results_json,
            status=item.status,
            created_at=item.created_at,
        )
        for item in items
    ]


@router.post("/documents", response_model=PatientDocumentResponse)
async def add_document(
    payload: PatientDocumentCreateRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Добавляет документ пациента в личный медицинский архив."""
    _, patient = ctx
    item = await workspace.create_document(
        patient_id=patient.id,
        title=payload.title,
        file_url=payload.file_url,
        category=payload.category,
    )
    return PatientDocumentResponse(
        id=item.id,
        title=item.title,
        file_url=item.file_url,
        category=item.category,
        created_at=item.created_at,
    )


@router.get("/documents", response_model=list[PatientDocumentResponse])
async def list_documents(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает документы пациента из PHR-хранилища."""
    _, patient = ctx
    items = await workspace.list_documents(patient.id)
    return [
        PatientDocumentResponse(
            id=item.id,
            title=item.title,
            file_url=item.file_url,
            category=item.category,
            created_at=item.created_at,
        )
        for item in items
    ]


@router.get("/timeline/diagnoses")
async def diagnoses_timeline(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает неизменяемую временную шкалу врачебных диагнозов."""
    _, patient = ctx
    return await workspace.list_diagnoses(patient.id)


@router.get("/tasks/active", response_model=list[TaskItemResponse])
async def active_tasks(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает активные задачи пациента на текущий день."""
    _, patient = ctx
    items = await workspace.list_active_tasks(patient.id)
    return [
        TaskItemResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            start_date=item.start_date,
            end_date=item.end_date,
        )
        for item in items
    ]


@router.post("/tasks/entries", response_model=TaskEntryResponse)
async def create_task_entry(
    payload: TaskEntryCreateRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Создает запись выполнения задачи с базовой валидацией значения."""
    _, _ = ctx
    item = await workspace.create_task_entry(
        task_id=payload.task_id,
        value=payload.value,
        patient_comment=payload.patient_comment,
        timestamp=datetime.now(timezone.utc),
        last_edited_at=None,
    )
    return TaskEntryResponse(
        id=item.id,
        task_id=item.task_id,
        value=item.value,
        patient_comment=item.patient_comment,
        timestamp=item.timestamp,
        last_edited_at=item.last_edited_at,
    )


@router.patch("/tasks/entries/{entry_id}", response_model=TaskEntryResponse)
async def update_task_entry(
    entry_id: int,
    payload: TaskEntryUpdateRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Редактирует запись задачи в пределах окна 24 часов."""
    del ctx
    entry = await workspace.get_task_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task entry not found")
    try:
        updated = await workspace.update_task_entry_with_window(
            entry=entry,
            value=payload.value,
            patient_comment=payload.patient_comment,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return TaskEntryResponse(
        id=updated.id,
        task_id=updated.task_id,
        value=updated.value,
        patient_comment=updated.patient_comment,
        timestamp=updated.timestamp,
        last_edited_at=updated.last_edited_at,
    )


@router.get("/health/snapshot", response_model=HealthSnapshotResponse | None)
async def get_health_snapshot(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
    analytics: AnalyticsService = Depends(get_analytics_service),
):
    """Строит и возвращает снимок персональных показателей по активным задачам."""
    _, patient = ctx
    dashboard = await analytics.build_patient_dashboard(patient.id)
    snapshot = await workspace.create_or_replace_snapshot(
        patient_id=patient.id,
        key_metrics_json=dashboard,
    )
    return HealthSnapshotResponse(
        id=snapshot.id,
        key_metrics_json=snapshot.key_metrics_json,
        generated_at=snapshot.generated_at,
    )


@router.get("/preferences", response_model=PreferencesResponse | None)
async def get_preferences(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает текущие настройки уведомлений пользователя."""
    user, _ = ctx
    pref = await workspace.get_preferences(user.id)
    if not pref:
        return None
    return PreferencesResponse(
        user_id=pref.user_id,
        enable_email=pref.enable_email,
        enable_push=pref.enable_push,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
    )


@router.put("/preferences", response_model=PreferencesResponse)
async def update_preferences(
    payload: PreferencesUpdateRequest,
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Создает или обновляет настройки каналов и тихих часов уведомлений."""
    user, _ = ctx
    pref = await workspace.upsert_preferences(user.id, **payload.model_dump(exclude_unset=True))
    return PreferencesResponse(
        user_id=pref.user_id,
        enable_email=pref.enable_email,
        enable_push=pref.enable_push,
        quiet_hours_start=pref.quiet_hours_start,
        quiet_hours_end=pref.quiet_hours_end,
    )


@router.get("/notifications/logs", response_model=list[NotificationLogResponse])
async def list_notification_logs(
    ctx=Depends(_get_patient_context),
    workspace: PatientWorkspaceRepository = Depends(get_patient_workspace_repo),
):
    """Возвращает журнал отправленных пациенту уведомлений."""
    user, _ = ctx
    items = await workspace.list_notification_logs(user.id)
    return [
        NotificationLogResponse(
            id=item.id,
            trigger_event=item.trigger_event,
            channel=item.channel,
            status=item.status,
            created_at=item.created_at,
        )
        for item in items
    ]


@router.post("/deactivate")
async def request_deactivation(
    ctx=Depends(_get_patient_context),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """Фиксирует запрос пациента на деактивацию аккаунта в аудите."""
    user, _ = ctx
    await log_action(
        audit_logs,
        user_id=user.id,
        action="patient_requested_deactivation",
        entity_type="user",
        entity_id=str(user.id),
    )
    return {"message": "Deactivation request has been logged"}
