from datetime import date, datetime, time
from pydantic import BaseModel


class PatientProfileUpdateRequest(BaseModel):
    """Запрос на обновление анкеты пациента и контактных данных."""

    full_name: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    blood_type: str | None = None
    contact_details: str | None = None
    emergency_contact: str | None = None


class PatientProfileResponse(BaseModel):
    """Ответ с профилем пациента для личного кабинета."""

    id: int
    user_id: int
    full_name: str | None = None
    birth_date: date | None = None
    gender: str | None = None
    blood_type: str | None = None
    contact_details: str | None = None
    emergency_contact: str | None = None


class ConsentCreateRequest(BaseModel):
    """Запрос на фиксацию согласия по версии юридического текста."""

    consent_type: str
    version: str
    ip_address: str | None = None


class ConsentResponse(BaseModel):
    """Ответ с записью согласия пользователя."""

    id: int
    consent_type: str
    version: str
    signed_at: datetime
    ip_address: str | None = None


class SubmissionTextRequest(BaseModel):
    """Запрос на отправку текстовой жалобы пациента."""

    raw_content: str


class SubmissionResponse(BaseModel):
    """Ответ с карточкой отправленной жалобы."""

    id: int
    input_type: str
    raw_content: str
    transcription: str | None = None
    ai_results_json: dict | None = None
    status: str
    created_at: datetime


class PatientDocumentCreateRequest(BaseModel):
    """Запрос на добавление документа в PHR-хранилище."""

    title: str
    file_url: str
    category: str | None = None


class PatientDocumentResponse(BaseModel):
    """Ответ с карточкой документа пациента."""

    id: int
    title: str
    file_url: str
    category: str | None = None
    created_at: datetime


class TaskEntryCreateRequest(BaseModel):
    """Запрос на создание записи выполнения задачи."""

    task_id: int
    value: str
    patient_comment: str | None = None


class TaskEntryUpdateRequest(BaseModel):
    """Запрос на обновление записи выполнения задачи в допустимое окно."""

    value: str
    patient_comment: str | None = None


class TaskEntryResponse(BaseModel):
    """Ответ с данными записи выполнения задачи."""

    id: int
    task_id: int
    value: str
    patient_comment: str | None = None
    timestamp: datetime
    last_edited_at: datetime | None = None


class TaskItemResponse(BaseModel):
    """Краткая карточка активной задачи пациента."""

    id: int
    title: str
    description: str
    start_date: date
    end_date: date


class HealthSnapshotResponse(BaseModel):
    """Ответ со снимком агрегированных медицинских показателей."""

    id: int
    key_metrics_json: dict
    generated_at: datetime


class PreferencesUpdateRequest(BaseModel):
    """Запрос на обновление пользовательских настроек уведомлений."""

    enable_email: bool | None = None
    enable_push: bool | None = None
    quiet_hours_start: time | None = None
    quiet_hours_end: time | None = None


class PreferencesResponse(BaseModel):
    """Ответ с текущими настройками уведомлений пользователя."""

    user_id: int
    enable_email: bool
    enable_push: bool
    quiet_hours_start: time | None = None
    quiet_hours_end: time | None = None


class NotificationLogResponse(BaseModel):
    """Ответ с записью журнала уведомлений пользователя."""

    id: int
    trigger_event: str
    channel: str
    status: str
    created_at: datetime
