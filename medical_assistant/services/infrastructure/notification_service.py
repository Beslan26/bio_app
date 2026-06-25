"""Сервис уведомлений: очередь, шаблоны и мультиканальная доставка."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from string import Template

from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.patient.notification_log import NotificationLog
from medical_assistant.services.infrastructure.base import DeliveryStatus, NotificationChannel
from medical_assistant.services.infrastructure.notification_providers import (
    ConsoleNotificationProvider,
    DeliveryResult,
    NotificationProvider,
)


DEFAULT_TEMPLATES: dict[str, str] = {
    "task_reminder": "Напоминание: выполните задачу «$task_title» до $due_at.",
    "appointment_soon": "Приём с врачом через $hours ч.: $appointment_time.",
    "doctor_message": "Новое сообщение от врача: $preview",
    "password_reset": "Код восстановления пароля: $token (действует $minutes мин.)",
}


@dataclass
class QueuedNotification:
    """Элемент внутренней очереди уведомлений до отправки."""

    user_id: int
    channel: NotificationChannel
    recipient: str
    template_key: str
    context: dict[str, str]
    trigger_event: str


class NotificationService:
    """Оркестратор уведомлений с рендерингом шаблонов и записью в notification_logs."""

    def __init__(
        self,
        session: AsyncSession,
        providers: dict[NotificationChannel, NotificationProvider] | None = None,
        templates: dict[str, str] | None = None,
    ):
        """
        Инициализирует сервис сессией БД и набором провайдеров по каналам.

        Если провайдеры не переданы, используются консольные заглушки для всех каналов.
        """
        self.session = session
        self.templates = templates or DEFAULT_TEMPLATES
        self._queue: list[QueuedNotification] = []
        self.providers = providers or {
            NotificationChannel.email: ConsoleNotificationProvider(NotificationChannel.email),
            NotificationChannel.sms: ConsoleNotificationProvider(NotificationChannel.sms),
            NotificationChannel.push: ConsoleNotificationProvider(NotificationChannel.push),
            NotificationChannel.system: ConsoleNotificationProvider(NotificationChannel.system),
        }

    def render_template(self, template_key: str, context: dict[str, str]) -> str:
        """Рендерит текст уведомления по ключу шаблона и контексту подстановок."""
        raw = self.templates.get(template_key)
        if not raw:
            raise KeyError(f"Unknown notification template: {template_key}")
        return Template(raw).safe_substitute(**context)

    def enqueue(
        self,
        *,
        user_id: int,
        channel: NotificationChannel,
        recipient: str,
        template_key: str,
        context: dict[str, str],
        trigger_event: str,
    ) -> None:
        """Добавляет уведомление во внутреннюю очередь перед фактической отправкой."""
        self._queue.append(
            QueuedNotification(
                user_id=user_id,
                channel=channel,
                recipient=recipient,
                template_key=template_key,
                context=context,
                trigger_event=trigger_event,
            )
        )

    async def flush_queue(self) -> list[NotificationLog]:
        """Отправляет все уведомления из очереди и возвращает записи журнала."""
        logs: list[NotificationLog] = []
        while self._queue:
            item = self._queue.pop(0)
            body = self.render_template(item.template_key, item.context)
            log = await self.send_now(
                user_id=item.user_id,
                channel=item.channel,
                recipient=item.recipient,
                subject=item.template_key,
                body=body,
                trigger_event=item.trigger_event,
            )
            logs.append(log)
        return logs

    async def send_now(
        self,
        *,
        user_id: int,
        channel: NotificationChannel,
        recipient: str,
        subject: str,
        body: str,
        trigger_event: str,
    ) -> NotificationLog:
        """Немедленно отправляет уведомление через провайдер и фиксирует результат в БД."""
        provider = self.providers.get(channel)
        result: DeliveryResult
        if provider:
            result = await provider.send(recipient, subject, body)
        else:
            result = DeliveryResult(success=False, error="Provider not configured")

        status = DeliveryStatus.sent if result.success else DeliveryStatus.failed
        log = NotificationLog(
            user_id=user_id,
            trigger_event=trigger_event,
            channel=channel.value,
            status=status.value,
        )
        self.session.add(log)
        await self.session.commit()
        await self.session.refresh(log)
        return log
