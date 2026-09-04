import { Link, useParams } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
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
  return <section><Link to="/">← Volver</Link><div className="album-header"><p className="eyebrow">{album.category?.name}</p><h1>{album.title}</h1><p>{album.description}</p></div><AlbumBook album={album} canComplete={canComplete} /></section>;
}
