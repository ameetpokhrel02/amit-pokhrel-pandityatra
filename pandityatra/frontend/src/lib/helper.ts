// Helper utilities for API calls and auth headers (frontend-only)
const rawApiBase = import.meta.env.VITE_API_URL ?? '';
export const API_BASE_URL = rawApiBase.replace(/\/+$|\s+/g, '').replace(/\/+$/g, '');

export function buildUrl(path: string) {
  if (!path) return API_BASE_URL;
  // Ensure single slash between base and path
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${p}`;
}

export function authHeaders(token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default { API_BASE_URL, buildUrl, authHeaders };
