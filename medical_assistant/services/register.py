from fastapi import HTTPException

from medical_assistant.models.user.user import UserRole, AccountStatus
from medical_assistant.repositories.doctor import DoctorRepository
from medical_assistant.schemas.auth import RegisterRequest
from medical_assistant.repositories.user import UserRepository
from medical_assistant.repositories.patient import PatientRepository
from medical_assistant.utils.password import hash_password


async def register_user(
    data: RegisterRequest,
    users: UserRepository,
    patients: PatientRepository,
):
    # Проверяем email
    if await users.get_by_email(data.email):
        raise HTTPException(status_code=409, detail="Email already exists")

    # Создаем пользователя
    user = await users.create(
        email=data.email,
        password_hash=hash_password(data.password),
        role=UserRole.patient,
        status=AccountStatus.active,
    )

    # Создаем профиль пациента
    await patients.create(user_id=user.id)

    return user
