import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'participant' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) { setError(err.response?.data?.detail || 'Registration failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-l">
          <div style={{position:'absolute',top:-80,right:-80,width:200,height:200,borderRadius:'50%',background:'rgba(255,255,255,.04)'}}/>
          <div style={{position:'relative',zIndex:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'.65rem',marginBottom:'2rem'}}>
              <div style={{width:32,height:32,background:'rgba(255,255,255,.15)',border:'1.5px solid rgba(255,255,255,.28)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'white'}}>ES</div>
              <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.3rem',fontWeight:700,color:'white',letterSpacing:'.04em'}}>Event<span style={{color:'var(--blue-pale)'}}>Sphere</span></span>
            </div>
            <div style={{fontSize:'.58rem',fontWeight:600,letterSpacing:'.2em',textTransform:'uppercase',color:'rgba(255,255,255,.38)',marginBottom:'1rem'}}>Multi-Event Management Platform</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2.1rem',fontWeight:700,lineHeight:1.08,color:'white',marginBottom:'.9rem'}}>Join the platform<br/>built for <em style={{fontStyle:'italic',color:'var(--blue-pale)'}}>events</em></div>
            <p style={{fontSize:'.76rem',lineHeight:1.8,color:'rgba(255,255,255,.52)',fontWeight:300}}>Register to participate in events, form teams, and track everything in one place.</p>
          </div>
          <div style={{position:'relative',zIndex:1,fontSize:'.75rem',color:'rgba(255,255,255,.45)'}}>
            Already have an account?{' '}
            <Link to="/login" style={{color:'var(--blue-pale)',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
          </div>
        </div>

        <div className="auth-r">
          <div className="auth-tab-bar">
            <button className="auth-tab" onClick={() => navigate('/login')}>Sign In</button>
            <button className="auth-tab active">Register</button>
          </div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'1.7rem',fontWeight:700,color:'var(--text)',marginBottom:'.18rem'}}>Create account</div>
          <div style={{fontSize:'.7rem',color:'var(--text-mid)',marginBottom:'1.3rem'}}>Choose your role to get started</div>

          {/* Role selector */}
          <div style={{display:'flex',gap:'.55rem',marginBottom:'1.1rem'}}>
            {[['participant','🎯 Participant'],['admin','⚙️ Admin']].map(([r, label]) => (
              <button key={r} type="button"
                style={{flex:1,background:form.role===r?'rgba(74,111,212,.1)':'var(--surface2)',border:`1.5px solid ${form.role===r?'var(--blue)':'var(--border)'}`,color:form.role===r?'var(--text)':'var(--text-mid)',fontFamily:"'Montserrat',sans-serif",fontSize:'.68rem',fontWeight:600,padding:'.55rem',borderRadius:7,cursor:'pointer',transition:'all .18s'}}
                onClick={() => setForm({...form, role: r})}>
                {label}
              </button>
            ))}
          </div>

          {error && <div className="msg-error" style={{marginBottom:'1rem'}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:'.85rem'}}>
              <label className="label">Full Name</label>
              <input className="input" type="text" required placeholder="Your full name"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div style={{marginBottom:'.85rem'}}>
              <label className="label">Email Address</label>
              <input className="input" type="email" required placeholder="your@email.com"
                value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div style={{marginBottom:'1rem'}}>
              <label className="label">Password</label>
              <input className="input" type="password" required minLength={6} placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
            </div>
            <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
          <div style={{textAlign:'center',fontSize:'.7rem',color:'var(--text-mid)',marginTop:'1.1rem'}}>
            Already a member? <Link to="/login" style={{color:'var(--blue)',fontWeight:600,textDecoration:'none'}}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
