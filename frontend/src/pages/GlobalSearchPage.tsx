import React, { useState } from 'react';
import { executeGlobalSearch, GlobalSearchResponse, GlobalSearchRequest } from '../api/infrastructure';

export const GlobalSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [symptomTag, setSymptomTag] = useState('');
  const [urgency, setUrgency] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');

  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Текущая активная вкладка для просмотра результатов
  const [activeTab, setActiveTab] = useState<'patients' | 'doctors' | 'records'>('patients');

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !symptomTag.trim()) {
      setError('Введите поисковый запрос или выберите тег симптома');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const payload: GlobalSearchRequest = {
        query: query.trim(),
        symptom_tag: symptomTag.trim() || null,
        urgency: urgency || null,
        verification_status: verificationStatus || null,
      };

      const data = await executeGlobalSearch(payload);
      setResults(data);

      // Автоматически переключаем на вкладку, где есть результаты
      if (data.patients && data.patients.length > 0) setActiveTab('patients');
      else if (data.doctors && data.doctors.length > 0) setActiveTab('doctors');
      else if (data.records && data.records.length > 0) setActiveTab('records');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка выполнения глобального поиска');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Глобальный сквозной поиск</h1>
        <p className="mt-1 text-sm text-slate-500">Поиск по медицинским картам, профилям врачей и базе пациентов с учетом симптомов и срочности.</p>
      </div>

      {/* ФОРМА С РАСШИРЕННЫМИ ФИЛЬТРАМИ */}
      <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Введите ключевые слова для поиска (ФИО, диагноз, жалобы, email)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-medical-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-medical-600 hover:bg-medical-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {isLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Поиск
          </button>
        </div>

        {/* Дополнительные смарт-фильтры */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Тег симптома</label>
            <input
              type="text"
              placeholder="Например: головная_боль"
              value={symptomTag}
              onChange={(e) => setSymptomTag(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 outline-none focus:border-medical-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Срочность (Urgency)</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 outline-none focus:border-medical-500"
            >
              <option value="">Любая срочность</option>
              <option value="high">Высокая (Критично)</option>
              <option value="medium">Средняя</option>
              <option value="low">Низкая (Планово)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Статус врача (Для верификации)</label>
            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 bg-slate-50 outline-none focus:border-medical-500"
            >
              <option value="">Все статусы</option>
              <option value="verified">Verified (Подтвержден)</option>
              <option value="pending">Pending (Ожидает)</option>
              <option value="rejected">Rejected (Отклонен)</option>
            </select>
          </div>
        </div>
      </form>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      {/* ВЫВОД РЕЗУЛЬТАТОВ ПОИСКА */}
      {results && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {/* Переключатель вкладок результатов */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('patients')}
              className={`px-4 py-2.5 rounded-t-xl transition-all ${activeTab === 'patients' ? 'bg-white text-medical-700 border-t border-x border-slate-200 -mb-[1px] font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Пациенты ({results.patients?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2.5 rounded-t-xl transition-all ${activeTab === 'doctors' ? 'bg-white text-medical-700 border-t border-x border-slate-200 -mb-[1px] font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Врачи ({results.doctors?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2.5 rounded-t-xl transition-all ${activeTab === 'records' ? 'bg-white text-medical-700 border-t border-x border-slate-200 -mb-[1px] font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Медицинские записи ({results.records?.length || 0})
            </button>
          </div>

          {/* Содержимое вкладок */}
          <div className="p-6">
            {activeTab === 'patients' && (
              <div className="space-y-2">
                {(!results.patients || results.patients.length === 0) ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">Пациенты не найдены.</p>
                ) : (
                  results.patients.map((p: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                      <span className="font-semibold text-slate-900">{p.full_name || `Пациент ID: ${p.id}`}</span>
                      <span className="text-xs font-mono text-slate-400">User ID: {p.user_id}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'doctors' && (
              <div className="space-y-2">
                {(!results.doctors || results.doctors.length === 0) ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">Врачи не найдены.</p>
                ) : (
                  results.doctors.map((d: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                      <div>
                        <span className="font-semibold text-slate-900">{d.specialty}</span>
                        <span className="text-xs text-slate-400 ml-2 font-mono">Лицензия: {d.license_number}</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-teal-50 text-teal-700 border border-teal-100 uppercase">{d.verification_status}</span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-3">
                {(!results.records || results.records.length === 0) ? (
                  <p className="text-sm text-slate-400 italic text-center py-6">Медицинские записи не найдены.</p>
                ) : (
                  results.records.map((r: any, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="font-bold text-medical-700 font-sans text-sm">{r.diagnosis_text}</span>
                        <span>МКБ: {r.icd_code || '—'}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed pt-1 italic">"{r.consultation_notes}"</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
