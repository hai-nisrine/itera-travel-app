import { Navigate } from 'react-router-dom'
import { useAuth, homeFor } from '../context/AuthContext.jsx'

// <ProtectedRoute role="traveler">: not logged in -> /login, wrong role -> their own first page
export default function ProtectedRoute({ role, children }) {
  const { user, checking } = useAuth()

  if (checking) return <p role="status">Loading…</p>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />
  return children
}
