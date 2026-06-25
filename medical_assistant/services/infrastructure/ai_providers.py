"""Подключаемые LLM/STT-провайдеры для AI-сервиса."""

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class StructuredComplaint:
    """Структурированный результат разбора жалобы пациента."""

    symptoms: list[str]
    duration: str | None
    intensity: str | None
    risk_factors: list[str]
    localization: str | None
    medical_summary: str
    patient_summary: str
    triage_level: str
    recommended_specialists: list[str]


class LLMProvider(ABC):
    """Контракт внешнего LLM-провайдера (OpenAI, GigaChat, Anthropic и т.д.)."""

    @abstractmethod
    async def analyze_complaint(self, text: str) -> StructuredComplaint:
        """Выполняет извлечение сущностей, суммаризацию и триаж по тексту жалобы."""


class StubLLMProvider(LLMProvider):
    """Заглушка LLM для разработки без внешнего API."""

    async def analyze_complaint(self, text: str) -> StructuredComplaint:
        """Возвращает детерминированный тестовый разбор на основе длины текста."""
        symptom_count = max(1, len(text.split()) // 5)
        triage = "red" if "боль в груди" in text.lower() else "yellow" if symptom_count > 5 else "green"
        return StructuredComplaint(
            symptoms=["усталость", "головная боль"] if symptom_count < 4 else ["слабость", "головная боль", "головокружение"],
            duration="2-3 дня",
            intensity="умеренная",
            risk_factors=[],
            localization="общее",
            medical_summary=f"Пациент сообщает: {text[:120]}...",
            patient_summary=f"Вы описали симптомы ({symptom_count} ключевых признаков).",
            triage_level=triage,
            recommended_specialists=["терапевт", "невролог", "кардиолог"][:symptom_count],
        )
