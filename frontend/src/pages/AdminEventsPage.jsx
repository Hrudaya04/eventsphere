import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { eventsApi } from '../api'
import { X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function parseUTC(str) {
  if (!str) return new Date()
  const normalized = /[Z+\-]\d*$/.test(str) ? str : str + 'Z'
  return parseISO(normalized)
}

const CATEGORIES = ['Technology', 'Business', 'Arts', 'Sports', 'Education', 'Other']

function statusBadge(status) {
  const map = { ongoing:'live', upcoming:'soon', completed:'closed', cancelled:'cancelled' }
  const labels = { ongoing:'● Live', upcoming:'Upcoming', completed:'Completed', cancelled:'Cancelled' }
  return <span className={`badge badge-${map[status]||'soon'}`}>{labels[status]||status}</span>
}

function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event ? {
    title: event.title, description: event.description||'', venue: event.venue||'',
    start_date: event.start_date?.slice(0,16)||'', end_date: event.end_date?.slice(0,16)||'',
    capacity: event.capacity, allow_teams: event.allow_teams, max_team_size: event.max_team_size,
    status: event.status, category: event.category||'', cover_image_url: event.cover_image_url||'',
    enable_waitlist: event.enable_waitlist||false,
  } : {
    title:'', description:'', venue:'', start_date:'', end_date:'',
    capacity:100, allow_teams:true, max_team_size:5, category:'', cover_image_url:'', enable_waitlist:false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const payload = { ...form, start_date: new Date(form.start_date).toISOString(), end_date: new Date(form.end_date).toISOString() }
      if (!payload.category) delete payload.category
      if (!payload.cover_image_url) delete payload.cover_image_url
      if (event) await eventsApi.update(event.id, payload)
      else await eventsApi.create(payload)
      onSave()
    } catch (err) { setError(err.response?.data?.detail || 'Error saving event') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box">
        <div className="modal-hd">
          <div className="modal-title">{event ? 'Edit Event' : 'Create New Event'}</div>
          <button className="modal-close" onClick={onClose}><X size={14}/></button>
        </div>
        <div className="modal-body">
          {error && <div className="msg-error" style={{marginBottom:'1rem'}}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.8rem',marginBottom:'.9rem'}}>
              <div style={{gridColumn:'span 2'}}><label className="label">Event Title</label><input className="input" required placeholder="e.g. Tech Symposium 2025" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></div>
              <div><label className="label">Start Date & Time</label><input className="input" type="datetime-local" required value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})}/></div>
              <div><label className="label">End Date & Time</label><input className="input" type="datetime-local" required value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})}/></div>
              <div><label className="label">Venue</label><input className="input" placeholder="e.g. Main Auditorium" value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})}/></div>
              <div><label className="label">Capacity</label><input className="input" type="number" min={1} required value={form.capacity} onChange={e=>setForm({...form,capacity:parseInt(e.target.value)})}/></div>
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  <option value="">Select…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  {['upcoming','ongoing','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{gridColumn:'span 2'}}><label className="label">Description</label><textarea className="input" rows={3} placeholder="Event description…" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'1.5rem',marginBottom:'1.2rem',flexWrap:'wrap'}}>
              <label style={{display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer',fontSize:'.75rem',color:'var(--text-mid)'}}>
                <input type="checkbox" checked={form.allow_teams} onChange={e=>setForm({...form,allow_teams:e.target.checked})}/>
                Allow Teams
              </label>
              <label style={{display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer',fontSize:'.75rem',color:'var(--text-mid)'}}>
                <input type="checkbox" checked={form.enable_waitlist} onChange={e=>setForm({...form,enable_waitlist:e.target.checked})}/>
                Enable Waitlist
              </label>
              {form.allow_teams && (
                <div style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
                  <span style={{fontSize:'.72rem',color:'var(--text-mid)'}}>Max team size:</span>
                  <input className="input" type="number" min={2} max={10} value={form.max_team_size} style={{width:60,padding:'.35rem .5rem'}} onChange={e=>setForm({...form,max_team_size:parseInt(e.target.value)})}/>
                </div>
              )}
            </div>
            <div style={{display:'flex',gap:'.8rem'}}>
              <button type="submit" className="btn-primary" style={{flex:1}} disabled={loading}>{loading ? 'Saving…' : event ? 'Save Changes →' : 'Create Event →'}</button>
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminEventsPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [modalEvent, setModalEvent] = useState(undefined)
  const [showModal, setShowModal] = useState(false)
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || 'A'

  const load = () => eventsApi.list().then(r => setEvents(r.data))
  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return
    await eventsApi.delete(id); load()
  }

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      {showModal && (
        <EventModal event={modalEvent} onClose={() => setShowModal(false)} onSave={() => { load(); setShowModal(false) }} />
      )}
      <div className="dash-layout">
        <aside className="sidebar">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div><div className="sb-name">{user?.name||'Admin'}</div><div className="sb-role">Administrator</div><div className="sb-admin-badge">✦ Admin Access</div></div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section">Overview</div>
            <Link to="/admin" className="sb-item">◈ Dashboard</Link>
            <div className="sb-item active">🗓️ All Events</div>
            <Link to="/admin/users" className="sb-item">👥 Participants</Link>
            <div className="sb-section">System</div>
            <Link to="/admin/analytics" className="sb-item">📊 Analytics</Link>
          </nav>
          <div className="sb-footer"><button className="sb-signout" onClick={() => { logout(); navigate('/login') }}>↩ Sign Out</button></div>
        </aside>

        <main className="dash-main page-enter">
          <div className="pg-header">
            <div><div className="pg-eyebrow">Manage</div><div className="pg-title">All <em>Events</em></div></div>
            <div style={{display:'flex',gap:'.8rem',alignItems:'center'}}>
              <div style={{position:'relative'}}>
                <input className="input" style={{paddingLeft:'2rem',width:220,background:'var(--surface)'}} placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
                <span style={{position:'absolute',left:'.65rem',top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)',fontSize:'.9rem',pointerEvents:'none'}}>⌕</span>
              </div>
              <button className="btn-primary" onClick={() => { setModalEvent(undefined); setShowModal(true) }}>+ Create Event</button>
            </div>
          </div>

          <div className="panel">
            <table className="ev-table">
              <thead>
                <tr><th>Event</th><th>Date</th><th>Venue</th><th>Capacity</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id}>
                    <td><div className="td-name">{e.title}</div><div style={{fontSize:'.62rem',color:'var(--text-dim)',marginTop:'.1rem'}}>{e.category||''}</div></td>
                    <td>{format(parseUTC(e.start_date),'MMM d, yyyy')}</td>
                    <td style={{maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{e.venue||'—'}</td>
                    <td>{e.registration_count} / {e.capacity}</td>
                    <td>{statusBadge(e.status)}</td>
                    <td>
                      <div style={{display:'flex',gap:'.4rem'}}>
                        <Link to={`/admin/events/${e.id}`} className="btn-sm btn-sm-blue">View</Link>
                        <button className="btn-sm btn-sm-blue" onClick={() => { setModalEvent(e); setShowModal(true) }}>Edit</button>
                        <button className="btn-sm btn-sm-red" onClick={() => handleDelete(e.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>No events found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}
