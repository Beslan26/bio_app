"""Сервис агрегации метрик здоровья для графиков на фронтенде."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from medical_assistant.models.medical.health_metrics import HealthMetric
from medical_assistant.models.tasks.task_entries import TaskEntry
from medical_assistant.models.tasks.tasks import Task


class AnalyticsService:
    """Сводка сырых записей в формат, совместимый с Recharts/Chart.js."""

    def __init__(self, session: AsyncSession):
        """Инициализирует сервис асинхронной сессией БД."""
        self.session = session

    async def build_health_metric_chart(
        self,
        patient_id: int,
        metric_type: str | None = None,
    ) -> dict:
        """
        Агрегирует health_metrics пациента: min/max/avg по дням.

        Returns:
            JSON с полями labels и datasets для библиотек графиков.
        """
        stmt = select(HealthMetric).where(HealthMetric.patient_id == patient_id)
        if metric_type:
            stmt = stmt.where(HealthMetric.metric_type == metric_type)
        stmt = stmt.order_by(HealthMetric.timestamp.asc())
        result = await self.session.execute(stmt)
        rows = list(result.scalars().all())

        by_day: dict[str, list[float]] = defaultdict(list)
        for row in rows:
            day_key = row.timestamp.date().isoformat()
            by_day[day_key].append(row.value)

        labels = sorted(by_day.keys())
        avg_data = [sum(by_day[d]) / len(by_day[d]) for d in labels]
        min_data = [min(by_day[d]) for d in labels]
        max_data = [max(by_day[d]) for d in labels]

        return {
            "labels": labels,
            "datasets": [
                {"label": "average", "data": avg_data},
                {"label": "min", "data": min_data},
                {"label": "max", "data": max_data},
            ],
            "metric_type": metric_type or "all",
        }

    async def build_task_compliance_chart(self, patient_id: int) -> dict:
        """
        Считает долю заполненных task_entries относительно активных задач.

        Returns:
            JSON для круговой/линейной диаграммы соблюдения режима.
        """
        tasks_result = await self.session.execute(select(Task).where(Task.patient_id == patient_id))
        tasks = list(tasks_result.scalars().all())
        if not tasks:
            return {"labels": [], "datasets": [{"label": "compliance_percent", "data": []}]}

        task_ids = [t.id for t in tasks]
        entries_result = await self.session.execute(
            select(TaskEntry).where(TaskEntry.task_id.in_(task_ids))
        )
        entries = list(entries_result.scalars().all())
        entries_by_task: dict[int, list[TaskEntry]] = defaultdict(list)
        for entry in entries:
            entries_by_task[entry.task_id].append(entry)

        labels = [t.title for t in tasks]
        compliance = []
        for task in tasks:
            count = len(entries_by_task.get(task.id, []))
            days = max(1, (task.end_date - task.start_date).days + 1)
            compliance.append(round(min(100.0, (count / days) * 100), 1))

        return {
            "labels": labels,
            "datasets": [{"label": "compliance_percent", "data": compliance}],
        }

    async def build_patient_dashboard(self, patient_id: int) -> dict:
        """Собирает сводный JSON дашборда пациента для PHR-экрана."""
        health_chart = await self.build_health_metric_chart(patient_id)
        task_chart = await self.build_task_compliance_chart(patient_id)
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "health_metrics": health_chart,
            "task_compliance": task_chart,
        }
