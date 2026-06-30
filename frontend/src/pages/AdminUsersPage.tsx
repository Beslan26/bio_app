import React, { useEffect, useState } from 'react';
import { listUsers, updateUserAccess, AdminUserResponse, UserFilters, AdminUserUpdateRequest, hardDeleteUser } from '../api/admin';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Состояния для фильтров
  const [filters, setFilters] = useState<UserFilters>({ role: '', status: '' });

  // Состояния для модального окна редактирования
  const [selectedUser, setSelectedUser] = useState<AdminUserResponse | null>(null);
  const [updateForm, setUpdateForm] = useState<AdminUserUpdateRequest>({ role: '', status: '', reason: '' });
  const [isUpdating, setIsUpdating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
    // Состояния для модального окна удаления (GDPR)
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);


  // Функция загрузки пользователей
  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Открытие модалки для конкретного юзера
  const openEditModal = (user: AdminUserResponse) => {
    setSelectedUser(user);
    setUpdateForm({
      role: user.role,
      status: user.status,
      reason: '', // Очищаем причину для нового действия
    });
    setModalError(null);
  };

  // Сабмит формы обновления доступа
  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsUpdating(true);
    setModalError(null);

    try {
      const updatedUser = await updateUserAccess(selectedUser.id, {
        role: updateForm.role || null,
        status: updateForm.status || null,
        reason: updateForm.reason?.trim() || null,
      });

        // Функция полного удаления пользователя
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteUserId) return;

    setIsDeleting(true);
    try {
      await hardDeleteUser(deleteUserId, deleteReason.trim());

      // Удаляем пользователя из таблицы на экране
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== deleteUserId));

      // Закрываем модалку удаления и очищаем причину
      setDeleteUserId(null);
      setDeleteReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Не удалось удалить пользователя');
    } finally {
      setIsDeleting(false);
    }
  };


      // Оптимистичный UI: обновляем измененного пользователя прямо в текущем массиве
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );

      // Закрываем модалку
      setSelectedUser(null);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Не удалось обновить доступ пользователя');
    } finally {
      setIsUpdating(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, string> = {
      admin: 'bg-purple-50 text-purple-700 border-purple-200',
      doctor: 'bg-teal-50 text-teal-700 border-teal-200',
      patient: 'bg-sky-50 text-sky-700 border-sky-200',
    };
    return badges[role] || 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      inactive: 'bg-amber-50 text-amber-700 border-amber-200',
      blocked: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return badges[status] || 'bg-slate-50 text-slate-700 border-slate-200';
  };
  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950">Каталог пользователей</h1>
        <p className="mt-1 text-sm text-slate-500">Управление ролями, статусами и аудит прав доступа.</p>
      </div>

      {/* Блок фильтров */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Роль</label>
          <select
            name="role" value={filters.role} onChange={handleFilterChange}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-medical-500"
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
            name="status" value={filters.status} onChange={handleFilterChange}
            className="w-full text-sm rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-medical-500"
          >
            <option value="">Все статусы</option>
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
            <option value="blocked">Заблокирован</option>
          </select>
        </div>
      </div>

      {error && <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800">{error}</div>}

      {/* Таблица */}
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
                <th className="px-6 py-3.5 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Загрузка данных...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">Пользователи не найдены.</td>
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
                      {new Date(user.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-xs font-semibold text-medical-600 hover:text-medical-800 hover:underline"
                      >
                        Управлять
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-xs font-semibold text-medical-600 hover:text-medical-800 hover:underline"
                      >
                        Управлять
                      </button>
                      <button
                        onClick={() => setDeleteUserId(user.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-700 hover:underline"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* МОДАЛЬНОЕ ОКНО РЕДАКТИРОВАНИЯ */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Изменение прав доступа</h3>
            <p className="text-sm text-slate-500 mb-4">Пользователь: <span className="font-semibold text-slate-700">{selectedUser.email}</span></p>

            {modalError && <div className="mb-4 p-3 rounded-lg bg-rose-50 text-xs text-rose-800">{modalError}</div>}

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Роль пользователя</label>
                <select
                  value={updateForm.role || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, role: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
                >
                  <option value="patient">Patient (Пациент)</option>
                  <option value="doctor">Doctor (Врач)</option>
                  <option value="admin">Admin (Администратор)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Статус аккаунта</label>
                <select
                  value={updateForm.status || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
                >
                  <option value="active">Active (Активен)</option>
                  <option value="inactive">Inactive (Неактивен)</option>
                  <option value="blocked">Blocked (Заблокирован)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Причина изменения</label>
                <input
                  type="text"
                  placeholder="Например: По запросу / Нарушение"
                  value={updateForm.reason || ''}
                  onChange={(e) => setUpdateForm({ ...updateForm, reason: e.target.value })}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-medical-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-medical-600 hover:bg-medical-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* МОДАЛЬНОЕ ОКНО БЕЗВОЗВРАТНОГО УДАЛЕНИЯ */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900">Опасное действие (GDPR)</h3>
            </div>

            <p className="text-sm text-slate-500 mb-4">
              Вы собираетесь полностью и безвозвратно удалить пользователя <span className="font-mono bg-slate-100 px-1 rounded text-rose-600">ID: {deleteUserId}</span> из базы данных. Это действие нельзя отменить.
            </p>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Укажите причину удаления</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Запрос пользователя на удаление данных"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setDeleteUserId(null); setDeleteReason(''); }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {isDeleting ? 'Удаление...' : 'Удалить навсегда'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
