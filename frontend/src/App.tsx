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
import { AdminVerifyDoctorsPage } from './pages/AdminVerifyDoctorsPage';
import { AdminSpecializationsPage } from './pages/AdminSpecializationsPage';
import { AdminConfigsPage } from './pages/AdminConfigsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { DoctorDashboardPage } from './pages/DoctorDashboardPage';
import { DoctorPatientsPage } from './pages/DoctorPatientsPage';
import { DoctorComplaintsInboxPage } from './pages/DoctorComplaintsInboxPage';
import { DoctorAppointmentsPage } from './pages/DoctorAppointmentsPage';
import { DoctorPatientEhrPage } from './pages/DoctorPatientEhrPage';
import { DoctorTasksPage } from './pages/DoctorTasksPage';
import { DoctorChatPage } from './pages/DoctorChatPage';
import { PatientDashboardPage } from './pages/PatientDashboardPage';
import { PatientConsentsPage } from './pages/PatientConsentsPage';
import { PatientSymptomsPage } from './pages/PatientSymptomsPage';
import { PatientDocumentsPage } from './pages/PatientDocumentsPage';
import { PatientTasksPage } from './pages/PatientTasksPage';
import { PatientPreferencesPage } from './pages/PatientPreferencesPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';


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
      <Route element={<Layout userRole={user?.role} />}>
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
        <Route path="/admin/doctors/pending" element={<AdminVerifyDoctorsPage />} />
        <Route path="/admin/specializations" element={<AdminSpecializationsPage />} />
        <Route path="/admin/system-configs" element={<AdminConfigsPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        <Route path="/dashboard" element={<PatientDashboardPage />} />
        <Route path="/dashboard/consents" element={<PatientConsentsPage />} />
        <Route path="/dashboard/symptoms" element={<PatientSymptomsPage />} />
        <Route path="/dashboard/documents" element={<PatientDocumentsPage />} />
        <Route path="/dashboard/tasks" element={<PatientTasksPage />} />
        <Route path="/dashboard/preferences" element={<PatientPreferencesPage />} />

        <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
        <Route path="/doctor/patients" element={<DoctorPatientsPage />} />
        <Route path="/doctor/complaints/inbox" element={<DoctorComplaintsInboxPage />} />
        <Route path="/doctor/appointments" element={<DoctorAppointmentsPage />} />
        <Route path="/doctor/patients/:patientId/ehr" element={<DoctorPatientEhrPage />} />
        <Route path="/doctor/tasks" element={<DoctorTasksPage />} />
        <Route path="/doctor/chat" element={<DoctorChatPage />} />

        <Route path="/global-search" element={<GlobalSearchPage />} />
      </Route>
    </Routes>
  );
}

export default App;
