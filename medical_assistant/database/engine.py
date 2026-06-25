from medical_assistant.core.config import settings
from sqlalchemy.ext.asyncio import create_async_engine


engine = create_async_engine(settings.database_url_async)