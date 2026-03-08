import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { adminApi } from '../api'
import { format } from 'date-fns'

export default function AdminUsersPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  const myInitials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'A'

  useEffect(() => { adminApi.users().then(r => setUsers(r.data)) }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

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
            <div className="sb-item active">👥 Participants</div>
            <div className="sb-section">System</div>
            <Link to="/admin/analytics" className="sb-item">📊 Analytics</Link>
          </nav>
          <div className="sb-footer">
            <button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button>
          </div>
        </aside>

        <main className="dash-main page-enter">
          <div className="pg-header">
            <div>
              <div className="pg-eyebrow">Manage</div>
              <div className="pg-title">All <em>Users</em></div>
            </div>
            <div style={{display:'flex',gap:'.75rem',alignItems:'center'}}>
              <div style={{position:'relative'}}>
                <input className="input" style={{paddingLeft:'2rem',width:220,background:'var(--surface)'}}
                  placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
                <span style={{position:'absolute',left:'.65rem',top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)',fontSize:'.9rem',pointerEvents:'none'}}>⌕</span>
              </div>
              <div className="ftabs">
                {[['all','All'],['participant','Participants'],['admin','Admins']].map(([val, label]) => (
                  <button key={val} className={`ftab ${roleFilter===val?'active':''}`} onClick={() => setRoleFilter(val)}>{label}</button>
                ))}
              </div>
            </div>
          </div>

          <div style={{fontSize:'.7rem',color:'var(--text-dim)',marginBottom:'1rem'}}>{filtered.length} user{filtered.length!==1?'s':''} found</div>

          <div className="panel">
            <table className="ev-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{display:'flex',alignItems:'center',gap:'.65rem'}}>
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.name} style={{width:30,height:30,borderRadius:'50%',objectFit:'cover',border:'1px solid var(--border)'}}/>
                          : <div className="m-av">{initials(u.name)}</div>
                        }
                        <div className="td-name">{u.name}</div>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role==='admin'?'badge-live':'badge-completed'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.created_at ? format(new Date(u.created_at), 'MMM d, yyyy') : '—'}</td>
                    <td>
                      <span className={`badge ${u.is_active?'badge-open':'badge-closed'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
