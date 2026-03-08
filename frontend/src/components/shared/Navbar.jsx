import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const { user, logout, darkMode, setDarkMode } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const isAdmin = user?.role === 'admin'
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'

  const links = isAdmin
    ? [
        { to: '/admin', label: 'Dashboard' },
        { to: '/admin/events', label: 'Events' },
        { to: '/admin/users', label: 'Users' },
        { to: '/admin/analytics', label: 'Analytics' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/events', label: 'Events' },
        { to: '/teams', label: 'Teams' },
        { to: '/notifications', label: 'Notifications' },
        { to: '/profile', label: 'Profile' },
      ]

  const handleLogout = () => { logout(); navigate('/login') }
  const isActive = (to) => location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to))

  return (
    <nav className="top-nav">
      <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-logo">
        <div className="nav-logo-mark">ES</div>
        <div className="nav-logo-name">Event<span>Sphere</span></div>
      </Link>

      {/* Desktop links */}
      <div className="hidden md:flex items-center gap-1">
        {links.map(({ to, label }) => (
          <Link key={to} to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>{label}</Link>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2">
        <button onClick={() => setDarkMode(!darkMode)}
          style={{width:32,height:32,borderRadius:8,background:'var(--surface2)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',transition:'all .2s'}}
          title="Toggle theme">
          {darkMode ? <Sun size={14} color="var(--blue-light)" /> : <Moon size={14} color="var(--text-dim)" />}
        </button>
        <div className="nav-avatar">{initials}</div>
        <span style={{fontSize:'.78rem',fontWeight:500,color:'var(--text-mid)'}}>{user?.name?.split(' ')[0]}</span>
        {isAdmin && <span className="nav-badge">Admin</span>}
        <button className="btn-secondary" style={{padding:'.38rem .9rem',fontSize:'.72rem'}} onClick={handleLogout}>Sign Out</button>
      </div>

      {/* Mobile */}
      <div className="md:hidden flex items-center gap-2">
        <button onClick={() => setDarkMode(!darkMode)} style={{padding:'.4rem',background:'none',border:'none',cursor:'pointer'}}>
          {darkMode ? <Sun size={17} color="var(--blue-light)" /> : <Moon size={17} color="var(--text-dim)" />}
        </button>
        <button style={{padding:'.4rem',background:'none',border:'none',cursor:'pointer'}} onClick={() => setOpen(!open)}>
          {open ? <X size={20} color="var(--text)" /> : <Menu size={20} color="var(--text)" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div style={{position:'absolute',top:62,left:0,right:0,background:'var(--nav-bg)',backdropFilter:'blur(20px)',borderBottom:'1px solid var(--border)',padding:'.8rem 1.5rem 1.2rem',zIndex:300}}>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`nav-link ${isActive(to) ? 'active' : ''}`}
              style={{display:'block',marginBottom:'.25rem',padding:'.5rem .85rem'}}>
              {label}
            </Link>
          ))}
          <button className="btn-danger" style={{marginTop:'.6rem',width:'100%',fontSize:'.72rem'}} onClick={handleLogout}>Sign Out</button>
        </div>
      )}
    </nav>
  )
}
