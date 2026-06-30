import React, { useEffect, useState } from 'react';
import { upsertSpecialization, listSpecializations, SpecializationUpsertRequest, SpecializationResponse } from '../api/admin';

export const AdminSpecializationsPage: React.FC = () => {
  // Список всех специализаций для вывода в таблицу/список
  const [specializations, setSpecializations] = useState<SpecializationResponse[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Состояние формы
  const [formData, setFormData] = useState<SpecializationUpsertRequest>({
    name: '',
    description: '',
    category: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Загрузка списка специализаций при старте страницы
  const fetchSpecs = async () => {
    setIsListLoading(true);
    try {
      const data = await listSpecializations();
      setSpecializations(data);
    } catch (err: any) {
      setListError(err.response?.data?.detail || 'Не удалось загрузить список специализаций');
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchSpecs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  // Клик по элементу списка для его редактирования
  const handleEditClick = (spec: SpecializationResponse) => {
    setFormData({
      name: spec.name,
      description: spec.description || '',
      category: spec.category || '',
    });
    setMessage(null);
    // Прокрутка к форме на мобилках
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Название специализации обязательно' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await upsertSpecialization({
        name: formData.name.trim(),
        description: formData.description ? formData.description.trim() : null,
        category: formData.category ? formData.category.trim() : null,
      });

      setMessage({
        type: 'success',
        text: `Специализация "${response.name}" успешно сохранена!`,
      });

      // Очищаем форму и обновляем список из базы данных
      setFormData({ name: '', description: '', category: '' });
      await fetchSpecs();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Не удалось сохранить специализацию',
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Справочник специализаций</h1>
        <p className="mt-1 text-sm text-slate-500">
          Управление медицинскими направлениями платформы. Повторный ввод существующего имени обновит его данные.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ФОРМА ДОБАВЛЕНИЯ / ОБНОВЛЕНИЯ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Управление записью</h2>

          {message && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Название специализации <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" name="name" required placeholder="Например: Кардиолог"
                value={formData.name} onChange={handleChange}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Категория</label>
              <input
                type="text" name="category" placeholder="Например: Хирургия"
                value={formData.category || ''} onChange={handleChange}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Описание направления</label>
              <textarea
                name="description" rows={3} placeholder="Описание болезней и специфики приема..."
                value={formData.description || ''} onChange={handleChange}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              {formData.name && (
                <button
                  type="button"
                  onClick={() => { setFormData({ name: '', description: '', category: '' }); setMessage(null); }}
                  className="w-1/3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Сброс
                </button>
              )}
              <button
                type="submit" disabled={isLoading}
                className="flex-1 py-2 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLoading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Сохранить
              </button>
            </div>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЖИВОЙ СПИСОК ИЗ БАЗЫ ДАННЫХ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 p-6 pb-2">Существующие направления</h2>

          {listError && <div className="m-6 p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{listError}</div>}

          <div className="p-6 pt-2">
            {isListLoading ? (
              <div className="flex justify-center items-center py-10 gap-2 text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
                <span className="text-sm">Загрузка справочника...</span>
              </div>
            ) : specializations.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Справочник специализаций пока пуст.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {specializations.map((spec) => (
                  <div key={spec.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-medical-200 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm text-slate-900">{spec.name}</h4>
                        {spec.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-medical-50 text-medical-700 border border-medical-100">
                            {spec.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{spec.description || <span className="italic text-slate-400">Нет описания</span>}</p>
                    </div>

                    <button
                      type="button" onClick={() => handleEditClick(spec)}
                      className="text-xs font-semibold text-medical-600 hover:text-medical-800 hover:underline self-start sm:self-center"
                    >
                      Редактировать
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
