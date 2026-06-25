from medical_assistant.models.user.user import UserRole, AccountStatus
from medical_assistant.utils.password import hash_password


async def create_doctor_by_admin(
    password: str,
    license_number: str,
    sex: str,
    specialty: str,
    users,
    doctors,
):
    """Создает учетную запись врача с обязательной проверкой лицензии."""
    license_row = await doctors.get_valid_license(license_number)
    if not license_row:
        raise ValueError("License is invalid or not found")

    user = await users.create(
        password_hash=hash_password(password),
        role=UserRole.doctor,
        status=AccountStatus.active,
    )

    await doctors.create(
        user_id=user.id,
        license_number=license_number,
        sex=sex,
        specialty=specialty,
        verified=False,
    )

    return user
