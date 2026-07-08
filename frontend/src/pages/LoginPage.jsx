import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(form);
      const fallbackRoute = response.redirectTo || '/app';
      const nextRoute = location.state?.from?.pathname || fallbackRoute;
      navigate(nextRoute, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Unidad III</p>
        <h1>Iniciar sesion</h1>
        <p className="muted">Accede a una experiencia fitness premium con roles, coach approval y onboarding inteligente.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="tu@correo.com"
              autoComplete="email"
            />
          </label>

          <label>
            Contrasena
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Tu contrasena"
              autoComplete="current-password"
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}

          <button className="primary" disabled={loading} type="submit">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <section className="privacy-notice auth-policy" aria-labelledby="privacy-title-login">
          <h2 id="privacy-title-login">Politica de privacidad</h2>
          <p>
            Al iniciar sesion, Mentoria trata los datos necesarios para verificar tu identidad,
            proteger tu cuenta, cargar tu perfil y ofrecerte las funciones personalizadas de la
            plataforma.
          </p>
          <p>
            La informacion se usa para fines de operacion, seguridad, soporte, mejora del servicio
            y cumplimiento de obligaciones aplicables. Puedes ejercer tus derechos de acceso,
            rectificacion, cancelacion u oposicion por los canales de contacto de la plataforma.
          </p>
          <a href="/politica-de-proteccion-de-datos-personales.pdf" target="_blank" rel="noreferrer">
            Ver politica de proteccion de datos personales
          </a>
        </section>

        <div className="auth-links">
          <Link to="/registro">Crear cuenta</Link>
          <Link to="/olvide-password">Olvide mi contrasena</Link>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </section>
  );
};

export default LoginPage;
