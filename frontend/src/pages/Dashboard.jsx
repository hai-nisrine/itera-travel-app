import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { OPTIONS } from './AccessibilityProfile.jsx'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const labels = OPTIONS.filter((o) => user.profile?.selected.includes(o.id)).map((o) => o.label)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="a11y-body" style={{ paddingTop: 60 }}>
      <div className="card">
        <legend>Welcome back, {user.username || user.email}</legend>
        <p className="sub">Signed in as {user.email}</p>

        <div className="label">Accessibility needs on file</div>
        {labels.length ? (
          <ul className="dash-list">
            {labels.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        ) : (
          <p className="desc">No accessibility needs saved yet.</p>
        )}

        {user.profile?.notes && (
          <p className="desc" style={{ marginTop: 8 }}>
            Notes: {user.profile.notes}
          </p>
        )}

        <div className="dash-actions">
          <button className="btn-primary" onClick={() => navigate('/accessibility-profile')}>
            Edit accessibility profile
          </button>
          <button className="btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>
    </div>
  )
}
