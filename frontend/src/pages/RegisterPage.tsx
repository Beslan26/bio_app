import { FormEvent, useState } from 'react';
import axios from 'axios';
import { registerUser } from '../api/auth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === 'string') {
      return detail === 'Email already exists'
        ? 'Этот email уже зарегистрирован'
        : detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => (typeof item === 'object' && item !== null && 'msg' in item ? item.msg : String(item)))
        .join(', ');
    }
  }

  return 'Не удалось выполнить регистрацию. Попробуйте позже.';
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  function validate(): boolean {
    const errors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      errors.email = 'Введите email';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Введите корректный email';
    }

    if (!password) {
      errors.password = 'Введите пароль';
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.password = `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      await registerUser({ email: email.trim(), password });
      setIsSuccess(true);
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex justify-center items-start py-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-medical-100">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-medical-800">Регистрация</h2>
            <p className="mt-2 text-sm text-slate-500">
              Создайте аккаунт пациента в медицинском помощнике
            </p>
          </div>

          {serverError && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <svg
                className="mt-0.5 h-5 w-5 shrink-0 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{serverError}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="rounded-xl border border-accent-green/30 bg-emerald-50 px-4 py-5 text-center">
              <p className="font-medium text-emerald-800">Регистрация прошла успешно!</p>
              <p className="mt-1 text-sm text-emerald-600">
                Вы вошли в систему. Можно продолжить работу с приложением.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                  className={`w-full rounded-xl border px-4 py-2.5 text-slate-800 outline-none transition focus:ring-2 focus:ring-medical-300 ${
                    fieldErrors.email
                      ? 'border-red-300 bg-red-50'
                      : 'border-medical-200 bg-medical-50 focus:border-medical-400'
                  }`}
                  placeholder="example@mail.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Пароль
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`w-full rounded-xl border px-4 py-2.5 text-slate-800 outline-none transition focus:ring-2 focus:ring-medical-300 ${
                    fieldErrors.password
                      ? 'border-red-300 bg-red-50'
                      : 'border-medical-200 bg-medical-50 focus:border-medical-400'
                  }`}
                  placeholder="Минимум 8 символов"
                />
                {fieldErrors.password && (
                  <p className="mt-1.5 text-sm text-red-600">{fieldErrors.password}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-medical-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-medical-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading && (
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>

              {onSwitchToLogin && (
                <p className="text-center text-sm text-slate-500">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="font-medium text-medical-600 hover:text-medical-700 hover:underline"
                  >
                    Войти
                  </button>
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
