from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

from medical_assistant.dependencies.repos import get_user_repo
from medical_assistant.services.token import decode_token
from medical_assistant.repositories.user import UserRepository
from medical_assistant.models.user.user import AccountStatus, UserRole

security = HTTPBearer()


async def get_current_user(
    credentials=Depends(security),
    users: UserRepository = Depends(get_user_repo),
):
    """
    Проверяет валидность токена и возвращает текущего пользователя.

    Аргументы:
        credentials: Учетные данные из заголовка Authorization (Bearer токен).
        users: Репозиторий для работы с таблицей пользователей.

    Возвращает:
        User: Объект активного пользователя из базы данных.

    Исключения:
        HTTPException: 401 Unauthorized, если токен невалиден, пользователь
        не найден или его учетная запись деактивирована.
    """
    try:
        payload = decode_token(credentials.credentials)
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    if payload.get("token_type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    user = await users.get_by_id(payload["user_id"])
    if not user or user.status != AccountStatus.active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED)

    return user


def require_roles(*roles: UserRole):
    async def _checker(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN)
        return user

    return _checker