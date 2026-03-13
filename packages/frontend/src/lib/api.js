const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('bellet_token');
  return null;
}

function setToken(token) {
  if (typeof window !== 'undefined') localStorage.setItem('bellet_token', token);
}

function getUser() {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('bellet_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
}

function setUser(user) {
  if (typeof window !== 'undefined') localStorage.setItem('bellet_user', JSON.stringify(user));
}

function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('bellet_token');
    localStorage.removeItem('bellet_user');
  }
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export async function login(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export async function register(userData) {
  const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(userData) });
  setToken(data.token);
  setUser(data.user);
  return data;
}

export function logout() { clearAuth(); window.location.href = '/'; }
export { api, getToken, getUser, setToken, setUser, clearAuth, API_URL };
