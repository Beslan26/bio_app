import apiClient, { setAccessToken } from './client';

export interface UserResponse {
  id: number;
  role: string;
  status: string;
  last_login: string | null;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  id: number;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: LoginUserResponse;
}

export interface CreateDoctorRequest {
  license_number: string;
  password: string;
  sex: string; // Можно уточнить типы, если на бэкенде Enum, например: 'male' | 'female'
  specialty: string;
}

// 2. Описываем интерфейс ответа от бэкенда
export interface CreateDoctorResponse {
  id: string | number; // Идентификатор, который присвоила база данных
  license_number: string;
  specialty: string;
  sex: string;
  role?: string; // Если бэкенд возвращает роль пользователя
}

export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiClient.post<RegisterResponse>('/api/v1/auth/register', data);
  setAccessToken(response.data.access_token);
  return response.data;
}

export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data);
  setAccessToken(response.data.access_token);
  return response.data;
}

// 3. Пишем саму функцию запроса
export const createDoctor = async (data: CreateDoctorRequest): Promise<CreateDoctorResponse> => {
  // Наш Axios-клиент сам подставит базовый URL и токен админа из localStorage
  const response = await client.post<CreateDoctorResponse>('/api/v1/auth/admin/create-doctor', data);
  return response.data;
};
