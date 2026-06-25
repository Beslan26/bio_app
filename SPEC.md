# Project Specification: AI-Driven Medical Platform
**Version:** 1.0.0  
**Focus:** AI-Assisted Patient Intake, Diagnostics & Health Tracking  


# 1. System-wide Functions (Auth & Security)

## 1.1 Authentication (JWT-based)
- **Sign Up**: Email/Password registration. Default role: `PATIENT`.
- **Sign In**: Credentials validation with MFA support (optional).
- **Password Recovery**: Secure token-based flow (Send Email -> Reset Link -> New Password).
- **Session Management**: 
    - `access_token` (short-lived) 
    - `refresh_token` (long-lived, stored in HttpOnly cookie).
- **Account Security**: Ability to Change Password within an active session.

## 1.2 Access Control (RBAC)
Strict Role-Based Access Control must be enforced on all API routes:
- `ADMIN`: Full system access, User management (Block/Deactivate).
- `DOCTOR`: Access to Patient Cards, Task Creation, Analytics.
- `PATIENT`: Access to own Profile, AI Consultation, Assigned Tasks.

## 1.3 Audit & Compliance
- **Action Logging**: Every state change (e.g., Status updated, Task created) must be logged in `audit_logs` table.
- **Account Lifecycle**:
    - `active`: Normal operation.
    - `deactivated`: User-initiated suspension.
    - `blocked`: Admin-initiated restriction.

## 1.4 Data Entities (Schema Hints)
- **User**: `id, email, password_hash, role, status, created_at, last_login`.
- **AuditLog**: `id, user_id, action, entity_type, entity_id, timestamp`.


## 1.5 Notification Engine
- **Multichannel System**: 
    - `EMAIL`: Critical alerts (auth, password reset).
    - `SMS`: Urgent doctor notifications or MFA.
    - `SYSTEM`: In-app real-time notifications (Socket/Push).
- **Scheduler**: Use worker/cron jobs for delayed reminders (e.g., "Take your medicine in 30 mins").
- **Templates**: Notification messages must be decoupled from logic (stored as templates).
- **Preferences**: User-level settings to toggle specific notification types.

## 1.6 Document & File Management (DMS)
- **Security First**: Files stored in isolated buckets (e.g., S3). Access via Signed URLs only.
- **Storage Logic**:
    - `UPLOAD`: Support for PDF, JPEG, PNG (max 10MB).
    - `ENCRYPTION`: All medical records encrypted at rest.
- **Versioning**: 
    - Track `version_id`, `created_by`, `timestamp`. 
    - Old versions must be archived, not deleted.
- **Permission Matrix**: 
    - `PATIENT`: Can read/upload own files.
    - `DOCTOR`: Read access to assigned patient's files. No delete rights.

## 1.7 Data Analytics & Export
- **Aggregation Logic**: Backend pre-calculates metrics (e.g., "Health stats over time") for frontend charts.
- **Export Engine**:
    - `PDF`: For official medical reports/summaries.
    - `CSV`: For raw data export (Patient/Admin only).
- **Data Integrity**: Historical snapshots of user data to ensure "History of Changes" is immutable.

## 1.8 Data Entities (Schema Hints)
- **Notification**: `id, user_id, type, status (sent/failed), payload, scheduled_at`.
- **Document**: `id, owner_id, file_path, version, type, is_archived`.
- **AuditTrail**: `id, entity_id, change_data (JSON), updated_by, timestamp`.


---
# 2. Doctor Functions (Clinical Workspace)

## 2.1 Medical Credentialing & Auth
- **Verification Flow**: 
    - Sign In using `License Number` + `Credentials`.
    - **License Validation**: Service must check against external/internal database of valid licenses.
    - **Account Status**: New doctor profiles are set to `PENDING_VERIFICATION` by default. Access to patient data is restricted until `VERIFIED` status.
- **Profile Association**: Each license unique identifier must be linked to a single `User ID`.

## 2.2 Doctor Dashboard (Workspace)
- **Profile Management**: 
    - Read-only: `License Number`, `Verification Date`.
    - Editable: `Bio`, `Work Hours`, `Contact Info`.
- **Specialization Schema**:
    - `Primary Specialization`: (e.g., Cardiology, Therapy).
    - `Sub-specializations`: Tags or related medical fields for the Matching System.
- **Patient Management (Patient List)**:
    - **Active Patients**: Those with ongoing treatment or appointments.
    - **Queue/Inbox**: New AI-prepared cards waiting for initial review.
    - **Search & Filter**: Find patients by Name, Symptom tags, or Urgency level (AI-assigned).

## 2.3 Data Entities (Schema Hints)
- **DoctorProfile**: `id, user_id, license_id, specialization_id, bio, verification_status (pending/verified/rejected), verified_at`.
- **License**: `id, license_number, issue_date, expiry_date, issuer, is_valid (boolean)`.
- **Specialization**: `id, name, description, category`.

## 2.4 Scheduling & Appointments
- **Calendar View**: Interface to visualize daily/weekly/monthly slots.
- **Appointment Lifecycle**:
    - `Filters`: Sort by date, time, and patient priority.
    - `Details`: Direct link to AI-structured complaint and patient record.
    - `Status`: (Scheduled, Completed, No-show, Cancelled).
- **History**: Immutable archive of all past consultations for audit and clinical review.

## 2.5 Clinical Patient Management (Advanced View)
- **Comprehensive Profile**: 
    - **Medical History**: Timeline of previous diagnoses, procedures, and AI-summaries.
    - **Documentation**: Unified view for lab results, DICOM images (optional), and PDF reports.
- **Extended Context (Social Determinants of Health)**:
    - **Family Tree (Relations)**: Link to other Patient IDs in the system to track hereditary risks.
    - **Environment**: Records of living conditions and workplace (important for occupational diseases/allergies).
- **Analytics & Health Trends**: 
    - **Visual Tracking**: Integration with frontend charts (e.g., Blood pressure, Glucose levels over time).
    - **Baseline vs Current**: AI-powered highlight of significant deviations in patient metrics.

## 2.6 Data Entities (Schema Hints)
- **Appointment**: `id, doctor_id, patient_id, start_time, end_time, status, notes`.
- **PatientRelation**: `id, patient_id_1, patient_id_2, relation_type (e.g., Parent/Child, Spouse)`.
- **PatientSocialData**: `id, patient_id, workplace, residence_type, environment_hazards`.
- **HealthMetric**: `id, patient_id, metric_type, value, unit, timestamp`.

## 2.6 Diagnostics & Clinical Records
- **Preliminary Diagnosis**: Interface for the doctor to input an initial diagnosis (linking to ICD codes if necessary). This field is distinct from the AI's suggestion.
- **Consultation Notes**: Rich-text support for detailed medical entries during/after the appointment.
- **Lab Commentary**: Ability to attach specific notes/interpretations to uploaded medical documents or lab results.
- **Recommendations**: A formatted block of instructions for the patient (separate from trackable tasks).

## 2.7 Task Management (Patient Trackers)
- **Task Creation Engine**:
    - **Types**:
        - `Numeric`: For tracking metrics (e.g., Blood Pressure, Weight, Temperature).
        - `Text/Journal`: For qualitative feedback (e.g., "Describe your mood" or "List your meals").
        - `Checkbox`: For simple completion (e.g., "Take medication").
- **Scheduling**: Define start/end dates and frequency (daily, weekly, specific intervals).
- **Monitoring & Feedback**:
    - **Execution Dashboard**: Visual indicator of patient compliance (percentage of completed tasks).
    - **Analysis**: Aggregation of numeric data into trend lines.
- **Lifecycle**:
    - `Active`: Currently being tracked.
    - `Completed`: Task finished.
    - `Extended`: Period update for an existing task.
    - `Closed/Archived`: Stopped by doctor.

## 2.8 Data Entities (Schema Hints)
- **Diagnosis**: `id, doctor_id, patient_id, diagnosis_text, icd_code, type (preliminary/final)`.
- **PatientTask**: `id, doctor_id, patient_id, title, task_type (numeric/text/boolean), unit (if numeric), frequency, start_date, end_date, status`.
- **TaskEntry**: `id, task_id, value (string/number), timestamp, patient_comment`.

## 2.9 Communication & AI Insights
- **Inbound Complaints**: 
    - Real-time notification of new patient submissions.
    - View raw patient input (Text/Audio transcript) alongside AI-structured data.
- **AI Summary Interface**: 
    - Visual highlighting of key symptoms, urgency markers, and potential red flags detected by AI.
    - One-click "Accept AI summary" to import data into the official medical record.
- **Messaging System**:
    - **Secure Chat**: Text-based communication within the patient-doctor context.
    - **Contextual Replies**: Ability to send messages linked to specific tasks or lab results.
    - **Read Receipts**: Status tracking for patient message delivery.

## 2.10 Data Entities (Schema Hints)
- **CommunicationThread**: `id, doctor_id, patient_id, created_at, last_message_at`.
- **ChatMessage**: `id, thread_id, sender_id, role (doctor/patient), content, is_read, metadata (link to task/file)`.
- **ComplaintRecord**: `id, patient_id, raw_input, ai_summary_json, urgency_score, status (new/reviewed/archived)`.

---
# 3. Patient Functions (User Experience)

## 3.1 Profile & Compliance
- **Personal Identity**: Full name, Date of Birth, Gender, Blood Type.
- **Dynamic Updates**: Ability to edit contact details and emergency contacts.
- **Legal Compliance (GDPR/FZ)**:
    - **Consent Management**: Explicit toggles for Personal Data Processing and Medical Data Storage.
    - **Audit Log**: Record of when and which version of consent was signed.
    - **Data Deletion**: Request for account deactivation and data obfuscation.

## 3.2 Complaint Submission (AI-Powered)
- **Multimodal Input**:
    - **Text**: Standard text area for symptom description.
    - **Voice (STT)**: Audio recording feature with automated Speech-to-Text conversion.
- **Submission History**: Dashboard showing all past complaints with their status (Processing, Reviewed by Doctor, Archived).
- **AI Triage (Real-time)**:
    - **Symptom Extraction**: AI identifies keywords and patterns from input.
    - **Urgency Assessment**: Immediate feedback on severity (e.g., "Seek emergency care" vs "Wait for specialist").
- **Specialist Matching**: 
    - Logic to recommend specific medical fields based on AI-analyzed symptoms (e.g., "Based on your symptoms, we suggest a Cardiologist").

## 3.3 Data Entities (Schema Hints)
- **PatientProfile**: `id, user_id, full_name, dob, gender, blood_type, emergency_contact`.
- **Consent**: `id, user_id, consent_type, version, signed_at, ip_address`.
- **SymptomSubmission**: `id, patient_id, input_type (text/audio), raw_content, audio_url, transcription, ai_results_json`.

## 3.4 Personal Health Record (PHR)
- **Medical Dashboard**: 
    - **Health Timeline**: Centralized view of all past diagnoses and medical events.
    - **Document Vault**: Personal storage for lab results, prescriptions, and imaging.
- **Doctor’s Advice**: Dedicated section for non-trackable recommendations (e.g., "General lifestyle advice" from the doctor).
- **Read-Only Records**: Diagnoses and official history must be immutable (Patient cannot edit official doctor entries).

## 3.5 Task Execution (Patient Tracking)
- **Active Task List**: Focused view of "What to do today" (Checkboxes, inputs).
- **Data Entry Logic**:
    - **Validation**: Ensure numeric inputs (e.g., Blood Pressure) are within realistic ranges.
    - **Editing**: Allow editing entries only within a specific timeframe (e.g., "Within 24 hours of entry").
- **Progress & Visualization**:
    - **Gamification/Consistency**: Visual streak or percentage of completion to encourage compliance.
    - **Personal Analytics**: Interactive charts showing the patient's own data (Pulse, Weight, etc.) to visualize recovery.

## 3.6 Data Entities (Schema Hints)
- **PatientDocument**: `id, patient_id, title, file_url, uploaded_at, category (Lab/Scan/Prescription)`.
- **TaskEntry**: `id, task_id, value, patient_comment, timestamp, last_edited_at`.
- **HealthSnapshot**: `id, patient_id, key_metrics_json, generated_at` (For quick loading of dashboard charts).

## 3.7 Patient Alerts & Notifications
- **Task Reminders**: 
    - Push/Email triggers based on the `frequency` and `scheduled_at` fields of assigned tasks.
    - Escalation logic: "Reminder sent 15 mins before" and "Overdue alert" if not completed.
- **Appointment Alerts**: 
    - Standard notifications: 24h before, 1h before, and "Room is ready" (for telemed).
- **Direct Physician Updates**: 
    - Instant alerts when a doctor:
        - Updates a diagnosis.
        - Comments on a lab result.
        - Sends a new message in chat.
        - Closes or extends a task.

## 3.8 Data Entities (Schema Hints)
- **NotificationLog**: `id, user_id, trigger_event (task_due/appt_soon/doc_message), channel (push/email), status (pending/sent/read)`.
- **UserPreferences**: `id, user_id, enable_email, enable_push, quiet_hours_start, quiet_hours_end`.


----
# 4. AI Engine (Smart Assistant)

## 4.1 Speech-to-Medical-Text (STT)
- **Transcription**: Convert patient voice audio to raw text (using Whisper or similar).
- **Denoising & Cleaning**: AI must remove filler words ("uhm", "well", etc.) and irrelevant "noise" information while preserving clinical context.

## 4.2 Clinical Entity Extraction (NLP)
The AI must parse the cleaned text and extract the following entities into a structured JSON:
- **Symptoms**: List of identified health issues.
- **Duration/Onset**: When it started (e.g., "3 days ago").
- **Intensity**: Pain/discomfort scale (1-10) or qualitative (e.g., "acute", "dull").
- **Risk Factors**: Mentions of allergies, chronic diseases, or genetic predispositions.
- **Localization**: Where exactly it hurts.

## 4.3 Data Structuring & Summarization
- **Complaint Card**: A structured JSON object for the system's backend.
- **Medical Summary (Doctor's View)**: A professional, concise brief using medical terminology (e.g., "Patient reports paroxysmal tachycardia for 48 hours").
- **Patient Summary**: A simplified version for the patient to confirm ("You told us about heart palpitations that started 2 days ago").

## 4.4 Triage & Routing
- **Specialist Matching**: 
    - AI analyzes extracted symptoms against a `Specializations` database.
    - Output: Top 3 recommended doctor types.
- **Urgency Scoring (Triage)**:
    - `RED`: Emergency (chest pain, stroke symptoms) -> Alert for immediate action.
    - `YELLOW`: Needs attention within 24h.
    - `GREEN`: Routine consultation.
- **Risk Warnings**: Automatic "Red Flag" detection (e.g., specific combinations of symptoms that require urgent care).

## 4.5 Data Entities (Schema Hints)
- **AIProcessingJob**: `id, submission_id, status (processing/completed/failed), model_version, tokens_used`.
- **StructuredComplaint**: `id, submission_id, entities (JSON: symptoms, duration, intensity), triage_level, recommended_spec_id`.

---
# 5. Administrative Functions (Control Plane)

## 5.1 User & Access Management
- **User Directory**: Centralized view of all accounts (Patients, Doctors, Admins) with advanced filtering.
- **RBAC Management**: 
    - Manual role assignment and permission overrides.
    - Status control: `Active`, `Blocked` (temp), `Deactivated` (soft delete).
- **Hard Delete**: GDPR-compliant permanent data removal upon request.

## 5.2 Provider Verification (Doctor Management)
- **Credential Review**: Interface to inspect uploaded doctor licenses and certificates.
- **License Approval**: One-click action to change Doctor status from `PENDING_VERIFICATION` to `VERIFIED`.
- **Specialization Dictionary**: Management of the global list of medical specialities used by the AI for matching.

## 5.3 System Oversight & Compliance
- **Global Audit Trail**: Searchable logs of critical actions (login attempts, data access, record edits).
- **Master Data Management (Dictionaries)**:
    - Edit/Update ICD-10 (МКБ-10) codes or symptoms lists.
    - Configure global system parameters (e.g., notification intervals, AI model selection).
- **System Health**: Basic dashboard showing API health, AI processing queues, and error rates.

## 5.4 Data Entities (Schema Hints)
- **AdminAction**: `id, admin_id, target_user_id, action_type, reason, timestamp`.
- **SystemConfig**: `id, key, value, description, updated_at`.
- **LicenseProof**: `id, doctor_id, file_url, status (valid/invalid), reviewer_id, review_date`.

---
# 6. Domain Entities & Relationships (Data Model)

This section defines the core entities. The AI should use this as a blueprint for the Database Schema (Prisma/SQL).

## 6.1 User Core
- **User**: Base identity (Email, Auth, Global Role).
- **Doctor**: Extended profile (License, Bio, Verification Status). Linked 1:1 to User.
- **Patient**: Personal health profile (DOB, Gender, Social data). Linked 1:1 to User.

## 6.2 Medical Records
- **MedicalCard (PHR)**: The root container for a patient's history.
- **MedicalRecord**: A single clinical event (Diagnosis, Clinical Note). Linked to Doctor and Patient.
- **Investigation (Analysis/Scan)**: Lab results or imaging files. Can be linked to a MedicalRecord.

## 6.3 Consultation Flow
- **Complaint**: Initial patient input + AI-structured JSON.
- **Appointment (Приём)**: A scheduled or past meeting session. Links Complaint, Doctor, and Patient.
- **Prescription (Назначение)**: Formal medical orders (drugs, procedures).

## 6.4 Tracking & Engagement
- **PatientTask**: A tracker created by a Doctor (Numeric/Text/Checkbox).
- **TaskResult**: Daily/periodic entries made by the Patient for a specific Task.
- **Notification**: Alerts triggered by system events (Scheduled tasks, new messages).

## 6.5 Entity Relationship Map (ERM)
- **User** -> (has one) -> **Doctor OR Patient**.
- **Patient** -> (has many) -> **Complaints** & **MedicalRecords**.
- **Doctor** -> (manages many) -> **Appointments** & **Tasks**.
- **Task** -> (contains many) -> **TaskResults**.
- **MedicalRecord** -> (can have many) -> **Investigations**.

---
# 7. Helper Services (Infrastructure)

The system should implement these as decoupled service modules to ensure scalability and maintainability.

## 7.1 Notification Service
- **Logic**: Handles queuing, template rendering, and delivery via multiple channels (Email, SMS, Push).
- **Integration**: Pluggable providers (e.g., SendGrid, Twilio, Firebase).

## 7.2 AI Service (The Brain)
- **Logic**: Manages LLM orchestration (Prompt engineering, Context window management).
- **Functions**: STT (Speech-to-Text) processing, Symptom extraction, Triage calculation.
- **Provider**: Wrapper around OpenAI API / GigaChat / Anthropic.

## 7.3 File Storage Service
- **Logic**: Secure upload/download management, generation of Signed URLs, file type validation.
- **Provider**: AWS S3 / Google Cloud Storage / Supabase Storage.

## 7.4 Analytics & Charting Service
- **Logic**: Data aggregation (reducing raw health entries into min/max/average trends for visualization).
- **Output**: JSON formatted specifically for frontend charting libraries (e.g., Recharts, Chart.js).

## 7.5 Search & Discovery Service
- **Logic**: Full-text search across Patient Records, Doctors, and Medical Histories.
- **Features**: Filtering by tags (symptoms), licensing status, and urgency.

## 7.6 Audit & Logging Service
- **Logic**: Independent logging of all security-sensitive operations.
- **Compliance**: Ensures logs are immutable and searchable for administrative review.

---
# 8. User Flow: Patient-Doctor Interaction Loop

This section defines the sequential states of the system. Transitions between steps must trigger specific UI updates and data access changes.

## 8.1 Core Flow Steps
1. **Intake**: Patient submits symptoms (Text/Voice) -> `Submission` created (Status: `PENDING_AI`).
2. **Processing**: AI Service extracts entities -> `ComplaintCard` generated (Status: `READY_FOR_MATCHING`).
3. **Routing**: System identifies specialty -> Assigns to Doctor (Status: `WAITING_REVIEW`).
4. **Pre-Consultation**: Doctor opens the `ComplaintCard` (Read-only view of AI summary).
5. **Consultation**: Doctor initiates "Active Session" -> Direct communication/exam (Status: `IN_PROGRESS`).
6. **Prescribing Tasks**: Doctor creates `PatientTasks` (Trackers) -> Access granted to Patient.
7. **Compliance**: Patient logs data into trackers -> `TaskEntries` populated in real-time.
8. **Clinical Review**: Doctor views aggregated charts/reports -> Decides to `Complete`, `Extend`, or `Adjust` treatment.

## 8.2 State Transition Logic (for AI Agent)
- **Gatekeeping**: Step 6 (Task Assignment) must be locked until Step 5 (Consultation) is initiated by the Doctor.
- **Data Availability**: Step 8 (Analysis) requires at least one `TaskEntry` from the Patient to generate a report.
- **Notifications**: Automated alerts must trigger at Step 3 (for Doctor) and Step 6 (for Patient).
