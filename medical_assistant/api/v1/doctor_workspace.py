from fastapi import APIRouter, Depends, HTTPException, Query, status

from medical_assistant.dependencies.auth import require_roles
from medical_assistant.dependencies.repos import (
    get_audit_log_repo,
    get_doctor_workspace_repo,
)
from medical_assistant.models.medical.appointments import AppointmentStatus
from medical_assistant.models.medical.diagnoses import DiagnosisType
from medical_assistant.models.user.doctors import DoctorVerificationStatus
from medical_assistant.models.user.user import UserRole
from medical_assistant.repositories.audit_log import AuditLogRepository
from medical_assistant.repositories.doctor_workspace import DoctorWorkspaceRepository
from medical_assistant.schemas.doctor_workspace import (
    AppointmentCreateRequest,
    AppointmentResponse,
    DiagnosisCreateRequest,
    DiagnosisResponse,
    DoctorPatientItem,
    DoctorProfileResponse,
    DoctorProfileUpdateRequest,
    MessageResponse,
    SendMessageRequest,
    TaskCreateRequest,
    TaskResponse,
)
from medical_assistant.services.audit import log_action

router = APIRouter(prefix="/doctor/workspace", tags=["doctor-workspace"])


async def _get_verified_doctor(
    current_user=Depends(require_roles(UserRole.doctor)),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Проверяет, что врач существует и прошел верификацию для работы с пациентами."""
    doctor = await workspace.get_doctor_by_user_id(current_user.id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor profile not found")
    if doctor.verification_status != DoctorVerificationStatus.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor is not verified yet",
        )
    return doctor, current_user


@router.get("/profile", response_model=DoctorProfileResponse)
async def get_profile(doctor_context=Depends(_get_verified_doctor)):
    """Возвращает профиль верифицированного врача для дашборда."""
    doctor, _ = doctor_context
    return DoctorProfileResponse(
        id=doctor.id,
        license_number=doctor.license_number,
        specialty=doctor.specialty,
        verification_status=doctor.verification_status.value,
        verified_at=doctor.verified_at,
        bio=doctor.bio,
        work_hours=doctor.work_hours,
        contact_info=doctor.contact_info,
        sub_specializations=doctor.sub_specializations,
    )


@router.patch("/profile", response_model=DoctorProfileResponse)
async def update_profile(
    payload: DoctorProfileUpdateRequest,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Обновляет редактируемые поля профиля врача в рабочем пространстве."""
    doctor, _ = doctor_context
    updated = await workspace.update_doctor_profile(
        doctor,
        **payload.model_dump(exclude_unset=True),
    )
    return DoctorProfileResponse(
        id=updated.id,
        license_number=updated.license_number,
        specialty=updated.specialty,
        verification_status=updated.verification_status.value,
        verified_at=updated.verified_at,
        bio=updated.bio,
        work_hours=updated.work_hours,
        contact_info=updated.contact_info,
        sub_specializations=updated.sub_specializations,
    )


@router.get("/patients/active", response_model=list[DoctorPatientItem])
async def list_active_patients(
    q: str | None = Query(default=None),
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Возвращает активных пациентов врача или результаты поиска по email."""
    doctor, _ = doctor_context
    patients = await (workspace.list_patients_by_query(q) if q else workspace.list_active_patients(doctor.id))
    return [
        DoctorPatientItem(
            id=item.id,
            user_id=item.user_id,
            birth_date=item.birth_date,
            sex=item.sex.value if item.sex else None,
        )
        for item in patients
    ]


@router.get("/complaints/inbox")
async def complaints_inbox(
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Возвращает входящую очередь жалоб для первичного клинического разбора."""
    del doctor_context
    items = await workspace.list_inbox_complaints()
    return items


@router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(
    payload: AppointmentCreateRequest,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """Создает запись приема в календаре врача."""
    doctor, current_user = doctor_context
    if payload.end_time <= payload.start_time:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid appointment range")

    item = await workspace.create_appointment(
        doctor_id=doctor.id,
        patient_id=payload.patient_id,
        complaint_id=payload.complaint_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=AppointmentStatus.scheduled,
        patient_priority=payload.patient_priority,
        notes=payload.notes,
    )
    await log_action(
        audit_logs,
        user_id=current_user.id,
        action="appointment_created",
        entity_type="appointment",
        entity_id=str(item.id),
    )
    return AppointmentResponse(
        id=item.id,
        doctor_id=item.doctor_id,
        patient_id=item.patient_id,
        complaint_id=item.complaint_id,
        start_time=item.start_time,
        end_time=item.end_time,
        status=item.status.value,
        patient_priority=item.patient_priority,
        notes=item.notes,
    )


@router.get("/appointments", response_model=list[AppointmentResponse])
async def list_appointments(
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Возвращает календарь приемов врача с ближайших дат."""
    doctor, _ = doctor_context
    items = await workspace.list_appointments(doctor.id)
    return [
        AppointmentResponse(
            id=item.id,
            doctor_id=item.doctor_id,
            patient_id=item.patient_id,
            complaint_id=item.complaint_id,
            start_time=item.start_time,
            end_time=item.end_time,
            status=item.status.value,
            patient_priority=item.patient_priority,
            notes=item.notes,
        )
        for item in items
    ]


@router.post("/diagnoses", response_model=DiagnosisResponse)
async def create_diagnosis(
    payload: DiagnosisCreateRequest,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Создает предварительный или финальный диагноз с клиническими заметками."""
    doctor, _ = doctor_context
    try:
        diagnosis_type = DiagnosisType(payload.type)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid diagnosis type") from exc

    item = await workspace.create_diagnosis(
        doctor_id=doctor.id,
        patient_id=payload.patient_id,
        diagnosis_text=payload.diagnosis_text,
        icd_code=payload.icd_code,
        type=diagnosis_type,
        consultation_notes=payload.consultation_notes,
        recommendation=payload.recommendation,
    )
    return DiagnosisResponse(
        id=item.id,
        doctor_id=item.doctor_id,
        patient_id=item.patient_id,
        diagnosis_text=item.diagnosis_text,
        icd_code=item.icd_code,
        type=item.type.value,
        consultation_notes=item.consultation_notes,
        recommendation=item.recommendation,
        created_at=item.created_at,
    )


@router.get("/diagnoses/{patient_id}", response_model=list[DiagnosisResponse])
async def list_diagnoses(
    patient_id: int,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Возвращает историю диагнозов пациента для продвинутого клинического просмотра."""
    del doctor_context
    items = await workspace.list_diagnoses(patient_id)
    return [
        DiagnosisResponse(
            id=item.id,
            doctor_id=item.doctor_id,
            patient_id=item.patient_id,
            diagnosis_text=item.diagnosis_text,
            icd_code=item.icd_code,
            type=item.type.value,
            consultation_notes=item.consultation_notes,
            recommendation=item.recommendation,
            created_at=item.created_at,
        )
        for item in items
    ]


@router.post("/tasks", response_model=TaskResponse)
async def create_task(
    payload: TaskCreateRequest,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Создает задачу наблюдения за пациентом в рамках плана лечения."""
    doctor, _ = doctor_context
    if payload.end_date < payload.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid task schedule")
    task = await workspace.create_task(
        doctor_id=doctor.id,
        patient_id=payload.patient_id,
        title=payload.title,
        description=payload.description,
        start_date=payload.start_date,
        end_date=payload.end_date,
    )
    return TaskResponse(
        id=task.id,
        doctor_id=task.doctor_id,
        patient_id=task.patient_id,
        title=task.title,
        description=task.description,
        start_date=task.start_date,
        end_date=task.end_date,
    )


@router.get("/tasks", response_model=list[TaskResponse])
async def list_tasks(
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Возвращает список задач-трекеров, созданных текущим врачом."""
    doctor, _ = doctor_context
    items = await workspace.list_tasks(doctor.id)
    return [
        TaskResponse(
            id=item.id,
            doctor_id=item.doctor_id,
            patient_id=item.patient_id,
            title=item.title,
            description=item.description,
            start_date=item.start_date,
            end_date=item.end_date,
        )
        for item in items
    ]


@router.post("/messages", response_model=MessageResponse)
async def send_message(
    payload: SendMessageRequest,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Отправляет сообщение врачу в защищенный чат с пациентом."""
    doctor, current_user = doctor_context
    thread = await workspace.get_or_create_thread(doctor.id, payload.patient_id)
    message = await workspace.create_message(
        thread_id=thread.id,
        sender_id=current_user.id,
        role="doctor",
        content=payload.content,
        is_read=False,
        message_metadata=payload.metadata,
    )
    return MessageResponse(
        id=message.id,
        thread_id=message.thread_id,
        sender_id=message.sender_id,
        role=message.role,
        content=message.content,
        is_read=message.is_read,
        metadata=message.message_metadata,
        created_at=message.created_at,
    )


@router.get("/messages/{patient_id}", response_model=list[MessageResponse])
async def list_messages(
    patient_id: int,
    doctor_context=Depends(_get_verified_doctor),
    workspace: DoctorWorkspaceRepository = Depends(get_doctor_workspace_repo),
):
    """Возвращает историю чата врача с конкретным пациентом."""
    doctor, _ = doctor_context
    thread = await workspace.get_or_create_thread(doctor.id, patient_id)
    items = await workspace.list_messages(thread.id)
    return [
        MessageResponse(
            id=item.id,
            thread_id=item.thread_id,
            sender_id=item.sender_id,
            role=item.role,
            content=item.content,
            is_read=item.is_read,
            metadata=item.message_metadata,
            created_at=item.created_at,
        )
        for item in items
    ]
