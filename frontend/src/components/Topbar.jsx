import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const todayLabel = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  const goSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/app/buscar?q=${encodeURIComponent(query.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="topbar">
      <div>
        <h1>MentorIA</h1>
        <p className="muted">
          {user?.rol === 'administrador'
            ? 'Aprobacion y control de coaches'
            : user?.rol === 'coach'
              ? 'Seguimiento de alumnos'
              : 'Progreso personal y coach seleccionado'}
        </p>
      </div>
      <div className="topbar-actions">
        <form onSubmit={goSearch} style={{ position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: 11, color: '#8a775c' }} />
          <input
            placeholder="Buscar rutinas, recetas o planes"
            style={{ paddingLeft: 32 }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
        <button className="ghost small">Hoy · {todayLabel}</button>
        <button className="ghost"><FiBell /></button>
        <div className="user-summary">
          <div className="avatar">{(user?.nombre || 'M').slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user?.nombre}</strong>
            <p className="muted role-line">{user?.rol}</p>
          </div>
        </div>
        <button className="ghost small" onClick={handleLogout}>Salir</button>
      </div>
    </header>
  );
};

export default Topbar;
