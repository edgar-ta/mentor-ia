import { NavLink } from 'react-router-dom';
import { FiHome, FiUsers, FiCalendar, FiMessageCircle, FiSettings, FiSearch, FiUser, FiShield } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">MentorIA</div>
        <small>Black fitness system</small>
      </div>
      <nav>
        <NavLink to="/app" end className={({ isActive }) => isActive ? 'active' : ''}><FiHome /> Inicio</NavLink>
        <NavLink to="/app/buscar" className={({ isActive }) => isActive ? 'active' : ''}><FiSearch /> Planes</NavLink>
        <NavLink to="/app/sesiones" className={({ isActive }) => isActive ? 'active' : ''}><FiCalendar /> Sesiones</NavLink>
        <NavLink to="/app/chat" className={({ isActive }) => isActive ? 'active' : ''}><FiMessageCircle /> Coach IA</NavLink>
        <NavLink to="/app/perfil" className={({ isActive }) => isActive ? 'active' : ''}><FiUser /> Perfil</NavLink>
        <NavLink to="/app/seguridad" className={({ isActive }) => isActive ? 'active' : ''}><FiShield /> Seguridad</NavLink>
        {user?.rol === 'usuario' ? (
          <NavLink to="/app/coaches" className={({ isActive }) => isActive ? 'active' : ''}><FiUsers /> Coaches</NavLink>
        ) : null}
        {user?.rol === 'coach' ? (
          <NavLink to="/app/coach" className={({ isActive }) => isActive ? 'active' : ''}><FiUsers /> Mis alumnos</NavLink>
        ) : null}
        {user?.rol === 'administrador' ? (
          <NavLink to="/app/clientes" className={({ isActive }) => isActive ? 'active' : ''}><FiUsers /> Clientes</NavLink>
        ) : null}
        {user?.rol === 'administrador' ? (
          <NavLink to="/app/admin/coaches" className={({ isActive }) => isActive ? 'active' : ''}><FiSettings /> Solicitudes</NavLink>
        ) : null}
      </nav>
    </aside>
  );
};

export default Sidebar;
