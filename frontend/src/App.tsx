import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateDoctorPage } from './pages/CreateDoctorPage';
import { DoctorLoginPage } from './pages/DoctorLoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Новые роуты */}
        <Route path="/doctor/login" element={<DoctorLoginPage />} />
        <Route path="/admin/create-doctor" element={<CreateDoctorPage />} />
        <Route path="/password-recovery/request" element={<ForgotPasswordPage />} />
      </Route>
    </Routes>
  );
}

export default App;
