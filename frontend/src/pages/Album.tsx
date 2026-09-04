import { Link, useParams } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { albumService } from '../services/album.service';
import { useAlbumPermissions } from '../hooks/useAlbumPermissions';
import { AlbumBook } from '../components/AlbumBook';
export function Album() {
  const { id = '' } = useParams(); const { data: album, loading, error } = useAsync(() => albumService.getById(id), [id]);
  if (loading) return <p>Cargando álbum...</p>; if (error) return <p className="error">{error}</p>; if (!album) return <p>Álbum no encontrado.</p>;
  return <AlbumContent album={album} />;
}

function AlbumContent({ album }: { album: NonNullable<Awaited<ReturnType<typeof albumService.getById>>> }) {
  const { canComplete } = useAlbumPermissions(album);
  const { user } = useAuth();
  const { data: votes, reload } = useAsync(() => albumService.votes(album.id), [album.id]);
  const [busy, setBusy] = useState(false);
  async function toggleVote() {
    if (!user || busy) return;
    setBusy(true);
    try {
      if (votes?.voted) await albumService.removeVote(album.id);
      else await albumService.vote(album.id);
      await reload();
    } finally {
      setBusy(false);
    }
  }
  const canModerate = album.permissions?.canModerate === true;
  return <section><Link to="/">← Volver</Link><div className="album-header"><p className="eyebrow">{album.category?.name}</p><h1>{album.title}</h1><p>{album.description}</p><div className="album-vote"><span>♥ {votes?.votes ?? 0} votos</span><button className={`button vote-button ${votes?.voted ? 'is-voted' : ''}`} type="button" disabled={!user || busy} onClick={() => void toggleVote()}>{votes?.voted ? '♥ Votado' : '♡ Upvote'}</button>{!user && <small>Inicia sesión para votar</small>}</div></div><AlbumBook album={album} canComplete={canComplete} canModerate={canModerate} /></section>;
}
