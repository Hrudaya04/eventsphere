import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { notificationsApi } from '../api'
import { formatDistanceToNow, parseISO } from 'date-fns'

function parseUTC(str) {
  if (!str) return new Date()
  const normalized = /[Z+\-]\d*$/.test(str) ? str : str + 'Z'
  return parseISO(normalized)
}

export default function NotificationsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'

  const load = () => notificationsApi.list().then(r => setNotifications(r.data))
  useEffect(() => { load() }, [])

  const markRead = async (id) => { await notificationsApi.markRead(id); load() }
  const markAll = async () => { await notificationsApi.markAllRead(); load() }

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div className="dash-layout">
        <aside className="sidebar">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div><div className="sb-name">{user?.name}</div><div className="sb-role">Participant</div></div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section">Main</div>
            <Link to="/dashboard" className="sb-item">◈ Dashboard</Link>
            <Link to="/events" className="sb-item">🗓️ Browse Events</Link>
            <div className="sb-section">Team</div>
            <Link to="/teams" className="sb-item">👥 My Teams</Link>
            <div className="sb-section">Account</div>
            <div className="sb-item active">🔔 Notifications {unread > 0 && <span className="sb-badge">{unread}</span>}</div>
            <Link to="/profile" className="sb-item">⚙ Profile</Link>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        <main className="dash-main page-enter">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem'}}>
            <div>
              <div className="pg-eyebrow">Updates</div>
              <div className="pg-title">Notif<em>ications</em></div>
              {unread > 0 && <div style={{fontSize:'.7rem',color:'var(--text-dim)',marginTop:'.25rem'}}><span style={{color:'var(--blue-light)',fontWeight:700}}>{unread}</span> unread</div>}
            </div>
            {unread > 0 && (
              <button className="btn-secondary" style={{fontSize:'.72rem'}} onClick={markAll}>Mark all read</button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="panel">
              <div style={{padding:'4rem',textAlign:'center'}}>
                <div style={{fontSize:'3rem',opacity:.15,marginBottom:'1rem'}}>🔔</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',color:'var(--text-mid)',marginBottom:'.3rem'}}>No notifications yet</div>
                <div style={{fontSize:'.72rem',color:'var(--text-dim)'}}>You're all caught up!</div>
              </div>
            </div>
          ) : (
            <div className="panel">
              {notifications.map(n => (
                <div key={n.id} className="notif-item"
                  style={{cursor: n.is_read ? 'default' : 'pointer'}}
                  onClick={() => !n.is_read && markRead(n.id)}>
                  <div className={`n-dot ${n.is_read ? 'read' : ''}`}></div>
                  <div className="n-text">
                    <strong>{n.title}</strong>
                    {n.message && <> — {n.message}</>}
                  </div>
                  <div className="n-time">
                    {(() => { try { return formatDistanceToNow(parseUTC(n.created_at), { addSuffix: true }) } catch { return '' } })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
