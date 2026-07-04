import React, { useEffect, useState } from 'react';
import { searchAuditLogs, getSystemHealthSnapshot, AuditLogResponse } from '../api/admin';
import { getInfraHealth } from '../api/infrastructure';

export const AdminDashboardPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [health, setHealth] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Внутренний стейт полей ввода для фильтрации логов
  const [inputAction, setInputAction] = useState('');
  const [inputEntityType, setInputEntityType] = useState('');
  const [inputUserId, setInputUserId] = useState('');

  // Активный стейт фильтров, по которому триггерится запрос к бэкенду
  const [activeFilters, setActiveFilters] = useState({});

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Параллельно запрашиваем три эндпоинта
      const [healthData, logsData, infraData] = await Promise.all([
        getSystemHealthSnapshot(),
        searchAuditLogs(activeFilters),
        getInfraHealth().catch(() => ({ status: 'error', services: [] }))
      ]);

      const combinedHealth = {
        ...healthData,
        "Инфраструктура": infraData.status === 'ok',
        "Активные сервисы": infraData.services.join(', ') || 'нет данных'
      };

      setHealth(combinedHealth);
      setLogs(logsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные дашборда');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeFilters]);

  // Обработчик применения фильтров по клику на кнопку
  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveFilters({
      action: inputAction.trim() || undefined,
      entity_type: inputEntityType.trim() || undefined,
      user_id: inputUserId.trim() ? Number(inputUserId) : undefined
    });
  };
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Панель управления</h1>
        <p className="mt-1 text-sm text-slate-500">Мониторинг состояния систем и compliance-анализ безопасности.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100 font-mono">{error}</div>}

      {/* РАЗДЕЛ 1: МЕТРИКИ ЗДОРОВЬЯ СИСТЕМЫ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading && !health ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />
          ))
        ) : (
          health && Object.entries(health).map(([key, value]) => (
            <div key={key} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-2xl font-bold text-slate-900 mt-2">
                {typeof value === 'boolean' ? (value ? '🟢 OK' : '🔴 FAIL') : String(value)}
              </span>
            </div>
          ))
        )}
      </div>
      {/* РАЗДЕЛ 2: ЖУРНАЛ АУДИТА */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-bold text-slate-900 shrink-0">Журнал глобального аудита</h2>

          {/* Панель фильтров в линейном стиле */}
          <form onSubmit={handleApplyFilters} className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              placeholder="Действие (e.g. UPDATE)..."
              value={inputAction}
              onChange={(e) => setInputAction(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-medical-500 bg-slate-50 font-mono w-full sm:w-auto"
            />
            <input
              type="text"
              placeholder="Тип сущности (e.g. Patient)..."
              value={inputEntityType}
              onChange={(e) => setInputEntityType(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-medical-500 bg-slate-50 font-mono w-full sm:w-auto"
            />
            <input
              type="number"
              placeholder="ID инициатора (User ID)..."
              value={inputUserId}
              onChange={(e) => setInputUserId(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-medical-500 bg-slate-50 font-mono w-full sm:w-auto"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 w-full sm:w-auto"
            >
              Применить
            </button>
          </form>
        </div>

        {/* Таблица логов */}
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3.5">Дата / Время</th>
                  <th className="px-4 py-3.5">Инициатор (User ID)</th>
                  <th className="px-4 py-3.5">Действие (Action)</th>
                  <th className="px-4 py-3.5">Тип сущности</th>
                  <th className="px-4 py-3.5">ID сущности</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-mono text-[11px]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-sans">
                      <div className="flex justify-center items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
                        <span>Синхронизация логов безопасности...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-sans text-xs">
                      Записи аудита не найдены по выбранным критериям.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-bold">
                        {log.user_id ? `User #${log.user_id}` : '🖥️ Система'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="bg-slate-100 text-slate-800 font-sans px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-sans font-medium">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-400 break-all">
                        {log.entity_id ? `#${log.entity_id}` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
