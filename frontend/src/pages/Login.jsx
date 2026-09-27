import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import loginHero from '../assets/login-hero4.jpg'

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
    <PageShell overlap>
      <AuthLayout heroSide="right" heroImage={loginHero}>
        <form onSubmit={handleSubmit}>
          <h1>Welcome back 👋</h1>
          <p className="sub">Log in to continue planning travel around your needs.</p>

          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="your password" />
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="foot-note">
            Need an account? <Link className="link" to="/register">Register</Link>
          </p>
        </form>
      </AuthLayout>
    </PageShell>
  )
}
