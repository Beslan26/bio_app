from fastapi import APIRouter, Depends, HTTPException, Query, status

from medical_assistant.dependencies.auth import require_roles
from medical_assistant.dependencies.repos import get_admin_control_repo, get_audit_log_repo
from medical_assistant.models.user.doctors import DoctorVerificationStatus
from medical_assistant.models.user.user import AccountStatus, UserRole
from medical_assistant.repositories.admin_control import AdminControlRepository
from medical_assistant.repositories.audit_log import AuditLogRepository
from medical_assistant.schemas.admin_control import (
    AdminUserResponse,
    AdminUserUpdateRequest,
    AuditLogResponse,
    DoctorItemResponse,
    DoctorVerificationRequest,
    LicenseProofCreateRequest,
    LicenseProofResponse,
    LicenseProofReviewRequest,
    SpecializationResponse,
    SpecializationUpsertRequest,
    SystemConfigResponse,
    SystemConfigUpsertRequest,
)
from medical_assistant.services.audit import log_action

router = APIRouter(prefix="/admin/control", tags=["admin-control"])


@router.get("/users", response_model=list[AdminUserResponse])
async def list_users(
    role: str | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Возвращает каталог пользователей с фильтрами по роли и статусу."""
    del current_admin
    role_enum = UserRole(role) if role else None
    status_enum = AccountStatus(status_value) if status_value else None
    items = await admin_repo.list_users(role=role_enum, status=status_enum)
    return [
        AdminUserResponse(
            id=item.id,
            email=item.email,
            role=item.role.value,
            status=item.status.value,
            created_at=item.created_at,
            last_login=item.last_login,
        )
        for item in items
    ]


@router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def update_user_access(
    user_id: int,
    payload: AdminUserUpdateRequest,
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """Обновляет роль/статус пользователя и пишет действие в аудит."""
    user = await admin_repo.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    role_enum = UserRole(payload.role) if payload.role else None
    status_enum = AccountStatus(payload.status) if payload.status else None
    updated = await admin_repo.update_user_role_status(user, role=role_enum, status=status_enum)
    await admin_repo.create_admin_action(
        admin_id=current_admin.id,
        target_user_id=updated.id,
        action_type="user_access_updated",
        reason=payload.reason,
    )
    await log_action(
        audit_logs,
        user_id=current_admin.id,
        action="admin_updated_user_access",
        entity_type="user",
        entity_id=str(updated.id),
    )
    return AdminUserResponse(
        id=updated.id,
        email=updated.email,
        role=updated.role.value,
        status=updated.status.value,
        created_at=updated.created_at,
        last_login=updated.last_login,
    )


@router.delete("/users/{user_id}")
async def hard_delete_user(
    user_id: int,
    reason: str | None = Query(default=None),
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """Выполняет hard delete пользователя по GDPR-запросу."""
    user = await admin_repo.get_user(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    await admin_repo.hard_delete_user(user_id)
    await admin_repo.create_admin_action(
        admin_id=current_admin.id,
        target_user_id=user_id,
        action_type="user_hard_deleted",
        reason=reason,
    )
    await log_action(
        audit_logs,
        user_id=current_admin.id,
        action="admin_hard_deleted_user",
        entity_type="user",
        entity_id=str(user_id),
    )
    return {"message": "User was permanently deleted"}


@router.get("/doctors/pending", response_model=list[DoctorItemResponse])
async def list_pending_doctors(
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Возвращает врачей, ожидающих подтверждения лицензии."""
    del current_admin
    items = await admin_repo.list_pending_doctors()
    return [
        DoctorItemResponse(
            id=item.id,
            user_id=item.user_id,
            license_number=item.license_number,
            specialty=item.specialty,
            verification_status=item.verification_status.value,
            verified_at=item.verified_at,
        )
        for item in items
    ]


@router.post("/doctors/{doctor_id}/verification", response_model=DoctorItemResponse)
async def verify_doctor(
    doctor_id: int,
    payload: DoctorVerificationRequest,
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """Меняет статус верификации врача по решению администратора."""
    doctor = await admin_repo.get_doctor_by_id(doctor_id)
    if not doctor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Doctor not found")

    try:
        new_status = DoctorVerificationStatus(payload.status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification status") from exc

    updated = await admin_repo.set_doctor_verification_status(doctor, new_status)
    await admin_repo.create_admin_action(
        admin_id=current_admin.id,
        target_user_id=updated.user_id,
        action_type="doctor_verification_updated",
        reason=payload.reason,
    )
    await log_action(
        audit_logs,
        user_id=current_admin.id,
        action="admin_updated_doctor_verification",
        entity_type="doctor",
        entity_id=str(updated.id),
    )
    return DoctorItemResponse(
        id=updated.id,
        user_id=updated.user_id,
        license_number=updated.license_number,
        specialty=updated.specialty,
        verification_status=updated.verification_status.value,
        verified_at=updated.verified_at,
    )


@router.post("/license-proofs", response_model=LicenseProofResponse)
async def create_license_proof(
    payload: LicenseProofCreateRequest,
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Добавляет документ подтверждения лицензии в административный контур."""
    del current_admin
    item = await admin_repo.create_license_proof(
        doctor_id=payload.doctor_id,
        file_url=payload.file_url,
        status="valid",
    )
    return LicenseProofResponse(
        id=item.id,
        doctor_id=item.doctor_id,
        file_url=item.file_url,
        status=item.status,
        reviewer_id=item.reviewer_id,
        review_date=item.review_date,
    )


@router.post("/license-proofs/{proof_id}/review", response_model=LicenseProofResponse)
async def review_license_proof(
    proof_id: int,
    payload: LicenseProofReviewRequest,
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Проверяет и утверждает/отклоняет документ подтверждения лицензии."""
    proof = await admin_repo.get_license_proof(proof_id)
    if not proof:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="License proof not found")
    if payload.status not in {"valid", "invalid"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid review status")
    updated = await admin_repo.review_license_proof(proof, current_admin.id, payload.status)
    return LicenseProofResponse(
        id=updated.id,
        doctor_id=updated.doctor_id,
        file_url=updated.file_url,
        status=updated.status,
        reviewer_id=updated.reviewer_id,
        review_date=updated.review_date,
    )


@router.get("/license-proofs", response_model=list[LicenseProofResponse])
async def list_license_proofs(
    doctor_id: int | None = Query(default=None),
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Возвращает список загруженных документов лицензий врачей."""
    del current_admin
    items = await admin_repo.list_license_proofs(doctor_id=doctor_id)
    return [
        LicenseProofResponse(
            id=item.id,
            doctor_id=item.doctor_id,
            file_url=item.file_url,
            status=item.status,
            reviewer_id=item.reviewer_id,
            review_date=item.review_date,
        )
        for item in items
    ]


@router.put("/specializations", response_model=SpecializationResponse)
async def upsert_specialization(
    payload: SpecializationUpsertRequest,
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Создает или обновляет элемент словаря медицинских специализаций."""
    del current_admin
    item = await admin_repo.create_or_update_specialization(
        name=payload.name,
        description=payload.description,
        category=payload.category,
    )
    return SpecializationResponse(
        id=item.id,
        name=item.name,
        description=item.description,
        category=item.category,
    )


@router.get("/specializations", response_model=list[SpecializationResponse])
async def list_specializations(
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Возвращает словарь медицинских специализаций платформы."""
    del current_admin
    items = await admin_repo.list_specializations()
    return [
        SpecializationResponse(
            id=item.id,
            name=item.name,
            description=item.description,
            category=item.category,
        )
        for item in items
    ]


@router.put("/system-configs", response_model=SystemConfigResponse)
async def upsert_system_config(
    payload: SystemConfigUpsertRequest,
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Создает или обновляет системный параметр и мастер-данные."""
    del current_admin
    item = await admin_repo.create_or_update_system_config(
        key=payload.key,
        value=payload.value,
        description=payload.description,
    )
    return SystemConfigResponse(
        id=item.id,
        key=item.key,
        value=item.value,
        description=item.description,
        created_at=item.created_at,
    )


@router.get("/system-configs", response_model=list[SystemConfigResponse])
async def list_system_configs(
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Возвращает все системные параметры контрольной плоскости."""
    del current_admin
    items = await admin_repo.list_system_configs()
    return [
        SystemConfigResponse(
            id=item.id,
            key=item.key,
            value=item.value,
            description=item.description,
            created_at=item.created_at,
        )
        for item in items
    ]


@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def search_audit_logs(
    action: str | None = Query(default=None),
    entity_type: str | None = Query(default=None),
    current_admin=Depends(require_roles(UserRole.admin)),
    admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
):
    """Возвращает глобальный аудит с фильтрацией для compliance-анализа."""
    del current_admin
    items = await admin_repo.search_audit_logs(action=action, entity_type=entity_type)
    return [
        AuditLogResponse(
            id=item.id,
            user_id=item.user_id,
            action=item.action,
            entity_type=item.entity_type,
            entity_id=item.entity_id,
            created_at=item.created_at,
        )
        for item in items
    ]


    @router.get("/health")
    async def get_control_plane_health(
        current_admin=Depends(require_roles(UserRole.admin)),
        admin_repo: AdminControlRepository = Depends(get_admin_control_repo),
    ):
        """Возвращает базовые метрики состояния системы для админ-дашборда."""
        del current_admin
        return await admin_repo.get_system_health_snapshot()
