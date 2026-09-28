import { createContext, useContext, useState } from 'react'
import * as api from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login(data) {
    setLoading(true)
    setError('')
    const res = await api.login(data)
    setLoading(false)
    if (res.ok) setUser(res.user)
    else setError(res.error)
    return res
  }

  async function register(data) {
    setLoading(true)
    setError('')
    const res = await api.register(data)
    setLoading(false)
    if (res.ok) setUser(res.user)
    else setError(res.error)
    return res
  }

  async function saveProfile(profile) {
    setLoading(true)
    const res = await api.saveProfile(profile)
    setLoading(false)
    
    if(res.ok) {
      setUser({
        ...user,
        profile: res.profile
      })
    }
    return res
  }

  function logout() {
    setUser(null)
    setError('')
  }

  function clearError() {
    setError('')
  }

  return (
    <AuthContext.Provider
      value={{ user, login, register, saveProfile, logout, clearError, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
