import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { registrationsApi, notificationsApi, teamsApi } from '../api'
import { format, isPast, parseISO } from 'date-fns'

function parseUTC(str) {
  if (!str) return new Date()
  const normalized = /[Z+\-]\d*$/.test(str) ? str : str + 'Z'
  return parseISO(normalized)
}

function getHour() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function statusBadge(status) {
  const map = { ongoing:'live', upcoming:'soon', completed:'closed', cancelled:'cancelled' }
  const cls = map[status] || 'soon'
  const labels = { ongoing:'● Live', upcoming:'Upcoming', completed:'Completed', cancelled:'Cancelled' }
  return <span className={`badge badge-${cls}`}>{labels[status] || status}</span>
}

export default function ParticipantDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [registrations, setRegistrations] = useState([])
  const [notifications, setNotifications] = useState([])
  const [teams, setTeams] = useState([])
  const [waitlist, setWaitlist] = useState([])

  useEffect(() => {
    registrationsApi.myRegistrations().then(r => setRegistrations(r.data))
    notificationsApi.list().then(r => setNotifications(r.data.filter(n => !n.is_read).slice(0, 4)))
    teamsApi.myTeams().then(r => setTeams(r.data))
    registrationsApi.myWaitlist().then(r => setWaitlist(r.data)).catch(() => {})
  }, [])

  const upcoming = registrations.filter(r => r.event?.end_date && !isPast(parseUTC(r.event.end_date)))
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const firstName = user?.name?.split(' ')[0] || 'there'
  const unread = notifications.length

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div className="dash-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div>
              <div className="sb-name">{user?.name}</div>
              <div className="sb-role">Participant</div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section">Main</div>
            <div className="sb-item active">◈ Dashboard</div>
            <Link to="/events" className="sb-item">🗓️ Browse Events</Link>
            <div className="sb-item">✅ My Registrations <span className="sb-badge">{registrations.length}</span></div>
            <div className="sb-section">Team</div>
            <Link to="/teams" className="sb-item">👥 My Teams <span className="sb-badge">{teams.length}</span></div>
            <div className="sb-section">Account</div>
            <Link to="/notifications" className="sb-item">🔔 Notifications {unread > 0 && <span className="sb-badge">{unread}</span>}</Link>
            <Link to="/profile" className="sb-item">⚙ Profile</Link>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        {/* Main */}
        <main className="dash-main page-enter">
          {/* Welcome */}
          <div className="welcome">
            <div>
              <div className="welcome-hi">{getHour()}</div>
              <div className="welcome-name">Welcome back, <em>{firstName}</em></div>
              <div className="welcome-sub">
                {upcoming.length > 0 ? `You have ${upcoming.length} upcoming event${upcoming.length > 1 ? 's' : ''}.` : 'No upcoming events. Browse and register!'}
              </div>
            </div>
            <Link to="/events" className="btn-primary">Browse Events →</Link>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card"><div className="sc-lbl">Registered Events</div><div className="sc-val">{registrations.length}</div><div className="sc-sub">{upcoming.length} upcoming</div><div className="sc-icon">🗓️</div></div>
            <div className="stat-card"><div className="sc-lbl">Teams Joined</div><div className="sc-val">{teams.length}</div><div className="sc-sub">Active teams</div><div className="sc-icon">👥</div></div>
            <div className="stat-card"><div className="sc-lbl">Notifications</div><div className="sc-val">{unread}</div><div className="sc-sub">Unread</div><div className="sc-icon">🔔</div></div>
            <div className="stat-card"><div className="sc-lbl">Waitlists</div><div className="sc-val">{waitlist.length}</div><div className="sc-sub">Pending spots</div><div className="sc-icon">⏳</div></div>
          </div>

          {/* Two col */}
          <div className="two-col">
            <div className="panel">
              <div className="panel-hd"><div className="panel-t">My Registrations</div><Link to="/events" className="panel-a">Browse More →</Link></div>
              {upcoming.slice(0, 5).map(reg => (
                <Link key={reg.id} to={`/events/${reg.event_id}`} className="list-item" style={{textDecoration:'none'}}>
                  <div className="li-icon">🗓️</div>
                  <div style={{flex:1}}>
                    <div className="li-title">{reg.event?.title || `Event #${reg.event_id}`}</div>
                    <div className="li-sub">{reg.event?.start_date ? format(parseUTC(reg.event.start_date), 'MMM d, yyyy') : '—'}{reg.event?.venue ? ` · ${reg.event.venue}` : ''}</div>
                  </div>
                  {statusBadge(reg.event?.status)}
                </Link>
              ))}
              {upcoming.length === 0 && (
                <div style={{padding:'2.5rem',textAlign:'center'}}>
                  <div style={{fontSize:'2rem',opacity:.2,marginBottom:'.8rem'}}>🗓️</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1rem',color:'var(--text-mid)'}}>No upcoming events</div>
                  <div style={{fontSize:'.7rem',color:'var(--text-dim)',marginTop:'.25rem'}}>Register for events to see them here</div>
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-hd"><div className="panel-t">Notifications</div><Link to="/notifications" className="panel-a">View All →</Link></div>
              {notifications.map(n => (
                <div key={n.id} className="notif-item">
                  <div className="n-dot"></div>
                  <div className="n-text"><strong>{n.title}</strong> {n.message?.slice(0, 60)}{n.message?.length > 60 ? '…' : ''}</div>
                  <div className="n-time">{format(parseUTC(n.created_at), 'MMM d')}</div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div style={{padding:'2rem',textAlign:'center',fontSize:'.72rem',color:'var(--text-dim)'}}>All caught up! ✓</div>
              )}
            </div>
          </div>

          {/* Teams */}
          {teams.length > 0 && (
            <div className="panel" style={{marginBottom:'1.4rem'}}>
              <div className="panel-hd"><div className="panel-t">My Teams</div><Link to="/teams" className="panel-a">View All →</Link></div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:'1rem',padding:'1.3rem 1.4rem'}}>
                {teams.slice(0, 4).map(t => (
                  <div key={t.id} style={{background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:10,padding:'1rem'}}>
                    <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1rem',fontWeight:700,color:'var(--text)',marginBottom:'.15rem'}}>{t.name}</div>
                    <div style={{fontSize:'.6rem',fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--blue-light)',opacity:.75,marginBottom:'.75rem'}}>Event #{t.event_id}</div>
                    <div style={{display:'flex',gap:'.3rem',flexWrap:'wrap'}}>
                      {t.members?.slice(0,4).map(m => (
                        <div key={m.id} className="m-av">{m.user?.name?.[0]?.toUpperCase() || '?'}</div>
                      ))}
                      {(t.members?.length || 0) > 4 && <div className="m-av">+{t.members.length - 4}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
