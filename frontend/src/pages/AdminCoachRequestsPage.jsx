import { useEffect, useState } from 'react';
import api from '../lib/api';

const AdminCoachRequestsPage = () => {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');

  const loadApplications = async () => {
    try {
      const { data } = await api.get('/admin/coach-applications');
      setApplications(data);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar las solicitudes.');
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const review = async (id, decision) => {
    const reason = decision === 'rechazar' ? window.prompt('Motivo del rechazo:') || '' : '';
    const { data } = await api.post(`/admin/coach-applications/${id}/review`, {
      decision,
      rejectionReason: reason
    });
    setApplications(data.applications);
  };

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Admin</p>
            <h2>Solicitudes de coach</h2>
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="application-list">
          {applications.map((application) => (
            <article key={application.id} className="application-card">
              <div>
                <strong>{application.usuario.nombre}</strong>
                <p className="muted">{application.usuario.email}</p>
              </div>
              <p>{application.bio}</p>
              <span className="muted">{application.specialties}</span>
              <span className="pill">{application.status}</span>
              <div className="app-actions">
                <button className="primary small" onClick={() => review(application.id, 'aprobar')}>Aprobar</button>
                <button className="ghost small" onClick={() => review(application.id, 'rechazar')}>Rechazar</button>
              </div>
            </article>
          ))}
          {applications.length === 0 ? <div className="panel">No hay solicitudes registradas.</div> : null}
        </div>
      </article>
    </section>
  );
};

export default AdminCoachRequestsPage;
