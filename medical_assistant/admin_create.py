import asyncio
from sqlalchemy.future import select

# 1. Пропишите импорты из вашего проекта (замените 'app' на ваше название папки)
from medical_assistant.database.session import AsyncSessionLocal  # или как у вас импортируется сессия
from medical_assistant.models.user.user import User, UserRole
from medical_assistant.repositories.admin_control import AdminControlRepository  # файл, где лежит admin_repo


async def main():
    # Укажите email аккаунта, которому вы хотите выдать админа
    my_email = "admin@example.com"

    async with AsyncSessionLocal() as session:
        # 1. Ищем вас в базе данных
        query = select(User).where(User.email == my_email)
        result = await session.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            print(f"Пользователь {my_email} не найден! Сначала зарегистрируйтесь в системе.")
            return

        print(f"Найден пользователь: {user.email}. Текущая роль: {user.role}")

        # 2. Инициализируем ваш репозиторий напрямую
        admin_repo = AdminControlRepository(session)

        # 3. Вызываем встроенную функцию обновления роли
        print("Принудительно меняем роль на admin...")
        updated = await admin_repo.update_user_role_status(user, role=UserRole.admin)

        print(f"Успех! Теперь ваша роль в базе данных: {updated.role}")


if __name__ == "__main__":
    asyncio.run(main())
