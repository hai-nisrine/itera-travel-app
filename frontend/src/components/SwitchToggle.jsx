import { useNavigate, useLocation } from 'react-router-dom'

export default function SwitchToggle() {
  const navigate = useNavigate()
  const location = useLocation()
  const value = location.pathname === '/register' ? 'register' : 'login'

  return (
    <div className="switch-track">
      <div
        className="switch-thumb"
        style={{ transform: value === 'login' ? 'translateX(0)' : 'translateX(100%)' }}
      />
      <button type="button" className={value === 'login' ? 'active' : ''} onClick={() => navigate('/login')}>
        Log in
      </button>
      <button type="button" className={value === 'register' ? 'active' : ''} onClick={() => navigate('/register')}>
        Register
      </button>
    </div>
  )
}
