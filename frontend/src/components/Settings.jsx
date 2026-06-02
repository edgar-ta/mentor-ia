import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

const Settings = () => {
  const { logoutAll } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { data } = await api.get('/auth/sessions');
        setSessions(data.sessions);
        setCurrentSessionId(data.currentSessionId);
      } catch (err) {
        setError(err.response?.data?.message || 'No se pudieron cargar las sesiones activas.');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const handleLogoutAll = async () => {
    await logoutAll();
  };

  return (
    <section className="settings-grid">
      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>Politica de sesiones</h2>
            <p className="muted">Configuracion aplicada al proyecto de mentorias.</p>
          </div>
        </div>
        <ul className="list policy-list">
          <li><strong>Duracion:</strong><span className="muted">12 horas por inactividad</span></li>
          <li><strong>Multisesion:</strong><span className="muted">Permitida con limite de 3 dispositivos</span></li>
          <li><strong>Rotacion:</strong><span className="muted">Se extiende y renueva actividad en cada peticion valida</span></li>
          <li><strong>Revocacion global:</strong><span className="muted">Restablecer contrasena o cerrar todas revoca sesiones</span></li>
        </ul>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <h2>Sesiones activas</h2>
            <p className="muted">Control de multisesion y auditoria basica.</p>
          </div>
          <button className="ghost" onClick={handleLogoutAll}>Cerrar todas</button>
        </div>

        {loading ? <p>Cargando sesiones...</p> : null}
        {error ? <div className="error-banner">{error}</div> : null}
        {message ? <div className="success-banner">{message}</div> : null}

        {!loading && !error ? (
          <ul className="list">
            {sessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>
                    {session.id === currentSessionId ? 'Sesion actual' : 'Dispositivo autorizado'}
                  </strong>
                  <p className="muted">{session.userAgent}</p>
                </div>
                <div className="muted align-right">
                  <div>{session.ipAddress}</div>
                  <div>Expira: {new Date(session.expiresAt).toLocaleString('es-MX')}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </section>
  );
};

export default Settings;
