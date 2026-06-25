from medical_assistant.services.infrastructure.ai_service import AIService

_ai_service = AIService()


async def extract_medical_facts(text: str) -> list[str]:
    """Извлекает симптомы через AIService (обратная совместимость для существующих роутов)."""
    return await _ai_service.extract_symptoms(text)