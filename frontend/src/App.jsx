import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/AppShell';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Sessions from './components/Sessions';
import Chatbot from './components/Chatbot';
import Settings from './components/Settings';
import Search from './components/Search';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import OnboardingPage from './pages/OnboardingPage';
import CoachesPage from './pages/CoachesPage';
import ProfilePage from './pages/ProfilePage';
import CoachHubPage from './pages/CoachHubPage';
import AdminCoachRequestsPage from './pages/AdminCoachRequestsPage';
import api from './lib/api';

const DashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data } = await api.get('/metrics');
        setMetrics(data);
      } catch (_err) {
        setError('No se pudo cargar el panel protegido.');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) return <div className="panel">Cargando metricas...</div>;
  if (error) return <div className="panel error">{error}</div>;
  return <Dashboard metrics={metrics} />;
};

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/registro" element={<RegisterPage />} />
    <Route path="/olvide-password" element={<ForgotPasswordPage />} />
    <Route path="/restablecer-password" element={<ResetPasswordPage />} />
    <Route path="/sin-acceso" element={<UnauthorizedPage />} />

    <Route
      path="/app/onboarding"
      element={
        <ProtectedRoute onboarding="only-incomplete">
          <OnboardingPage />
        </ProtectedRoute>
      }
    />

    <Route
      path="/app"
      element={
        <ProtectedRoute onboarding="required">
          <AppShell />
        </ProtectedRoute>
      }
    >
      <Route index element={<DashboardPage />} />
      <Route path="buscar" element={<Search />} />
      <Route path="sesiones" element={<Sessions />} />
      <Route path="chat" element={<Chatbot />} />
      <Route path="perfil" element={<ProfilePage />} />
      <Route path="seguridad" element={<Settings />} />
      <Route
        path="coaches"
        element={
          <ProtectedRoute roles={['usuario']}>
            <CoachesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="coach"
        element={
          <ProtectedRoute roles={['coach']}>
            <CoachHubPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="clientes"
        element={
          <ProtectedRoute roles={['administrador']}>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="admin/coaches"
        element={
          <ProtectedRoute roles={['administrador']}>
            <AdminCoachRequestsPage />
          </ProtectedRoute>
        }
      />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
