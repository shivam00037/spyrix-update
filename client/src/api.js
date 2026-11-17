const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = configuredApiBase || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '');

export async function apiRequest(path, options = {}) {
  if (!API_BASE) {
    throw new Error('SPYRIX API is not configured for this deployment. Set VITE_API_BASE_URL to your deployed backend URL ending in /api/v1, then redeploy the frontend.');
  }

  const token = localStorage.getItem('spyrix_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  } catch {
    throw new Error('Cannot reach the SPYRIX API. Check the backend URL, backend availability, and CORS configuration.');
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('spyrix_token');
      window.dispatchEvent(new Event('spyrix:unauthorized'));
    }
    throw new Error(payload.message || 'Something went wrong. Please try again.');
  }
  return payload;
}
