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
