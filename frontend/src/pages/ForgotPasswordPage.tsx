import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { requestPasswordRecovery } from '../api/auth';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Пожалуйста, введите ваш Email' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await requestPasswordRecovery({ email: email.trim() });

      // Если бэкенд вернул reset_token (пользователь найден)
      if (response.reset_token) {
        setMessage({ type: 'success', text: 'Инструкции сгенерированы. Перенаправляем на страницу сброса...' });
        // Через 2 секунды перенаправляем на страницу ввода нового пароля и передаем токен через state
        setTimeout(() => {
          navigate('/password-recovery/confirm', { state: { token: response.reset_token } });
        }, 2000);
      } else {
        // Из соображений безопасности бэкенд всегда пишет успех, даже если email нет в базе
        setMessage({
          type: 'success',
          text: 'Если аккаунт с таким Email существует, инструкции по восстановлению были успешно созданы.'
        });
      }
    } catch (error: any) {
      const errorText = error.response?.data?.detail || 'Произошла ошибка. Попробуйте позже.';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Восстановление пароля
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Введите ваш Email для получения инструкций
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
            <div>
              <label className="block text-sm font-medium text-slate-700">Email адрес</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
                placeholder="example@mail.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-medical-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Отправка...' : 'Восстановить пароль'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-700 underline">
              Вернуться на страницу входа
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
