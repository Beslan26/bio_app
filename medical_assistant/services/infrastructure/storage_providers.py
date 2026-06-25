"""Подключаемые провайдеры файлового хранилища."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
import hashlib
import secrets


@dataclass
class StoredObject:
    """Метаданные объекта, сохранённого в хранилище."""

    key: str
    path: str
    size_bytes: int


class StorageProvider(ABC):
    """Контракт провайдера объектного хранилища (S3, GCS, Supabase и т.д.)."""

    @abstractmethod
    async def put(self, key: str, data: bytes, content_type: str) -> StoredObject:
        """Сохраняет бинарные данные по ключу."""

    @abstractmethod
    async def generate_signed_url(self, key: str, expires_seconds: int = 3600) -> str:
        """Возвращает подписанный URL для безопасного скачивания."""


class LocalStorageProvider(StorageProvider):
    """Локальное файловое хранилище для разработки."""

    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.base_dir.mkdir(parents=True, exist_ok=True)

    async def put(self, key: str, data: bytes, content_type: str) -> StoredObject:
        """Записывает файл на диск в каталог base_dir."""
        del content_type
        target = self.base_dir / key
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        return StoredObject(key=key, path=str(target), size_bytes=len(data))

    async def generate_signed_url(self, key: str, expires_seconds: int = 3600) -> str:
        """Формирует псевдо-подписанный URL с токеном для локального доступа."""
        token = hashlib.sha256(f"{key}:{expires_seconds}:{secrets.token_hex(8)}".encode()).hexdigest()[:32]
        return f"/api/v1/infrastructure/files/{key}?token={token}&expires={expires_seconds}"
