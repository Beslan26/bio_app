"""AI-сервис: STT, извлечение симптомов, триаж и подбор специалистов."""

from __future__ import annotations
from fastapi import UploadFile
import tempfile


from faster_whisper import WhisperModel

from medical_assistant.services.infrastructure.ai_providers import LLMProvider, StubLLMProvider, StructuredComplaint
from medical_assistant.services.infrastructure.base import TriageLevel


class AIService:
    """Оркестратор AI-функций с подключаемым LLM-провайдером."""

    def __init__(self, llm_provider: LLMProvider | None = None):
        """Инициализирует сервис; по умолчанию используется заглушка провайдера."""
        self.llm = llm_provider or StubLLMProvider()

    async def save_temporary_file(self, audio_file: UploadFile) -> str:
        audio_bytes = await audio_file.read()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        return temp_file_path

    async def transcribe_audio(self, audio_file: UploadFile) -> str:
        """
        Преобразует аудио в текст (STT).

        В продакшене здесь вызывается Whisper или аналог; сейчас — заглушка.
        """
        # del mime_type
        # if not audio_bytes:
        #     return ""
        # return "Пациент сообщает о слабости, головной боли и нарушении сна."
        model_name = 'base'
        audio_file_path = await self.save_temporary_file(audio_file)  # ошибка: Конструктор WhisperModel вызывается прямо внутри функции. Модель будет заново скачиваться/загружаться в память при каждом запросе.
        model = WhisperModel(model_size_or_path=model_name, device="cpu", compute_type="int8")
        segments, info = model.transcribe(audio=audio_file_path, language='ru', vad_filter=True)

        text_pieces = [segment.text for segment in segments]
        full_text = " ".join(text_pieces)

        print("Началось распознавание...") # поставить раньше

        return full_text

    async def extract_symptoms(self, text: str) -> list[str]:
        """Извлекает список симптомов из очищенного текста жалобы."""
        structured = await self.llm.analyze_complaint(text)
        return structured.symptoms

    async def analyze_complaint(self, text: str) -> StructuredComplaint:
        """Выполняет полный NLP-разбор жалобы для карточки и маршрутизации."""
        return await self.llm.analyze_complaint(text)

    async def calculate_triage(self, text: str) -> TriageLevel:
        """Рассчитывает уровень срочности (RED/YELLOW/GREEN) по тексту жалобы."""
        structured = await self.llm.analyze_complaint(text)
        return TriageLevel(structured.triage_level)

    async def match_specialists(self, text: str, limit: int = 3) -> list[str]:
        """Возвращает до limit рекомендованных специализаций на основе симптомов."""
        structured = await self.llm.analyze_complaint(text)
        return structured.recommended_specialists[:limit]

    def to_ai_results_json(self, structured: StructuredComplaint) -> dict:
        """Сериализует структурированный разбор в JSON для хранения в symptom_submissions."""
        return {
            "symptoms": structured.symptoms,
            "duration": structured.duration,
            "intensity": structured.intensity,
            "risk_factors": structured.risk_factors,
            "localization": structured.localization,
            "medical_summary": structured.medical_summary,
            "patient_summary": structured.patient_summary,
            "urgency": structured.triage_level,
            "recommended_specialists": structured.recommended_specialists,
        }
