"""Сервис безопасной загрузки и выдачи файлов с валидацией типа и размера."""

from __future__ import annotations

from pathlib import Path

from medical_assistant.core.config import BASE_DIR
from medical_assistant.services.infrastructure.storage_providers import LocalStorageProvider, StorageProvider, StoredObject


ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
}
ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB по спецификации DMS


class FileStorageService:
    """Валидация, загрузка и выдача signed URL для медицинских документов."""

    def __init__(self, provider: StorageProvider | None = None):
        """Инициализирует сервис с провайдером хранилища (по умолчанию — локальный каталог)."""
        default_base = BASE_DIR / "storage"
        self.provider = provider or LocalStorageProvider(default_base)

    def validate_upload(self, filename: str, content_type: str, size_bytes: int) -> None:
        """
        Проверяет допустимость загружаемого файла.

        Raises:
            ValueError: если тип, расширение или размер не соответствуют политике.
        """
        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise ValueError(f"Unsupported file extension: {ext}")
        if content_type not in ALLOWED_CONTENT_TYPES:
            raise ValueError(f"Unsupported content type: {content_type}")
        if size_bytes > MAX_FILE_SIZE_BYTES:
            raise ValueError(f"File exceeds maximum size of {MAX_FILE_SIZE_BYTES} bytes")

    async def upload(
        self,
        *,
        key: str,
        data: bytes,
        filename: str,
        content_type: str,
    ) -> StoredObject:
        """Валидирует и сохраняет файл, возвращая метаданные объекта."""
        self.validate_upload(filename, content_type, len(data))
        return await self.provider.put(key, data, content_type)

    async def get_download_url(self, key: str, expires_seconds: int = 3600) -> str:
        """Возвращает подписанный URL для скачивания объекта."""
        return await self.provider.generate_signed_url(key, expires_seconds)
