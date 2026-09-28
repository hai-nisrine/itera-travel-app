import NavBar from './NavBar.jsx'

export default function PageShell({ overlap = false, children }) {
  return (
    <div className="page-shell">
      <NavBar />
      <div className={'page-content' + (overlap ? ' overlap' : '')}>{children}</div>
    </div>
  )
}
