import { Route, Routes, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CreateDoctorPage } from './pages/CreateDoctorPage'; // Импортируем новую страницу

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Главная страница автоматически перенаправляет на логин */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Пути для авторизации и регистрации */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Новый защищенный путь для администратора */}
        <Route path="/admin/create-doctor" element={<CreateDoctorPage />} />
      </Route>
    </Routes>
  );
}

export default App;
