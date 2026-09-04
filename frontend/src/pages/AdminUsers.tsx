import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/admin.service';
import type { User, UserRole } from '../types/auth';

export function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user?.role !== 'ADMIN') return;
    void adminService.listUsers().then(setUsers).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los usuarios.'));
  }, [user]);
  if (!user || user.role !== 'ADMIN') return <section className="state-message error">No tienes permisos para acceder a este panel.</section>;
  async function update(id: string, input: { role?: UserRole; isActive?: boolean }) {
    const next = await adminService.updateUser(id, input);
    setUsers((items) => items.map((item) => item.id === id ? next : item));
  }
  async function remove(id: string) {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    await adminService.removeUser(id);
    setUsers((items) => items.filter((item) => item.id !== id));
  }
  return <section className="admin-page"><button className="button secondary small" type="button" onClick={() => navigate('/profile')}>← Mi perfil</button><h1>Gestión de usuarios</h1>{error && <p className="error">{error}</p>}<div className="admin-table">{users.map((item) => <article className="admin-user" key={item.id}><div><strong>{item.firstName} {item.lastName}</strong><span>{item.email}</span></div><select value={item.role} onChange={(event) => void update(item.id, { role: event.target.value as UserRole })}><option value="USER">USER</option><option value="MODERATOR">MODERATOR</option><option value="ADMIN">ADMIN</option></select><button className="button small" type="button" onClick={() => void update(item.id, { isActive: !item.isActive })}>{item.isActive ? 'Desactivar' : 'Activar'}</button><button className="button danger small" type="button" disabled={item.id === user.id} onClick={() => void remove(item.id)}>Eliminar</button></article>)}</div></section>;
}
