import apiClient from './client';

// 1. Интерфейс пользователя для каталога админа
export interface AdminUserResponse {
  id: number;
  email: string | null;
  role: string;   // 'patient' | 'doctor' | 'admin'
  status: string; // 'active' | 'inactive' | 'blocked' и т.д.
  created_at: string;
  last_login: string | null;
}

// 2. Интерфейс для параметров фильтрации
export interface UserFilters {
  role?: string;
  status?: string;
}

// 1. Интерфейс для PATCH запроса обновления пользователя
export interface AdminUserUpdateRequest {
  role?: string | null;
  status?: string | null;
  reason?: string | null;
}






// 3. Функция получения списка пользователей
export const listUsers = async (filters?: UserFilters): Promise<AdminUserResponse[]> => {
  const response = await apiClient.get<AdminUserResponse[]>('/api/v1/admin/control/users', {
    params: {
      role: filters?.role || undefined,
      // На бэкенде используется алиас status для параметра status_value
      status: filters?.status || undefined,
    },
  });
  return response.data;
};


// 2. Функция для обновления роли или статуса пользователя
export const updateUserAccess = async (
  userId: number,
  payload: AdminUserUpdateRequest
): Promise<AdminUserResponse> => {
  const response = await apiClient.patch<AdminUserResponse>(
    `/api/v1/admin/control/users/${userId}`,
    payload
  );
  return response.data;
};


// Функция для безвозвратного удаления пользователя (Hard Delete по GDPR)
export const hardDeleteUser = async (userId: number, reason?: string | null): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/api/v1/admin/control/users/${userId}`, {
    params: {
      // Бэкенд ждет параметр reason в Query строке
      reason: reason || undefined,
    },
  });
  return response.data;
};


// 1. Интерфейс карточки врача для верификации
export interface DoctorItemResponse {
  id: number;
  user_id: number;
  license_number: string;
  specialty: string;
  verification_status: string; // Обычно 'pending'
  verified_at: string | null;
}

// 2. Функция получения списка врачей, ожидающих проверки
export const listPendingDoctors = async (): Promise<DoctorItemResponse[]> => {
  const response = await apiClient.get<DoctorItemResponse[]>('/api/v1/admin/control/doctors/pending');
  return response.data;
};


// 1. Интерфейс запроса верификации врача
export interface DoctorVerificationRequest {
  status: 'verified' | 'rejected'; // Значения вашего DoctorVerificationStatus.value
  reason?: string | null;
}

// 2. Функция отправки решения по верификации
export const verifyDoctor = async (
  doctorId: number,
  payload: DoctorVerificationRequest
): Promise<DoctorItemResponse> => {
  const response = await apiClient.post<DoctorItemResponse>(
    `/api/v1/admin/control/doctors/${doctorId}/verification`,
    payload
  );
  return response.data;
};


// 1. Интерфейс запроса для создания подтверждения лицензии
export interface LicenseProofCreateRequest {
  doctor_id: number;
  file_url: string;
}

// 2. Интерфейс ответа от бэкенда
export interface LicenseProofResponse {
  id: number;
  doctor_id: number;
  file_url: string;
  status: string; // Обычно 'valid'
  reviewer_id: number | null;
  review_date: string | null;
}

// 3. Функция отправки документа
export const createLicenseProof = async (
  payload: LicenseProofCreateRequest
): Promise<LicenseProofResponse> => {
  const response = await apiClient.post<LicenseProofResponse>(
    '/api/v1/admin/control/license-proofs',
    payload
  );
  return response.data;
};


// 1. Интерфейс запроса для ревью документа лицензии
export interface LicenseProofReviewRequest {
  status: 'valid' | 'invalid';
}

// 2. Функция отправки ревью документа
export const reviewLicenseProof = async (
  proofId: number,
  payload: LicenseProofReviewRequest
): Promise<LicenseProofResponse> => {
  const response = await apiClient.post<LicenseProofResponse>(
    `/api/v1/admin/control/license-proofs/${proofId}/review`,
    payload
  );
  return response.data;
};


// Функция получения списка всех загруженных документов лицензий
export const listLicenseProofs = async (doctorId?: number): Promise<LicenseProofResponse[]> => {
  const response = await apiClient.get<LicenseProofResponse[]>('/api/v1/admin/control/license-proofs', {
    params: {
      doctor_id: doctorId || undefined,
    },
  });
  return response.data;
};


// 1. Интерфейс запроса для создания/обновления специализации
export interface SpecializationUpsertRequest {
  name: string;
  description: string | null;
  category: string | null;
}

// 2. Интерфейс ответа от бэкенда
export interface SpecializationResponse {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
}

// 3. Функция отправки (создания/обновления) специализации
export const upsertSpecialization = async (
  payload: SpecializationUpsertRequest
): Promise<SpecializationResponse> => {
  const response = await apiClient.put<SpecializationResponse>(
    '/api/v1/admin/control/specializations',
    payload
  );
  return response.data;
};


// Функция получения списка всех медицинских специализаций
export const listSpecializations = async (): Promise<SpecializationResponse[]> => {
  const response = await apiClient.get<SpecializationResponse[]>('/api/v1/admin/control/specializations');
  return response.data;
};


// 1. Интерфейс запроса для создания/обновления системного параметра
export interface SystemConfigUpsertRequest {
  key: string;
  value: string;
  description: string | null;
}

// 2. Интерфейс ответа от бэкенда
export interface SystemConfigResponse {
  id: number;
  key: string;
  value: string;
  description: string | null;
  created_at: string;
}

// 3. Функция отправки (создания/обновления) системного параметра
export const upsertSystemConfig = async (
  payload: SystemConfigUpsertRequest
): Promise<SystemConfigResponse> => {
  const response = await apiClient.put<SystemConfigResponse>(
    '/api/v1/admin/control/system-configs',
    payload
  );
  return response.data;
};


// Функция получения списка всех системных конфигураций
export const listSystemConfigs = async (): Promise<SystemConfigResponse[]> => {
  const response = await apiClient.get<SystemConfigResponse[]>('/api/v1/admin/control/system-configs');
  return response.data;
};


// 1. Интерфейс записи журнала аудита
export interface AuditLogResponse {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

// 2. Интерфейс для фильтров аудита
export interface AuditFilters {
  action?: string;
  entity_type?: string;
}

// 3. Функция получения логов аудита
export const searchAuditLogs = async (filters?: AuditFilters): Promise<AuditLogResponse[]> => {
  const response = await apiClient.get<AuditLogResponse[]>('/api/v1/admin/control/audit-logs', {
    params: {
      action: filters?.action || undefined,
      entity_type: filters?.entity_type || undefined,
    },
  });
  return response.data;
};

// 4. Функция получения состояния системы (Health Check)
// Поскольку тип ответа зависит от вашей БД, сделаем гибкий Record
export const getSystemHealthSnapshot = async (): Promise<Record<string, any>> => {
  const response = await apiClient.get<Record<string, any>>('/api/v1/admin/control/health');
  return response.data;
};
