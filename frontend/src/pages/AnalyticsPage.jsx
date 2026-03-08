import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { adminApi, registrationsApi } from '../api'
import { Download } from 'lucide-react'

function CapBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{display:'flex',alignItems:'center',gap:'.65rem'}}>
      <div className="cap-bar" style={{flex:1}}>
        <div className="cap-fill" style={{width:`${pct}%`, background: color || 'var(--blue)'}} />
      </div>
      <span style={{fontSize:'.62rem',color:'var(--text-dim)',width:28,textAlign:'right'}}>{pct}%</span>
    </div>
  )
}

export default function AnalyticsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState([])
  const [loading, setLoading] = useState(true)
  const myInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'A'

  useEffect(() => {
    adminApi.analytics().then(r => { setAnalytics(r.data); setLoading(false) })
  }, [])

  const handleExport = async (eventId, title) => {
    try {
      const res = await registrationsApi.exportCSV(eventId)
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/\s+/g, '_')}_participants.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Export failed') }
  }

  const totals = analytics.reduce((acc, e) => ({
    registrations: acc.registrations + e.registrations,
    checkins: acc.checkins + e.checkins,
    capacity: acc.capacity + e.capacity,
    waitlist: acc.waitlist + e.waitlist,
  }), { registrations: 0, checkins: 0, capacity: 0, waitlist: 0 })

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div className="dash-layout">
        <aside className="sidebar">
          <div className="sb-user">
            <div className="sb-av">{myInitials}</div>
            <div>
              <div className="sb-name">{user?.name || 'Admin'}</div>
              <div className="sb-role">Administrator</div>
              <div className="sb-admin-badge">✦ Admin Access</div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section">Overview</div>
            <Link to="/admin" className="sb-item">◈ Dashboard</Link>
            <Link to="/admin/events" className="sb-item">🗓️ All Events</Link>
            <Link to="/admin/users" className="sb-item">👥 Participants</Link>
            <div className="sb-section">System</div>
            <div className="sb-item active">📊 Analytics</div>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        <main className="dash-main page-enter">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem'}}>
            <div>
              <div className="pg-eyebrow">Reports</div>
              <div className="pg-title">Event <em>Analytics</em></div>
            </div>
          </div>

          {/* Summary stats */}
          <div className="stats-row">
            <div className="stat-card"><div className="sc-lbl">Total Registrations</div><div className="sc-val">{totals.registrations}</div><div className="sc-sub">Across all events</div><div className="sc-icon">📋</div></div>
            <div className="stat-card"><div className="sc-lbl">Total Check-ins</div><div className="sc-val">{totals.checkins}</div><div className="sc-sub">{totals.registrations > 0 ? Math.round(totals.checkins/totals.registrations*100) : 0}% rate</div><div className="sc-icon">✅</div></div>
            <div className="stat-card"><div className="sc-lbl">Total Capacity</div><div className="sc-val">{totals.capacity}</div><div className="sc-sub">{totals.capacity > 0 ? Math.round(totals.registrations/totals.capacity*100) : 0}% filled</div><div className="sc-icon">🏟️</div></div>
            <div className="stat-card"><div className="sc-lbl">On Waitlists</div><div className="sc-val">{totals.waitlist}</div><div className="sc-sub">Pending spots</div><div className="sc-icon">⏳</div></div>
          </div>

          <div className="panel">
            <div className="panel-hd">
              <div className="panel-t">Per-Event Breakdown</div>
            </div>
            {loading ? (
              <div style={{padding:'3rem',textAlign:'center',color:'var(--text-dim)',fontSize:'.8rem'}}>Loading analytics…</div>
            ) : analytics.length === 0 ? (
              <div style={{padding:'3rem',textAlign:'center',color:'var(--text-dim)',fontSize:'.8rem'}}>No events yet</div>
            ) : (
              <table className="ev-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Registrations</th>
                    <th>Fill Rate</th>
                    <th>Check-in Rate</th>
                    <th>Waitlist</th>
                    <th>Export</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map(e => {
                    const fillColor = e.fill_rate >= 100 ? 'var(--red)' : e.fill_rate > 75 ? 'var(--amber)' : 'var(--blue)'
                    return (
                      <tr key={e.event_id}>
                        <td>
                          <div className="td-name">{e.event_title}</div>
                          <div style={{fontSize:'.62rem',color:'var(--text-dim)',marginTop:'.1rem'}}>{e.registrations} / {e.capacity} registered</div>
                        </td>
                        <td style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.1rem',fontWeight:700,color:'var(--blue-light)'}}>{e.registrations}</td>
                        <td style={{width:160}}>
                          <CapBar value={e.registrations} max={e.capacity} color={fillColor} />
                        </td>
                        <td style={{width:160}}>
                          <CapBar value={e.checkins} max={e.registrations} color="var(--green-light)" />
                        </td>
                        <td style={{color:'var(--text-mid)'}}>{e.waitlist}</td>
                        <td>
                          <button className="btn-sm btn-sm-blue" style={{display:'flex',alignItems:'center',gap:'.3rem'}}
                            onClick={() => handleExport(e.event_id, e.event_title)}>
                            <Download size={11}/> CSV
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
