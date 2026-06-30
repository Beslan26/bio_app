import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { confirmPasswordRecovery } from '../api/auth';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Извлекаем токен из state перенаправления (или пытаемся достать из URL параметров при необходимости)
  const stateToken = location.state?.token || '';

  const [token, setToken] = useState(stateToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Отсутствует секретный токен сброса' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Пароль должен содержать минимум 8 символов' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Пароли не совпадают' });
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordRecovery({
        token: token.trim(),
        new_password: newPassword
      });

      setMessage({ type: 'success', text: 'Пароль успешно обновлен! Сейчас вы будете перенаправлены на вход...' });

      // Через 3 секунды отправляем на логин
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      const errorText = error.response?.data?.detail || 'Невалидный или просроченный токен сброса.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Установка нового пароля
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Придумайте надежный пароль для вашего аккаунта
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">

          {message && (
            <div className={`p-4 mb-4 rounded-md text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
            }`}>
              {message.text}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Поле токена скрыто от глаз или заблокировано, если он передался автоматом */}
            {!stateToken && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Токен восстановления</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
                  placeholder="Вставьте токен из письма"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
                placeholder="Минимум 8 символов"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
                placeholder="Повторите ввод пароля"
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Сохранение...' : 'Обновить пароль'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-700 underline">
              Отмена
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
