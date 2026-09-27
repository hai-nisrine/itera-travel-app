import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout.jsx'
import SwitchToggle from '../components/SwitchToggle.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Register() {
  const { register, loading, error } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await register({ username, email, phone, password })
    if (res.ok) navigate('/accessibility-profile')
  }

  return (
    <AuthLayout heroSide="left">
      <SwitchToggle />
      <form onSubmit={handleSubmit}>
        <h1>Create your account</h1>
        <p className="sub">First, tell us how to keep your travel plans connected to you.</p>

        <div className="field">
          <label>Username</label>
          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+212 6 12 34 56 78" />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
        </div>

        {error && <p className="error-text">{error}</p>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
