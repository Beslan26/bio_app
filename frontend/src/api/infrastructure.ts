import apiClient from './client';

// 1. Схема запроса на глобальный поиск
export interface GlobalSearchRequest {
  query: string;
  symptom_tag?: string | null;
  verification_status?: string | null;
  urgency?: string | null;
}

// 2. Универсальная схема ответа (подстраивается под структуру вашего SearchService)
export interface GlobalSearchResponse {
  patients?: any[];
  doctors?: any[];
  records?: any[];
  total_results?: number;
  [key: string]: any; // Гибкий ключ на случай других полей в словаре result
}

// 3. Функция глобального поиска
export const executeGlobalSearch = async (payload: GlobalSearchRequest): Promise<GlobalSearchResponse> => {
  const response = await apiClient.post<GlobalSearchResponse>('/api/v1/infrastructure/search', payload);
  return response.data;
};

// 4. Функция проверки здоровья инфраструктуры
export interface InfraHealthResponse {
  status: string;
  services: string[];
}

export const getInfraHealth = async (): Promise<InfraHealthResponse> => {
  const response = await apiClient.get<InfraHealthResponse>('/api/v1/infrastructure/health');
  return response.data;
};

// 1. Интерфейс ответа после успешной загрузки строго по FileUploadResponse
export interface FileUploadResponse {
  key: string;
  path: string;
  size_bytes: number;
  download_url: string;
}

// 2. Функция загрузки файла (FormData / Multipart)
export const uploadMedicalFile = async (file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  // Бэкенд ждет переменную с именем 'file' (file: UploadFile = File(...))
  formData.append('file', file);

  const response = await apiClient.post<FileUploadResponse>('/api/v1/infrastructure/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};


export interface NotifyRequest {
  user_id: number;
  channel: 'email' | 'sms' | 'push' | string;
  recipient: string;
  template_key: string;
  context: Record<string, string>;
  trigger_event: string;
}

export interface NotifyResponse {
  notification_log_id: number;
  status: string;
}

/**
 * Отправка системного уведомления по шаблону (только для роли admin)
 */
export async function sendSystemNotification(payload: NotifyRequest): Promise<NotifyResponse> {
  const { data } = await apiClient.post<NotifyResponse>('/infrastructure/notifications/send', payload);
  return data;
}


export interface AuditLogItem {
  id: number;
  user_id: number | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
}

/**
 * Поиск по глобальному журналу аудита (только для роли admin)
 */
export async function searchAuditLogs(filters: {
  action?: string;
  entity_type?: string;
  user_id?: number;
}): Promise<AuditLogItem[]> {
  const params = new URLSearchParams();
  if (filters.action) params.append('action', filters.action);
  if (filters.entity_type) params.append('entity_type', filters.entity_type);
  if (filters.user_id) params.append('user_id', String(filters.user_id));

  const { data } = await apiClient.get<AuditLogItem[]>(`/infrastructure/audit?${params.toString()}`);
  return data;
}


export interface AiAnalysisResponse {
  extracted_facts: string[];
  triage_status?: string;
  recommended_specialists?: string[];
}

/**
 * Выполняет AI-разбор текста жалобы пациента
 */
export async function analyzeComplaintText(text: string): Promise<AiAnalysisResponse> {
  const params = new URLSearchParams();
  params.append('text', text);

  const { data } = await apiClient.post<AiAnalysisResponse>(`/infrastructure/ai/analyze?${params.toString()}`);
  return data;
}
