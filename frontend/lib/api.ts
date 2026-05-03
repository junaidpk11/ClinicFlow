const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:8080/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cf_token');
}

export function saveToken(token: string) { localStorage.setItem('cf_token', token); }
export function clearToken()             { localStorage.removeItem('cf_token'); }

export function getClinicName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('cf_clinic_name');
}
export function saveClinicName(name: string) { localStorage.setItem('cf_clinic_name', name); }

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token     ? { 'Authorization': `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    cache: 'no-store',
    headers: { ...headers, ...(init.headers as Record<string,string> ?? {}) },
  });
  if (res.status === 401) throw new Error('Unauthorized');
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const apiGet  = <T>(path: string)              => request<T>(path);
export const apiPost = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) });
