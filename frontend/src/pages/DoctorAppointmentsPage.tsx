import React, { useEffect, useState } from 'react';
import { listAppointments, createAppointment, AppointmentResponse, AppointmentCreateRequest } from '../api/doctor';

export const DoctorAppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние формы нового приема
  const [formData, setFormData] = useState<AppointmentCreateRequest>({
    patient_id: 0,
    complaint_id: null,
    start_time: '',
    end_time: '',
    patient_priority: 5, // Дефолтный средний приоритет
    notes: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      const data = await listAppointments();
      // Сортируем приемы по времени начала
      const sorted = data.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      setAppointments(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить календарь приемов');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'patient_id' || name === 'patient_priority'
        ? (value ? Number(value) : null)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formData.patient_id || !formData.start_time || !formData.end_time) {
      setFormMessage({ type: 'error', text: 'Заполните ID пациента, время начала и окончания' });
      return;
    }

    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      setFormMessage({ type: 'error', text: 'Время окончания должно быть позже времени начала' });
      return;
    }

    setIsSaving(true);
    try {
      await createAppointment({
        ...formData,
        complaint_id: formData.complaint_id ? Number(formData.complaint_id) : null,
      });

      setFormMessage({ type: 'success', text: 'Прием успешно запланирован!' });
      setFormData({ patient_id: 0, complaint_id: null, start_time: '', end_time: '', patient_priority: 5, notes: '' });
      await fetchAppointments(); // Обновляем календарь на экране
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось создать запись приема' });
    } finally {
      setIsSaving(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('ru-RU', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Календарь приемов</h1>
        <p className="mt-1 text-sm text-slate-500">Управление графиком консультаций, планирование приемов и триаж приоритетов.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ЛЕВАЯ КОЛОНКА: ФОРМА ПЛАНИРОВАНИЯ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Назначить новый прием</h2>

          {formMessage && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ID Пациента *</label>
                <input
                  type="number" name="patient_id" required placeholder="12"
                  value={formData.patient_id || ''} onChange={handleInputChange}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">ID Жалобы (Опционально)</label>
                <input
                  type="number" name="complaint_id" placeholder="5"
                  value={formData.complaint_id || ''} onChange={handleInputChange}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Начало приема *</label>
                <input
                  type="datetime-local" name="start_time" required
                  value={formData.start_time} onChange={handleInputChange}
                  className="w-full text-sm rounded-lg border border-slate-300 px-2 py-1.5 bg-white outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Окончание приема *</label>
                <input
                  type="datetime-local" name="end_time" required
                  value={formData.end_time} onChange={handleInputChange}
                  className="w-full text-sm rounded-lg border border-slate-300 px-2 py-1.5 bg-white outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Приоритет пациента (1 - 10)</label>
              <input
                type="range" name="patient_priority" min="1" max="10"
                value={formData.patient_priority || 5} onChange={handleInputChange}
                className="w-full accent-teal-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-medium px-1 mt-1">
                <span>1 (Низкий)</span>
                <span className="text-teal-700 font-bold">Текущий: {formData.patient_priority}</span>
                <span>10 (Критический)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Заметки / Жалобы</label>
              <textarea
                name="notes" rows={3} placeholder="Цель визита, клинические особенности..."
                value={formData.notes || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit" disabled={isSaving}
              className="w-full py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isSaving && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Запланировать прием
            </button>
          </form>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЛЕНТА ПРИЕМОВ (КАЛЕНДАРЬ) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Ближайшие консультации</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm">Синхронизация календаря...</div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-sans">Приемов пока не запланировано.</div>
          ) : (
            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-2">
              {appointments.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-teal-200 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900">Пациент ID: {item.patient_id}</span>
                      {item.complaint_id && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                          Жалоба #{item.complaint_id}
                        </span>
                      )}
                      {item.patient_priority && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                          item.patient_priority >= 8
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : item.patient_priority >= 5
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          Приоритет: {item.patient_priority}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-4 text-xs text-slate-500 font-medium pt-0.5">
                      <span className="text-teal-700 font-semibold">🕒 {formatDateTime(item.start_time)}</span>
                      <span>—</span>
                      <span>{new Date(item.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-slate-600 bg-white/80 border border-slate-100 p-2 rounded-lg mt-1 whitespace-pre-line italic">
                        "{item.notes}"
                      </p>
                    )}
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-200/50 self-start sm:self-center">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
