import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      setMessage(data.message);
      setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar la contrasena.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Token temporal</p>
        <h1>Restablecer contrasena</h1>
        <p className="muted">Este formulario solo acepta enlaces validos y vigentes.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Nueva contrasena
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimo 10 caracteres con mayuscula, minuscula y numero"
              autoComplete="new-password"
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}
          {message ? <div className="success-banner">{message}</div> : null}

          <button className="primary" disabled={loading || !token} type="submit">
            {loading ? 'Actualizando...' : 'Actualizar contrasena'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver al login</Link>
        </div>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
