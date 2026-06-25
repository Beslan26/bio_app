from datetime import datetime, timedelta, timezone
import hashlib
import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, Request, status

from medical_assistant.dependencies.repos import (
    get_user_repo,
    get_patient_repo,
    get_doctor_repo,
    get_audit_log_repo,
    get_password_reset_repo,
)
from medical_assistant.models.user.user import UserRole, AccountStatus
from medical_assistant.models.user.doctors import DoctorVerificationStatus
from medical_assistant.schemas.auth import (
    RegisterRequest,
    RegisterResponse,
    LoginRequest,
    UserResponse,
    DoctorLoginRequest,
    CreateDoctorRequest,
    RefreshTokenRequest,
    PasswordRecoveryRequest,
    PasswordRecoveryConfirm,
)
from medical_assistant.repositories.user import UserRepository
from medical_assistant.repositories.patient import PatientRepository
from medical_assistant.repositories.doctor import DoctorRepository
from medical_assistant.repositories.audit_log import AuditLogRepository
from medical_assistant.repositories.password_reset import PasswordResetRepository
from medical_assistant.services.doctor_register import create_doctor_by_admin
from medical_assistant.utils.password import hash_password, verify_password
from medical_assistant.services.token import create_access_token, create_refresh_token, decode_token
from medical_assistant.services.register import register_user
from medical_assistant.services.audit import log_action
from medical_assistant.dependencies.auth import get_current_user, require_roles


router = APIRouter(prefix="/auth", tags=["auth"])


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    """
    Устанавливает Refresh Token в HTTP-only куки.

    Args:
        response: Объект ответа FastAPI.
        refresh_token: Строка токена для обновления access-токена.
    """
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 60 * 60,
    )


@router.post("/register", response_model=RegisterResponse)
async def register(
    data: RegisterRequest,
    response: Response,
    users: UserRepository = Depends(get_user_repo),
    patients: PatientRepository = Depends(get_patient_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    user = await register_user(data, users, patients)
    access_token = create_access_token({"user_id": user.id, "role": user.role.value})
    refresh_token = create_refresh_token({"user_id": user.id, "role": user.role.value})
    _set_refresh_cookie(response, refresh_token)
    await log_action(
        audit_logs,
        user_id=user.id,
        action="user_registered",
        entity_type="user",
        entity_id=str(user.id),
    )

    return RegisterResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            role=user.role.value,
            status=user.status.value,
            last_login=user.last_login,
        ),
    )


@router.post("/login")
async def login(
    data: LoginRequest,
    response: Response,
    users: UserRepository = Depends(get_user_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    user = await users.get_by_email(data.email)

    if not user or user.role not in [UserRole.patient, UserRole.admin]:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)
    if user.status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN)

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    await users.update_last_login(user.id)
    access_token = create_access_token({"user_id": user.id, "role": user.role.value})
    refresh_token = create_refresh_token({"user_id": user.id, "role": user.role.value})
    _set_refresh_cookie(response, refresh_token)
    await log_action(
        audit_logs,
        user_id=user.id,
        action="user_logged_in",
        entity_type="user",
        entity_id=str(user.id),
    )

    return {
        "access_token": access_token,
        "user": {"id": user.id, "role": user.role.value},
    }


@router.post("/admin/create-doctor")
async def create_doctor(
    data: CreateDoctorRequest,
    current_user=Depends(require_roles(UserRole.admin)),
    users: UserRepository = Depends(get_user_repo),
    doctors: DoctorRepository = Depends(get_doctor_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    try:
        doctor_user = await create_doctor_by_admin(
            password=data.password,
            license_number=data.license_number,
            sex=data.sex,
            specialty=data.specialty,
            users=users,
            doctors=doctors,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    await log_action(
        audit_logs,
        user_id=current_user.id,
        action="doctor_created_by_admin",
        entity_type="user",
        entity_id=str(doctor_user.id),
    )

    return {"id": doctor_user.id}


@router.post("/doctor/login")
async def doctor_login(
    data: DoctorLoginRequest,
    response: Response,
    doctors: DoctorRepository = Depends(get_doctor_repo),
    users: UserRepository = Depends(get_user_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    doctor = await doctors.get_by_license(data.license_number)

    if not doctor or doctor.verification_status != DoctorVerificationStatus.verified:
        raise HTTPException(status.HTTP_403_FORBIDDEN)

    user = await users.get_by_id(doctor.user_id)
    if not user or user.status != AccountStatus.active:
        raise HTTPException(status.HTTP_403_FORBIDDEN)
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    await users.update_last_login(user.id)
    access_token = create_access_token({"user_id": user.id, "role": user.role.value})
    refresh_token = create_refresh_token({"user_id": user.id, "role": user.role.value})
    _set_refresh_cookie(response, refresh_token)
    await log_action(
        audit_logs,
        user_id=user.id,
        action="doctor_logged_in",
        entity_type="user",
        entity_id=str(user.id),
    )

    return {
        "access_token": access_token,
        "user": {"id": user.id, "role": user.role.value},
    }


@router.post("/refresh")
async def refresh_tokens(
    request: Request,
    response: Response,
    data: RefreshTokenRequest | None = None,
    users: UserRepository = Depends(get_user_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """
    Обновляет пару токенов (Access и Refresh) для пользователя.

    Логика работы:
    1. Извлекает refresh_token из тела запроса (JSON) или из куки 'refresh_token'.
    2. Валидирует токен и проверяет его тип (должен быть 'refresh').
    3. Проверяет существование и активность пользователя в базе данных.
    4. Генерирует новую пару токенов (механизм ротации).
    5. Перезаписывает новую куку и логирует действие в системе аудита.

    Returns:
        dict: Новый access_token в формате JSON.
        Cookie: Новый refresh_token устанавливается в заголовках ответа.

    Raises:
        HTTPException: 401 Unauthorized, если токен отсутствует, невалиден
                       или пользователь не найден.
    """
    refresh_token = (data.refresh_token if data else None) or request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    try:
        payload = decode_token(refresh_token)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    if payload.get("token_type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    user = await users.get_active_by_id(payload["user_id"])
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    access_token = create_access_token({"user_id": user.id, "role": user.role.value})
    new_refresh_token = create_refresh_token({"user_id": user.id, "role": user.role.value})
    _set_refresh_cookie(response, new_refresh_token)
    await log_action(
        audit_logs,
        user_id=user.id,
        action="refresh_token_rotated",
        entity_type="user",
        entity_id=str(user.id),
    )
    return {"access_token": access_token}


@router.post("/password-recovery/request")
async def request_password_recovery(
    data: PasswordRecoveryRequest,
    reset_repo: PasswordResetRepository = Depends(get_password_reset_repo),
    users: UserRepository = Depends(get_user_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """
    Инициирует процесс восстановления пароля.

    Логика работы:
    1. Ищет пользователя по email.
    2. Если пользователь найден:
       - Генерирует криптографически стойкий токен (secrets.token_urlsafe).
       - Сохраняет SHA-256 хеш токена в БД (срок действия 30 минут).
       - Логирует запрос в аудит-логах.
    3. Возвращает одинаковый ответ вне зависимости от того, найден email или нет.

    Безопасность:
    - Предотвращает перебор email-адресов (всегда возвращает успех).
    - В БД хранится только хеш токена, что защищает от компрометации в случае утечки данных.

    Returns:
        dict: Сообщение об успешной генерации инструкций.
    """
    user = await users.get_by_email(data.email)
    if user:
        raw_token = secrets.token_urlsafe(32)
        token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
        await reset_repo.create(user_id=user.id, token_hash=token_hash, expires_at=expires_at)
        await log_action(
            audit_logs,
            user_id=user.id,
            action="password_recovery_requested",
            entity_type="user",
            entity_id=str(user.id),
        )
        return {"message": "If account exists, reset instructions were generated.", "reset_token": raw_token}

    return {"message": "If account exists, reset instructions were generated."}


@router.post("/password-recovery/confirm")
async def confirm_password_recovery(
    data: PasswordRecoveryConfirm,
    reset_repo: PasswordResetRepository = Depends(get_password_reset_repo),
    users: UserRepository = Depends(get_user_repo),
    audit_logs: AuditLogRepository = Depends(get_audit_log_repo),
):
    """
    Завершает процесс восстановления пароля с использованием токена.

    Логика работы:
    1. Хеширует полученный токен для поиска в базе данных.
    2. Проверяет существование токена и его срок годности (get_valid_by_hash).
    3. При успехе:
       - Обновляет пароль пользователя (предварительно хешируя его).
       - Удаляет использованный токен из базы (делает его одноразовым).
       - Логирует событие успешной смены пароля.

    Безопасность:
    - Сравнение токенов происходит через хеши, что защищает от утечек из БД.
    - Токен немедленно удаляется после использования, предотвращая повторные атаки (Replay Attack).

    Raises:
        HTTPException: 400 Bad Request, если токен не найден, невалиден или просрочен.

    Returns:
        dict: Сообщение об успешном обновлении пароля.
    """
    token_hash = hashlib.sha256(data.token.encode()).hexdigest()
    token_row = await reset_repo.get_valid_by_hash(token_hash)
    if not token_row:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset token")

    await users.update_password(token_row.user_id, hash_password(data.new_password))
    await reset_repo.delete_by_hash(token_hash)
    await log_action(
        audit_logs,
        user_id=token_row.user_id,
        action="password_recovered",
        entity_type="user",
        entity_id=str(token_row.user_id),
    )
    return {"message": "Password updated successfully"}


@router.get("/me")
async def me(
        patients: Annotated[PatientRepository, Depends(get_patient_repo)],
        doctors: Annotated[DoctorRepository, Depends(get_doctor_repo)],
        user=Depends(get_current_user),
):
    if user.role == UserRole.patient:
        profile = await patients.get_by_user_id(user.id)
    else:
        profile = await doctors.get_by_user_id(user.id)

    return {
        "id": user.id,
        "role": user.role.value,
        "status": user.status.value,
        "last_login": user.last_login,
        "profile": profile,
    }
