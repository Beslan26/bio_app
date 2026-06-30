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

// 1. Схема запроса строго по DoctorLoginRequest
export interface DoctorLoginRequest {
  license_number: string;
  password: string;
}

// 2. Схема ответа, которую возвращает return бэкенда
export interface DoctorLoginResponse {
  access_token: string;
  user: {
    id: number | string;
    role: string; // Обычно 'doctor'
  };
}


// Схема запроса строго по PasswordRecoveryRequest
export interface PasswordRecoveryRequest {
  email: string;
}

// Схема ответа бэкенда
export interface PasswordRecoveryResponse {
  message: string;
  reset_token?: string; // Приходит, только если пользователь существует в БД
}

// Интерфейс ответа эндпоинта /refresh
export interface RefreshTokenResponse {
  access_token: string;
}

// Функция для обновления токена
export const refreshTokens = async (): Promise<RefreshTokenResponse> => {
  // Передаем пустой объект {}, так как бэкенд умеет брать токен из кук,
  // но Axios требует credentials для передачи кук
  const response = await client.post<RefreshTokenResponse>('/api/v1/auth/refresh', {});

  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }

  return response.data;
};




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


// 3. Функция авторизации врача
export const loginDoctor = async (data: DoctorLoginRequest): Promise<DoctorLoginResponse> => {
  const response = await client.post<DoctorLoginResponse>('/api/v1/auth/doctor/login', data);

  // Если у вас в client.ts уже настроено автоматическое сохранение токена при регистрации,
  // убедитесь, что оно сработает и здесь. Если нет — сохраняем вручную:
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }

  return response.data;
};


// Функция для инициации сброса пароля
export const requestPasswordRecovery = async (data: PasswordRecoveryRequest): Promise<PasswordRecoveryResponse> => {
  const response = await apiClient.post<PasswordRecoveryResponse>('/api/v1/auth/password-recovery/request', data);
  return response.data;
};
