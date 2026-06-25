from pydantic import BaseModel, Field


class GlobalSearchRequest(BaseModel):
    """Запрос объединённого поиска по платформе."""

    query: str = Field(min_length=1)
    symptom_tag: str | None = None
    verification_status: str | None = None
    urgency: str | None = None


class GlobalSearchResponse(BaseModel):
    """Ответ с результатами поиска по пациентам, врачам и истории."""

    patients: list[dict]
    doctors: list[dict]
    medical_history: list[dict]


class FileUploadResponse(BaseModel):
    """Ответ после успешной загрузки файла в хранилище."""

    key: str
    path: str
    size_bytes: int
    download_url: str


class NotifyRequest(BaseModel):
    """Запрос на немедленную отправку уведомления."""

    user_id: int
    channel: str
    recipient: str
    template_key: str
    context: dict[str, str] = Field(default_factory=dict)
    trigger_event: str
