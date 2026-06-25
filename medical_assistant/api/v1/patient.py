from fastapi import APIRouter, Depends, HTTPException, status

from medical_assistant.dependencies.repos import get_patient_repo
from medical_assistant.schemas.patient import (
    PatientProfileResponse,
    PatientProfileUpdate,
)
from medical_assistant.repositories.patient import PatientRepository
from medical_assistant.dependencies.auth import require_roles
from medical_assistant.models.user.user import UserRole

router = APIRouter(prefix="/patient", tags=["patient"])


@router.get("/profile", response_model=PatientProfileResponse)
async def get_patient_profile(
    user=Depends(require_roles(UserRole.patient)),
    patients: PatientRepository = Depends(get_patient_repo),
):
    patient = await patients.get_by_user_id(user.id)

    if not patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    return patient


@router.put("/profile", response_model=PatientProfileResponse)
async def update_patient_profile(
    data: PatientProfileUpdate,
    user=Depends(require_roles(UserRole.patient)),
    patients: PatientRepository = Depends(get_patient_repo),
):
    updated_patient = await patients.update_by_user_id(
        user_id=user.id,
        data=data.dict(exclude_unset=True),
    )

    if not updated_patient:
        raise HTTPException(status.HTTP_404_NOT_FOUND)

    return updated_patient
