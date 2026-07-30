const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const API_BASE = rawUrl.replace(/\/+$/, '').replace(/\/api$/, '');

export async function api(path, { method = 'GET', body, token } = {}) {
  const authToken = token || localStorage.getItem('token');
  const tenantSlug = localStorage.getItem('activeTenantSlug');

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug } : {}),
  };

  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || err.message || 'Request failed');
  }
  return res.json();
}
