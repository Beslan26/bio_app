"""Общие типы и перечисления для инфраструктурных сервисов."""

from enum import Enum


class NotificationChannel(str, Enum):
    """Канал доставки уведомления."""

    email = "email"
    sms = "sms"
    push = "push"
    system = "system"


class DeliveryStatus(str, Enum):
    """Статус доставки уведомления."""

    pending = "pending"
    sent = "sent"
    failed = "failed"


class TriageLevel(str, Enum):
    """Уровень срочности после AI-триажа."""

    red = "red"
    yellow = "yellow"
    green = "green"
