import React, { useEffect, useState } from 'react';
import {
  getPatientPreferences,
  updatePatientPreferences,
  listNotificationLogs,
  requestDeactivation,
  NotificationLogResponse
} from '../api/patient';

export const PatientPreferencesPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Состояния для чекбоксов и времени
  const [enableEmail, setEnableEmail] = useState(false);
  const [enablePush, setEnablePush] = useState(false);
  const [quietStart, setQuietStart] = useState('');
  const [quietEnd, setQuietEnd] = useState('');

  // НОВЫЕ СОСТОЯНИЯ: Журнал уведомлений и деактивация
  const [logs, setLogs] = useState<NotificationLogResponse[]>([]);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  const formatTimeToInput = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.slice(0, 5); // Отрезаем секунды ЧЧ:ММ
  };

  const loadPageData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Параллельно загружаем конфигурацию настроек и журнал отправленных алертов
      const [prefData, logsData] = await Promise.all([
        getPatientPreferences(),
        listNotificationLogs()
      ]);

      if (prefData) {
        setEnableEmail(prefData.enable_email);
        setEnablePush(prefData.enable_push);
        setQuietStart(formatTimeToInput(prefData.quiet_hours_start));
        setQuietEnd(formatTimeToInput(prefData.quiet_hours_end));
      }

      // Сортируем логи уведомлений от новых к старым
      const sortedLogs = logsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLogs(sortedLogs);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить параметры воркспейса');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    if ((quietStart && !quietEnd) || (!quietStart && quietEnd)) {
      setMessage({ type: 'error', text: 'Для активации тихих часов укажите и время начала, и время окончания.' });
      setIsSaving(false);
      return;
    }

    try {
      const response = await updatePatientPreferences({
        enable_email: enableEmail,
        enable_push: enablePush,
        quiet_hours_start: quietStart ? `${quietStart}:00` : null,
        quiet_hours_end: quietEnd ? `${quietEnd}:00` : null,
      });

      setEnableEmail(response.enable_email);
      setEnablePush(response.enable_push);
      setQuietStart(formatTimeToInput(response.quiet_hours_start));
      setQuietEnd(formatTimeToInput(response.quiet_hours_end));

      setMessage({ type: 'success', text: 'Настройки уведомлений успешно применены!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Не удалось сохранить конфигурацию' });
    } finally {
      setIsSaving(false);
    }
  };

  // Хэндлер обработки деактивации аккаунта
  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      await requestDeactivation();
      alert('Запрос на деактивацию аккаунта успешно зарегистрирован. Наша compliance-служба свяжется с вами.');
      setShowDeactivateConfirm(false);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось отправить запрос на деактивацию');
    } finally {
      setIsDeactivating(false);
    }
  };
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20 gap-2 text-slate-500">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
        <span>Загрузка параметров профиля...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Настройки аккаунта</h1>
        <p className="mt-1 text-sm text-slate-500">Управление уведомлениями, тихими часами и историей оповещений платформы.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ЛЕВАЯ КОЛОНКА: ТОГЛЫ НАСТРОЕК + ДЕАКТИВАЦИЯ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
            {message && (
              <div className={`p-4 mb-5 rounded-xl text-sm font-medium border ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>{message.text}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Разрешенные каналы</h3>
                <label className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100 cursor-pointer select-none hover:bg-slate-50 transition">
                  <input type="checkbox" checked={enableEmail} onChange={(e) => setEnableEmail(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-medical-600 accent-medical-600" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">Email-уведомления</p>
                    <p className="text-slate-500 mt-0.5">Получать копии назначений и выписок на электронную почту.</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100 cursor-pointer select-none hover:bg-slate-50 transition">
                  <input type="checkbox" checked={enablePush} onChange={(e) => setEnablePush(e.checked)} className="h-4 w-4 rounded border-slate-300 text-medical-600 accent-medical-600" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-900">Push-напоминания</p>
                    <p className="text-slate-500 mt-0.5">Оповещения в браузере о необходимости внести показатели в Дневник.</p>
                  </div>
                </label>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Режим тишины</h3>
                <div className="grid grid-cols-2 gap-4 bg-slate-50/40 p-4 rounded-xl border border-slate-100/80 max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Начало</label>
                    <input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 outline-none focus:border-medical-500 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Окончание</label>
                    <input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} className="w-full text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-800 outline-none focus:border-medical-500 font-mono" />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="submit" disabled={isSaving} className="px-5 py-2 text-xs font-semibold text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors">{isSaving ? 'Применение...' : 'Сохранить настройки'}</button>
              </div>
            </form>
          </div>

          {/* НОВЫЙ БЛОК БЕЗОПАСНОСТИ: ДЕАКТИВАЦИЯ АККАУНТА */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 text-rose-600">Опасная зона</h3>
            <p className="text-xs text-slate-500 leading-relaxed">Вы можете временно заморозить работу своего личного кабинета. При деактивации ИИ-ассистент приостановит сбор симптомов, а лечащие врачи получат уведомление, что ваш профиль неактивен.</p>

            {showDeactivateConfirm ? (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl space-y-3 max-w-xl animate-fade-in">
                <p className="text-xs font-semibold text-rose-800">Вы уверены? Это действие зафиксируется в логах безопасности системы.</p>
                <div className="flex gap-2">
                  <button type="button" disabled={isDeactivating} onClick={handleDeactivateAccount} className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">Да, подать запрос</button>
                  <button type="button" onClick={() => setShowDeactivateConfirm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-medium">Отмена</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowDeactivateConfirm(true)} className="py-2 px-4 border border-rose-200 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition">Деактивировать личный кабинет</button>
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЖУРНАЛ УВЕДОМЛЕНИЙ */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 lg:col-span-1 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Лог уведомлений</h2>

          {logs.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-8">История системных оповещений пуста.</p>
          ) : (
            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 font-mono text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center justify-between font-sans text-slate-900 font-bold text-xs">
                    <span className="truncate max-w-[70%] text-[11px]">{log.trigger_event}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      log.status === 'sent' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>{log.status}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-[10px] text-slate-400">
                    <span>Канал связи:</span>
                    <span className="text-slate-600 font-sans font-medium uppercase">{log.channel}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Время:</span>
                    <span className="text-slate-500 font-sans">{new Date(log.created_at).toLocaleString('ru-RU')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
