from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status

from medical_assistant.dependencies.repos import get_patient_repo, get_complaint_repo
from medical_assistant.schemas.complaint import (
    ComplaintCreateText,
    ComplaintResponse,
)
from medical_assistant.repositories.complaint import ComplaintRepository
from medical_assistant.repositories.patient import PatientRepository
from medical_assistant.dependencies.auth import require_roles
from medical_assistant.models.user.user import UserRole
from medical_assistant.services.complaint_ai import extract_medical_facts

router = APIRouter(
    prefix="/patient/complaints",
    tags=["patient-complaints"],
)


@router.post("/text", response_model=ComplaintResponse)
async def create_text_complaint(
    data: ComplaintCreateText,
    user=Depends(require_roles(UserRole.patient)),
    patients: PatientRepository = Depends(get_patient_repo),
    complaints: ComplaintRepository = Depends(get_complaint_repo),
):
    patient = await patients.get_by_user_id(user.id)
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    facts = await extract_medical_facts(data.text)

    complaint = await complaints.create(
        patient_id=patient.id,
        source="text",
        raw_text=data.text,
        extracted_facts=facts,
    )

    return complaint


@router.post("/voice", response_model=ComplaintResponse)
async def create_voice_complaint(
    file: UploadFile = File(...),
    user=Depends(require_roles(UserRole.patient)),
    patients: PatientRepository = Depends(get_patient_repo),
    complaints: ComplaintRepository = Depends(get_complaint_repo),
):
    patient = await patients.get_by_user_id(user.id)
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    # 1️⃣ Чтение аудио
    audio_bytes = await file.read()

    # 2️⃣ Speech-to-text (заглушка)
    transcribed_text = "Пациент жалуется на слабость и плохой сон"

    # 3️⃣ Извлечение фактов
    facts = await extract_medical_facts(transcribed_text)

    complaint = await complaints.create(
        patient_id=patient.id,
        source="voice",
        raw_text=transcribed_text,
        extracted_facts=facts,
    )

    return complaint


@router.get("", response_model=list[ComplaintResponse])
async def list_complaints(
    user=Depends(require_roles(UserRole.patient)),
    patients: PatientRepository = Depends(get_patient_repo),
    complaints: ComplaintRepository = Depends(get_complaint_repo),
):
    patient = await patients.get_by_user_id(user.id)
    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    return await complaints.get_by_patient_id(patient.id)
