import React, { useEffect, useState } from 'react';
import { searchAuditLogs, getSystemHealthSnapshot, AuditLogResponse, AuditFilters } from '../api/admin';

export const AdminDashboardPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [health, setHealth] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры для логов
  const [filters, setFilters] = useState<AuditFilters>({ action: '', entity_type: '' });

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [healthData, logsData] = await Promise.all([
        getSystemHealthSnapshot(),
        searchAuditLogs(filters),
      ]);
      setHealth(healthData);
      setLogs(logsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Не удалось загрузить данные дашборда');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filters]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Панель управления</h1>
        <p className="mt-1 text-sm text-slate-500">Мониторинг состояния систем иcompliance-анализ безопасности.</p>
      </div>

      {error && <div className="p-4 rounded-xl bg-rose-50 text-sm text-rose-800 border border-rose-100">{error}</div>}

      {/* РАЗДЕЛ 1: МЕТРИКИ ЗДОРОВЬЯ СИСТЕМЫ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
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
        <div className="sm:flex sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-900">Журнал глобального аудита</h2>
          
          {/* Фильтры */}
          <div className="flex gap-2 mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Фильтр по действию..."
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-medical-500"
            />
            <input
              type="text"
              placeholder="Фильтр по типу сущности..."
              value={filters.entity_type}
              onChange={(e) => setFilters(prev => ({ ...prev, entity_type: e.target.value }))}
              className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 outline-none focus:border-medical-500"
            />
          </div>
        </div>

        {/* Таблица логов */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 font-medium text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Дата/Время</th>
                  <th className="px-4 py-3">User ID</th>
                  <th className="px-4 py-3">Действие (Action)</th>
                  <th className="px-4 py-3">Тип сущности</th>
                  <th className="px-4 py-3">ID сущности</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 font-mono">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-400">Синхронизация логов...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-slate-400 font-sans">Записи аудита не найдены.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-bold">{log.user_id || 'Система'}</td>
                      <td className="px-4 py-3 text-medical-700 font-sans font-medium">{log.action}</td>
                      <td className="px-4 py-3 text-slate-500">{log.entity_type}</td>
                      <td className="px-4 py-3 text-slate-400 break-all">{log.entity_id}</td>
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
