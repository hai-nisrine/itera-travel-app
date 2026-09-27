const API_BASE = 'http://localhost:8000'

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/login`, {
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

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem('itera_users') || '{}')
  } catch {
    return {}
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem('itera_users', JSON.stringify(users))
  } catch {
    /* storage unavailable — ignore in this mock */
  }
}

export async function register({ username, email, phone, password }) {
  await delay(500)
  const users = loadUsers()
  const key = (email || '').trim().toLowerCase()
  if (!key || !password) return { ok: false, error: 'Email and password are required.' }
  if (users[key]) return { ok: false, error: 'An account with this email already exists.' }
  users[key] = { username, email: key, phone, password, profile: null }
  saveUsers(users)
  return { ok: true, user: users[key] }
}

export async function login({ email, password }) {
  await delay(500)
  const users = loadUsers()
  const key = (email || '').trim().toLowerCase()
  const user = users[key]
  if (!user || user.password !== password) {
    return { ok: false, error: 'Incorrect email or password.' }
  }
  return { ok: true, user }
}

export async function saveProfile(email, profile) {
  await delay(400)
  const users = loadUsers()
  const key = (email || '').trim().toLowerCase()
  if (!users[key]) return { ok: false, error: 'User not found.' }
  users[key].profile = profile
  saveUsers(users)
  return { ok: true, user: users[key] }
}
