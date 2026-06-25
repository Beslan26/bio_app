from datetime import datetime
from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    """Модель пользователя для административного каталога."""

    id: int
    email: str | None = None
    role: str
    status: str
    created_at: datetime
    last_login: datetime | None = None


class AdminUserUpdateRequest(BaseModel):
    """Запрос на обновление роли и/или статуса пользователя."""

    role: str | None = None
    status: str | None = None
    reason: str | None = None


class DoctorVerificationRequest(BaseModel):
    """Запрос на смену статуса верификации врача."""

    status: str
    reason: str | None = None


class DoctorItemResponse(BaseModel):
    """Краткая карточка врача в административной верификации."""

    id: int
    user_id: int
    license_number: str
    specialty: str
    verification_status: str
    verified_at: datetime | None = None


class LicenseProofCreateRequest(BaseModel):
    """Запрос на добавление подтверждающего документа лицензии."""

    doctor_id: int
    file_url: str


class LicenseProofReviewRequest(BaseModel):
    """Запрос на проверку документа лицензии администратором."""

    status: str


class LicenseProofResponse(BaseModel):
    """Ответ с карточкой документа подтверждения лицензии."""

    id: int
    doctor_id: int
    file_url: str
    status: str
    reviewer_id: int | None = None
    review_date: datetime | None = None


class SpecializationUpsertRequest(BaseModel):
    """Запрос на создание или обновление медицинской специализации."""

    name: str
    description: str | None = None
    category: str | None = None


class SpecializationResponse(BaseModel):
    """Ответ со значением словаря медицинских специализаций."""

    id: int
    name: str
    description: str | None = None
    category: str | None = None


class SystemConfigUpsertRequest(BaseModel):
    """Запрос на создание или обновление системного параметра."""

    key: str
    value: str
    description: str | None = None


class SystemConfigResponse(BaseModel):
    """Ответ с системной конфигурацией платформы."""

    id: int
    key: str
    value: str
    description: str | None = None
    created_at: datetime


class AuditLogResponse(BaseModel):
    """Ответ с записью глобального журнала аудита."""

    id: int
    user_id: int | None = None
    action: str
    entity_type: str
    entity_id: str
    created_at: datetime
