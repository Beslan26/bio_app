"""Сервис полнотекстового поиска по пациентам, врачам и медицинским данным."""

from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from medical_assistant.models.medical.complaints import Complaint
from medical_assistant.models.medical.medical_record import MedicalRecord
from medical_assistant.models.patient.symptom_submission import SymptomSubmission
from medical_assistant.models.user.doctors import Doctor, DoctorVerificationStatus
from medical_assistant.models.user.patients import Patient
from medical_assistant.models.user.user import User


class SearchService:
    """Поиск и фильтрация сущностей для врачебного и административного контуров."""

    def __init__(self, session: AsyncSession):
        """Инициализирует сервис асинхронной сессией SQLAlchemy."""
        self.session = session

    async def search_patients(
        self,
        query: str,
        *,
        symptom_tag: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """
        Ищет пациентов по email, ФИО и тексту жалоб.

        symptom_tag фильтрует по вхождению в structured_data/ai_results_json (упрощённо — raw_content).
        """
        pattern = f"%{query}%"
        stmt = (
            select(Patient)
            .join(User, User.id == Patient.user_id)
            .where(
                or_(
                    User.email.ilike(pattern),
                    Patient.full_name.ilike(pattern),
                )
            )
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        patients = list(result.scalars().all())
        if not symptom_tag:
            return [{"patient_id": p.id, "user_id": p.user_id, "full_name": p.full_name} for p in patients]

        filtered = []
        for patient in patients:
            subs = await self.session.execute(
                select(SymptomSubmission).where(
                    SymptomSubmission.patient_id == patient.id,
                    SymptomSubmission.raw_content.ilike(f"%{symptom_tag}%"),
                )
            )
            if subs.scalars().first():
                filtered.append(
                    {"patient_id": patient.id, "user_id": patient.user_id, "full_name": patient.full_name}
                )
        return filtered

    async def search_doctors(
        self,
        query: str,
        *,
        verification_status: DoctorVerificationStatus | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """Ищет врачей по лицензии, специальности и статусу верификации."""
        pattern = f"%{query}%"
        stmt = select(Doctor).where(
            or_(
                Doctor.license_number.ilike(pattern),
                Doctor.specialty.ilike(pattern),
            )
        )
        if verification_status:
            stmt = stmt.where(Doctor.verification_status == verification_status)
        stmt = stmt.limit(limit)
        result = await self.session.execute(stmt)
        return [
            {
                "doctor_id": d.id,
                "license_number": d.license_number,
                "specialty": d.specialty,
                "verification_status": d.verification_status.value,
            }
            for d in result.scalars().all()
        ]

    async def search_medical_history(
        self,
        query: str,
        *,
        patient_id: int | None = None,
        urgency: str | None = None,
        limit: int = 50,
    ) -> list[dict]:
        """
        Ищет по жалобам, symptom_submissions и medical_records.

        urgency фильтрует ai_results_json->urgency (упрощённо через ilike в raw_content/ai_summary).
        """
        pattern = f"%{query}%"
        hits: list[dict] = []

        complaint_stmt = select(Complaint).where(Complaint.raw_text.ilike(pattern))
        if patient_id:
            complaint_stmt = complaint_stmt.where(Complaint.patient_id == patient_id)
        complaint_stmt = complaint_stmt.limit(limit)
        for c in (await self.session.execute(complaint_stmt)).scalars().all():
            hits.append({"type": "complaint", "id": c.id, "patient_id": c.patient_id, "snippet": c.raw_text[:200]})

        sub_stmt = select(SymptomSubmission).where(SymptomSubmission.raw_content.ilike(pattern))
        if patient_id:
            sub_stmt = sub_stmt.where(SymptomSubmission.patient_id == patient_id)
        if urgency:
            sub_stmt = sub_stmt.where(SymptomSubmission.status.ilike(f"%{urgency}%"))
        sub_stmt = sub_stmt.limit(limit)
        for s in (await self.session.execute(sub_stmt)).scalars().all():
            hits.append(
                {
                    "type": "symptom_submission",
                    "id": s.id,
                    "patient_id": s.patient_id,
                    "status": s.status,
                    "snippet": s.raw_content[:200],
                }
            )

        record_stmt = select(MedicalRecord).options(joinedload(MedicalRecord.patient)).where(
            MedicalRecord.body.ilike(pattern)
        )
        if patient_id:
            record_stmt = record_stmt.where(MedicalRecord.patient_id == patient_id)
        record_stmt = record_stmt.limit(limit)
        for r in (await self.session.execute(record_stmt)).scalars().all():
            hits.append(
                {
                    "type": "medical_record",
                    "id": r.id,
                    "patient_id": r.patient_id,
                    "record_kind": r.record_kind.value,
                    "snippet": r.body[:200],
                }
            )

        return hits[:limit]

    async def global_search(
        self,
        query: str,
        *,
        symptom_tag: str | None = None,
        verification_status: DoctorVerificationStatus | None = None,
        urgency: str | None = None,
    ) -> dict:
        """Выполняет объединённый поиск по всем поддерживаемым сущностям."""
        return {
            "patients": await self.search_patients(query, symptom_tag=symptom_tag),
            "doctors": await self.search_doctors(query, verification_status=verification_status),
            "medical_history": await self.search_medical_history(query, urgency=urgency),
        }
