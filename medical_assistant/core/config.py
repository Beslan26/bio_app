import os
from pathlib import Path
from pydantic import computed_field
from pydantic_settings import BaseSettings

# Абсолютный путь к корневой директории проекта
BASE_DIR = Path(__file__).resolve().parent.parent

# Путь к папке с CSV, XML и другими статическими данными
DATA_DIR = BASE_DIR / "apple_health_export"


class Settings(BaseSettings):
    # Раскомментируем атомарные переменные для базы данных
    # Pydantic автоматически приведет типы (например, port к int)
    postgres_server: str  # В .env это POSTGRES_SERVER
    postgres_port: int    # В .env это POSTGRES_PORT
    postgres_user: str    # В .env это POSTGRES_USER
    postgres_password: str  # В .env это POSTGRES_PASSWORD
    postgres_db: str      # В .env это POSTGRES_DB

    # Секреты для JWT (будут автоматически прочитаны из .env)
    jwt_secret_key: str
    jwt_algorithm: str

    # Инфраструктурные сервисы (раздел 7)
    storage_local_path: str | None = None
    ai_provider: str = "stub"  # stub | openai | gigachat | anthropic
    notification_provider: str = "console"  # console | sendgrid | twilio | firebase

    # ДИНАМИЧЕСКАЯ СБОРКА URL (ЧИСТАЯ АРХИТЕКТУРА)
    # Эти поля теперь вычисляются на лету, но для остальной программы они 
    # выглядят точно так же, как обычные строки settings.database_url_async
    @computed_field
    @property
    def database_url_async(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"

    @computed_field
    @property
    def database_url_sync(self) -> str:
        return f"postgresql+psycopg2://{self.postgres_user}:{self.postgres_password}@{self.postgres_server}:{self.postgres_port}/{self.postgres_db}"

    class Config:
        env_file = BASE_DIR / ".env"
        # Разрешаем Pydantic сопоставлять переменные без учета регистра (POSTGRES_USER -> postgres_user)
        case_sensitive = False


settings = Settings()
