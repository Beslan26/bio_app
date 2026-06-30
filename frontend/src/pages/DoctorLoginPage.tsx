import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginDoctor, DoctorLoginRequest } from '../api/auth';

export const DoctorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DoctorLoginRequest>({
    license_number: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.license_number || !formData.password) {
      setError('Пожалуйста, заполните все поля');
      setIsLoading(false);
      return;
    }

    try {
      const response = await loginDoctor(formData);
      // Успешно вошли! Перенаправляем врача на его дашборд
      // (Маршрут /doctor/dashboard создадим позже)
      navigate('/doctor/dashboard');
    } catch (err: any) {
      // Обработка статус-кодов из вашего FastAPI эндпоинта
      if (err.response?.status === 403) {
        setError('Доступ запрещен. Возможно, ваш аккаунт еще не верифицирован администратором.');
      } else if (err.response?.status === 401) {
        setError('Неверный номер лицензии или пароль.');
      } else {
        setError(err.response?.data?.detail || 'Произошла ошибка при входе. Попробуйте позже.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Вход для врачей
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Медицинский портал помощника
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-teal-100 ring-2 ring-teal-50/50">

          {error && (
            <div className="p-4 mb-4 rounded-md text-sm font-medium bg-rose-50 text-rose-800">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Номер лицензии</label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="ЛО-77-01-XXXXXX"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Авторизация...' : 'Войти в личный кабинет'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-medium text-slate-500 hover:text-slate-700 underline">
              Я пациент (Вход по Email)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
