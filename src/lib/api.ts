export type AuthUser = { phone: string; role: 'customer' | 'admin' };

function cookie(name: string) {
  const match = document.cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : '';
}

async function csrfToken() {
  const response = await fetch('/api/auth/csrf', { credentials: 'include' });
  if (!response.ok) throw new Error('Não foi possível iniciar a sessão segura.');
  const data = await response.json() as { csrfToken?: string };
  return data.csrfToken || cookie('senario_csrf');
}

export async function apiRequest<T>(url: string, options: RequestInit = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (method !== 'GET' && method !== 'HEAD') headers.set('x-csrf-token', await csrfToken());
  const response = await fetch(url, { ...options, headers, credentials: 'include' });
  const data = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a operação.');
  return data;
}

export function authRequest(url: string, phone: string, pin: string) {
  return apiRequest<{ user: AuthUser }>(url, { method: 'POST', body: JSON.stringify({ phone, pin }) });
}
