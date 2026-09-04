import { request } from './api';
import type { User, UserRole } from '../types/auth';

export const adminService = {
  async listUsers(): Promise<User[]> {
    return (await request<{ users: User[] }>('/admin/users')).users;
  },
  async updateUser(id: string, input: { role?: UserRole; isActive?: boolean }): Promise<User> {
    return (await request<{ user: User }>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) })).user;
  },
  async removeUser(id: string): Promise<void> {
    await request<void>(`/admin/users/${id}`, { method: 'DELETE' });
  },
};
