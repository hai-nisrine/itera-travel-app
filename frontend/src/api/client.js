const API_BASE = import.meta.env.VITE_API_URL

let onUnauthorized = () => {}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

export const getToken = () => localStorage.getItem('token')
export function setToken(token) {
  if (token) localStorage.setItem('token', token)
  else localStorage.removeItem('token')
}

// Every call goes through here: adds the token, and a 401 on a logged-in call logs the user out.
export async function request(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { ok: false, status: 0, error: 'Could not reach the server.' }
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token) onUnauthorized()
  if (!res.ok) return { ok: false, status: res.status, error: data.error || 'Something went wrong.' }
  return { ok: true, status: res.status, data }
}
