"""Подключаемые провайдеры доставки уведомлений (Email, SMS, Push)."""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from medical_assistant.services.infrastructure.base import NotificationChannel


@dataclass
class DeliveryResult:
    """Результат попытки доставки сообщения через внешний канал."""

    success: bool
    provider_message_id: str | None = None
    error: str | None = None


class NotificationProvider(ABC):
    """Базовый контракт провайдера уведомлений."""

    channel: NotificationChannel

    @abstractmethod
    async def send(self, recipient: str, subject: str, body: str) -> DeliveryResult:
        """Отправляет сообщение получателю через конкретный канал."""


class ConsoleNotificationProvider(NotificationProvider):
    """Заглушка провайдера для локальной разработки без внешних API."""

    def __init__(self, channel: NotificationChannel):
        self.channel = channel

    async def send(self, recipient: str, subject: str, body: str) -> DeliveryResult:
        """Имитирует успешную доставку, записывая данные в stdout."""
        print(f"[{self.channel.value}] -> {recipient}: {subject}\n{body}")
        return DeliveryResult(success=True, provider_message_id=f"console-{self.channel.value}")
