import apiClient from './client';

// 1. Интерфейс ответа профиля врача
export interface DoctorProfileResponse {
  id: number;
  license_number: string;
  specialty: string;
  verification_status: string;
  verified_at: string | null;
  bio: string | null;
  work_hours: string | null;
  contact_info: string | null;
  sub_specializations: string | null;
}

// 2. Интерфейс запроса на обновление профиля врача (PATCH)
export interface DoctorProfileUpdateRequest {
  bio?: string | null;
  work_hours?: string | null;
  contact_info?: string | null;
  sub_specializations?: string | null;
}

// 3. Получение профиля врача (с обновленным префиксом)
export const getDoctorProfile = async (): Promise<DoctorProfileResponse> => {
  const response = await apiClient.get<DoctorProfileResponse>('/api/v1/doctor/workspace/profile');
  return response.data;
};

// 4. Частичное обновление профиля врача
export const updateDoctorProfile = async (payload: DoctorProfileUpdateRequest): Promise<DoctorProfileResponse> => {
  const response = await apiClient.patch<DoctorProfileResponse>('/api/v1/doctor/workspace/profile', payload);
  return response.data;
};


// 1. Интерфейс краткой карточки пациента строго по DoctorPatientItem
export interface DoctorPatientItem {
  id: number;
  user_id: number;
  birth_date: string | null; // Даты из Pydantic прилетают строками (ISO)
  sex: string | null;
}

// 2. Функция получения списка активных пациентов с поддержкой поиска
export const listActivePatients = async (searchQuery?: string): Promise<DoctorPatientItem[]> => {
  const response = await apiClient.get<DoctorPatientItem[]>('/api/v1/doctor/workspace/patients/active', {
    params: {
      q: searchQuery || undefined, // Передаем q только если строка не пустая
    },
  });
  return response.data;
};


// 1. Интерфейс для входящей жалобы (Clinical Complaint)
export interface ClinicalComplaint {
  id: number;
  patient_id: number;
  patient_full_name?: string | null; // Если бэкенд обогащает имя
  description: string;               // Текст жалобы/симптомов
  severity_level?: 'low' | 'medium' | 'high' | string; // Уровень критичности, если есть триаж
  created_at: string;
}

// 2. Функция получения очереди жалоб для разбора
export const getComplaintsInbox = async (): Promise<ClinicalComplaint[]> => {
  const response = await apiClient.get<ClinicalComplaint[]>('/api/v1/doctor/workspace/complaints/inbox');
  return response.data;
};


// 1. Интерфейс ответа для приема (Appointment)
export interface AppointmentResponse {
  id: number;
  doctor_id: number;
  patient_id: number;
  complaint_id: number | null;
  start_time: string;
  end_time: string;
  status: string; // 'scheduled' и др.
  patient_priority: number | null;
  notes: string | null;
}

// 2. Интерфейс запроса на создание нового приема
export interface AppointmentCreateRequest {
  patient_id: number;
  complaint_id: number | null;
  start_time: string; // ISO строка даты/времени
  end_time: string;   // ISO строка даты/времени
  patient_priority: number | null;
  notes: string | null;
}

// 3. Получить расписание приемов врача
export const listAppointments = async (): Promise<AppointmentResponse[]> => {
  const response = await apiClient.get<AppointmentResponse[]>('/api/v1/doctor/workspace/appointments');
  return response.data;
};

// 4. Создать новую запись приема
export const createAppointment = async (payload: AppointmentCreateRequest): Promise<AppointmentResponse> => {
  const response = await apiClient.post<AppointmentResponse>('/api/v1/doctor/workspace/appointments', payload);
  return response.data;
};


// 1. Интерфейс ответа для диагноза строго по DiagnosisResponse
export interface DiagnosisResponse {
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

// 2. Интерфейс запроса на создание диагноза
export interface DiagnosisCreateRequest {
  patient_id: number;
  diagnosis_text: string;
  icd_code: string | null;
  type: string; // 'preliminary' или 'final'
  consultation_notes: string | null;
  recommendation: string | null;
}

// 3. Получить историю диагнозов конкретного пациента
export const listDiagnoses = async (patientId: number): Promise<DiagnosisResponse[]> => {
  const response = await apiClient.get<DiagnosisResponse[]>(`/api/v1/doctor/workspace/diagnoses/${patientId}`);
  return response.data;
};

// 4. Поставить новый диагноз пациенту
export const createDiagnosis = async (payload: DiagnosisCreateRequest): Promise<DiagnosisResponse> => {
  const response = await apiClient.post<DiagnosisResponse>('/api/v1/doctor/workspace/diagnoses', payload);
  return response.data;
};


// 1. Интерфейс ответа для задачи-трекера строго по TaskResponse
export interface DoctorTaskResponse {
  id: number;
  doctor_id: number;
  patient_id: number;
  title: string;
  description: string;
  start_date: string; // Даты (date) прилетают в формате YYYY-MM-DD
  end_date: string;
}

// 2. Интерфейс запроса на создание задачи для пациента
export interface TaskCreateRequest {
  patient_id: number;
  title: string;
  description: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

// 3. Получить список всех задач, созданных текущим врачом
export const listDoctorTasks = async (): Promise<DoctorTaskResponse[]> => {
  const response = await apiClient.get<DoctorTaskResponse[]>('/api/v1/doctor/workspace/tasks');
  return response.data;
};

// 4. Назначить новую задачу наблюдения пациенту
export const createDoctorTask = async (payload: TaskCreateRequest): Promise<DoctorTaskResponse> => {
  const response = await apiClient.post<DoctorTaskResponse>('/api/v1/doctor/workspace/tasks', payload);
  return response.data;
};


// 1. Интерфейс ответа для сообщения чата строго по MessageResponse
export interface MessageResponse {
  id: number;
  thread_id: number;
  sender_id: number;
  role: string; // 'doctor' | 'patient' | 'assistant'
  content: string;
  is_read: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}

// 2. Интерфейс запроса на отправку сообщения
export interface SendMessageRequest {
  patient_id: number;
  content: string;
  metadata?: Record<string, any> | null;
}

// 3. Получить историю чата с конкретным пациентом
export const listMessages = async (patientId: number): Promise<MessageResponse[]> => {
  const response = await apiClient.get<MessageResponse[]>(`/api/v1/doctor/workspace/messages/${patientId}`);
  return response.data;
};

// 4. Отправить сообщение пациенту в чат
export const sendMessage = async (payload: SendMessageRequest): Promise<MessageResponse> => {
  const response = await apiClient.post<MessageResponse>('/api/v1/doctor/workspace/messages', payload);
  return response.data;
};
