from datetime import datetime, timezone
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.auth.password_reset import PasswordResetToken


class PasswordResetRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, **data) -> PasswordResetToken:
        token = PasswordResetToken(**data)
        self.session.add(token)
        await self.session.commit()
        await self.session.refresh(token)
        return token

    async def get_valid_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.expires_at > datetime.now(timezone.utc),
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete_by_hash(self, token_hash: str) -> None:
        stmt = delete(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        await self.session.execute(stmt)
        await self.session.commit()
