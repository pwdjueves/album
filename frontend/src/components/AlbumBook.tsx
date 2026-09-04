import { useState } from 'react';
import type { Album, PhotoSlot } from '../types/album';
import { useAlbumNavigation } from '../hooks/useAlbumNavigation';
import { PhotoSlot as PhotoSlotView } from './PhotoSlot';

export function AlbumBook({ album, canComplete }: { album: Album; canComplete: boolean }) {
  const [pages, setPages] = useState(album.pages ?? []);
  const navigation = useAlbumNavigation(pages);
  function updateSlot(pageId: string, slotId: string, photo: PhotoSlot['photo']) {
    setPages((items) => items.map((page) => page.id === pageId
      ? { ...page, photoSlots: page.photoSlots.map((slot) => slot.id === slotId ? { ...slot, photo, status: 'COMPLETED' } : slot) }
      : page));
  }

  return (
    <div className="album-reader">
      <div className="album-reader__toolbar">
        <button className="button secondary" type="button" disabled={!navigation.canGoPrevious} onClick={navigation.previous}>Anterior</button>
        <span>Páginas {navigation.currentPages[0]?.pageNumber ?? '—'}{navigation.currentPages[1] ? `–${navigation.currentPages[1].pageNumber}` : ''} de {pages.length}</span>
        <button className="button secondary" type="button" disabled={!navigation.canGoNext} onClick={navigation.next}>Siguiente</button>
      </div>
      <div className="album-book">
        {navigation.currentPages.map((page) => (
          <article className="book-page" key={page.id}>
            <h2>Página {page.pageNumber}</h2>
            <div className="book-page__slots">
              {page.photoSlots.map((slot) => <PhotoSlotView key={slot.id} albumId={album.id} pageId={page.id} slot={slot} canComplete={canComplete} onCompleted={(slotId, photo) => updateSlot(page.id, slotId, photo)} />)}
            </div>
          </article>
        ))}
        {navigation.currentPages.length === 1 && <div className="book-page book-page--blank" aria-hidden="true" />}
      </div>
    </div>
  );
}
