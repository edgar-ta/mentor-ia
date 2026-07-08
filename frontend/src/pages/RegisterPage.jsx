import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!acceptedPrivacy) {
      setError('Debes aceptar la politica de privacidad para crear tu cuenta.');
      return;
    }

    setLoading(true);

    try {
      const response = await register(form);
      navigate(response.redirectTo || '/app/onboarding', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Mentoria</p>
        <h1>Crear cuenta</h1>
        <p className="muted">Los nuevos registros se crean con rol `usuario`.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input
              value={form.nombre}
              onChange={(event) => setForm({ ...form, nombre: event.target.value })}
              placeholder="Tu nombre"
              autoComplete="name"
            />
          </label>

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
              placeholder="Minimo 10 caracteres con mayuscula, minuscula y numero"
              autoComplete="new-password"
            />
          </label>

          <section className="privacy-notice" aria-labelledby="privacy-title-register">
            <h2 id="privacy-title-register">Politica de privacidad</h2>
            <p>
              Al crear una cuenta en Mentoria, autorizas el tratamiento de tus datos personales
              para gestionar tu perfil, autenticar tu acceso, personalizar tu experiencia,
              asignar servicios de mentor/coach y mantener comunicacion relacionada con la
              plataforma.
            </p>
            <p>
              Podemos tratar datos de identificacion, contacto, preferencias, avance dentro de la
              app y datos tecnicos necesarios para seguridad, prevencion de abuso y mejora del
              servicio. La informacion se conserva solo durante el tiempo necesario para cumplir
              estas finalidades y las obligaciones aplicables.
            </p>
            <p>
              Puedes solicitar acceso, rectificacion, cancelacion u oposicion al tratamiento de tus
              datos, asi como revocar tu consentimiento, mediante los canales de contacto de la
              plataforma.
            </p>
            <a href="/politica-de-proteccion-de-datos-personales.pdf" target="_blank" rel="noreferrer">
              Ver politica de proteccion de datos personales
            </a>
          </section>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(event) => setAcceptedPrivacy(event.target.checked)}
            />
            <span>Acepto la politica de privacidad y el tratamiento de mis datos personales.</span>
          </label>

          {error ? <div className="error-banner">{error}</div> : null}

          <button className="primary" disabled={loading || !acceptedPrivacy} type="submit">
            {loading ? 'Creando...' : 'Crear cuenta'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Ya tengo cuenta</Link>
          <Link to="/">Volver al inicio</Link>
        </div>
      </div>
    </section>
  );
};

export default RegisterPage;
