import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, roles = [], onboarding = 'ignore' }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="auth-shell"><div className="auth-card">Validando sesion...</div></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.rol)) {
    return <Navigate to="/sin-acceso" replace />;
  }

  if (onboarding === 'required' && user.rol === 'usuario' && !user.onboardingCompleted) {
    return <Navigate to="/app/onboarding" replace />;
  }

  if (onboarding === 'only-incomplete' && user.rol === 'usuario' && user.onboardingCompleted) {
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default ProtectedRoute;
