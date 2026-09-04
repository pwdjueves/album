import { request } from './api';
import type { AuthResponse, LoginInput, RegisterInput, User } from '../types/auth';
export const authService = {
  login: (input: LoginInput) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(input) }),
  register: (input: RegisterInput) => request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(input) }),
  me: async (): Promise<User> => {
    const response = await request<{ user: User }>('/auth/me');
    return response.user;
  },
};
