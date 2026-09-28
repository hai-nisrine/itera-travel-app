import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageShell from '../components/PageShell.jsx'
import AuthLayout from '../components/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import registerHero from '../assets/register-hero.jpg'

const PASSWORD_RULES = [
  { key: 'length', label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { key: 'upper', label: 'One uppercase letter', test: (pw) => /[A-Z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw) => /[0-9]/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
]

export default function Register() {
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone_number, setPhoneNumber] = useState('')
  const [password, setPassword] = useState('')
  const [passwordFocused, setPasswordFocused] = useState(false)

  const passwordChecks = PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }))
  const passwordValid = passwordChecks.every((rule) => rule.met)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!passwordValid) return
    const res = await register({ name, email, phone_number, password })
    if (res.ok) navigate('/accessibility-profile')
  }

  return (
    <PageShell overlap>
      <AuthLayout heroSide="left" heroImage={registerHero}>
        <form onSubmit={handleSubmit}>
          <h1>Create your account</h1>
          <p className="sub">First, tell us how to keep your travel plans connected to you.</p>

          <div className="field">
            <label>Username</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="janedoe1997" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div className="field">
            <label>Phone number</label>
            <input type="tel" value={phone_number} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+212 6 12 34 56 78" />
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              placeholder="Create a secure password"
            />
            {(passwordFocused || password.length > 0) && (
              <ul className="password-requirements">
                {passwordChecks.map((rule) => (
                  <li key={rule.key} className={rule.met ? 'met' : ''}>
                    <span className="req-dot">
                      <svg viewBox="0 0 16 16" width="10" height="10">
                        <path d="M3 8l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <p className="error-text">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading || !passwordValid}>
            {loading ? 'Creating…' : 'Create account'}
          </button>

          <p className="foot-note">
            Do you already have an account? <Link className="link" to="/login">Log in</Link>
          </p>
        </form>
      </AuthLayout>
    </PageShell>
  )
}