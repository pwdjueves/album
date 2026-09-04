import { useState } from 'react';
import type { PhotoSlot as PhotoSlotModel } from '../types/album';
import { photoService } from '../services/photo.service';

type Props = {
  albumId: string;
  pageId: string;
  slot: PhotoSlotModel;
  canComplete: boolean;
  onCompleted: (slotId: string, photo: PhotoSlotModel['photo']) => void;
};

export function PhotoSlot({ albumId, pageId, slot, canComplete, onCompleted }: Props) {
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function completeFromUrl() {
    setBusy(true);
    setError(undefined);
    try {
      const photo = await photoService.completeFromUrl(albumId, pageId, slot.id, imageUrl);
      onCompleted(slot.id, photo);
      setImageUrl('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo completar el espacio.');
    } finally {
      setBusy(false);
    }
  }

  async function completeFromUpload(file: File) {
    setBusy(true);
    setError(undefined);
    try {
      const photo = await photoService.completeFromUpload(albumId, pageId, slot.id, file);
      onCompleted(slot.id, photo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo subir la foto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`photo-slot ${slot.photo ? 'photo-slot--filled' : ''}`}>
      <p className="photo-slot__prompt">{slot.prompt}</p>
      {slot.photo ? (
        <img className="photo-slot__image" src={slot.photo.imageUrl} alt={slot.prompt} />
      ) : (
        <p className="photo-slot__empty">Espacio disponible</p>
      )}
      {canComplete && !slot.photo && (
        <div className="photo-slot__controls">
          <label className="button small">
            Subir foto
            <input type="file" accept="image/*" hidden disabled={busy} onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void completeFromUpload(file);
            }} />
          </label>
          <div className="photo-slot__url">
            <input value={imageUrl} placeholder="URL HTTPS" onChange={(event) => setImageUrl(event.target.value)} />
            <button className="button small" type="button" disabled={busy || !imageUrl} onClick={() => void completeFromUrl()}>Usar URL</button>
          </div>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
