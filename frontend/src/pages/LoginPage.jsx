import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('login')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) { setError(err.response?.data?.detail || 'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Left */}
        <div className="auth-l">
          <div style={{position:'absolute',top:-80,right:-80,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,.04)'}}/>
          <div style={{position:'absolute',bottom:-60,left:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,.03)'}}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'.65rem',marginBottom:'2rem'}}>
              <div style={{width:32,height:32,background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.28)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'white'}}>ES</div>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:700,color:'white',letterSpacing:'.04em'}}>Event<span style={{color:'var(--blue-pale)'}}>Sphere</span></span>
            </div>
            <div style={{fontSize:'.58rem',fontWeight:600,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.38)',marginBottom:'1rem'}}>Multi-Event Management Platform</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.1rem',fontWeight:700,lineHeight:1.08,color:'white',marginBottom:'.9rem'}}>Where events<br/>meet <em style={{fontStyle:'italic',color:'var(--blue-pale)'}}>excellence</em></div>
            <p style={{fontSize:'.76rem',lineHeight:1.8,color:'rgba(255,255,255,.52)',fontWeight:300}}>A unified platform for hosting, registering, and orchestrating multiple events with precision.</p>
          </div>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{width:28,height:2,background:'rgba(255,255,255,.16)',borderRadius:2,marginBottom:'1.1rem'}}/>
            {[['Multi-Event Hosting','Manage unlimited events from one dashboard'],['Team Formation','Create, join, and manage event teams seamlessly'],['Real-time Updates','Stay updated with instant announcements']].map(([title, desc]) => (
              <div key={title} style={{display:'flex',alignItems:'flex-start',gap:'.75rem',padding:'.55rem 0',borderBottom:'1px solid rgba(255,255,255,.06)'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:'var(--blue-pale)',flexShrink:0,marginTop:5}}/>
                <div style={{fontSize:'.72rem',color:'rgba(255,255,255,.54)',fontWeight:300,lineHeight:1.5}}>
                  <strong style={{color:'white',fontWeight:600,display:'block',marginBottom:'.02rem'}}>{title}</strong>{desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="auth-r">
          <div className="auth-tab-bar">
            <button className={`auth-tab ${tab==='login'?'active':''}`} onClick={() => setTab('login')}>Sign In</button>
            <button className={`auth-tab ${tab==='register'?'active':''}`} onClick={() => navigate('/register')}>Register</button>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.7rem',fontWeight:700,color:'var(--text)',marginBottom:'.18rem'}}>Welcome back</div>
          <div style={{fontSize:'.7rem',color:'var(--text-mid)',marginBottom:'1.5rem'}}>Sign in to your EventSphere account</div>

          {error && <div className="msg-error" style={{marginBottom:'1rem'}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:'.9rem'}}>
              <label className="label">Email Address</label>
              <input className="input" type="email" required placeholder="your@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div style={{marginBottom:'.3rem'}}>
              <label className="label">Password</label>
              <input className="input" type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <div style={{textAlign:'right',marginBottom:'1.2rem'}}>
              <span style={{fontSize:'.68rem',color:'var(--blue)',cursor:'pointer'}}>Forgot password?</span>
            </div>
            <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div style={{textAlign:'center',fontSize:'.7rem',color:'var(--text-mid)',marginTop:'1.1rem'}}>
            No account yet? <Link to="/register" style={{color:'var(--blue)',fontWeight:600,textDecoration:'none'}}>Create one</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
