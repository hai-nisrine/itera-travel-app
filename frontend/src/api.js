const API_BASE = 'http://localhost:8000'

export async function register({ name, email, phone_number, password }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, phone_number, password }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error }
  localStorage.setItem('token', data.token)
  return { ok: true, user: data.user }
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error }
  localStorage.setItem('token', data.token)
  return { ok: true, user: data.user }
}

export async function saveProfile(email, profile) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ profile }),
  })
  const data = await res.json()
  if (!res.ok) return { ok: false, error: data.error }
  return { ok: true, user: data.user }
}