import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth, homeFor } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import AccessibilityProfile from './pages/AccessibilityProfile.jsx'

// Placeholders until pages 4 and 6 are merged. Their owners swap these for the real pages.
function Placeholder({ title }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  return (
    <main style={{ padding: '2rem' }}>
      <h1>{title}</h1>
      <p>Logged in as {user.email} ({user.role})</p>
      <button onClick={() => { logout(); navigate('/login') }}>Log out</button>
    </main>
  )
}

function RootRedirect() {
  const { user, checking } = useAuth()
  if (checking) return null
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      {/* Traveler */}
      <Route
        path="/accessibility-profile"
        element={<ProtectedRoute role="traveler"><AccessibilityProfile /></ProtectedRoute>}
      />
      <Route
        path="/home"
        element={<ProtectedRoute role="traveler"><Placeholder title="Traveler home" /></ProtectedRoute>}
      />
      <Route
        path="/trips/:id"
        element={<ProtectedRoute role="traveler"><Placeholder title="Trip details" /></ProtectedRoute>}
      />

      {/* Organizer */}
      <Route
        path="/organizer/new"
        element={<ProtectedRoute role="organizer"><Placeholder title="New draft" /></ProtectedRoute>}
      />

      <Route path="/dashboard" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
