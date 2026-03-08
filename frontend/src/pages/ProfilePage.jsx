import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api'
import { format } from 'date-fns'

export default function ProfilePage() {
  const { user, logout, updateUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: user?.name || '', bio: user?.bio || '', avatar_url: user?.avatar_url || '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res = await authApi.updateProfile(form)
      updateUser(res.data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) { setError(err.response?.data?.detail || 'Failed to save') }
    finally { setLoading(false) }
  }

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
            <Link to="/notifications" className="sb-item">🔔 Notifications</Link>
            <div className="sb-item active">⚙ Profile</div>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        <main className="dash-main page-enter" style={{maxWidth:700}}>
          <div style={{marginBottom:'1.8rem'}}>
            <div className="pg-eyebrow">Account</div>
            <div className="pg-title">My <em>Profile</em></div>
          </div>

          {/* Avatar card */}
          <div className="panel" style={{marginBottom:'1.4rem'}}>
            <div style={{padding:'1.5rem',display:'flex',alignItems:'center',gap:'1.2rem',borderBottom:'1px solid var(--border)'}}>
              {form.avatar_url
                ? <img src={form.avatar_url} alt={user?.name} style={{width:64,height:64,borderRadius:12,objectFit:'cover',border:'1.5px solid var(--border)'}}/>
                : <div style={{width:64,height:64,borderRadius:12,background:'linear-gradient(135deg,#1A1F6E,#4A6FD4)',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Cormorant Garamond',serif",fontSize:'1.6rem',fontWeight:700,color:'white',flexShrink:0}}>{initials}</div>
              }
              <div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:700,color:'var(--text)'}}>{user?.name}</div>
                <div style={{fontSize:'.72rem',color:'var(--text-mid)',marginTop:'.15rem'}}>{user?.email}</div>
                <span className={`badge ${user?.role==='admin'?'badge-live':'badge-upcoming'}`} style={{marginTop:'.5rem',display:'inline-block'}}>{user?.role}</span>
              </div>
            </div>
            <div style={{padding:'1.5rem 1.4rem',display:'flex',gap:'2.5rem'}}>
              {[
                ['Member since', user?.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : '—'],
                ['Account status', 'Active'],
              ].map(([label, val]) => (
                <div key={label}>
                  <div style={{fontSize:'.56rem',fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'.25rem'}}>{label}</div>
                  <div style={{fontSize:'.82rem',fontWeight:600,color:'var(--text)'}}>{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit form */}
          <div className="panel">
            <div className="panel-hd"><div className="panel-t">Edit Profile</div></div>
            <div style={{padding:'1.5rem'}}>
              {error && <div className="msg-error" style={{marginBottom:'1rem'}}>{error}</div>}
              {saved && <div className="msg-success" style={{marginBottom:'1rem'}}>✓ Profile saved successfully!</div>}
              <form onSubmit={handleSubmit}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.9rem',marginBottom:'.9rem'}}>
                  <div style={{gridColumn:'span 2'}}>
                    <label className="label">Display Name</label>
                    <input className="input" required placeholder="Your name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label className="label">Bio</label>
                    <textarea className="input" rows={3} placeholder="Tell us a bit about yourself…" value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} />
                  </div>
                  <div style={{gridColumn:'span 2'}}>
                    <label className="label">Avatar URL</label>
                    <input className="input" placeholder="https://…" value={form.avatar_url} onChange={e => setForm({...form, avatar_url: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes →'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
