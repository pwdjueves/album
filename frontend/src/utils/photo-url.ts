const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');

function apiOrigin(): string {
  return new URL(apiBaseUrl, window.location.origin).origin;
}

/**
 * Local uploads belong to the backend origin, while remote URLs must remain
 * untouched so existing persisted photos keep working.
 */
export function resolvePhotoUrl(imageUrl: string): string {
  const value = imageUrl.trim();
  if (!value) return '';

  if (value.startsWith('//')) {
    return `${window.location.protocol}${value}`;
  }

  try {
    const parsed = new URL(value);
    if (['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname)) {
      const backendOrigin = new URL(apiBaseUrl, window.location.origin).origin;
      parsed.protocol = new URL(backendOrigin).protocol;
      parsed.host = new URL(backendOrigin).host;
    }
    return parsed.toString();
  } catch {
    const localPath = value.startsWith('/') ? value : `/${value}`;
    return new URL(localPath, `${apiOrigin()}/`).toString();
  }
}
