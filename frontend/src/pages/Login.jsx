import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import SwitchToggle from '../components/SwitchToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, loading, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await login({ email, password })
    if (res.ok) navigate(res.user.profile ? '/dashboard' : '/accessibility-profile')
  }

  return (
    <AuthLayout heroSide="right">
      <SwitchToggle />
      <form onSubmit={handleSubmit}>
        <h1>Welcome back 👋</h1>
        <p className="sub">Log in to continue planning travel around your needs.</p>

        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  )
}
