import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { useAuth } from '../context/AuthContext'
import { eventsApi, registrationsApi, teamsApi, announcementsApi, checkinsApi } from '../api'
import { Download, QrCode, Clock, CheckCircle2, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'

function parseUTC(str) {
  if (!str) return new Date()
  const normalized = /[Z+\-]\d*$/.test(str) ? str : str + 'Z'
  return parseISO(normalized)
}

const EMOJI_MAP = { Technology:'🚀', Business:'💼', Arts:'🎨', Sports:'⚽', Education:'📚', Other:'📌' }
const BANNER_COLORS = {
  Technology:'linear-gradient(135deg,#1A1F6E,#2D5BAA)', Business:'linear-gradient(135deg,#1A3A6E,#2D6E4A)',
  Arts:'linear-gradient(135deg,#2D1A6E,#5A2D9E)', Sports:'linear-gradient(135deg,#1A4A6E,#2D6E6E)',
  Education:'linear-gradient(135deg,#3A1A6E,#6E2D5A)', Other:'linear-gradient(135deg,#3A3A1A,#6E6E2D)',
}

function statusBadge(status) {
  const map = { ongoing:'live', upcoming:'soon', completed:'closed', cancelled:'cancelled' }
  const labels = { ongoing:'● Live', upcoming:'Upcoming', completed:'Completed', cancelled:'Cancelled' }
  return <span className={`badge badge-${map[status]||'soon'}`}>{labels[status]||status}</span>
}

function QRModal({ token, onClose }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(token)}`
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-box modal-box-sm" style={{textAlign:'center'}}>
        <div className="modal-hd">
          <div className="modal-title">Your Check-in QR</div>
          <button className="modal-close" onClick={onClose}><X size={14}/></button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:'.72rem',color:'var(--text-mid)',marginBottom:'1.2rem'}}>Show this to the organizer at check-in</p>
          <div className="qr-wrap" style={{display:'inline-block',marginBottom:'1rem'}}>
            <img src={qrUrl} alt="QR Code" style={{width:200,height:200,display:'block'}}/>
          </div>
          <p style={{fontSize:'.62rem',color:'var(--text-dim)',fontFamily:'monospace',wordBreak:'break-all',marginBottom:'1.2rem'}}>{token}</p>
          <button className="btn-secondary" style={{width:'100%'}} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default function EventDetailPage({ adminMode = false }) {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [registered, setRegistered] = useState(false)
  const [onWaitlist, setOnWaitlist] = useState(false)
  const [registrations, setRegistrations] = useState([])
  const [checkinIds, setCheckinIds] = useState(new Set())
  const [announcements, setAnnouncements] = useState([])
  const [teams, setTeams] = useState([])
  const [teamForm, setTeamForm] = useState({ name: '' })
  const [joinCode, setJoinCode] = useState('')
  const [annForm, setAnnForm] = useState({ title: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState({ text: '', type: 'info' })
  const [qrToken, setQrToken] = useState(null)
  const [showQR, setShowQR] = useState(false)
  const [qrVerifyCode, setQrVerifyCode] = useState('')

  const isAdmin = user?.role === 'admin'

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type })
    setTimeout(() => setMsg({ text: '', type: 'info' }), 4000)
  }

  useEffect(() => {
    eventsApi.get(id).then(r => setEvent(r.data))
    announcementsApi.eventAnnouncements(id).then(r => setAnnouncements(r.data))
    if (isAdmin) {
      registrationsApi.eventRegistrations(id).then(r => setRegistrations(r.data)).catch(() => {})
      checkinsApi.eventCheckins(id).then(r => setCheckinIds(new Set(r.data.map(c => c.user_id)))).catch(() => {})
    } else {
      registrationsApi.myRegistrations().then(r => setRegistered(r.data.some(reg => reg.event_id === parseInt(id))))
      registrationsApi.myWaitlist().then(r => setOnWaitlist(r.data.some(w => w.event_id === parseInt(id)))).catch(() => {})
      checkinsApi.myCheckin(id).then(r => { if (r.data?.qr_token) setQrToken(r.data.qr_token) }).catch(() => {})
    }
    teamsApi.eventTeams(id).then(r => setTeams(r.data)).catch(() => {})
  }, [id])

  const handleRegister = async () => {
    setLoading(true)
    try { await registrationsApi.register({ event_id: parseInt(id) }); setRegistered(true); showMsg('Registered successfully!'); eventsApi.get(id).then(r => setEvent(r.data)) }
    catch (e) { showMsg(e.response?.data?.detail || 'Failed to register', 'error') }
    finally { setLoading(false) }
  }

  const handleUnregister = async () => {
    setLoading(true)
    try { await registrationsApi.unregister(parseInt(id)); setRegistered(false); showMsg('Unregistered'); eventsApi.get(id).then(r => setEvent(r.data)) }
    catch (e) { showMsg(e.response?.data?.detail || 'Failed', 'error') }
    finally { setLoading(false) }
  }

  const handleJoinWaitlist = async () => {
    setLoading(true)
    try { await registrationsApi.joinWaitlist({ event_id: parseInt(id) }); setOnWaitlist(true); showMsg("You're on the waitlist!"); eventsApi.get(id).then(r => setEvent(r.data)) }
    catch (e) { showMsg(e.response?.data?.detail || 'Failed', 'error') }
    finally { setLoading(false) }
  }

  const handleLeaveWaitlist = async () => {
    setLoading(true)
    try { await registrationsApi.leaveWaitlist(parseInt(id)); setOnWaitlist(false); showMsg('Removed from waitlist'); eventsApi.get(id).then(r => setEvent(r.data)) }
    catch (e) { showMsg(e.response?.data?.detail || 'Failed', 'error') }
    finally { setLoading(false) }
  }

  const handleGetQR = async () => {
    try { const res = await checkinsApi.generateQR(parseInt(id)); setQrToken(res.data.qr_token); setShowQR(true) }
    catch (e) { showMsg(e.response?.data?.detail || 'Failed to generate QR', 'error') }
  }

  const handleCreateTeam = async (e) => {
    e.preventDefault()
    try { await teamsApi.create({ name: teamForm.name, event_id: parseInt(id) }); setTeamForm({ name: '' }); teamsApi.eventTeams(id).then(r => setTeams(r.data)); showMsg('Team created!') }
    catch (err) { showMsg(err.response?.data?.detail || 'Error', 'error') }
  }

  const handleJoinTeam = async (e) => {
    e.preventDefault()
    try { await teamsApi.join({ join_code: joinCode }); setJoinCode(''); teamsApi.eventTeams(id).then(r => setTeams(r.data)); showMsg('Joined team!') }
    catch (err) { showMsg(err.response?.data?.detail || 'Invalid code', 'error') }
  }

  const handleAnnouncement = async (e) => {
    e.preventDefault()
    try { await announcementsApi.create({ event_id: parseInt(id), ...annForm }); setAnnForm({ title: '', message: '' }); announcementsApi.eventAnnouncements(id).then(r => setAnnouncements(r.data)); showMsg('Announcement sent!') }
    catch (err) { showMsg(err.response?.data?.detail || 'Error', 'error') }
  }

  const handleCheckin = async (userId) => {
    try { await checkinsApi.checkin({ user_id: userId, event_id: parseInt(id) }); setCheckinIds(prev => new Set([...prev, userId])); showMsg('Checked in!') }
    catch (err) { showMsg(err.response?.data?.detail || 'Already checked in', 'error') }
  }

  const handleQRVerify = async (e) => {
    e.preventDefault()
    try { const res = await checkinsApi.verifyQR({ qr_token: qrVerifyCode }); setCheckinIds(prev => new Set([...prev, res.data.user_id])); setQrVerifyCode(''); showMsg('QR check-in successful!') }
    catch (err) { showMsg(err.response?.data?.detail || 'Invalid QR', 'error') }
  }

  const handleExport = async () => {
    try {
      const res = await registrationsApi.exportCSV(parseInt(id))
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a'); a.href = url; a.download = `${event.title.replace(/\s+/g,'_')}_participants.csv`; a.click()
    } catch { showMsg('Export failed', 'error') }
  }

  const handleDeleteEvent = async () => {
    if (!confirm('Delete this event? This cannot be undone.')) return
    await eventsApi.delete(id); navigate('/admin/events')
  }

  if (!event) return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}>
        <div style={{width:36,height:36,border:'2.5px solid var(--blue)',borderTopColor:'transparent',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      </div>
    </div>
  )

  const isFull = event.registration_count >= event.capacity
  const fillPct = Math.min(100, Math.round((event.registration_count / event.capacity) * 100))
  const fillColor = fillPct >= 100 ? 'var(--red)' : fillPct > 75 ? 'var(--amber)' : 'var(--blue)'
  const cat = event.category || 'Other'
  const banner = BANNER_COLORS[cat] || BANNER_COLORS.Other

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      {showQR && qrToken && <QRModal token={qrToken} onClose={() => setShowQR(false)} />}

      <div style={{paddingTop:62,maxWidth:1100,margin:'0 auto',padding:'82px 2.5rem 4rem'}}>
        {/* Hero panel */}
        <div className="panel" style={{marginBottom:'1.5rem',overflow:'visible'}}>
          <div style={{height:130,background:event.cover_image_url?undefined:banner,borderRadius:'11px 11px 0 0',position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {event.cover_image_url
              ? <img src={event.cover_image_url} alt={event.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <span style={{fontSize:'3rem'}}>{EMOJI_MAP[cat]||'📌'}</span>
            }
            <div style={{position:'absolute',top:'1rem',right:'1rem'}}>{statusBadge(event.status)}</div>
          </div>
          <div style={{padding:'1.5rem 2rem 2rem'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'1.5rem',flexWrap:'wrap'}}>
              <div>
                <div style={{fontSize:'.58rem',fontWeight:700,letterSpacing:'.15em',textTransform:'uppercase',color:'var(--blue)',marginBottom:'.3rem'}}>{cat}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.1rem',fontWeight:700,color:'var(--text)',lineHeight:1.05,marginBottom:'.5rem'}}>{event.title}</div>
                {event.description && <p style={{fontSize:'.8rem',lineHeight:1.75,color:'var(--text-mid)',maxWidth:640}}>{event.description}</p>}
              </div>
              {isAdmin && (
                <div style={{display:'flex',gap:'.6rem',flexShrink:0}}>
                  <button className="btn-secondary" style={{fontSize:'.72rem',padding:'.5rem .9rem'}} onClick={handleExport}>
                    <Download size={13}/> Export CSV
                  </button>
                  <button className="btn-danger" style={{fontSize:'.72rem',padding:'.5rem .9rem'}} onClick={handleDeleteEvent}>
                    Delete Event
                  </button>
                </div>
              )}
            </div>

            {/* Meta grid */}
            <div className="modal-grid" style={{marginTop:'1.3rem'}}>
              <div className="modal-cell">
                <div className="modal-cell-lbl">Start Date</div>
                <div className="modal-cell-val">{format(parseUTC(event.start_date), 'MMM d, yyyy · h:mm a')}</div>
              </div>
              <div className="modal-cell">
                <div className="modal-cell-lbl">End Date</div>
                <div className="modal-cell-val">{format(parseUTC(event.end_date), 'MMM d, yyyy · h:mm a')}</div>
              </div>
              {event.venue && (
                <div className="modal-cell">
                  <div className="modal-cell-lbl">Venue</div>
                  <div className="modal-cell-val">{event.venue}</div>
                </div>
              )}
              <div className="modal-cell">
                <div className="modal-cell-lbl">Capacity</div>
                <div className="modal-cell-val">{event.registration_count} / {event.capacity} registered</div>
              </div>
            </div>

            {/* Capacity bar */}
            <div style={{marginBottom:'1.3rem'}}>
              <div className="cap-bar">
                <div className="cap-fill" style={{width:`${fillPct}%`,background:fillColor}}/>
              </div>
              <div style={{fontSize:'.62rem',color:'var(--text-dim)',marginTop:'.3rem'}}>
                {fillPct}% full{event.enable_waitlist && isFull ? ' · Waitlist open' : ''}
              </div>
            </div>

            {/* Message */}
            {msg.text && (
              <div className={`msg-${msg.type==='error'?'error':msg.type==='success'?'success':'info'}`} style={{marginBottom:'1rem'}}>
                {msg.text}
              </div>
            )}

            {/* Participant actions */}
            {!isAdmin && (
              <div style={{display:'flex',gap:'.75rem',flexWrap:'wrap'}}>
                {registered ? (
                  <>
                    <button className="btn-danger" style={{fontSize:'.78rem'}} onClick={handleUnregister} disabled={loading}>Unregister</button>
                    <button className="btn-primary" style={{fontSize:'.78rem'}} onClick={qrToken ? () => setShowQR(true) : handleGetQR}>
                      <QrCode size={14}/> {qrToken ? 'Show QR Code' : 'Get QR Code'}
                    </button>
                  </>
                ) : isFull && event.enable_waitlist ? (
                  onWaitlist
                    ? <button className="btn-secondary" style={{fontSize:'.78rem',borderColor:'var(--amber-border)',color:'var(--amber)'}} onClick={handleLeaveWaitlist} disabled={loading}><Clock size={14}/> Leave Waitlist</button>
                    : <button className="btn-primary" style={{fontSize:'.78rem',background:'var(--amber)'}} onClick={handleJoinWaitlist} disabled={loading}><Clock size={14}/> Join Waitlist</button>
                ) : (
                  <button className="btn-primary" style={{fontSize:'.78rem'}} onClick={handleRegister} disabled={loading || isFull}>
                    {isFull ? 'Event Full' : loading ? 'Registering…' : 'Register Now →'}
                  </button>
                )}
              </div>
            )}

            {/* Admin: QR verify */}
            {isAdmin && (
              <form onSubmit={handleQRVerify} style={{display:'flex',gap:'.7rem',maxWidth:400}}>
                <input className="input" value={qrVerifyCode} onChange={e => setQrVerifyCode(e.target.value)} placeholder="Paste QR token to verify…" required/>
                <button type="submit" className="btn-primary" style={{flexShrink:0,fontSize:'.72rem'}}><QrCode size={13}/> Verify</button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom grid */}
        <div style={{display:'grid',gridTemplateColumns:event.allow_teams?'1fr 1fr':'1fr',gap:'1.3rem',marginBottom:'1.4rem'}}>
          {/* Teams panel */}
          {event.allow_teams && (
            <div className="panel">
              <div className="panel-hd"><div className="panel-t">Teams</div><span style={{fontSize:'.68rem',color:'var(--text-dim)'}}>{teams.length} teams</span></div>
              {!isAdmin && registered && (
                <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)',display:'flex',flexDirection:'column',gap:'.55rem'}}>
                  <form onSubmit={handleCreateTeam} style={{display:'flex',gap:'.5rem'}}>
                    <input className="input" style={{flex:1}} value={teamForm.name} onChange={e => setTeamForm({name:e.target.value})} placeholder="New team name…" required/>
                    <button type="submit" className="btn-primary" style={{flexShrink:0,fontSize:'.72rem',padding:'.55rem .9rem'}}>Create</button>
                  </form>
                  <form onSubmit={handleJoinTeam} style={{display:'flex',gap:'.5rem'}}>
                    <input className="input" style={{flex:1}} value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="Join code…" required/>
                    <button type="submit" className="btn-secondary" style={{flexShrink:0,fontSize:'.72rem',padding:'.55rem .9rem'}}>Join</button>
                  </form>
                </div>
              )}
              <div style={{maxHeight:280,overflowY:'auto'}}>
                {teams.map(team => {
                  const isMember = team.members?.some(m => m.user_id === user?.id)
                  const showCode = isMember && team.join_code !== '••••••'
                  return (
                    <div key={team.id} className="list-item">
                      <div style={{flex:1}}>
                        <div className="li-title">{team.name}</div>
                        <div className="li-sub">{team.members?.length || 0} members</div>
                      </div>
                      <span style={{fontFamily:'monospace',fontSize:'.72rem',background:'var(--surface2)',border:'1px solid var(--border)',borderRadius:6,padding:'.18rem .55rem',color:showCode?'var(--blue-light)':'var(--text-dim)',letterSpacing:'.08em'}}>
                        {showCode ? team.join_code : '••••••'}
                      </span>
                    </div>
                  )
                })}
                {teams.length === 0 && <div style={{padding:'2rem',textAlign:'center',fontSize:'.72rem',color:'var(--text-dim)'}}>No teams yet</div>}
              </div>
            </div>
          )}

          {/* Announcements panel */}
          <div className="panel">
            <div className="panel-hd"><div className="panel-t">Announcements</div></div>
            {isAdmin && (
              <div style={{padding:'1rem 1.4rem',borderBottom:'1px solid var(--border)'}}>
                <form onSubmit={handleAnnouncement} style={{display:'flex',flexDirection:'column',gap:'.6rem'}}>
                  <input className="input" value={annForm.title} onChange={e => setAnnForm({...annForm,title:e.target.value})} placeholder="Title…" required/>
                  <textarea className="input" rows={2} value={annForm.message} onChange={e => setAnnForm({...annForm,message:e.target.value})} placeholder="Message…" required/>
                  <button type="submit" className="btn-primary" style={{fontSize:'.74rem'}}>Send Announcement →</button>
                </form>
              </div>
            )}
            <div style={{maxHeight:300,overflowY:'auto'}}>
              {announcements.map(ann => (
                <div key={ann.id} className="notif-item">
                  <div style={{width:7,height:7,borderRadius:'50%',background:'var(--amber)',flexShrink:0,marginTop:5}}/>
                  <div className="n-text">
                    <strong>{ann.title}</strong> — {ann.message}
                  </div>
                  <div className="n-time">{format(parseUTC(ann.created_at), 'MMM d, h:mm a')}</div>
                </div>
              ))}
              {announcements.length === 0 && <div style={{padding:'2rem',textAlign:'center',fontSize:'.72rem',color:'var(--text-dim)'}}>No announcements yet</div>}
            </div>
          </div>
        </div>

        {/* Admin: participants & check-in */}
        {isAdmin && (
          <div className="panel">
            <div className="panel-hd">
              <div className="panel-t">Participants & Check-in <span style={{fontSize:'.72rem',fontWeight:500,color:'var(--text-dim)',marginLeft:'.4rem'}}>({registrations.length})</span></div>
            </div>
            <table className="ev-table">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Registered</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {registrations.map(reg => {
                  const isCheckedIn = checkinIds.has(reg.user_id)
                  return (
                    <tr key={reg.id}>
                      <td><div className="td-name">{reg.user?.name || '—'}</div></td>
                      <td>{reg.user?.email || '—'}</td>
                      <td>{format(parseUTC(reg.registered_at), 'MMM d, yyyy')}</td>
                      <td>
                        {isCheckedIn
                          ? <span className="badge badge-open"><CheckCircle2 size={10} style={{display:'inline',marginRight:3}}/> Checked in</span>
                          : <span className="badge badge-closed">Pending</span>
                        }
                      </td>
                      <td>
                        {!isCheckedIn && (
                          <button className="btn-sm btn-sm-blue" onClick={() => handleCheckin(reg.user_id)}>Check In</button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {registrations.length === 0 && (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:'3rem',color:'var(--text-dim)'}}>No registrations yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
