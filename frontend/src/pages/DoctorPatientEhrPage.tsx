import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listDiagnoses, createDiagnosis, DiagnosisResponse, DiagnosisCreateRequest } from '../api/doctor';

export const DoctorPatientEhrPage: React.FC = () => {
  // Извлекаем patient_id из параметров URL строки
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const numericPatientId = Number(patientId);

  const [diagnoses, setDiagnoses] = useState<DiagnosisResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние формы для новой записи в карту
  const [formData, setFormData] = useState<Omit<DiagnosisCreateRequest, 'patient_id'>>({
    diagnosis_text: '',
    icd_code: '',
    type: 'preliminary',
    consultation_notes: '',
    recommendation: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchEhrHistory = async () => {
    if (!numericPatientId) return;
    setIsLoading(true);
    try {
      const data = await listDiagnoses(numericPatientId);
      // Сортируем от новых к старым (хронология)
      const sorted = data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setDiagnoses(sorted);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить медицинскую карту пациента');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEhrHistory();
  }, [patientId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    if (!formData.diagnosis_text.trim()) {
      setFormMessage({ type: 'error', text: 'Текст диагноза обязателен для заполнения' });
      return;
    }

    setIsSaving(true);
    try {
      await createDiagnosis({
        patient_id: numericPatientId,
        diagnosis_text: formData.diagnosis_text.trim(),
        icd_code: formData.icd_code?.trim() || null,
        type: formData.type,
        consultation_notes: formData.consultation_notes?.trim() || null,
        recommendation: formData.recommendation?.trim() || null,
      });

      setFormMessage({ type: 'success', text: 'Диагностическая запись успешно внесена в карту!' });
      setFormData({ diagnosis_text: '', icd_code: '', type: 'preliminary', consultation_notes: '', recommendation: '' });
      await fetchEhrHistory(); // Перезагружаем хронологию на экране
    } catch (err: any) {
      setFormMessage({ type: 'error', text: err.response?.data?.detail || 'Ошибка добавления диагноза' });
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Кнопка назад */}
      <button
        onClick={() => navigate('/doctor/patients')}
        className="text-xs font-semibold text-slate-500 hover:text-teal-700 flex items-center gap-1 transition-colors"
      >
        ← Вернуться к списку пациентов
      </button>

      <div>
        <h1 className="text-2xl font-bold text-slate-950">Электронная медицинская карта</h1>
        <p className="mt-1 text-sm text-slate-500">Пациент ID: <span className="font-mono text-slate-800 font-bold">{patientId}</span>. Просмотр анамнеза и документирование текущего приема.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ЛЕВАЯ КОЛОНКА: ИСТОРИЯ БОЛЕЗНИ (ХРОНОЛОГИЯ) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 px-1">История диагнозов и приемов</h2>

          {isLoading ? (
            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">Загрузка медицинской карты...</div>
          ) : diagnoses.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm font-sans bg-white rounded-xl border border-slate-200 shadow-sm">Записей в карте этого пациента пока нет.</div>
          ) : (
            <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2">
              {diagnoses.map((diag) => (
                <div key={diag.id} className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm space-y-3 relative hover:border-teal-100 transition-colors">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        diag.type === 'final'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {diag.type === 'final' ? 'Финальный' : 'Предварительный'}
                      </span>
                      {diag.icd_code && (
                        <span className="text-xs bg-slate-100 border border-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded-lg">
                          МКБ-10: {diag.icd_code}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      📅 {new Date(diag.created_at).toLocaleString('ru-RU')} (Врач ID: {diag.doctor_id})
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{diag.diagnosis_text}</h4>
                  </div>

                  {diag.consultation_notes && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Клинические заметки / Жалобы</label>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-2 rounded-lg border border-slate-100 whitespace-pre-line italic">
                        "{diag.consultation_notes}"
                      </p>
                    </div>
                  )}

                  {diag.recommendation && (
                    <div>
                      <label className="block text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-0.5">Лист назначений и рекомендации</label>
                      <p className="text-xs text-teal-900 bg-teal-50/30 p-2.5 rounded-lg border border-teal-100/50 whitespace-pre-line">
                        {diag.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Врач сразу видит графики показателей пациента в его цифровой карте */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-4">
          <PatientAnalyticsCharts patientId={numericPatientId} />
        </div>


        {/* ПРАВАЯ КОЛОНКА: ФОРМА ОСМОТРА И ЗАПОЛНЕНИЯ КАРТЫ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Внести новую запись</h2>

          {formMessage && (
            <div className={`p-4 mb-4 rounded-xl text-sm font-medium border ${
              formMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {formMessage.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Тип диагноза *</label>
              <select
                name="type" value={formData.type} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              >
                <option value="preliminary">Preliminary (Предварительный)</option>
                <option value="final">Final (Заключительный)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Диагноз (Основное заключение) *</label>
              <input
                type="text" name="diagnosis_text" required placeholder="Например: ОРВИ легкой степени"
                value={formData.diagnosis_text} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Код по МКБ-10 (Опционально)</label>
              <input
                type="text" name="icd_code" placeholder="Например: J06.9"
                value={formData.icd_code || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Жалобы и статус осмотра (Заметки)</label>
              <textarea
                name="consultation_notes" rows={3} placeholder="Жалобы на кашель, температура 37.5, зев гиперемирован..."
                value={formData.consultation_notes || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-teal-700 mb-1">Рекомендации и лечение</label>
              <textarea
                name="recommendation" rows={3} placeholder=" Обильное питье, симптоматическая терапия, контроль через 3 дня..."
                value={formData.recommendation || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-teal-500"
              />
            </div>

            <button
              type="submit" disabled={isSaving}
              className="w-full py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isSaving && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Внести запись в ЭМК
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
