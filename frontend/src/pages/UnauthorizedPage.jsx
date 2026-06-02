import { Link } from 'react-router-dom';

const UnauthorizedPage = () => (
  <section className="auth-shell">
    <div className="auth-card">
      <p className="eyebrow">403</p>
      <h1>Acceso denegado</h1>
      <p className="muted">Tu rol no tiene permisos para entrar a esta seccion.</p>
      <div className="auth-links">
        <Link to="/">Ir al panel</Link>
      </div>
    </div>
  </section>
);

export default UnauthorizedPage;
