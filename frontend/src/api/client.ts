import axios from 'axios';
import { refreshTokens } from './auth'; // Импортируем функцию обновления (ее мы добавили в auth.ts)

const ACCESS_TOKEN_KEY = 'access_token';

// Ваши существующие функции-помощники для работы с localStorage
export function setAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

// Создание инстанса Axios
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // КРИТИЧЕСКИ ВАЖНО для автоматической отправки refresh_token в куках
});

// Перехватчик для автоматического добавления токена к каждому исходящему запросу
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Служебные переменные для управления очередью запросов во время обновления токена
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

// Перехватчик ответов: ловит ошибку 401 и бесшовно запрашивает новый токен через /refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если бэкенд ответил 401 (Unauthorized) и этот запрос еще не пытался повториться
    if (error.response?.status === 401 && !originalRequest._retry) {

      // Если 401 ошибку вернул сам эндпоинт /refresh — значит, кука тоже просрочена.
      // В этом случае нужно очистить токен и разлогинить пользователя.
      if (originalRequest.url?.includes('/auth/refresh')) {
        clearAccessToken();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      // Если процесс обновления токена уже запущен другим параллельным запросом,
      // ставим этот запрос в очередь ожидания
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // Запрашиваем новый токен у бэкенда (функция сама сохранит его в localStorage)
        const data = await refreshTokens();
        const newAccessToken = data.access_token;

        isRefreshing = false;
        processQueue(null, newAccessToken);

        // Повторяем изначальный упавший запрос со свежим токеном
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);
        clearAccessToken(); // Очищаем токен при неудачном рефреше
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
