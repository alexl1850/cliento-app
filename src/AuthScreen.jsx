import { useState } from 'react'
import { supabase } from './supabase.js'

const C = {
  black:'#07090E', brand:'#2563EB', brandLt:'#EFF6FF',
  green:'#16A34A', greenLt:'#F0FDF4',
  red:'#DC2626', redLt:'#FEF2F2',
  border:'#E5E7EB', text:'#111827', muted:'#6B7280',
  amber:'#D97706',
}

export default function AuthScreen() {
  const [mode,     setMode]     = useState('signup') // signup | signin | forgot
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [name,     setName]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [message,  setMessage]  = useState(null) // {type:'success'|'error', text:''}

  const msg = (type, text) => setMessage({ type, text })

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!name.trim()) { msg('error', 'Please enter your name.'); return }
    if (password.length < 8) { msg('error', 'Password must be at least 8 characters.'); return }
    setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    setLoading(false)
    if (error) msg('error', error.message)
    else msg('success', `Welcome! Check ${email} to confirm your account, then come back and sign in.`)
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) msg('error', error.message === 'Invalid login credentials'
      ? 'Email or password is incorrect. Try again.'
      : error.message)
    // on success the App component will catch the session change and show dashboard
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setLoading(true); setMessage(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`
    })
    setLoading(false)
    if (error) msg('error', error.message)
    else msg('success', `Password reset link sent to ${email}. Check your inbox.`)
  }

  const inp = {
    width:'100%', padding:'12px 14px', borderRadius:'9px',
    border:`1.5px solid ${C.border}`, fontSize:'0.95em',
    color:C.text, outline:'none', boxSizing:'border-box',
    fontFamily:'inherit', background:'#fff',
    transition:'border-color 0.15s',
  }

  const btn = {
    width:'100%', padding:'13px', borderRadius:'9px', border:'none',
    background:C.brand, color:'#fff', fontSize:'0.95em', fontWeight:700,
    cursor:'pointer', opacity:loading?0.7:1,
    boxShadow:'0 4px 12px rgba(37,99,235,0.25)', transition:'all 0.15s',
  }

  return (
    <div style={{minHeight:'100vh',background:'#F8F9FA',fontFamily:"'Inter',system-ui,sans-serif",display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px'}}>

      {/* Logo */}
      <div style={{marginBottom:'32px',textAlign:'center'}}>
        <div style={{fontSize:'1.8rem',fontWeight:900,letterSpacing:'-0.04em',color:C.text,marginBottom:'6px'}}>
          <span style={{color:C.brand}}>⚡</span>Akus<span style={{color:C.amber}}>.</span>
        </div>
        <div style={{fontSize:'0.85em',color:C.muted}}>Skip the agency. Keep the results.</div>
      </div>

      {/* Card */}
      <div style={{background:'#fff',borderRadius:'16px',border:`1px solid ${C.border}`,padding:'36px 32px',width:'100%',maxWidth:'420px',boxShadow:'0 4px 24px rgba(0,0,0,0.07)'}}>

        {/* Tabs */}
        {mode !== 'forgot' && (
          <div style={{display:'flex',background:'#F3F4F6',borderRadius:'9px',padding:'3px',marginBottom:'28px'}}>
            {[['signup','Create account'],['signin','Sign in']].map(([m,label])=>(
              <button key={m} onClick={()=>{setMode(m);setMessage(null)}} style={{
                flex:1,padding:'9px',borderRadius:'7px',border:'none',cursor:'pointer',
                background:mode===m?'#fff':'transparent',
                color:mode===m?C.text:C.muted,
                fontWeight:mode===m?700:500,fontSize:'0.88em',
                boxShadow:mode===m?'0 1px 3px rgba(0,0,0,0.1)':'none',
                transition:'all 0.15s',
              }}>{label}</button>
            ))}
          </div>
        )}

        {/* Message banner */}
        {message && (
          <div style={{
            padding:'12px 14px',borderRadius:'8px',marginBottom:'18px',fontSize:'0.85em',lineHeight:1.5,
            background:message.type==='error'?C.redLt:C.greenLt,
            color:message.type==='error'?C.red:C.green,
            border:`1px solid ${message.type==='error'?'#FECACA':'#BBF7D0'}`,
          }}>
            {message.type==='error'?'⚠️':'✅'} {message.text}
          </div>
        )}

        {/* SIGN UP */}
        {mode==='signup' && (
          <form onSubmit={handleSignUp} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div>
              <label style={{display:'block',fontWeight:600,fontSize:'0.82em',color:C.muted,marginBottom:'5px'}}>Your name</label>
              <input style={inp} type="text" placeholder="e.g. Sandra" value={name} onChange={e=>setName(e.target.value)} required autoFocus/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:600,fontSize:'0.82em',color:C.muted,marginBottom:'5px'}}>Email address</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required/>
            </div>
            <div>
              <label style={{display:'block',fontWeight:600,fontSize:'0.82em',color:C.muted,marginBottom:'5px'}}>Password</label>
              <input style={inp} type="password" placeholder="At least 8 characters" value={password} onChange={e=>setPassword(e.target.value)} required/>
            </div>
            <button type="submit" style={btn} disabled={loading}>
              {loading ? 'Creating your account...' : 'Create My Free Account →'}
            </button>
            <div style={{fontSize:'0.75em',color:C.muted,textAlign:'center',lineHeight:1.5}}>
              By signing up you agree to our{' '}
              <a href="/terms" target="_blank" style={{color:C.brand}}>Terms of Service</a> and{' '}
              <a href="/privacy" target="_blank" style={{color:C.brand}}>Privacy Policy</a>.
            </div>
          </form>
        )}

        {/* SIGN IN */}
        {mode==='signin' && (
          <form onSubmit={handleSignIn} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div>
              <label style={{display:'block',fontWeight:600,fontSize:'0.82em',color:C.muted,marginBottom:'5px'}}>Email address</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
            </div>
            <div>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'5px'}}>
                <label style={{fontWeight:600,fontSize:'0.82em',color:C.muted}}>Password</label>
                <button type="button" onClick={()=>{setMode('forgot');setMessage(null)}} style={{background:'none',border:'none',cursor:'pointer',color:C.brand,fontSize:'0.78em',padding:0}}>
                  Forgot password?
                </button>
              </div>
              <input style={inp} type="password" placeholder="Your password" value={password} onChange={e=>setPassword(e.target.value)} required/>
            </div>
            <button type="submit" style={btn} disabled={loading}>
              {loading ? 'Signing you in...' : 'Sign In →'}
            </button>
          </form>
        )}

        {/* FORGOT */}
        {mode==='forgot' && (
          <form onSubmit={handleForgot} style={{display:'flex',flexDirection:'column',gap:'14px'}}>
            <div style={{fontWeight:700,fontSize:'1em',color:C.text,marginBottom:'4px'}}>Reset your password</div>
            <div style={{fontSize:'0.85em',color:C.muted,lineHeight:1.6}}>Enter your email and we'll send you a link to reset your password.</div>
            <div>
              <label style={{display:'block',fontWeight:600,fontSize:'0.82em',color:C.muted,marginBottom:'5px'}}>Email address</label>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus/>
            </div>
            <button type="submit" style={btn} disabled={loading}>
              {loading ? 'Sending reset link...' : 'Send Reset Link'}
            </button>
            <button type="button" onClick={()=>{setMode('signin');setMessage(null)}} style={{background:'none',border:'none',cursor:'pointer',color:C.brand,fontSize:'0.85em',padding:'4px 0'}}>
              ← Back to sign in
            </button>
          </form>
        )}
      </div>

      {/* Trial callout */}
      <div style={{marginTop:'20px',textAlign:'center',fontSize:'0.8em',color:C.muted}}>
        🎉 7-day free trial · No credit card required · Cancel anytime
      </div>
    </div>
  )
}
