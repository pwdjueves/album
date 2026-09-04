import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function MainLayout() {
  const { user, logout } = useAuth();
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}`.toUpperCase() : '';
  return <div className="app-shell"><header className="site-header"><Link className="brand" to="/">Álbum</Link><h1 className="site-title">Álbumes de fotos</h1><nav>{user ? <><Link to="/albums/new">Crear álbum</Link><details className="profile-menu"><summary className="avatar" aria-label="Abrir menú de perfil" title="Perfil">{initials}</summary><div className="profile-menu__items"><Link to="/profile">Mi perfil</Link>{(user.role === 'MODERATOR' || user.role === 'ADMIN') && <Link to="/moderation/albums">Álbumes</Link>}{user.role === 'ADMIN' && <Link to="/admin/users">Usuarios</Link>}<button type="button" onClick={logout}>Cerrar sesión</button></div></details></> : <><Link to="/login">Login</Link><Link className="button small" to="/register">Registro</Link></>}</nav></header><main className="content"><Outlet /></main><footer>Álbum · Comparte tus recuerdos</footer></div>;
}
