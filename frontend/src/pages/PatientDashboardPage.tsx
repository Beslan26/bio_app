import React, { useEffect, useState } from 'react';
import {
  getPatientWorkspaceProfile,
  updatePatientWorkspaceProfile,
  getDiagnosesTimeline,
  getHealthSnapshot,
  PatientProfileResponse,
  PatientProfileUpdateRequest,
  PatientTimelineDiagnosis,
  HealthSnapshotResponse
} from '../api/patient';

export const PatientDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [timeline, setTimeline] = useState<PatientTimelineDiagnosis[]>([]);
  const [snapshot, setSnapshot] = useState<HealthSnapshotResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Режим редактирования анкеты
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<PatientProfileUpdateRequest>({
    full_name: '',
    birth_date: '',
    gender: '',
    blood_type: '',
    contact_details: '',
    emergency_contact: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Параллельно загружаем анкету профиля, таймлайн диагнозов и снимок аналитики
      const [profileData, timelineData, snapshotData] = await Promise.all([
        getPatientWorkspaceProfile(),
        getDiagnosesTimeline(),
        getHealthSnapshot()
      ]);

      setProfile(profileData);
      setSnapshot(snapshotData);

      const sortedTimeline = timelineData.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setTimeline(sortedTimeline);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные личного кабинета');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleStartEdit = () => {
    if (!profile) return;
    setEditForm({
      full_name: profile.full_name || '',
      birth_date: profile.birth_date || '',
      gender: profile.gender || '',
      blood_type: profile.blood_type || '',
      contact_details: profile.contact_details || '',
      emergency_contact: profile.emergency_contact || '',
    });
    setSaveMessage(null);
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value || null }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updated = await updatePatientWorkspaceProfile({
        full_name: editForm.full_name?.trim() || null,
        birth_date: editForm.birth_date || null,
        gender: editForm.gender || null,
        blood_type: editForm.blood_type || null,
        contact_details: editForm.contact_details?.trim() || null,
        emergency_contact: editForm.emergency_contact?.trim() || null,
      });
      setProfile(updated);
      setSaveMessage({ type: 'success', text: 'Данные профиля успешно сохранены в системе!' });
      setIsEditing(false);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось обновить анкету' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 gap-2 text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
        <span>Синхронизация медицинского кабинета...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium shadow-sm">
          {error}
        </div>
      </div>
    );
  }
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {saveMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Шапка личного кабинета пациента */}
      <div className="bg-gradient-to-r from-medical-600 to-sky-700 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{profile?.full_name || <span className="italic opacity-60">Имя не указано</span>}</h1>
            <p className="text-sky-100 text-sm mt-1">Личный кабинет электронной медицинской карты</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded-lg">Карта ID: #{profile?.id}</span>
            {!isEditing && (
              <button
                type="button" onClick={handleStartEdit}
                className="mt-1 text-xs font-semibold bg-white text-medical-700 px-4 py-2 rounded-xl shadow hover:bg-sky-50 transition"
              >
                Редактировать анкету
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ЛЕВАЯ КОЛОНКА: Маркеры здоровья + Виджет ИИ-Аналитики */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-1">Медицинские маркеры</h3>
            <div>
              <label className="block text-xs text-slate-400">Группа крови</label>
              {isEditing ? (
                <input
                  type="text" name="blood_type" placeholder="Например: A(II) Rh+"
                  value={editForm.blood_type || ''} onChange={handleInputChange}
                  className="mt-1 w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 outline-none focus:border-medical-500"
                />
              ) : (
                <span className="text-lg font-bold text-rose-600 mt-0.5 block">{profile?.blood_type || 'Не указана'}</span>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs text-slate-400">Биологический пол</label>
              {isEditing ? (
                <select
                  name="gender" value={editForm.gender || ''} onChange={handleInputChange}
                  className="mt-1 w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 outline-none focus:border-medical-500"
                >
                  <option value="">Не указан</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              ) : (
                <span className="text-sm font-semibold text-slate-800 mt-0.5 block uppercase">
                  {profile?.gender === 'male' ? 'Мужской' : profile?.gender === 'female' ? 'Женский' : '—'}
                </span>
              )}
            </div>

            <div className="border-t border-slate-100 pt-3">
              <label className="block text-xs text-slate-400">Дата рождения</label>
              {isEditing ? (
                <input
                  type="date" name="birth_date" value={editForm.birth_date || ''} onChange={handleInputChange}
                  className="mt-1 w-full text-sm rounded-lg border border-slate-300 px-2 py-1.5 bg-white text-slate-800 outline-none focus:border-medical-500"
                />
              ) : (
                <span className="text-sm font-medium text-slate-800 mt-0.5 block">
                  {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('ru-RU') : '—'}
                </span>
              )}
            </div>
          </div>

          {/* ИНТЕРАКТИВНЫЙ ВИДЖЕТ: АНАЛИТИКА ЗДОРОВЬЯ ИЗ /health/snapshot */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-50 pb-2">
              <svg className="h-4 w-4 text-medical-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.003 0 0120.488 9z" />
              </svg>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Аналитика показателей</h3>
            </div>

            {!snapshot || Object.keys(snapshot.key_metrics_json).length === 0 ? (
              <p className="text-[11px] text-slate-400 italic leading-relaxed">Данные для расчета трендов здоровья еще не собраны. Продолжайте заполнять ежедневный Дневник наблюдения.</p>
            ) : (
              <div className="space-y-2.5">
                {Object.entries(snapshot.key_metrics_json).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-sm font-bold text-medical-700 text-right">{String(val)}</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-dashed border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>Обновлено:</span>
                  <span>{new Date(snapshot.generated_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* ПРАВАЯ КОЛОНКА: Контактные данные + ТАЙМЛАЙН ДИАГНОЗОВ */}
        <div className="lg:col-span-2 space-y-4">
          {/* Блок контактов */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Контактные данные анкеты</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Полное имя (ФИО)</label>
                {isEditing ? (
                  <input
                    type="text" name="full_name" value={editForm.full_name || ''} onChange={handleInputChange}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white outline-none focus:border-medical-500"
                  />
                ) : (
                  <p className="text-sm font-semibold text-slate-900">{profile?.full_name || '—'}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Адрес и связь</label>
                  {isEditing ? (
                    <textarea
                      name="contact_details" rows={2} value={editForm.contact_details || ''} onChange={handleInputChange}
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-medical-500"
                    />
                  ) : (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 min-h-[50px]">{profile?.contact_details || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Экстренная связь</label>
                  {isEditing ? (
                    <input
                      type="text" name="emergency_contact" value={editForm.emergency_contact || ''} onChange={handleInputChange}
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white outline-none focus:border-medical-500"
                    />
                  ) : (
                    <p className="text-xs text-rose-900 bg-rose-50/40 p-2.5 rounded-lg border border-rose-100/50 min-h-[50px]">{profile?.emergency_contact || '—'}</p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl">Отмена</button>
                <button type="submit" disabled={isSaving} className="px-5 py-1.5 text-xs font-semibold text-white bg-medical-600 rounded-xl shadow-sm">{isSaving ? 'Сохранение...' : 'Сохранить'}</button>
              </div>
            )}
          </div>

          {/* ЖИВОЙ ТАЙМЛАЙН ВРАЧЕБНЫХ ДИАГНОЗОВ */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Моя история болезней (Таймлайн)</h2>

            {timeline.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Врачебных записей и диагнозов пока нет.</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {timeline.map((diag) => (
                  <div key={diag.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-200/40 pb-1 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider border ${
                          diag.type === 'final' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {diag.type === 'final' ? 'Финальный' : 'Предварительный'}
                        </span>
                        {diag.icd_code && <span className="font-mono bg-white px-1 rounded border border-slate-200 text-slate-600">МКБ-10: {diag.icd_code}</span>}
                      </div>
                      <span>📅 {new Date(diag.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{diag.diagnosis_text}</h4>

                    {diag.consultation_notes && (
                      <p className="text-xs text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                        "{diag.consultation_notes}"
                      </p>
                    )}

                    {diag.recommendation && (
                      <div className="text-xs text-medical-800 bg-medical-50/50 p-2 rounded border border-medical-100/50">
                        <span className="font-bold text-medical-900 block mb-0.5">Рекомендации врача:</span>
                        {diag.recommendation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
