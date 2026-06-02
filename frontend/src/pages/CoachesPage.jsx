import { useEffect, useState } from 'react';
import { FiCheck, FiRefreshCw, FiUserPlus, FiX } from 'react-icons/fi';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CoachesPage = () => {
  const { user, updateUser } = useAuth();
  const [coaches, setCoaches] = useState([]);
  const [applicationForm, setApplicationForm] = useState({ bio: '', specialties: '', experienceYears: 0 });
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/coaches').then(({ data }) => setCoaches(data)).catch(() => setCoaches([]));
  }, []);

  const assignCoach = async (coachId) => {
    const { data } = await api.post('/users/me/coach-assignment', { coachId });
    updateUser(data.user);
    setStatusMessage('Coach asignado correctamente.');
  };

  const removeCoach = async () => {
    const { data } = await api.delete('/users/me/coach-assignment');
    updateUser(data.user);
    setStatusMessage('Coach removido. Ahora puedes elegir otro.');
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    try {
      const { data } = await api.post('/coach/apply', applicationForm);
      setStatusMessage(data.message);
      setApplicationForm({ bio: '', specialties: '', experienceYears: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la solicitud.');
    }
  };

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Coach Match</p>
            <h2>Elige tu coach</h2>
            <p className="muted">Solo puedes tener uno activo, pero puedes cambiarlo cuando quieras.</p>
          </div>
          {user?.assignedCoach ? (
            <button className="ghost" onClick={removeCoach}>
              <FiX />
              Quitar coach actual
            </button>
          ) : null}
        </div>

        {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}
        {error ? <div className="error-banner">{error}</div> : null}

        {user?.assignedCoach ? (
          <div className="assigned-coach-banner">
            <FiCheck />
            <span>Coach asignado: <strong>{user.assignedCoach.nombre}</strong></span>
          </div>
        ) : null}

        <div className="coach-grid">
          {coaches.map((coach) => (
            <article key={coach.id} className="coach-card">
              <div className="coach-avatar">{coach.nombre.slice(0, 2).toUpperCase()}</div>
              <h3>{coach.nombre}</h3>
              <p>{coach.bio}</p>
              <span className="muted">{coach.specialties}</span>
              <div className="coach-meta">
                <span>{coach.experienceYears} anos</span>
                <span>{coach.activeClients} alumnos</span>
              </div>
              <button className="primary" onClick={() => assignCoach(coach.id)}>
                <FiUserPlus />
                Elegir coach
              </button>
            </article>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Coach Access</p>
            <h2>Quiero ingresar como coach</h2>
          </div>
        </div>

        <form className="auth-form" onSubmit={submitApplication}>
          <label>Bio profesional
            <textarea value={applicationForm.bio} onChange={(e) => setApplicationForm({ ...applicationForm, bio: e.target.value })} rows="4" />
          </label>
          <label>Especialidades
            <input value={applicationForm.specialties} onChange={(e) => setApplicationForm({ ...applicationForm, specialties: e.target.value })} placeholder="Nutricion, hipertrofia, perdida de grasa..." />
          </label>
          <label>Anos de experiencia
            <input type="number" min="0" value={applicationForm.experienceYears} onChange={(e) => setApplicationForm({ ...applicationForm, experienceYears: e.target.value })} />
          </label>
          <button className="ghost" type="submit">
            <FiRefreshCw />
            Enviar solicitud
          </button>
        </form>
      </article>
    </section>
  );
};

export default CoachesPage;
