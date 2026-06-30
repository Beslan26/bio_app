import React, { useEffect, useState } from 'react';
import { listUsers, AdminUserResponse, UserFilters } from '../api/admin';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояние для фильтров
  const [filters, setFilters] = useState<UserFilters>({
    role: '',
    status: '',
  });

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await listUsers(filters);
        setUsers(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Не удалось загрузить список пользователей');
      } finally {
        setIsLoading(false);
      }
    }

    fetchUsers();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Вспомогательная функция для красивого отображения бейджей ролей
  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      doctor: 'bg-teal-50 text-teal-700 border-teal-200',
      patient: 'bg-sky-50 text-sky-700 border-sky-200',
    };
    return badges[role] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Вспомогательная функция для бейджей статуса аккаунта
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      inactive: 'bg-amber-50 text-amber-700 border-amber-200',
      blocked: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return badges[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Каталог пользователей</h1>
          <p className="mt-1 text-sm text-slate-500">
            Управление учетными записями пациентов, врачей и администраторов.
          </p>
        </div>
      </div>

      {/* Блок фильтров */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Роль</label>
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
          >
            <option value="">Все роли</option>
            <option value="patient">Пациент</option>
            <option value="doctor">Врач</option>
            <option value="admin">Администратор</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Статус</label>
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-medical-500 focus:ring-1 focus:ring-medical-500"
          >
            <option value="">Все статусы</option>
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
            <option value="blocked">Заблокирован</option>
          </select>
        </div>
      </div>

      {/* Вывод ошибок */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 font-medium">
          {error}
        </div>
      )}

      {/* Таблица пользователей */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 font-medium text-slate-600">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Роль</th>
                <th className="px-6 py-3.5">Статус</th>
                <th className="px-6 py-3.5">Дата регистрации</th>
                <th className="px-6 py-3.5">Последний вход</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex justify-center items-center gap-2 text-slate-500">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-medical-600 border-t-transparent" />
                      <span>Загрузка данных...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    Пользователи с заданными фильтрами не найдены.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{user.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{user.email || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(user.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {user.last_login ? (
                        new Date(user.last_login).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      ) : (
                        <span className="text-slate-400 italic">Ни разу не входил</span>
                      )}
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
