import React, { useEffect, useState } from 'react';
import { upsertSystemConfig, listSystemConfigs, SystemConfigUpsertRequest, SystemConfigResponse } from '../api/admin';

export const AdminConfigsPage: React.FC = () => {
  // Список всех параметров из базы данных
  const [configs, setConfigs] = useState<SystemConfigResponse[]>([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // Состояние формы ввода
  const [formData, setFormData] = useState<SystemConfigUpsertRequest>({
    key: '',
    value: '',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Функция загрузки списка конфигураций
  const fetchConfigs = async () => {
    setIsListLoading(true);
    try {
      const data = await listSystemConfigs();
      setConfigs(data);
    } catch (err: any) {
      setListError(err.response?.data?.detail || 'Не удалось загрузить системные параметры');
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || null }));
  };

  // Клик по параметру для его быстрого редактирования
  const handleEditClick = (config: SystemConfigResponse) => {
    setFormData({
      key: config.key,
      value: config.value,
      description: config.description || '',
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key.trim() || !formData.value.trim()) {
      setMessage({ type: 'error', text: 'Ключ и значение обязательны' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      await upsertSystemConfig({
        key: formData.key.trim().toUpperCase(),
        value: formData.value.trim(),
        description: formData.description ? formData.description.trim() : null,
      });

      setMessage({
        type: 'success',
        text: `Параметр успешно сохранен!`,
      });

      setFormData({ key: '', value: '', description: '' });
      await fetchConfigs(); // Перезагружаем список с бэкенда
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.detail || 'Не удалось сохранить параметр',
      });
    } finally { // Опечатка с double L исправлена!
      setIsLoading(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Системные конфигурации</h1>
        <p className="mt-1 text-sm text-slate-500">
          Управление мастер-данными и техническими константами медицинского помощника.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ФОРМА ДОБАВЛЕНИЯ / ИЗМЕНЕНИЯ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Сохранить параметр</h2>

          {message && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ключ (Key) *</label>
              <input
                type="text" name="key" required placeholder="MAX_AI_REQUESTS"
                value={formData.key} onChange={handleChange}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Значение (Value) *</label>
              <input
                type="text" name="value" required placeholder="50"
                value={formData.value} onChange={handleChange}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Описание константы</label>
              <textarea
                name="description" rows={3} placeholder="За что отвечает этот параметр..."
                value={formData.description || ''} onChange={handleChange}
                className="w-full text-sm rounded-xl border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
              />
            </div>

            <div className="pt-2 flex gap-2">
              {formData.key && (
                <button
                  type="button"
                  onClick={() => { setFormData({ key: '', value: '', description: '' }); setMessage(null); }}
                  className="w-1/3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Сбросить
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

        {/* ПРАВАЯ КОЛОНКА: ТАБЛИЦА С КОНФИГУРАЦИЯМИ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 p-6 pb-2">Текущие настройки системы</h2>

          {listError && <div className="m-6 p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{listError}</div>}

          <div className="p-6 pt-2">
            {isListLoading ? (
              <div className="flex justify-center items-center py-10 gap-2 text-slate-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
                <span className="text-sm">Загрузка параметров...</span>
              </div>
            ) : configs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Конфигурации не найдены.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {configs.map((cfg) => (
                  <div key={cfg.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-medical-200 transition-colors">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-slate-900 bg-slate-200/60 px-1.5 py-0.5 rounded">
                          {cfg.key}
                        </span>
                        <span className="text-sm font-semibold text-medical-600">
                          = {cfg.value}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {cfg.description || <span className="italic text-slate-400">Описание отсутствует</span>}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Создан: {new Date(cfg.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>

                    <button
                      type="button" onClick={() => handleEditClick(cfg)}
                      className="text-xs font-semibold text-medical-600 hover:text-medical-800 hover:underline self-start sm:self-center shrink-0"
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
