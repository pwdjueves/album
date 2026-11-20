import { useEffect, useState } from 'react';
import type { PhotoSlot as PhotoSlotModel } from '../types/album';
import { photoService } from '../services/photo.service';
import { resolvePhotoUrl } from '../utils/photo-url';

type Props = {
  albumId: string;
  pageId: string;
  slot: PhotoSlotModel;
  canComplete: boolean;
  canModerate: boolean;
  onCompleted: (slotId: string, photo: PhotoSlotModel['photo']) => void;
};

export function PhotoSlot({ albumId, pageId, slot, canComplete, canModerate, onCompleted }: Props) {
  const [imageUrl, setImageUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [imageLoadError, setImageLoadError] = useState(false);
  const resolvedImageUrl = slot.photo ? resolvePhotoUrl(slot.photo.imageUrl) : '';

  useEffect(() => {
    setImageLoadError(false);
  }, [resolvedImageUrl]);

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
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        throw new Error('Elige una imagen JPG, PNG o WebP.');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('La imagen no puede superar los 5 MB.');
      }
      const photo = await photoService.completeFromUpload(albumId, pageId, slot.id, file);
      onCompleted(slot.id, photo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo subir la foto.');
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    setError(undefined);
    try {
      await photoService.remove(albumId, pageId, slot.id);
      onCompleted(slot.id, null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo borrar la foto.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`photo-slot ${slot.photo ? 'photo-slot--filled' : ''}`}>
      <p className="photo-slot__prompt">{slot.prompt}</p>
      <div className="photo-slot__media">
        {slot.photo && !imageLoadError ? (
          <img
            className="photo-slot__image"
            src={resolvedImageUrl}
            alt={slot.prompt}
            onError={(event) => {
              const failedUrl = event.currentTarget.currentSrc || event.currentTarget.src;
              console.error('Failed to load stored photo', {
                source: failedUrl,
                slotId: slot.id,
              });
              setImageLoadError(true);
              setError(`No se pudo cargar la imagen almacenada. URL solicitada: ${failedUrl}`);
            }}
          />
        ) : slot.photo ? (
          <span className="photo-slot__image-error" role="alert">No se pudo cargar la imagen.</span>
        ) : (
          <span className="photo-slot__empty">Espacio para figurita</span>
        )}
      </div>
      {canModerate && slot.photo && <button className="button danger small" type="button" disabled={busy} onClick={() => void removePhoto()}>Borrar foto</button>}
      {canComplete && !slot.photo && (
        <div className="photo-slot__controls">
          <label className="button small">
            Subir foto
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden disabled={busy} onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
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
