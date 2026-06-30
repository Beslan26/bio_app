import { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateDoctorPage } from './pages/CreateDoctorPage';
import { DoctorLoginPage } from './pages/DoctorLoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { getCurrentUser, UserMeResponse } from './api/auth';
import { getAccessToken } from './api/client';
import { AdminUsersPage } from './pages/AdminUsersPage';

function App() {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const token = getAccessToken();

      // Если токена вообще нет в localStorage, сразу выключаем лоадер
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        // Если токен есть, спрашиваем у бэкенда профиль
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        // Если упала ошибка (токен невалиден), интерцептор сам очистит токен
        console.error('Ошибка авторизации:', error);
      } finally {
        setIsInitializing(false);
      }
    }

    checkAuth();
  }, []);

  // Пока приложение проверяет токен при старте — показываем красивый экран загрузки
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-medical-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Загрузка медицинского профиля...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Если пользователь авторизован, при заходе на корень кидаем его дальше, если нет — на логин */}
        <Route
          path="/"
          element={user ? <Navigate to={user.role === 'doctor' ? '/doctor/dashboard' : '/dashboard'} replace /> : <Navigate to="/login" replace />}
        />

        {/* Открытые роуты для гостей */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/doctor/login" element={user ? <Navigate to="/" replace /> : <DoctorLoginPage />} />
        <Route path="/password-recovery/request" element={<ForgotPasswordPage />} />
        <Route path="/password-recovery/confirm" element={<ResetPasswordPage />} />

        {/* Защищенные роуты (в будущем здесь будут полноценные дашборды) */}
        <Route path="/admin/create-doctor" element={<CreateDoctorPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/dashboard" element={<div>Личный кабинет пациента (В разработке)</div>} />
        <Route path="/doctor/dashboard" element={<div>Панель управления врача (В разработке)</div>} />
      </Route>
    </Routes>
  );
}

export default App;
