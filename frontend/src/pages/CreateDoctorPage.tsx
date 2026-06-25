import React, { useState } from 'react';
import { createDoctor, CreateDoctorRequest } from '../api/auth';

export const CreateDoctorPage: React.FC = () => {
  // Инициализируем стейт строго по Pydantic-схеме
  const [formData, setFormData] = useState<CreateDoctorRequest>({
    license_number: '',
    password: '',
    sex: '', // Будет выбираться через <select>
    specialty: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Обработчик изменения полей (работает и для input, и для select)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    // Валидация на заполненность всех полей
    if (!formData.license_number || !formData.password || !formData.sex || !formData.specialty) {
      setMessage({ type: 'error', text: 'Пожалуйста, заполните все обязательные поля' });
      setIsLoading(false);
      return;
    }

    try {
      await createDoctor(formData);
      setMessage({ type: 'success', text: `Врач с лицензией ${formData.license_number} успешно добавлен!` });
      // Сбрасываем форму после успешной отправки
      setFormData({ license_number: '', password: '', sex: '', specialty: '' });
    } catch (error: any) {
      const errorText = error.response?.data?.detail || 'Ошибка при создании аккаунта врача';
      setMessage({ type: 'error', text: errorText });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Панель Администратора
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Регистрация нового врача в системе
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
            {/* Поле: Номер лицензии */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Номер лицензии</label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="Например, ЛО-77-01-XXXXXX"
              />
            </div>

            {/* Поле: Пароль для врача */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Временный пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="••••••••"
              />
            </div>

            {/* Поле: Специализация */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Специализация</label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                placeholder="Терапевт, Хирург, Кардиолог"
              />
            </div>

            {/* Поле: Пол (Выпадающий список) */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Пол</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              >
                <option value="">Выберите пол...</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Сохранение...' : 'Создать учетную запись'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
