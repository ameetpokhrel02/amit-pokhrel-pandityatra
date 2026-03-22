// Helper utilities for API calls and auth headers (frontend-only)
const rawApiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';
export const API_BASE_URL = rawApiBase.replace(/\/+$|\s+/g, '').replace(/\/+$/g, '');
export const ROOT_URL = API_BASE_URL.replace(/\/api$/, '');

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

export const WS_BASE_URL = import.meta.env.VITE_WS_URL || ROOT_URL.replace('http', 'ws');

export default { API_BASE_URL, WS_BASE_URL, ROOT_URL, buildUrl, authHeaders };
