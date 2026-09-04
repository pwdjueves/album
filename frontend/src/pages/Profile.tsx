import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Field } from '../components/Field';
import { AlbumCard } from '../components/AlbumCard';
import { useAuth } from '../context/AuthContext';
import { albumService } from '../services/album.service';
import type { Album } from '../types/album';

export function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [message, setMessage] = useState('');
  const [created, setCreated] = useState<Album[]>([]);
  const [collaborated, setCollaborated] = useState<Album[]>([]);
  useEffect(() => { if (user) Promise.all([albumService.created(), albumService.collaborated()]).then(([mine, team]) => { setCreated(mine); setCollaborated(team); }); }, [user]);
  async function removeAlbum(id: string) { if (!window.confirm('¿Borrar este álbum?')) return; await albumService.remove(id); setCreated((albums) => albums.filter((album) => album.id !== id)); }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await updateProfile({ firstName: String(data.get('firstName')), lastName: String(data.get('lastName')) }); setMessage('Perfil actualizado.');
  }
  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    await changePassword({ currentPassword: String(data.get('currentPassword')), password: String(data.get('password')), confirmPassword: String(data.get('confirmPassword')) }); event.currentTarget.reset(); setMessage('Contraseña actualizada.');
  }
  if (!user) return <section className="form-page"><p>Inicia sesión para ver tu perfil.</p></section>;
  return <section className="form-page"><div className="form-card"><h1>Mi perfil</h1><form onSubmit={saveProfile}><Field label="Nombre" name="firstName" defaultValue={user.firstName} required /><Field label="Apellido" name="lastName" defaultValue={user.lastName} required /><Field label="Correo" name="email" value={user.email} readOnly /><button className="button" type="submit">Guardar datos</button></form><hr /><form onSubmit={savePassword}><h2>Cambiar contraseña</h2><Field label="Contraseña actual" name="currentPassword" type="password" required /><Field label="Nueva contraseña" name="password" type="password" minLength={8} required /><Field label="Confirmar contraseña" name="confirmPassword" type="password" minLength={8} required /><button className="button" type="submit">Cambiar contraseña</button></form>{message && <p role="status">{message}</p>}<section><h2>Álbumes creados</h2>{created.length ? <div className="grid">{created.map((album) => <AlbumCard key={album.id} album={album} voteCount={0} actions={<div className="album-management"><Link className="button small" to={`/albums/${album.id}/edit`}>Editar</Link><button className="button danger small" type="button" onClick={() => void removeAlbum(album.id)}>Borrar</button></div>} />)}</div> : <p>Aún no tienes álbumes creados.</p>}</section><section><h2>Álbumes colaborados</h2>{collaborated.length ? <div className="grid">{collaborated.map((album) => <AlbumCard key={album.id} album={album} voteCount={0} />)}</div> : <p>No colaboras en álbumes todavía.</p>}</section></div></section>;
}
