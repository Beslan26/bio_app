from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.user.user import User, AccountStatus


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: int) -> User | None:
        stmt = select(User).where(User.id == user_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_active_by_id(self, user_id: int) -> User | None:
        stmt = select(User).where(
            User.id == user_id,
            User.status == AccountStatus.active,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(self, **data) -> User:
        user = User(**data)
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_last_login(self, user_id: int) -> None:
        user = await self.get_by_id(user_id)
        if not user:
            return
        user.last_login = datetime.now(timezone.utc)
        await self.session.commit()

    async def update_password(self, user_id: int, password_hash: str) -> None:
        user = await self.get_by_id(user_id)
        if not user:
            return
        user.password_hash = password_hash
        await self.session.commit()