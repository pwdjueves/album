import { Link } from 'react-router-dom';
import type { Album } from '../types/album';
export function AlbumCard({ album, voteCount, rank }: { album: Album; voteCount: number; rank?: number }) {
  return <article className="album-card"><div className="album-card__top"><span className="rank-badge">#{rank ?? '-'}</span><span className="votes">♥ {voteCount} votos</span></div><h3>{album.title}</h3><p>{album.description || 'Sin descripción'}</p><span className="category-tag">{album.category?.name ?? 'Sin categoría'}</span><Link className="button secondary" to={`/albums/${album.id}`}>Ver álbum</Link></article>;
}
