import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { clearAccessToken } from '../api/client';

interface LayoutProps {
  userRole?: 'admin' | 'doctor' | 'patient' | string | null;
}

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

export const Layout: React.FC<LayoutProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearAccessToken();
    window.location.href = '/login';
  };

  // Проверяем, является ли текущая страница публичной (для гостей)
  const isPublicPage = [
    '/login',
    '/register',
    '/doctor/login',
    '/password-recovery/request',
    '/password-recovery/confirm'
  ].includes(location.pathname);

  // Если это страница логина или регистрации, рендерим ТОЛЬКО контент (без сайдбара)
  if (isPublicPage) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Outlet />
      </main>
    );
  }

  // Конфигурация бокового меню
  const menuConfig: Record<'admin' | 'doctor' | 'patient', NavItem[]> = {
    admin: [
      { path: '/admin/dashboard', label: 'Главная', icon: '📊' },
      { path: '/admin/users', label: 'Каталог юзеров', icon: '👥' },
      { path: '/admin/doctors/pending', label: 'Верификация врачей', icon: '🩺' },
      { path: '/admin/specializations', label: 'Специализации', icon: '📚' },
      { path: '/admin/system-configs', label: 'Системные настройки', icon: '⚙️' },
      { path: '/global-search', label: 'Глобальный поиск', icon: '🔍' }
    ],
    doctor: [
      { path: '/doctor/dashboard', label: 'Мой профиль', icon: '👨‍⚕️' },
      { path: '/doctor/patients', label: 'Мои пациенты', icon: '🏥' },
      { path: '/doctor/complaints/inbox', label: 'Разбор жалоб', icon: '📥' },
      { path: '/doctor/appointments', label: 'Календарь приемов', icon: '📅' },
      { path: '/doctor/tasks', label: 'Задачи наблюдения', icon: '📝' },
      { path: '/doctor/chat', label: 'Телемед-чат', icon: '💬' },
      { path: '/global-search', label: 'Глобальный поиск', icon: '🔍' }
    ],
    patient: [
      { path: '/dashboard', label: 'Моя медкарта', icon: '👤' },
      { path: '/dashboard/symptoms', label: 'ИИ-анализ симптомов', icon: '🧠' },
      { path: '/dashboard/tasks', label: 'Дневник здоровья', icon: '📈' },
      { path: '/dashboard/documents', label: 'Архив документов', icon: '📁' },
      { path: '/dashboard/consents', label: 'Юридические согласия', icon: '⚖️' },
      { path: '/dashboard/preferences', label: 'Настройки связи', icon: '🔔' },
    ],
  };

  // Приводим роль от бэкенда к нижнему регистру, чтобы избежать конфликтов (Doctor -> doctor)
  const normalizedRole = typeof userRole === 'string' ? userRole.toLowerCase() : '';

  // Безопасно вытаскиваем пункты меню по нормализованной роли
  const currentMenu = normalizedRole && menuConfig[normalizedRole as keyof typeof menuConfig]
    ? menuConfig[normalizedRole as 'admin' | 'doctor' | 'patient']
    : [];


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* БОКОВАЯ ПАНЕЛЬ (САЙДБАР) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 bg-gradient-to-tr from-teal-600 to-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
              B
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-base">Bio Program</span>
          </div>

          {userRole && (
            <div className="px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] uppercase font-bold tracking-wider text-slate-400 text-center">
              Контур: <span className="text-teal-600">{userRole}</span>
            </div>
          )}

          <nav className="space-y-1">
            {currentMenu.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/10'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/40">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <span>🚪</span>
            <span>Выйти из системы</span>
          </button>
        </div>
      </aside>

      {/* ОСНОВНОЙ КОНТЕНТ СТРАНИЦЫ */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50">
        <Outlet />
      </main>
    </div>
  );
};
