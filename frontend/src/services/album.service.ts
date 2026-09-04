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
  async getById(id: string): Promise<Album> {
    const response = await request<AlbumResponse>(`/albums/${id}`);
    return { ...response.album, permissions: response.permissions ?? response.album.permissions };
  },
  async ranking(filters: { title?: string; categoryId?: string }): Promise<RankedAlbum[]> {
    const params = new URLSearchParams({ page: '1', limit: '100' });
    if (filters.title) params.set('title', filters.title);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    const response = await request<RankingResponse>(`/albums/ranking?${params.toString()}`);
    return response.items;
  },
};
