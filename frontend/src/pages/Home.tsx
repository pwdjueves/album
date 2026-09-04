import { useMemo, useState } from 'react';
import { AlbumCard } from '../components/AlbumCard';
import { useAsync } from '../hooks/useAsync';
import { albumService } from '../services/album.service';
export function Home() {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [refresh, setRefresh] = useState(0);
  const filters = useMemo(() => ({ title: title.trim(), categoryId }), [title, categoryId]);
  const { data, loading, error } = useAsync(async () => {
    const [ranked, available] = await Promise.all([albumService.ranking(filters), albumService.list()]);
    return { ranked, available };
  }, [filters, refresh]);
  const rankedAlbums = data?.ranked;
  const categories = useMemo(() => {
    const values = new Map<string, string>();
    data?.available.forEach((album) => values.set(album.category.id, album.category.name));
    return [...values.entries()];
  }, [data?.available]);

  return <section className="home"><div className="home-intro"><p className="eyebrow">Explora recuerdos compartidos</p><h2>Encuentra tu próximo álbum favorito</h2><p>Descubre las historias que la comunidad está votando.</p></div><div className="home-layout"><aside className="filters"><p className="filters__eyebrow">Explorar</p><h2>Filtrar álbumes</h2><label htmlFor="album-search">Buscar por título</label><input id="album-search" type="search" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ej. Viaje a la playa" /><label htmlFor="category-filter">Categoría</label><select id="category-filter" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Todas las categorías</option>{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>{(title || categoryId) && <button className="clear-filter" type="button" onClick={() => { setTitle(''); setCategoryId(''); }}>Limpiar filtros</button>}</aside><div className="ranking"><div className="section-heading"><div><p className="eyebrow">Lo más votado</p><h2>Ranking de álbumes</h2></div><span className="ranking-count">{rankedAlbums?.length ?? 0} resultados</span></div>{loading && <div className="state-message" role="status">Cargando álbumes...</div>}{error && <div className="state-message error" role="alert">No pudimos cargar los álbumes. {error}</div>}{!loading && !error && !rankedAlbums?.length && <div className="state-message">No encontramos álbumes con estos filtros.</div>}{!loading && !error && rankedAlbums && rankedAlbums.length > 0 && <div className="grid">{rankedAlbums.map(({ album, voteCount, voted }, index) => <AlbumCard key={album.id} album={album} voteCount={voteCount} voted={voted} rank={index + 1} onVoteChange={() => setRefresh((value) => value + 1)} />)}</div>}</div></div></section>;
}
