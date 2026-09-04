import { request } from './api';
import type { AuthResponse, ChangePasswordInput, LoginInput, ProfileInput, RegisterInput, User } from '../types/auth';
export const authService = {
  login: (input: LoginInput) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: RegisterInput) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  me: async (): Promise<User> => {
    const response = await request<{ user: User }>('/auth/me');
    return response.user;
  },
  updateProfile: async (input: ProfileInput): Promise<User> => (await request<{ user: User }>('/auth/me', { method: 'PATCH', body: JSON.stringify(input) })).user,
  changePassword: (input: ChangePasswordInput) => request<void>('/auth/me/password', { method: 'PATCH', body: JSON.stringify(input) }),
};
