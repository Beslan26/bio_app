# dependencies/patient.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from medical_assistant.repositories.patient import PatientRepository
from medical_assistant.dependencies.db import get_db


async def get_patient_repository(
    session: AsyncSession = Depends(get_db)
) -> PatientRepository:
    return PatientRepository(session)
