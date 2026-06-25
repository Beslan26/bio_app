from datetime import datetime, timedelta, timezone
from medical_assistant.core.config import settings
from jose import jwt

SECRET_KEY = settings.jwt_secret_key
ALGORITHM = settings.jwt_algorithm


def create_access_token(data: dict, minutes: int = 15) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=minutes)
    payload["token_type"] = "access"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict, days: int = 7) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=days)
    payload["token_type"] = "refresh"
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])