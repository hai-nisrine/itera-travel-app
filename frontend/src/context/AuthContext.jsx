import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { request, getToken, setToken, setUnauthorizedHandler } from '../api/client.js'

const AuthContext = createContext(null)

// Each role's first page
export function homeFor(role) {
  return role === 'organizer' ? '/organizer/new' : '/home'
}

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken())
  const [user, setUser] = useState(null) // { id, name, email, role, profile }
  const [checking, setChecking] = useState(Boolean(getToken())) // true while restoring a session
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const logout = useCallback(() => {
    setToken(null)
    setTokenState(null)
    setUser(null)
    setError('')
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
  }, [logout])

  // Restore the session on refresh
  useEffect(() => {
    if (!getToken()) return
    request('/api/auth/me').then((res) => {
      if (res.ok) setUser({ ...res.data.user, profile: res.data.profile })
      else logout()
      setChecking(false)
    })
  }, [logout])

  function startSession(data) {
    setToken(data.token)
    setTokenState(data.token)
    const u = { ...data.user, profile: data.profile ?? null }
    setUser(u)
    return u
  }

  async function authCall(path, body) {
    setLoading(true)
    setError('')
    const res = await request(path, { method: 'POST', body })
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return { ok: false, error: res.error }
    }
    return { ok: true, user: startSession(res.data) }
  }

  const login = (data) => authCall('/api/auth/login', data)
  const register = (data) => authCall('/api/auth/signup', data)

  async function saveProfile(profile) {
    setLoading(true)
    const res = await request('/api/accessibility', { method: 'POST', body: profile })
    setLoading(false)
    if (!res.ok) return { ok: false, error: res.error }
    setUser((u) => ({ ...u, profile: res.data.profile }))
    return { ok: true, profile: res.data.profile }
  }

  function clearError() {
    setError('')
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: user?.role ?? null,
        checking,
        login,
        register,
        saveProfile,
        logout,
        clearError,
        loading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
