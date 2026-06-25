import os
from pathlib import Path
from pydantic_settings import BaseSettings

# Абсолютный путь к корневой директории проекта
BASE_DIR = Path(__file__).resolve().parent.parent

# Путь к папке с CSV, XML и другими статическими данными
DATA_DIR = BASE_DIR / "apple_health_export"


class Settings(BaseSettings):
    # postgres_db: str
    # postgres_user: str
    # postgres_password: str
    # postgres_host: str
    # postgres_port: int
    database_url_async: str    # для работы с записями бд
    database_url_sync: str     # для Alembic

    jwt_secret_key: str
    jwt_algorithm: str
    # jwt_access_token_minutes: int
    # jwt_refresh_token_days: int

    # Инфраструктурные сервисы (раздел 7)
    storage_local_path: str | None = None
    ai_provider: str = "stub"  # stub | openai | gigachat | anthropic
    notification_provider: str = "console"  # console | sendgrid | twilio | firebase

    class Config:
        env_file = BASE_DIR / ".env"


settings = Settings()