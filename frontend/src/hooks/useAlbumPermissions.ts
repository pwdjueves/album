import { useAuth } from '../context/AuthContext';
import type { Album } from '../types/album';

export function useAlbumPermissions(album: Album) {
  const { user } = useAuth();
  return {
    canComplete: Boolean(user && album.status === 'ACTIVE' && album.permissions?.canComplete),
  };
}
