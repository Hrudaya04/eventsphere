import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { adminApi, eventsApi } from '../api'
import { format, parseISO } from 'date-fns'

function parseUTC(str) {
  if (!str) return new Date()
  const normalized = /[Z+\-]\d*$/.test(str) ? str : str + 'Z'
  return parseISO(normalized)
}

function statusBadge(status) {
  const map = { ongoing:'live', upcoming:'soon', completed:'closed', cancelled:'cancelled' }
  const labels = { ongoing:'● Live', upcoming:'Upcoming', completed:'Completed', cancelled:'Cancelled' }
  return <span className={`badge badge-${map[status]||'soon'}`}>{labels[status]||status}</span>
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentEvents, setRecentEvents] = useState([])

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data))
    eventsApi.list().then(r => setRecentEvents(r.data.slice(0, 6)))
  }, [])

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'A'

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div className="dash-layout">
        <aside className="sidebar">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div>
              <div className="sb-name">{user?.name || 'Admin'}</div>
              <div className="sb-role">Administrator</div>
              <div className="sb-admin-badge">✦ Admin Access</div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section">Overview</div>
            <div className="sb-item active">◈ Dashboard</div>
            <Link to="/admin/events" className="sb-item">🗓️ All Events {stats && <span className="sb-badge">{stats.total_events}</span>}</Link>
            <Link to="/admin/users" className="sb-item">👥 Participants {stats && <span className="sb-badge">{stats.total_users}</span>}</Link>
            <div className="sb-section">Manage</div>
            <Link to="/admin/events" className="sb-item">＋ Create Event</Link>
            <div className="sb-section">System</div>
            <Link to="/admin/analytics" className="sb-item">📊 Analytics</Link>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        <main className="dash-main page-enter">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem'}}>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.65rem',fontWeight:700,color:'var(--text)'}}>Admin Dashboard</div>
              <div style={{fontSize:'.7rem',color:'var(--text-dim)',marginTop:'.2rem'}}>{format(new Date(),'EEEE, MMMM d yyyy')}</div>
            </div>
            <Link to="/admin/events" className="btn-primary">+ Create Event</Link>
          </div>

          {stats && (
            <div className="stats-row">
              <div className="stat-card"><div className="sc-lbl">Total Events</div><div className="sc-val">{stats.total_events}</div><div className="sc-sub">{stats.upcoming_events} upcoming</div><div className="sc-icon">🗓️</div></div>
              <div className="stat-card"><div className="sc-lbl">Registrations</div><div className="sc-val">{stats.total_registrations}</div><div className="sc-sub">Across all events</div><div className="sc-icon">📋</div></div>
              <div className="stat-card"><div className="sc-lbl">Total Users</div><div className="sc-val">{stats.total_users}</div><div className="sc-sub">Participants</div><div className="sc-icon">👥</div></div>
              <div className="stat-card"><div className="sc-lbl">Check-ins</div><div className="sc-val">{stats.total_checkins}</div><div className="sc-sub">of {stats.total_registrations} registered</div><div className="sc-icon">✅</div></div>
            </div>
          )}

          <div className="panel" style={{marginBottom:'1.4rem'}}>
            <div className="panel-hd">
              <div className="panel-t">Recent Events</div>
              <Link to="/admin/events" className="panel-a">View All →</Link>
            </div>
            <table className="ev-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Date</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentEvents.map(e => (
                  <tr key={e.id}>
                    <td><div className="td-name">{e.title}</div></td>
                    <td>{format(parseUTC(e.start_date), 'MMM d, yyyy')}</td>
                    <td>{e.registration_count} / {e.capacity}</td>
                    <td>{statusBadge(e.status)}</td>
                    <td>
                      <div style={{display:'flex',gap:'.4rem'}}>
                        <Link to={`/admin/events/${e.id}`} className="btn-sm btn-sm-blue">Manage</Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {recentEvents.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>No events yet</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="two-col">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
              {[
                { to:'/admin/events', icon:'🗓️', label:'Manage Events', sub:'Create, edit, delete events' },
                { to:'/admin/users', icon:'👥', label:'View Users', sub:'Manage participants' },
                { to:'/admin/analytics', icon:'📊', label:'Analytics', sub:'Reports and insights' },
                { to:'/admin/events', icon:'✅', label:'Check-ins', sub:'QR verification' },
              ].map(({ to, icon, label, sub }) => (
                <Link key={to} to={to} style={{background:'var(--surface)',border:'1px solid var(--border)',borderRadius:12,padding:'1.2rem',display:'flex',flexDirection:'column',gap:'.5rem',textDecoration:'none',transition:'all .25s',cursor:'pointer'}}
                  onMouseOver={e => { e.currentTarget.style.borderColor='var(--blue)'; e.currentTarget.style.transform='translateY(-2px)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform='' }}>
                  <span style={{fontSize:'1.4rem'}}>{icon}</span>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'.97rem',fontWeight:700,color:'var(--text)'}}>{label}</div>
                  <div style={{fontSize:'.68rem',color:'var(--text-dim)'}}>{sub}</div>
                </Link>
              ))}
            </div>
            <div className="panel">
              <div className="panel-hd"><div className="panel-t">System Overview</div></div>
              <div style={{padding:'1.3rem 1.4rem'}}>
                {stats && [
                  ['Total Events', stats.total_events],
                  ['Upcoming Events', stats.upcoming_events],
                  ['Total Registrations', stats.total_registrations],
                  ['Check-ins Done', stats.total_checkins],
                  ['Total Users', stats.total_users],
                ].map(([label, val]) => (
                  <div key={label} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'.65rem 0',borderBottom:'1px solid var(--bg2)'}}>
                    <span style={{fontSize:'.75rem',color:'var(--text-mid)'}}>{label}</span>
                    <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.05rem',fontWeight:700,color:'var(--blue-light)'}}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
