import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
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

          {error ? <div className="error-banner">{error}</div> : null}

          <button className="primary" disabled={loading} type="submit">
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
