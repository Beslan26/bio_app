from datetime import date, datetime
from pydantic import BaseModel, Field


class DoctorProfileUpdateRequest(BaseModel):
    """Запрос на обновление редактируемой части профиля врача."""

    bio: str | None = None
    work_hours: str | None = None
    contact_info: str | None = None
    sub_specializations: str | None = None


class DoctorProfileResponse(BaseModel):
    """Публичная модель профиля врача для рабочего кабинета."""

    id: int
    license_number: str
    specialty: str
    verification_status: str
    verified_at: datetime | None = None
    bio: str | None = None
    work_hours: str | None = None
    contact_info: str | None = None
    sub_specializations: str | None = None


class DoctorPatientItem(BaseModel):
    """Краткая карточка пациента в списке врача."""

    id: int
    user_id: int
    birth_date: date | None = None
    sex: str | None = None


class AppointmentCreateRequest(BaseModel):
    """Запрос на создание нового приема."""

    patient_id: int
    complaint_id: int | None = None
    start_time: datetime
    end_time: datetime
    patient_priority: int | None = Field(default=None, ge=1, le=10)
    notes: str | None = None


class AppointmentResponse(BaseModel):
    """Ответ с данными календарного приема."""

    id: int
    doctor_id: int
    patient_id: int
    complaint_id: int | None = None
    start_time: datetime
    end_time: datetime
    status: str
    patient_priority: int | None = None
    notes: str | None = None


class DiagnosisCreateRequest(BaseModel):
    """Запрос на создание диагноза и клинической заметки."""

    patient_id: int
    diagnosis_text: str
    icd_code: str | None = None
    type: str = "preliminary"
    consultation_notes: str | None = None
    recommendation: str | None = None


class DiagnosisResponse(BaseModel):
    """Ответ с диагностической записью врача."""

    id: int
    doctor_id: int
    patient_id: int
    diagnosis_text: str
    icd_code: str | None = None
    type: str
    consultation_notes: str | None = None
    recommendation: str | None = None
    created_at: datetime


class TaskCreateRequest(BaseModel):
    """Запрос на создание задачи-трекера для пациента."""

    patient_id: int
    title: str
    description: str
    start_date: date
    end_date: date


class TaskResponse(BaseModel):
    """Ответ с описанием задачи врача для пациента."""

    id: int
    doctor_id: int
    patient_id: int
    title: str
    description: str
    start_date: date
    end_date: date


class SendMessageRequest(BaseModel):
    """Запрос на отправку сообщения врачу в чат пациента."""

    patient_id: int
    content: str
    metadata: dict | None = None


class MessageResponse(BaseModel):
    """Ответ с отправленным или прочитанным сообщением чата."""

    id: int
    thread_id: int
    sender_id: int
    role: str
    content: str
    is_read: bool
    metadata: dict | None = None
    created_at: datetime
