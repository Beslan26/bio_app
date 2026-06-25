from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    role: str
    status: str
    last_login: datetime | None = None


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class CreateDoctorRequest(BaseModel):
    license_number: str
    password: str
    sex: str
    specialty: str


class RegisterResponse(BaseModel):
    access_token: str
    user: UserResponse


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DoctorLoginRequest(BaseModel):
    license_number: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class PasswordRecoveryRequest(BaseModel):
    email: EmailStr


class PasswordRecoveryConfirm(BaseModel):
    token: str
    new_password: str
