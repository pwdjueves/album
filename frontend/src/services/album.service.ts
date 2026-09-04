import { request } from './api';
import type { Album } from '../types/album';
import type { RankedAlbum } from '../types/album';

type AlbumListResponse = { albums: Album[] };
type AlbumResponse = { album: Album; permissions?: Album['permissions'] };
type RankingResponse = { items: RankedAlbum[]; page: number; limit: number; hasNextPage: boolean };

export const albumService = {
  async list(): Promise<Album[]> {
    const response = await request<AlbumListResponse>('/albums');
    return response.albums;
  },
  async created(): Promise<Album[]> {
    return (await request<AlbumListResponse>('/albums/mine/created')).albums;
  },
  async collaborated(): Promise<Album[]> {
    return (await request<AlbumListResponse>('/albums/mine/collaborated')).albums;
  },
  update(id: string, input: {
    title?: string; description?: string | null; categoryId?: string; privacy?: string; status?: string;
    structure?: { pages: Array<{ id?: string; title: string; slots: Array<{ id?: string; prompt: string }> }> };
  }) {
    return request<AlbumResponse>(`/albums/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
  },
  async remove(id: string): Promise<void> {
    await request<void>(`/albums/${id}`, { method: 'DELETE' });
  },
  async getById(id: string): Promise<Album> {
    const response = await request<AlbumResponse>(`/albums/${id}`);
    return { ...response.album, permissions: response.permissions ?? response.album.permissions };
  },
  async vote(id: string): Promise<{ votes: number }> {
    return request<{ votes: number }>(`/albums/${id}/vote`, { method: 'POST' });
  },
  async removeVote(id: string): Promise<void> {
    await request<void>(`/albums/${id}/vote`, { method: 'DELETE' });
  },
  async votes(id: string): Promise<{ votes: number; voted: boolean }> {
    return request<{ votes: number; voted: boolean }>(`/albums/${id}/votes`);
  },
  async moderate(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    await request(`/albums/${id}/moderation`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  async removePhoto(albumId: string, pageId: string, slotId: string): Promise<void> {
    await request(`/albums/${albumId}/pages/${pageId}/slots/${slotId}/photo`, { method: 'DELETE' });
  },
  async ranking(filters: { title?: string; categoryId?: string }): Promise<RankedAlbum[]> {
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (filters.title) params.set('title', filters.title);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    const response = await request<RankingResponse>(`/albums/ranking?${params.toString()}`);
    return response.items;
  },
};
