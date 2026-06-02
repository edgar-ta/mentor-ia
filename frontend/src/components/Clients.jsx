import { useEffect, useState } from 'react';
import api from '../lib/api';

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/clients').then(({ data }) => {
      setClients(data);
      setLoading(false);
    }).catch(() => {
      setError('No se pudo cargar clientes. Revisa el backend y la base de datos.');
      setLoading(false);
    });
  }, []);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Clientes</h2>
          <p className="muted">CRM especializado para mentoría</p>
        </div>
        <button className="primary">Nuevo cliente</button>
      </div>

      {loading && 'Cargando...'}
      {!loading && error && <div className="error">{error}</div>}
      {!loading && !error && (
        <div className="table">
          <div className="table-head">
            <span>Cliente</span><span>Objetivo</span><span>Estado</span><span>Próxima sesión</span><span>Score IA</span><span>Engagement</span>
          </div>
          {clients.map((c) => (
            <div key={c.id} className="table-row">
              <span className="client-cell">
                <span className="avatar-mini" style={{ backgroundImage: `url(${c.avatar_url})` }} />
                {c.name}
              </span>
              <span>{c.goal}</span>
              <span className={`pill ${c.status}`}>{c.statusLabel}</span>
              <span>{c.nextSession}</span>
              <span>{c.score}/100</span>
              <span>{c.engagement}%</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Clients;
