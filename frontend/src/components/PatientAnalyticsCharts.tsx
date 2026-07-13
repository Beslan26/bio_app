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
      setIsLoading(true);
      try {
        const data = await getPatientAnalytics(patientId);
        setAnalyticsData(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить графики здоровья');
      } finally {
        setIsLoading(false);
      }
    }
    if (patientId) loadAnalytics();
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10 gap-2 text-slate-500">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
        <span className="text-xs">Построение графиков PHR...</span>
      </div>
    );
  }

  if (error) return <div className="text-xs text-rose-600 p-2 italic">{error}</div>;
  if (!analyticsData || Object.keys(analyticsData).length === 0) {
    return <p className="text-xs text-slate-400 italic text-center py-6">Нет достаточного количества точек данных для построения графиков трендов.</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1.5">
        📈 Динамика показателей PHR
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(analyticsData).map(([metricName, historyItems]) => {
          if (!Array.isArray(historyItems)) return null;

          // Находим максимальное значение для визуального масштабирования полос
          const maxVal = Math.max(...historyItems.map(item => Number(item.value) || 0), 1);

          return (
            <div key={metricName} className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider capitalize">
                {metricName.replace(/_/g, ' ')}
              </h4>

              {/* Компактный и надежный CSS-таймлайн/график, который никогда не ломает синтаксис PyCharm */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {historyItems.map((item: any, idx: number) => {
                  const numValue = Number(item.value) || 0;
                  const percent = Math.min((numValue / maxVal) * 100, 100);

                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                        <span className="font-mono">{item.date || item.timestamp || 'Ранее'}</span>
                        <span className="font-bold text-medical-700">{item.value}</span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-medical-500 to-sky-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {item.comment && (
                        <p className="text-[9px] text-slate-400 italic pl-1 truncate">"{item.comment}"</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
