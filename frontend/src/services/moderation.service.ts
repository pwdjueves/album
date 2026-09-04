import { request } from './api';
import type { Album } from '../types/album';
import type { User } from '../types/auth';

export type ManagedAlbum = Album & {
  collaborators: Array<{ user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> }>;
};

export const moderationService = {
  async listAlbums(): Promise<ManagedAlbum[]> {
    return (await request<{ albums: ManagedAlbum[] }>('/moderation/albums')).albums;
  },
  async collaborators(id: string): Promise<{ id: string; title: string; collaborators: ManagedAlbum['collaborators'] }> {
    return request(`/moderation/albums/${id}/collaborators`);
  },
  async setStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    await request(`/moderation/albums/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
  async removeAlbum(id: string): Promise<void> {
    await request(`/moderation/albums/${id}`, { method: 'DELETE' });
  },
};
