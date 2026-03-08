import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { teamsApi } from '../api'
import { Copy, Check, Lock } from 'lucide-react'

export default function TeamsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [teams, setTeams] = useState([])
  const [copied, setCopied] = useState(null)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'

  useEffect(() => { teamsApi.myTeams().then(r => setTeams(r.data)) }, [])

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const canSeeCode = (team) => {
    const isMember = team.members?.some(m => m.user_id === user?.id)
    return isMember && team.join_code !== '••••••'
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
            <div className="sb-item active">👥 My Teams <span className="sb-badge">{teams.length}</span></div>
            <div className="sb-section">Account</div>
            <Link to="/notifications" className="sb-item">🔔 Notifications</Link>
            <Link to="/profile" className="sb-item">⚙ Profile</Link>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        <main className="dash-main page-enter">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.8rem'}}>
            <div>
              <div className="pg-eyebrow">Teams</div>
              <div className="pg-title">My <em>Teams</em></div>
            </div>
            <Link to="/events" className="btn-secondary" style={{fontSize:'.75rem'}}>Join via Event →</Link>
          </div>

          {teams.length === 0 ? (
            <div className="panel">
              <div style={{padding:'4rem',textAlign:'center'}}>
                <div style={{fontSize:'3rem',opacity:.15,marginBottom:'1rem'}}>👥</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.2rem',color:'var(--text-mid)',marginBottom:'.3rem'}}>No teams yet</div>
                <div style={{fontSize:'.72rem',color:'var(--text-dim)',marginBottom:'1.2rem'}}>Register for an event and create or join a team there.</div>
                <Link to="/events" className="btn-primary" style={{fontSize:'.75rem'}}>Browse Events →</Link>
              </div>
            </div>
          ) : (
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'1.3rem'}}>
              {teams.map(team => (
                <div key={team.id} className="panel">
                  <div className="panel-hd">
                    <div>
                      <div className="panel-t">{team.name}</div>
                      <div style={{fontSize:'.6rem',fontWeight:600,letterSpacing:'.12em',textTransform:'uppercase',color:'var(--blue-light)',opacity:.75,marginTop:'.15rem'}}>Event #{team.event_id}</div>
                    </div>
                    {canSeeCode(team) ? (
                      <button
                        style={{display:'flex',alignItems:'center',gap:'.4rem',fontFamily:"'Courier Prime',monospace",fontSize:'.82rem',fontWeight:700,color:copied===team.join_code?'var(--green-light)':'var(--blue-light)',background:'var(--surface2)',border:`1px solid ${copied===team.join_code?'var(--green-border)':'var(--border)'}`,borderRadius:8,padding:'.32rem .75rem',cursor:'pointer',transition:'all .2s'}}
                        onClick={() => copyCode(team.join_code)}>
                        {copied === team.join_code ? <Check size={13} /> : <Copy size={13} />}
                        {team.join_code}
                      </button>
                    ) : (
                      <span style={{display:'flex',alignItems:'center',gap:'.4rem',fontSize:'.78rem',color:'var(--text-dim)',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:8,padding:'.32rem .75rem',cursor:'not-allowed'}} title="Only members can see the join code">
                        <Lock size={12} /> ••••••
                      </span>
                    )}
                  </div>

                  <div style={{padding:'1.2rem 1.4rem'}}>
                    <div style={{fontSize:'.58rem',fontWeight:700,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--text-dim)',marginBottom:'.75rem'}}>Members ({team.members?.length || 0})</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'.5rem'}}>
                      {team.members?.map(m => {
                        const isMe = m.user_id === user?.id
                        const memberInitials = m.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '?'
                        return (
                          <div key={m.id} style={{display:'flex',alignItems:'center',gap:'.6rem'}}>
                            <div className="m-av">{memberInitials}</div>
                            <span style={{fontSize:'.78rem',color:'var(--text)',flex:1}}>{m.user?.name || `User #${m.user_id}`}</span>
                            {isMe && <span style={{fontSize:'.54rem',fontWeight:700,color:'var(--blue-light)',background:'rgba(74,111,212,.1)',padding:'.08rem .4rem',borderRadius:4}}>You</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Join placeholder */}
              <Link to="/events" style={{border:'1.5px dashed var(--border)',borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',textAlign:'center',cursor:'pointer',background:'transparent',transition:'all .28s',textDecoration:'none',minHeight:180}}
                onMouseOver={e => { e.currentTarget.style.borderColor='var(--blue)'; e.currentTarget.style.background='rgba(74,111,212,.03)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.background='' }}>
                <div style={{fontSize:'2rem',opacity:.3,marginBottom:'.8rem'}}>＋</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.05rem',fontWeight:700,color:'var(--text-mid)',marginBottom:'.3rem'}}>Join Another Team</div>
                <div style={{fontSize:'.68rem',color:'var(--text-dim)'}}>Register for an event first</div>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
