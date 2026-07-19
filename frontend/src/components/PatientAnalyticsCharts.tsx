import React, { useEffect, useState } from 'react';
import { getPatientAnalytics } from '../api/patient';

interface ChartsProps {
  patientId: number;
}

export const PatientAnalyticsCharts: React.FC<ChartsProps> = ({ patientId }) => {
  const [analyticsData, setAnalyticsData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      // Защита от NaN (если ID пациента некорректный)
      if (!patientId || isNaN(patientId)) {
        setError('Некорректный ID пациента для расчета аналитики');
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await getPatientAnalytics(patientId);
        setAnalyticsData(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить графики здоровья');
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10 gap-2 text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <span className="text-xs">Построение графиков PHR...</span>
      </div>
    );
  }

  if (error) return <div className="text-xs text-rose-600 p-4 bg-rose-50 rounded-xl border border-rose-100 italic">{error}</div>;
  
  // Проверяем наличие необходимых для графиков ключей из бэкенда
  if (!analyticsData || !analyticsData.health_metrics || !analyticsData.task_compliance) {
    return <p className="text-xs text-slate-400 italic text-center py-6">Нет данных для построения графиков трендов.</p>;
  }

  // Извлекаем структуры данных из ответа бэкенда
  const { health_metrics, task_compliance } = analyticsData;

  // Парсим данные здоровья (Берем средние значения 'average' из datasets)
  const healthLabels = health_metrics.labels || [];
  const avgDataset = health_metrics.datasets?.find((d: any) => d.label === 'average');
  const healthValues = avgDataset ? avgDataset.data : [];
  const maxHealthVal = Math.max(...healthValues.map((v: any) => Number(v) || 0), 1);

  // Парсим данные задач комплаентности
  const taskLabels = task_compliance.labels || [];
  const complianceDataset = task_compliance.datasets?.[0]; // Берем первый доступный датасет
  const complianceValues = complianceDataset ? complianceDataset.data : [];

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
        📈 Динамика показателей PHR
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* КАРТОЧКА 1: ПОКАЗАТЕЛИ ЗДОРОВЬЯ */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Параметры здоровья (Среднее по дням)
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {healthLabels.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">Замеры показателей отсутствуют</p>
            ) : (
              healthLabels.map((date: string, idx: number) => {
                const numValue = Number(healthValues[idx]) || 0;
                const percent = Math.min((numValue / maxHealthVal) * 100, 100);

                return (
                  <div key={date} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span className="font-mono">📅 {date}</span>
                      <span className="font-bold text-teal-700">{numValue.toFixed(1)}</span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-sky-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* КАРТОЧКА 2: ВЫПОЛНЕНИЕ НАЗНАЧЕНИЙ */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Выполнение медицинских задач
          </h4>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {taskLabels.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic py-2">Активные медицинские задачи отсутствуют</p>
            ) : (
              taskLabels.map((taskTitle: string, idx: number) => {
                const compliancePercent = Number(complianceValues[idx]) || 0;

                return (
                  <div key={taskTitle} className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                      <span className="truncate max-w-[190px]" title={taskTitle}>📋 {taskTitle}</span>
                      <span className="font-bold text-sky-700">{compliancePercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-400 to-indigo-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${compliancePercent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
