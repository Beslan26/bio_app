from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from medical_assistant import models

from medical_assistant.api.v1.auth import router as v1_router
from medical_assistant.api.v1 import (
    patient,
    patient_complaints,
    doctor_workspace,
    patient_workspace,
    admin_control,
    infrastructure,
)

app = FastAPI()


origins = [
    "http://localhost:5173",     # Локальный хост Vite (разработка)
    "http://127.0.0.1:5173",   # Альтернативный локальный адрес
    # "http://localhost",        # Будет нужен, когда запущу фронтенд в Docker на 80 порту
]


app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=origins,            # Разрешаем наш фронтенд
    allow_credentials=True,           # КРИТИЧЕСКИ ВАЖНО для считывания кук и JWT
    allow_methods=["*"],              # Разрешаем все методы (GET, POST, PUT, DELETE и т.д.)
    allow_headers=["*"],              # Разрешаем любые заголовки (включая Authorization)
)

# Версия API v1
app.include_router(v1_router.router, prefix="/api/v1")
app.include_router(patient.router, prefix="/api/v1")
app.include_router(patient_complaints.router, prefix="/api/v1")
app.include_router(doctor_workspace.router, prefix="/api/v1")
app.include_router(patient_workspace.router, prefix="/api/v1")
app.include_router(admin_control.router, prefix="/api/v1")
app.include_router(infrastructure.router, prefix="/api/v1")