import type { ApiErrorPayload } from '../types/api';
const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api').replace(/\/$/, '');
export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); this.name = 'ApiError'; } }
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  const storedToken = localStorage.getItem('album_token')?.trim();
  const token = storedToken?.replace(/^Bearer\s+/i, '').trim();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T | ApiErrorPayload) : null;
  if (response.status === 401) {
    localStorage.removeItem('album_token');
    localStorage.removeItem('album_user');
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  if (!response.ok) { const apiError = payload as ApiErrorPayload | null; throw new ApiError(apiError?.error?.message ?? 'Error de API.', response.status); }
  return payload as T;
}
