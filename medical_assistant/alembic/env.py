import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

from medical_assistant.database.base import Base
from medical_assistant.core.config import settings

from medical_assistant.models.auth.password_reset import PasswordResetToken
from medical_assistant.models.auth.audit_log import AuditLog
from medical_assistant.models.admin.admin_action import AdminAction
from medical_assistant.models.admin.system_config import SystemConfig
from medical_assistant.models.admin.license_proof import LicenseProof
from medical_assistant.models.communication.chat import CommunicationThread, ChatMessage
from medical_assistant.models.medical.appointments import Appointment, AppointmentStatus
from medical_assistant.models.medical.medical_card import MedicalCard
from medical_assistant.models.medical.medical_record import MedicalRecord, MedicalRecordKind
from medical_assistant.models.medical.investigation import Investigation
from medical_assistant.models.medical.prescription import Prescription, PrescriptionKind
from medical_assistant.models.medical.complaints import Complaint
from medical_assistant.models.medical.diagnoses import Diagnosis, DiagnosisType
from medical_assistant.models.medical.health_metrics import HealthMetric
from medical_assistant.models.medical.lab_files import LabFile
from medical_assistant.models.medical.patient_relation import PatientRelation
from medical_assistant.models.medical.patient_social_data import PatientSocialData
from medical_assistant.models.patient.consents import Consent
from medical_assistant.models.patient.health_snapshot import HealthSnapshot
from medical_assistant.models.patient.notification_log import NotificationLog
from medical_assistant.models.patient.patient_document import PatientDocument
from medical_assistant.models.patient.symptom_submission import SymptomSubmission
from medical_assistant.models.patient.user_preferences import UserPreferences
from medical_assistant.models.relations.doctor_patient import DoctorPatient
from medical_assistant.models.tasks.tasks import Task
from medical_assistant.models.tasks.task_entries import TaskEntry
from medical_assistant.models.user.user import UserRole, AccountStatus, User
from medical_assistant.models.user.doctors import Doctor, DoctorVerificationStatus
from medical_assistant.models.user.licenses import License
from medical_assistant.models.user.patients import Sex, Patient
from medical_assistant.models.user.notifications import Notification
from medical_assistant.models.user.specializations import Specialization

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline():
    """Generate SQL script without connecting to DB"""
    url = settings.database_url_sync
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations against actual DB"""
    connectable = engine_from_config(
        {"sqlalchemy.url": settings.database_url_sync},
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()