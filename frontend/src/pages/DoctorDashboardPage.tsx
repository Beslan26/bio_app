import React, { useEffect, useState } from 'react';
import { getDoctorProfile, updateDoctorProfile, DoctorProfileResponse, DoctorProfileUpdateRequest } from '../api/doctor';

export const DoctorDashboardPage: React.FC = () => {
  const [profile, setProfile] = useState<DoctorProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Режим редактирования и состояние полей формы
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<DoctorProfileUpdateRequest>({
    bio: '',
    work_hours: '',
    contact_info: '',
    sub_specializations: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await getDoctorProfile();
      setProfile(data);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError('Ваш профиль врача еще не верифицирован администратором системы.');
      } else {
        setError(err.response?.data?.detail || 'Не удалось загрузить профиль врача');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Вход в режим редактирования с заполнением текущих данных
  const handleStartEdit = () => {
    if (!profile) return;
    setEditForm({
      bio: profile.bio || '',
      work_hours: profile.work_hours || '',
      contact_info: profile.contact_info || '',
      sub_specializations: profile.sub_specializations || '',
    });
    setSaveMessage(null);
    setIsEditing(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const updatedData = await updateDoctorProfile({
        bio: editForm.bio?.trim() || null,
        work_hours: editForm.work_hours?.trim() || null,
        contact_info: editForm.contact_info?.trim() || null,
        sub_specializations: editForm.sub_specializations?.trim() || null,
      });

      setProfile(updatedData);
      setSaveMessage({ type: 'success', text: 'Профиль успешно обновлен!' });
      setIsEditing(false);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось сохранить изменения' });
    } finally {
      setIsSaving(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 gap-2 text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <span>Загрузка рабочего пространства врача...</span>
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
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Сообщение об успешном сохранении / ошибке */}
      {saveMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          saveMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* Шапка дашборда */}
      <div className="bg-gradient-to-r from-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Лицензия верифицирована
            </span>
            <h1 className="text-2xl font-bold mt-2">Личный кабинет врача</h1>
            <p className="text-teal-100 text-sm mt-1 font-medium">{profile?.specialty}</p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <div className="text-left sm:text-right sm:border-l sm:border-white/10 sm:pl-6">
              <p className="text-xs text-teal-200 uppercase tracking-wider font-semibold">Лицензия</p>
              <p className="text-sm font-mono font-bold bg-white/10 px-3 py-1 rounded-lg mt-1 inline-block">
                {profile?.license_number}
              </p>
            </div>
            {!isEditing && (
              <button
                type="button" onClick={handleStartEdit}
                className="mt-2 text-xs font-semibold bg-white text-teal-800 px-4 py-2 rounded-xl shadow hover:bg-teal-50 transition"
              >
                Редактировать профиль
              </button>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Левая колонка: Режим работы и Контакты */}
        <div className="md:col-span-1 space-y-4">
          {/* Режим работы */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">График и часы работы</h3>
            {isEditing ? (
              <input
                type="text" name="work_hours" value={editForm.work_hours || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-teal-500"
                placeholder="Пн-Пт: 09:00 - 18:00"
              />
            ) : (
              <p className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100">
                {profile?.work_hours || <span className="italic text-slate-400">Часы работы не настроены</span>}
              </p>
            )}
          </div>

          {/* Контактная информация */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Контакты для связи</h3>
            {isEditing ? (
              <textarea
                name="contact_info" rows={3} value={editForm.contact_info || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-teal-500"
                placeholder="Кабинет 304, тел: +7..."
              />
            ) : (
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                {profile?.contact_info || <span className="italic text-slate-400">Контакты не указаны</span>}
              </p>
            )}
          </div>
        </div>

        {/* Правая колонка: Биография и Субспециализации */}
        <div className="md:col-span-2 space-y-4">
          {/* Биография */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">Профессиональная биография</h2>
            {isEditing ? (
              <textarea
                name="bio" rows={6} value={editForm.bio || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-teal-500"
                placeholder="Расскажите о своем опыте работы, образовании и научных степенях..."
              />
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {profile?.bio || <span className="italic text-slate-400">Информация о себе отсутствует.</span>}
              </p>
            )}
          </div>

          {/* Субспециализации */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">Дополнительные компетенции (Узкие специализации)</h2>
            {isEditing ? (
              <input
                type="text" name="sub_specializations" value={editForm.sub_specializations || ''} onChange={handleInputChange}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-teal-500"
                placeholder="Например: Эхокардиография, Детская кардиология"
              />
            ) : (
              <div className="text-sm text-slate-600 bg-teal-50/40 p-4 rounded-xl border border-teal-100/50">
                {profile?.sub_specializations || <span className="italic text-slate-400">Дополнительные компетенции не указаны</span>}
              </div>
            )}
          </div>

          {/* Кнопки сохранения изменений внизу формы */}
          {isEditing && (
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button" onClick={() => setIsEditing(false)}
                className="px-5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Отмена
              </button>
              <button
                type="submit" disabled={isSaving}
                className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center gap-2"
              >
                {isSaving && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Сохранить изменения
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
