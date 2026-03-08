import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/shared/Navbar'
import { eventsApi } from '../api'

const CATEGORIES = ['All', 'Technology', 'Business', 'Arts', 'Sports', 'Education', 'Other']
const STATUS_TABS = [['all','All'],['upcoming','Upcoming'],['ongoing','Ongoing'],['completed','Completed']]
const EMOJI_MAP = { Technology:'🚀', Business:'💼', Arts:'🎨', Sports:'⚽', Education:'📚', Other:'📌' }
const BANNER_COLORS = {
  Technology:'linear-gradient(135deg,#1A1F6E,#2D5BAA)',
  Business:'linear-gradient(135deg,#1A3A6E,#2D6E4A)',
  Arts:'linear-gradient(135deg,#2D1A6E,#5A2D9E)',
  Sports:'linear-gradient(135deg,#1A4A6E,#2D6E6E)',
  Education:'linear-gradient(135deg,#3A1A6E,#6E2D5A)',
  Other:'linear-gradient(135deg,#3A3A1A,#6E6E2D)',
}

function statusBadge(status) {
  const map = { ongoing:'live', upcoming:'soon', completed:'closed', cancelled:'cancelled' }
  const labels = { ongoing:'● Live', upcoming:'Upcoming', completed:'Completed', cancelled:'Cancelled' }
  return <span className={`badge badge-${map[status]||'soon'}`}>{labels[status]||status}</span>
}

export default function EventsPage() {
  const [events, setEvents] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('All')

  useEffect(() => { eventsApi.list().then(r => setEvents(r.data)) }, [])

  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || e.status === statusFilter
    const matchCat = categoryFilter === 'All' || (e.category || 'Other') === categoryFilter
    return matchSearch && matchStatus && matchCat
  })

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Navbar />
      <div style={{paddingTop:62,maxWidth:1280,margin:'0 auto',padding:'62px 3rem 4rem'}}>
        <div className="pg-header" style={{marginTop:'2rem'}}>
          <div>
            <div className="pg-eyebrow">Browse</div>
            <div className="pg-title">Upcoming <em>Events</em></div>
          </div>
          <div style={{fontSize:'.7rem',color:'var(--text-dim)'}}>{filtered.length} event{filtered.length !== 1 ? 's' : ''} found</div>
        </div>

        {/* Filters */}
        <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'2rem',flexWrap:'wrap'}}>
          <div style={{position:'relative',flex:1,minWidth:200,maxWidth:260}}>
            <input className="input" style={{paddingLeft:'2rem',background:'var(--surface)'}} type="text"
              placeholder="Search events…" value={search} onChange={e => setSearch(e.target.value)} />
            <span style={{position:'absolute',left:'.65rem',top:'50%',transform:'translateY(-50%)',color:'var(--text-dim)',fontSize:'.9rem',pointerEvents:'none'}}>⌕</span>
          </div>
          <div className="ftabs">
            {STATUS_TABS.map(([val, label]) => (
              <button key={val} className={`ftab ${statusFilter===val?'active':''}`} onClick={() => setStatusFilter(val)}>{label}</button>
            ))}
          </div>
          <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
            {CATEGORIES.map(cat => (
              <button key={cat}
                style={{fontSize:'.64rem',fontWeight:600,padding:'.32rem .75rem',borderRadius:20,cursor:'pointer',fontFamily:"'Montserrat',sans-serif",transition:'all .18s',
                  background:categoryFilter===cat?'var(--blue)':'var(--surface)',
                  border:`1.5px solid ${categoryFilter===cat?'var(--blue)':'var(--border)'}`,
                  color:categoryFilter===cat?'white':'var(--text-dim)'}}
                onClick={() => setCategoryFilter(cat)}>{cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'5rem 2rem'}}>
            <div style={{fontSize:'3rem',opacity:.2,marginBottom:'1rem'}}>🔍</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.4rem',color:'var(--text-mid)',marginBottom:'.4rem'}}>No events found</div>
            <div style={{fontSize:'.76rem',color:'var(--text-dim)'}}>Try adjusting your search or filters</div>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1.3rem'}}>
            {filtered.map((e, i) => {
              const cat = e.category || 'Other'
              const emoji = EMOJI_MAP[cat] || '📌'
              const banner = BANNER_COLORS[cat] || BANNER_COLORS.Other
              const isFeatured = i === 0 && filtered.length >= 3
              return (
                <Link key={e.id} to={`/events/${e.id}`}
                  className="ev-card"
                  style={isFeatured ? {gridColumn:'span 2',display:'grid',gridTemplateColumns:'1fr 1fr',textDecoration:'none'} : {textDecoration:'none'}}>
                  <div className="ev-banner" style={{background:banner,minHeight:isFeatured?'100%':undefined}}>
                    <span style={{fontSize: isFeatured?'3rem':'2.1rem',position:'relative',zIndex:1}}>{emoji}</span>
                    <span style={{position:'absolute',top:'.75rem',right:'.75rem'}}>{statusBadge(e.status)}</span>
                  </div>
                  <div className="ev-body">
                    <div className="ev-cat">{cat}</div>
                    <div className="ev-title">{e.title}</div>
                    <div className="ev-desc">{e.description}</div>
                    {isFeatured && e.venue && (
                      <div style={{fontSize:'.68rem',color:'var(--text-mid)',marginBottom:'.8rem'}}>📍 {e.venue}</div>
                    )}
                    <div className="ev-foot">
                      <div style={{fontSize:'.64rem',color:'var(--text-dim)'}}>
                        {e.capacity - e.registration_count > 0
                          ? <>Slots: <span style={{color:'var(--blue)',fontWeight:700}}>{e.capacity - e.registration_count} left</span></>
                          : <span style={{color:'var(--red)'}}>Full</span>
                        }
                      </div>
                      <button className="btn-sm btn-sm-blue" onClick={e2 => e2.preventDefault()}>View →</button>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
