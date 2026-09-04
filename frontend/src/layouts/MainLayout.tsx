import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function MainLayout() {
  const { user, logout } = useAuth(); const navigate = useNavigate();
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';
  return <div className="app-shell"><header className="site-header"><Link className="brand" to="/">Álbum</Link><h1 className="site-title">Álbumes de fotos</h1><nav>{user ? <button className="avatar" aria-label={`Cerrar sesión de ${user.firstName}`} title="Cerrar sesión" onClick={() => { logout(); navigate('/'); }}>{initials}</button> : <><Link to="/login">Login</Link><Link className="button small" to="/register">Registro</Link></>}</nav></header><main className="content"><Outlet /></main><footer>Álbum · Comparte tus recuerdos</footer></div>;
}
