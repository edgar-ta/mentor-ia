import { useEffect, useState } from 'react';
import api from '../lib/api';

const Sessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({
    clientId: 1,
    topic: '',
    date: '',
    time: '',
    location: 'Online'
  });

  const loadSessions = () => {
    api.get('/sessions').then(({ data }) => {
      setSessions(data);
      setLoading(false);
    }).catch(() => {
      setError('No se pudo cargar sesiones. Revisa el backend y la base de datos.');
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const exportSessions = async () => {
    setExporting(true);
    setExportMessage('');

    try {
      const response = await api.get('/sessions-export', { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'sesiones.csv';
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      setExportMessage('Archivo exportado correctamente.');
    } catch (_err) {
      setExportMessage('No se pudo exportar el archivo en este momento.');
    } finally {
      setExporting(false);
    }
  };

  const openDetail = async (id) => {
    const { data } = await api.get(`/sessions/${id}`);
    setDetail(data);
  };

  const createSession = async (event) => {
    event.preventDefault();
    const { data } = await api.post('/sessions', form);
    setSessions((prev) => [...prev, data]);
    setForm({ clientId: 1, topic: '', date: '', time: '', location: 'Online' });
  };

  return (
    <section className="page-stack">
      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Schedule</p>
            <h2>Sesiones y bloques activos</h2>
            <p className="muted">Tu agenda de entrenamiento, seguimiento y revisiones con coach.</p>
          </div>
          <button className="ghost" onClick={exportSessions} disabled={exporting}>
            {exporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
        {exportMessage ? <div className="info">{exportMessage}</div> : null}

        <div className="session-highlight-grid">
          <div className="session-highlight-card">
            <span className="eyebrow">Hoy</span>
            <strong>{sessions[0]?.client || 'Sin sesion programada'}</strong>
            <p>{sessions[0] ? `${sessions[0].topic} · ${sessions[0].time}` : 'Agrega un bloque desde tu plan personalizado.'}</p>
          </div>
          <div className="session-highlight-card dark">
            <span className="eyebrow">Estado</span>
            <strong>{sessions.length}</strong>
            <p>sesiones visibles en tu calendario actual</p>
          </div>
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Nueva sesion</p>
            <h2>Agregar sesion</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={createSession}>
          <label>
            Cliente ID
            <input
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              placeholder="Ej. 1"
            />
          </label>
          <label>
            Tema
            <input
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              placeholder="Seguimiento de macros, ajuste de rutina..."
            />
          </label>
          <label>
            Fecha
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </label>
          <label>
            Hora
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </label>
          <label>
            Ubicacion
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Online, gimnasio, videollamada..."
            />
          </label>
          <button className="primary" type="submit">Crear sesion</button>
        </form>
      </article>

      <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Agenda</h2>
          <p className="muted">Vista simple y clara de tus proximas sesiones.</p>
        </div>
      </div>

      {loading && 'Cargando...'}
      {!loading && error && <div className="error">{error}</div>}
      {!loading && !error && (
        sessions.length > 0 ? (
          <div className="session-board">
            {sessions.map((s) => (
              <article key={s.id} className="session-board-card">
                <div className="session-board-top">
                  <span className="pill">{s.status}</span>
                  <span className="muted">{s.date}</span>
                </div>
                <h3>{s.client}</h3>
                <p>{s.topic}</p>
                <div className="session-board-footer">
                  <strong>{s.time}</strong>
                  <button className="ghost small" onClick={() => openDetail(s.id)}>Ver detalle</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No hay sesiones visibles</h3>
            <p className="muted">Cuando agregues seguimiento o el coach programe revisiones, apareceran aqui.</p>
          </div>
        )
      )}
      </section>

      {detail ? (
        <div className="member-modal-layer">
          <div className="member-modal resource-modal compact-modal">
            <div className="member-modal-copy">
              <button type="button" className="close-modal" onClick={() => setDetail(null)}>×</button>
              <p className="eyebrow">Sesion</p>
              <h2>{detail.client}</h2>
              <div className="detail-list">
                <div className="detail-row"><strong>Tema</strong><span>{detail.topic}</span></div>
                <div className="detail-row"><strong>Fecha</strong><span>{detail.date}</span></div>
                <div className="detail-row"><strong>Hora</strong><span>{detail.time}</span></div>
                <div className="detail-row"><strong>Estado</strong><span>{detail.status}</span></div>
                <div className="detail-row"><strong>Ubicacion</strong><span>{detail.location}</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Sessions;
