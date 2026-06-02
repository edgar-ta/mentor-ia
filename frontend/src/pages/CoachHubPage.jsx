import { useEffect, useState } from 'react';
import api from '../lib/api';

const CoachHubPage = () => {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/coach/clients').then(({ data }) => setClients(data)).catch((err) => {
      setError(err.response?.data?.message || 'No se pudo cargar el panel coach.');
    });
  }, []);

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Coach Space</p>
            <h2>Tus alumnos asignados</h2>
          </div>
        </div>
        {error ? <div className="error-banner">{error}</div> : null}
        <div className="coach-client-grid">
          {clients.map((client) => (
            <article key={client.id} className="coach-client-card">
              <h3>{client.nombre}</h3>
              <p className="muted">{client.email}</p>
              <div className="coach-client-metrics">
                <span>Objetivo: {client.objetivo}</span>
                <span>Peso actual: {client.currentWeightKg || 'N/A'} kg</span>
                <span>Peso inicial: {client.initialWeight || 'N/A'} kg</span>
                <span>Variacion: {client.progressDelta || 0} kg</span>
                <span>Meta: {client.targetWeightKg || 'N/A'} kg</span>
                <span>Ejercicios: {client.recommendedExercises || 'Pendiente'}</span>
              </div>
            </article>
          ))}
          {clients.length === 0 && !error ? <div className="panel">Aun no tienes alumnos asignados.</div> : null}
        </div>
      </article>
    </section>
  );
};

export default CoachHubPage;
