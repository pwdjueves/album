import { request } from './api';
import type { Photo } from '../types/album';

type PhotoResponse = { photo: Photo };

export const photoService = {
  async completeFromUrl(albumId: string, pageId: string, slotId: string, imageUrl: string): Promise<Photo> {
    const response = await request<PhotoResponse>(`/albums/${albumId}/pages/${pageId}/slots/${slotId}/photo`, {
      method: 'POST',
      body: JSON.stringify({ sourceType: 'URL', imageUrl }),
    });
    return response.photo;
  },

  async completeFromUpload(albumId: string, pageId: string, slotId: string, file: File): Promise<Photo> {
    const form = new FormData();
    form.append('file', file);
    form.append('sourceType', 'UPLOAD');
    const response = await request<PhotoResponse>(`/albums/${albumId}/pages/${pageId}/slots/${slotId}/photo`, {
      method: 'POST',
      body: form,
    });
    return response.photo;
  },
};
