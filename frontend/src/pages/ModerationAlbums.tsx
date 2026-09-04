import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { moderationService, type ManagedAlbum } from '../services/moderation.service';

export function ModerationAlbums() {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<ManagedAlbum[]>([]);
  const [expanded, setExpanded] = useState<string>();
  const [collaborators, setCollaborators] = useState<Record<string, ManagedAlbum['collaborators']>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    if (user?.role !== 'MODERATOR' && user?.role !== 'ADMIN') return;
    void moderationService.listAlbums().then(setAlbums).catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los álbumes.'));
  }, [user]);
  if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
    return <section className="state-message error">No tienes permisos para acceder a este panel.</section>;
  }
  async function toggleCollaborators(id: string) {
    if (expanded === id) {
      setExpanded(undefined);
      return;
    }
    setExpanded(id);
    if (!collaborators[id]) {
      const response = await moderationService.collaborators(id);
      setCollaborators((items) => ({ ...items, [id]: response.collaborators }));
    }
  }
  async function toggleStatus(album: ManagedAlbum) {
    const status = album.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await moderationService.setStatus(album.id, status);
    setAlbums((items) => items.map((item) => item.id === album.id ? { ...item, status } : item));
  }
  async function remove(album: ManagedAlbum) {
    if (!window.confirm(`¿Borrar el álbum "${album.title}"?`)) return;
    await moderationService.removeAlbum(album.id);
    setAlbums((items) => items.filter((item) => item.id !== album.id));
  }
  return <section className="admin-page"><p className="eyebrow">Moderación</p><h1>Álbumes</h1>{error && <p className="error">{error}</p>}<div className="admin-table">{albums.map((album) => <article className="admin-user" key={album.id}><div><strong>{album.title}</strong><span>{album.category.name} · {album.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</span></div><Link className="button secondary small" to={`/albums/${album.id}/edit`}>Editar</Link><button className="button small" type="button" onClick={() => void toggleStatus(album)}>{album.status === 'ACTIVE' ? 'Inactivar' : 'Activar'}</button><button className="button secondary small" type="button" onClick={() => void toggleCollaborators(album.id)}>Colaboradores</button><button className="button danger small" type="button" onClick={() => void remove(album)}>Borrar</button>{expanded === album.id && <div className="collaborator-list"><strong>Colaboradores</strong>{collaborators[album.id]?.length ? collaborators[album.id].map(({ user: collaborator }) => <span key={collaborator.id}>{collaborator.firstName} {collaborator.lastName} · {collaborator.email}</span>) : <span>Sin colaboradores</span>}</div>}</article>)}</div>{!albums.length && <p>No hay álbumes para moderar.</p>}</section>;
}
