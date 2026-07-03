import React, { useEffect, useState } from 'react';
// 1. Импортируем хук навигации на странице DoctorComplaintsInboxPage:
import { useNavigate } from 'react-router-dom';
import { getComplaintsInbox, ClinicalComplaint } from '../api/doctor';


export const DoctorComplaintsInboxPage: React.FC = () => {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState<ClinicalComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInbox() {
      try {
        const data = await getComplaintsInbox();
        setComplaints(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить очередь жалоб');
      } finally {
        setIsLoading(false);
      }
    }
    loadInbox();
  }, []);

  // Вспомогательная функция для форматирования даты
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Клинический разбор</h1>
        <p className="mt-1 text-sm text-slate-500">
          Входящая очередь жалоб пациентов для оценки симптомов и первичного триажа.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20 gap-2 text-slate-500">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
          <span>Синхронизация очереди жалоб...</span>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500 shadow-sm">
          <svg className="mx-auto h-12 w-12 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="font-medium text-slate-700">Очередь пуста</p>
          <p className="text-sm text-slate-400 mt-1">Все входящие жалобы пациентов успешно разобраны.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {complaints.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900">
                      {item.patient_full_name || `Пациент ID: ${item.patient_id}`}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formatDate(item.created_at)}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Анамнез / Описание жалобы
                  </label>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50/50 border border-slate-100 p-3 rounded-lg whitespace-pre-line">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Кнопка действия с переходом в календарь */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => navigate('/doctor/appointments', {
                    state: { patient_id: item.patient_id, complaint_id: item.id }
                  })}
                  className="py-1.5 px-4 text-xs font-semibold rounded-lg text-white bg-teal-600 hover:bg-teal-700 transition"
                >
                  Запланировать прием
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
