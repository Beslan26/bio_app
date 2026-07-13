import apiClient from './client';

// 1. Расширенный профиль пациента из воркспейса
export interface PatientProfileResponse {
  id: number;
  user_id: number;
  full_name: string | null;
  birth_date: string | null; // ISO строка YYYY-MM-DD
  gender: string | null;
  blood_type: string | null;
  contact_details: string | null;
  emergency_contact: string | null;
}

// 2. Схема для PATCH-обновления данных анкеты
export interface PatientProfileUpdateRequest {
  full_name?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  blood_type?: string | null;
  contact_details?: string | null;
  emergency_contact?: string | null;
}

// 3. Получить профиль из воркспейса пациента
export const getPatientWorkspaceProfile = async (): Promise<PatientProfileResponse> => {
  const response = await apiClient.get<PatientProfileResponse>('/api/v1/patient/workspace/profile');
  return response.data;
};

// 4. Обновить данные анкеты пациента
export const updatePatientWorkspaceProfile = async (payload: PatientProfileUpdateRequest): Promise<PatientProfileResponse> => {
  const response = await apiClient.patch<PatientProfileResponse>('/api/v1/patient/workspace/profile', payload);
  return response.data;
};


// 1. Интерфейс ответа для согласия (Consent) строго по ConsentResponse
export interface ConsentResponse {
  id: number;
  consent_type: string; // Например, 'privacy_policy', 'telemedicine_agreement'
  version: string;      // Например, '1.0.0'
  signed_at: string;    // ISO строка даты/времени
  ip_address: string | null;
}

// 2. Интерфейс запроса на подписание согласия
export interface ConsentCreateRequest {
  consent_type: string;
  version: string;
  ip_address: string | null;
}

// 3. Получить историю подписанных согласий пациента
export const listPatientConsents = async (): Promise<ConsentResponse[]> => {
  const response = await apiClient.get<ConsentResponse[]>('/api/v1/patient/workspace/consents');
  return response.data;
};

// 4. Зафиксировать подписание нового согласия
export const signConsent = async (payload: ConsentCreateRequest): Promise<ConsentResponse> => {
  const response = await apiClient.post<ConsentResponse>('/api/v1/patient/workspace/consents', payload);
  return response.data;
};

// 1. Интерфейс ответа для жалобы (Submission) строго по SubmissionResponse
export interface SubmissionResponse {
  id: number;
  input_type: string; // 'text' | 'audio'
  raw_content: string;
  transcription: string | null;
  ai_results_json: Record<string, any> | null; // Разбор от ИИ
  status: string; // 'processing' и др.
  created_at: string;
}

// 2. Отправить текстовую жалобу
export const submitTextComplaint = async (rawContent: string): Promise<SubmissionResponse> => {
  const response = await apiClient.post<SubmissionResponse>('/api/v1/patient/workspace/submissions/text', {
    raw_content: rawContent,
  });
  return response.data;
};

// 3. Отправить голосовую жалобу (аудиофайл через Multipart Form Data)
export const submitVoiceComplaint = async (audioBlob: Blob): Promise<SubmissionResponse> => {
  const formData = new FormData();
  // Передаем файл под именем 'file', как требует FastAPI (file: UploadFile = File(...))
  formData.append('file', audioBlob, 'complaint.wav');

  const response = await apiClient.post<SubmissionResponse>('/api/v1/patient/workspace/submissions/voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 4. Получить историю всех жалоб пациента
export const listPatientSubmissions = async (): Promise<SubmissionResponse[]> => {
  const response = await apiClient.get<SubmissionResponse[]>('/api/v1/patient/workspace/submissions');
  return response.data;
};


// 1. Интерфейс ответа для документа пациента строго по PatientDocumentResponse
export interface PatientDocumentResponse {
  id: number;
  title: string;
  file_url: string;
  category: string | null; // Например: 'Анализы', 'Снимки', 'Выписки'
  created_at: string;
}

// 2. Интерфейс запроса на добавление документа
export interface PatientDocumentCreateRequest {
  title: string;
  file_url: string;
  category: string | null;
}

// 3. Получить список всех документов пациента из PHR
export const listPatientDocuments = async (): Promise<PatientDocumentResponse[]> => {
  const response = await apiClient.get<PatientDocumentResponse[]>('/api/v1/patient/workspace/documents');
  return response.data;
};

// 4. Добавить новый документ в медицинский архив
export const addPatientDocument = async (payload: PatientDocumentCreateRequest): Promise<PatientDocumentResponse> => {
  const response = await apiClient.post<PatientDocumentResponse>('/api/v1/patient/workspace/documents', payload);
  return response.data;
};


// 1. Интерфейс врачебного диагноза для таймлайна пациента
export interface PatientTimelineDiagnosis {
  id: number;
  doctor_id: number;
  patient_id: number;
  diagnosis_text: string;
  icd_code: string | null;
  type: string; // 'preliminary' | 'final'
  consultation_notes: string | null;
  recommendation: string | null;
  created_at: string;
}

// 2. Функция получения временной шкалы диагнозов
export const getDiagnosesTimeline = async (): Promise<PatientTimelineDiagnosis[]> => {
  const response = await apiClient.get<PatientTimelineDiagnosis[]>('/api/v1/patient/workspace/timeline/diagnoses');
  return response.data;
};


// 1. Интерфейс активной задачи пациента строго по TaskItemResponse
export interface PatientTaskItem {
  id: number;
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

// 2. Интерфейс ответа записи выполнения строго по TaskEntryResponse
export interface TaskEntryResponse {
  id: number;
  task_id: number;
  value: string;
  patient_comment: string | null;
  timestamp: string;      // ISO datetime
  last_edited_at: string | null; // ISO datetime
}

// 3. Получить активные задачи пациента на сегодня
export const listActivePatientTasks = async (): Promise<PatientTaskItem[]> => {
  const response = await apiClient.get<PatientTaskItem[]>('/api/v1/patient/workspace/tasks/active');
  return response.data;
};

// 4. Создать новую запись выполнения задачи
export const createTaskEntry = async (payload: { task_id: number; value: string; patient_comment?: string | null }): Promise<TaskEntryResponse> => {
  const response = await apiClient.post<TaskEntryResponse>('/api/v1/patient/workspace/tasks/entries', payload);
  return response.data;
};

// 5. Отредактировать запись выполнения (в пределах 24-часового окна)
export const updateTaskEntry = async (entryId: number, payload: { value: string; patient_comment?: string | null }): Promise<TaskEntryResponse> => {
  const response = await apiClient.patch<TaskEntryResponse>(`/api/v1/patient/workspace/tasks/entries/${entryId}`, payload);
  return response.data;
};


// 1. Интерфейс ответа для снимка здоровья строго по HealthSnapshotResponse
export interface HealthSnapshotResponse {
  id: number;
  key_metrics_json: Record<string, any>; // Динамические метрики от AnalyticsService
  generated_at: string; // ISO datetime
}

// 2. Функция получения актуального снимка здоровья пациента
export const getHealthSnapshot = async (): Promise<HealthSnapshotResponse | null> => {
  const response = await apiClient.get<HealthSnapshotResponse | null>('/api/v1/patient/workspace/health/snapshot');
  return response.data;
};

// 1. Интерфейс ответа настроек строго по PreferencesResponse
export interface PreferencesResponse {
  user_id: number;
  enable_email: boolean;
  enable_push: boolean;
  quiet_hours_start: string | null; // Строка формата "HH:MM:SS" или "HH:MM"
  quiet_hours_end: string | null;
}

// 2. Интерфейс запроса на обновление настроек (PUT)
export interface PreferencesUpdateRequest {
  enable_email?: boolean | null;
  enable_push?: boolean | null;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
}

// 3. Получить текущие настройки уведомлений
export const getPatientPreferences = async (): Promise<PreferencesResponse | null> => {
  const response = await apiClient.get<PreferencesResponse | null>('/api/v1/patient/workspace/preferences');
  return response.data;
};

// 4. Создать или обновить настройки уведомлений
export const updatePatientPreferences = async (payload: PreferencesUpdateRequest): Promise<PreferencesResponse> => {
  const response = await apiClient.put<PreferencesResponse>('/api/v1/patient/workspace/preferences', payload);
  return response.data;
};


// 1. Интерфейс лога уведомления строго по NotificationLogResponse
export interface NotificationLogResponse {
  id: number;
  trigger_event: string;
  channel: string; // 'email' | 'push'
  status: string;  // 'sent' | 'failed'
  created_at: string;
}

// 2. Функция получения журнала уведомлений
export const listNotificationLogs = async (): Promise<NotificationLogResponse[]> => {
  const response = await apiClient.get<NotificationLogResponse[]>('/api/v1/patient/workspace/notifications/logs');
  return response.data;
};

// 3. Функция запроса на деактивацию аккаунта
export const requestDeactivation = async (): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/api/v1/patient/workspace/deactivate');
  return response.data;
};


// --- СИСТЕМНЫЙ CRUD ДЛЯ ВРАЧЕЙ И АДМИНИСТРАТОРОВ (из patients.py) ---

// Точный контракт ответа, соответствующий Pydantic-модели PatientProfileResponse
export interface BasePatientProfileResponse {
  birth_date: string | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
}

// Контракт запроса, соответствующий Pydantic-модели PatientProfileUpdate
export interface BasePatientProfileUpdate {
  birth_date?: string | null;
  sex?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
}

/**
 * 3. GET запрос получения базового физического профиля
 * Относительный путь БЕЗ /api/v1 на старте
 */
export const getBasePatientProfile = async (): Promise<BasePatientProfileResponse> => {
  const response = await apiClient.get<BasePatientProfileResponse>('/api/v1/patient/profile');
  return response.data;
};

/**
 * 4. PUT запрос на обновление базового физического профиля
 * Рост и вес передаются сюда, как требует бэкенд
 */
export const updateBasePatientProfile = async (payload: BasePatientProfileUpdate): Promise<BasePatientProfileResponse> => {
  const response = await apiClient.put<BasePatientProfileResponse>('api/v1/patient/profile', payload);
  return response.data;
};



// --- МОДУЛЬ ЖАЛОБ И СИМПТОМОВ (из patient_complaints.py) ---

// 1. Интерфейс ответа строго по модели ComplaintResponse
export interface PatientComplaintResponse {
  id: number;
  source: string; // 'text' | 'voice'
  raw_text: string;
  extracted_facts: string[] | null; // Факты, извлеченные ИИ
  created_at: string; // ISO datetime строка
}

// 2. Функция отправки текстовой жалобы в роутер patient/complaints/text
export const createTextComplaint = async (text: string): Promise<PatientComplaintResponse> => {
  const response = await apiClient.post<PatientComplaintResponse>('/api/v1/patient/complaints/text', {
    text: text,
  });
  return response.data;
};


// 1. Отправить голосовую жалобу в роутер patient_complaints
export const createVoiceComplaint = async (audioBlob: Blob): Promise<PatientComplaintResponse> => {
  const formData = new FormData();
  // Передаем файл под именем 'file', как требует FastAPI (file: UploadFile = File(...))
  formData.append('file', audioBlob, 'complaint.wav');

  const response = await apiClient.post<PatientComplaintResponse>('/api/v1/patient/complaints/voice', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 2. Получить список всех жалоб из этой таблицы
export const getPatientComplaintsList = async (): Promise<PatientComplaintResponse[]> => {
  const response = await apiClient.get<PatientComplaintResponse[]>('/api/v1/patient/complaints');
  return response.data;
};


// Функция получения агрегированных данных для графиков PHR пациента (из infrastructure.py)
export const getPatientAnalytics = async (patientId: number): Promise<Record<string, any>> => {
  const response = await apiClient.get<Record<string, any>>(`/api/v1/infrastructure/analytics/patient/${patientId}`);
  return response.data;
};
