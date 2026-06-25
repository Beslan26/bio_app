from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from medical_assistant.repositories.user import UserRepository
from medical_assistant.dependencies.db import get_db


async def get_user_repository(
    session: AsyncSession = Depends(get_db)
) -> UserRepository:
    return UserRepository(session)