import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'

const EMOJI_MAP = { Technology:'🚀', Business:'💼', Arts:'🎨', Sports:'⚽', Education:'📚', Other:'📌' }
const BANNER_COLORS = {
  Technology:'linear-gradient(135deg,#1A1F6E,#2D5BAA)',
  Business:'linear-gradient(135deg,#1A3A6E,#2D6E4A)',
  Arts:'linear-gradient(135deg,#2D1A6E,#5A2D9E)',
  Sports:'linear-gradient(135deg,#1A4A6E,#2D6E6E)',
  Education:'linear-gradient(135deg,#3A1A6E,#6E2D5A)',
  Other:'linear-gradient(135deg,#3A3A1A,#6E6E2D)',
}

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

export default function EventCard({ event, linkPrefix = '/events', actions }) {
  const cat = event.category || 'Other'
  const emoji = EMOJI_MAP[cat] || '📌'
  const banner = BANNER_COLORS[cat] || BANNER_COLORS.Other
  const fillPct = event.capacity > 0 ? Math.min(100, Math.round((event.registration_count / event.capacity) * 100)) : 0
  const fillColor = fillPct >= 100 ? 'var(--red)' : fillPct > 75 ? 'var(--amber)' : 'var(--blue)'

  return (
    <div className="ev-card">
      <div className="ev-banner" style={{background: event.cover_image_url ? undefined : banner}}>
        {event.cover_image_url
          ? <img src={event.cover_image_url} alt={event.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
          : <span style={{fontSize:'2rem'}}>{emoji}</span>
        }
        <span style={{position:'absolute',top:'.75rem',right:'.75rem'}}>{statusBadge(event.status)}</span>
      </div>
      <div className="ev-body">
        <div className="ev-cat">{cat}</div>
        <div className="ev-title">{event.title}</div>
        {event.description && <div className="ev-desc">{event.description}</div>}

        <div style={{marginBottom:'.8rem'}}>
          <div className="cap-bar">
            <div className="cap-fill" style={{width:`${fillPct}%`,background:fillColor}}/>
          </div>
          <div style={{fontSize:'.6rem',color:'var(--text-dim)',marginTop:'.3rem'}}>
            {event.registration_count} / {event.capacity} registered
            {event.enable_waitlist && fillPct >= 100 ? ' · Waitlist open' : ''}
          </div>
        </div>

        <div className="ev-foot">
          <div style={{fontSize:'.64rem',color:'var(--text-mid)'}}>
            {event.start_date ? `📅 ${format(parseUTC(event.start_date), 'MMM d, yyyy')}` : '📅 TBD'}
          </div>
          <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
            {actions}
            <Link to={`${linkPrefix}/${event.id}`} className="btn-sm btn-sm-blue" style={{textDecoration:'none'}}>View →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
