import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listActivePatients, DoctorPatientItem } from '../api/doctor';

export const DoctorPatientsPage: React.FC = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState<DoctorPatientItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Эффект для загрузки данных при изменении поискового запроса с задержкой (Debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listActivePatients(searchQuery.trim());
        setPatients(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить список пациентов');
      } finally {
        setIsLoading(false);
      }
    }, 400); // Задержка 400мс после окончания ввода

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Расчет возраста по дате рождения
  const calculateAge = (birthDateString: string | null) => {
    if (!birthDateString) return '—';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Мои пациенты</h1>
        <p className="mt-1 text-sm text-slate-500">
          Каталог прикрепленных пациентов и compliance-поиск по системе.
        </p>
      </div>

      {/* Поле поиска */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm max-w-md">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
          Поиск по Email или ID
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Введите email пациента для поиска..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-slate-800 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
          {error}
        </div>
      )}

      {/* Таблица пациентов */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 font-medium text-slate-600">
              <tr>
                <th className="px-6 py-3.5">ID Пациента</th>
                <th className="px-6 py-3.5">ФИО Пациента</th>
                <th className="px-6 py-3.5">User ID</th>
                <th className="px-6 py-3.5">Пол</th>
                <th className="px-6 py-3.5">Дата рождения</th>
                <th className="px-6 py-3.5">Возраст</th>
                <th className="px-6 py-3.5 text-right">ЭМК</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                      <span>Поиск пациентов...</span>
                    </div>
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Пациенты не найдены.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{patient.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {patient.full_name || 'Не указано'}
                    </td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{patient.user_id}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        patient.sex === 'male'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : patient.sex === 'female'
                          ? 'bg-pink-50 text-pink-700 border-pink-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}>
                        {patient.sex === 'male' ? 'Мужской' : patient.sex === 'female' ? 'Женский' : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('ru-RU') : '—'}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {calculateAge(patient.birth_date)}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/doctor/patients/${patient.id}/ehr`)}
                        className="text-xs font-semibold text-teal-600 hover:text-teal-800 hover:underline"
                      >
                        Открыть карту
                      </button>
                      <button
                        onClick={() => navigate('/doctor/chat', { state: { patient_id: patient.id } })}
                        className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                      >
                        Открыть чат
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
