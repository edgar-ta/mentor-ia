import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setPreviewUrl('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
      setPreviewUrl(data.previewUrl || '');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Recuperacion</p>
        <h1>Olvide mi contrasena</h1>
        <p className="muted">Genera un enlace temporal y de un solo uso.</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Correo registrado
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@correo.com"
            />
          </label>

          {error ? <div className="error-banner">{error}</div> : null}
          {message ? <div className="success-banner">{message}</div> : null}
          {previewUrl ? (
            <div className="preview-box">
              En desarrollo local puedes abrir este enlace:
              <a href={previewUrl}>{previewUrl}</a>
            </div>
          ) : null}

          <button className="primary" disabled={loading} type="submit">
            {loading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Volver al login</Link>
        </div>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
