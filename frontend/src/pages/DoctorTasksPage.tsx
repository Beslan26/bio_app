import React, { useEffect, useState } from 'react';
import { listDoctorTasks, createDoctorTask, DoctorTaskResponse, TaskCreateRequest } from '../api/doctor';

export const DoctorTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<DoctorTaskResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  // Форма новой задачи наблюдения
  const [formData, setFormData] = useState<TaskCreateRequest>({
    patient_id: 0,
    title: '',
    description: '',
    start_date: '',
    end_date: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const data = await listDoctorTasks();
      // Сортируем задачи: сначала те, которые начинаются позже (актуальные сверху)
      const sorted = data.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      setTasks(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить список медицинских задач');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'patient_id' ? (value ? Number(value) : 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formData.patient_id || !formData.title.trim() || !formData.description.trim() || !formData.start_date || !formData.end_date) {
      setFormMessage({ type: 'error', text: 'Пожалуйста, заполните все обязательные поля' });
      return;
    }

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      setFormMessage({ type: 'error', text: 'Дата окончания плана не может быть раньше даты начала' });
      return;
    }

    setIsSaving(true);
    try {
      await createDoctorTask({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });

      setFormMessage({ type: 'success', text: 'Задача-трекер успешно назначена пациенту!' });
      setFormData({ patient_id: 0, title: '', description: '', start_date: '', end_date: '' });
      await fetchTasks(); // Обновляем список задач на экране
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось сохранить задачу' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Задачи и Трекеры</h1>
        <p className="mt-1 text-sm text-slate-500">
          Назначение планов лечения, задач удаленного мониторинга и отслеживание выполнения предписаний.
        </p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: ФОРМА НАЗНАЧЕНИЯ ЗАДАЧИ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Назначить трекер</h2>

          {formMessage && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ID Пациента *</label>
              <input
                type="number" name="patient_id" required placeholder="Например: 12"
                value={formData.patient_id || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Название задачи *</label>
              <input
                type="text" name="title" required placeholder="Контроль артериального давления"
                value={formData.title} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Дата начала *</label>
                <input
                  type="date" name="start_date" required
                  value={formData.start_date} onChange={handleInputChange}
                  className="w-full text-sm rounded-lg border border-slate-300 px-2 py-1.5 bg-white outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Дата окончания *</label>
                <input
                  type="date" name="end_date" required
                  value={formData.end_date} onChange={handleInputChange}
                  className="w-full text-sm rounded-lg border border-slate-300 px-2 py-1.5 bg-white outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Инструкции и описание планов *</label>
              <textarea
                name="description" rows={4} required
                placeholder="Замерять АД утром и вечером перед приемом лекарств. Результаты заносить в application..."
                value={formData.description} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit" disabled={isSaving}
              className="w-full py-2 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2 h-10 shadow-sm"
            >
              {isSaving && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Выдать предписание
            </button>
          </form>
        </div>

       {/* ПРАВАЯ КОЛОНКА: СПИСОК ВСЕХ ВЫДАННЫХ ЗАДАЧ С ЛОГОМ ИЗМЕРЕНИЙ ПАЦИЕНТА */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Активные планы наблюдения</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Загрузка трекеров...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-sans">Задач мониторинга пока не создано.</div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {tasks.map((task) => {
                const isExpired = new Date(task.end_date).getTime() < new Date().setHours(0,0,0,0);
                const isOpen = activeTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => setActiveTaskId(isOpen ? null : task.id)}
                    className={`p-4 rounded-xl border transition-all duration-200 flex flex-col gap-2 cursor-pointer ${
                      isOpen
                        ? 'border-teal-500 bg-teal-50/10 shadow-sm'
                        : 'border-slate-100 bg-slate-50/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{task.title}</span>
                        <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100 font-medium">
                          Пациент ID: {task.patient_id}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                          isExpired
                            ? 'bg-slate-100 text-slate-500 border-slate-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isExpired ? 'Завершен' : 'Активен'}
                        </span>
                        <svg
                          className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-600' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 bg-white border border-slate-100 p-3 rounded-lg leading-relaxed whitespace-pre-line">
                      {task.description}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                      <span>Интервал мониторинга:</span>
                      <span className="text-slate-600 font-semibold">
                        📅 {formatDate(task.start_date)} — {formatDate(task.end_date)}
                      </span>
                    </div>

                    {/* ДИНАМИЧЕСКИЙ БЛОК: ИСТОРИЯ ПОКАЗАТЕЛЕЙ ПАЦИЕНТА (ОТКРЫВАЕТСЯ ПО КЛИКУ) */}
                    {isOpen && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          История отправленных показателей пациента:
                        </h3>

                        {!task.entries || task.entries.length === 0 ? (
                          <p className="text-xs text-slate-400 italic text-center py-4 bg-white border border-slate-100 rounded-lg">
                            Пациент еще не отправлял показатели по этой задаче.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {task.entries.map((entry) => (
                              <div key={entry.id} className="p-3 rounded-xl border border-slate-100 bg-white shadow-sm flex flex-col gap-1.5">
                                <div className="flex justify-between items-baseline gap-2">
                                  {/* Значение замера (например, 120/80) */}
                                  <span className="text-sm font-bold text-teal-700 bg-teal-50/60 border border-teal-100 px-2.5 py-0.5 rounded-md">
                                    {entry.value}
                                  </span>
                                  {/* Дата и время внесения */}
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {new Date(entry.timestamp).toLocaleString('ru-RU', {
                                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                    })}
                                  </span>
                                </div>

                                {/* Комментарий пациента, если он есть */}
                                {entry.patient_comment && (
                                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100/60 p-2 rounded-lg italic">
                                    "{entry.patient_comment}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
