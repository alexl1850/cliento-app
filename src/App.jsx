import { useState, useEffect } from 'react'
import { supabase, authHeaders } from './supabase.js'
import AuthScreen from './AuthScreen.jsx'
import Dashboard from './DashboardA.jsx'
import Journey from './Journey.jsx'
import AdminPanel from './AdminPanel.jsx'

const ADMIN_RETURN_KEY = 'akus_admin_return_session'

// Check for demo params from homepage
const urlParams = new URLSearchParams(window.location.search);
const demoParams = urlParams.get('demo') === '1' ? {
  biz:    urlParams.get('biz') || '',
  suburb: urlParams.get('suburb') || '',
  type:   urlParams.get('type') || 'local business',
} : null;

// Paddle redirects back here with ?checkout=success once payment completes.
// Paddle's webhook (the thing that actually flips profiles.plan) arrives
// server-to-server and can land after this redirect — without this, the app
// re-checks the still-stale profile and bounces straight back to the
// paywall, which looks exactly like "payment didn't go through."
const returningFromCheckout = urlParams.get('checkout') === 'success';

// Referral capture — stashed in localStorage (not just read from the URL)
// because signup requires an email-confirmation round trip: the visitor
// leaves this tab, clicks a link in their inbox, and lands back without the
// original ?ref= param. localStorage survives that; the URL alone wouldn't.
const REFERRAL_KEY = 'akus_referral_code'
const refParam = urlParams.get('ref')
if (refParam) { try { localStorage.setItem(REFERRAL_KEY, refParam) } catch {} }

function stillNeedsUpgrade(profile) {
  const plan = profile?.plan || 'trial'
  const trialEnds = profile?.trial_ends ? new Date(profile.trial_ends) : null
  const trialExpired = trialEnds && new Date() > trialEnds
  return plan === 'cancelled' || plan === 'past_due' || (plan === 'trial' && trialExpired)
}

export default function App() {
  const [session,         setSession]         = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [profile,         setProfile]         = useState(null)
  const [journeyComplete, setJourneyComplete] = useState(false)
  const [isAdmin,         setIsAdmin]         = useState(false)
  const [showAdminPanel,  setShowAdminPanel]  = useState(false)
  const [impersonating,   setImpersonating]   = useState(() => !!localStorage.getItem(ADMIN_RETURN_KEY))
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [confirmingPayment, setConfirmingPayment] = useState(returningFromCheckout)

  // Wait for the webhook to catch up instead of trusting whatever profile
  // state we loaded the instant we landed back from Paddle. Bounded at
  // ~12s (6 tries, 2s apart) — if the webhook still hasn't landed by then,
  // fall through to the normal paywall rather than waiting forever.
  const pollForPaidPlan = async (userId, initialProfile) => {
    let current = initialProfile
    let attempts = 0
    while (stillNeedsUpgrade(current) && attempts < 6) {
      await new Promise(r => setTimeout(r, 2000))
      current = await loadProfile(userId)
      attempts++
    }
    setConfirmingPayment(false)
    // Strip the marker so refreshing later doesn't re-trigger the wait.
    window.history.replaceState({}, '', window.location.pathname)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const data = await loadProfile(session.user.id)
        if (returningFromCheckout) await pollForPaidPlan(session.user.id, data)
      } else {
        setLoading(false)
        setConfirmingPayment(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Clicking the "forgot password" email link lands here with Supabase
      // having already signed the browser into a temporary recovery
      // session — without handling this event, that silently drops the
      // user straight into their normal dashboard with no way to actually
      // set a new password, which was the whole point of the email.
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      setSession(session)
      if (session) loadProfile(session.user.id)
      else {
        setProfile(null); setLoading(false); setJourneyComplete(false); setConfirmingPayment(false)
        // A stale impersonation stash left behind by a sign-out mid-session
        // would otherwise show a broken "Exit to admin" banner on next login.
        localStorage.removeItem(ADMIN_RETURN_KEY); setImpersonating(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Quietly check admin status once we have a session — a 200 means this
  // account is on the ADMIN_EMAILS allowlist server-side. Not a security
  // boundary itself (that's enforced per-request in the API), just decides
  // whether to show the "Admin" entry point in the UI.
  useEffect(() => {
    if (!session) { setIsAdmin(false); return }
    (async () => {
      try {
        const headers = await authHeaders()
        const res = await fetch('/api/admin-list-customers', { headers })
        setIsAdmin(res.ok)
      } catch {
        setIsAdmin(false)
      }
    })()
  }, [session])

  const impersonate = async (targetUserId) => {
    const headers = await authHeaders()
    const res = await fetch('/api/admin-impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({ targetUserId }),
    })
    const json = await res.json()
    if (!res.ok) { alert(json.error || 'Could not open that customer\'s dashboard.'); return }

    // Stash the admin's own session so "exit impersonation" can restore it
    // without needing them to sign in again.
    const { data: { session: adminSession } } = await supabase.auth.getSession()
    if (adminSession) {
      localStorage.setItem(ADMIN_RETURN_KEY, JSON.stringify({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      }))
    }
    try {
      await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token })
      setShowAdminPanel(false)
      setImpersonating(true)
    } catch (err) {
      localStorage.removeItem(ADMIN_RETURN_KEY)
      alert('Could not switch into that customer\'s session: ' + err.message)
    }
  }

  const exitImpersonation = async () => {
    const stashed = localStorage.getItem(ADMIN_RETURN_KEY)
    localStorage.removeItem(ADMIN_RETURN_KEY)
    setImpersonating(false)
    if (stashed) {
      const { access_token, refresh_token } = JSON.parse(stashed)
      await supabase.auth.setSession({ access_token, refresh_token })
    }
  }

  const loadProfile = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data && !error) {
      setProfile(data)
      // If they've already completed setup before, skip the journey
      setJourneyComplete(!!data.biz_name)
    } else {
      // No row yet (brand-new signup) — reset rather than leaving whatever
      // the PREVIOUS session's profile was, which otherwise lingers when
      // switching users without a full reload (e.g. admin impersonation).
      setProfile(null)
      setJourneyComplete(false)
    }
    setLoading(false)
    return data && !error ? data : null
  }

  const saveProfile = async (bizData) => {
    if (!session) return
    const payload = {
      user_id:     session.user.id,
      owner:       bizData.owner || bizData.name || '',
      biz_name:    bizData.name || bizData.biz_name || '',
      biz_type:    bizData.bizType || 'local',
      industry:    bizData.industry || '',
      suburb:      bizData.suburb || '',
      description: bizData.description || '',
      goal:        bizData.goal || '',
      website:     bizData.website || bizData.url || '',
      phone:       bizData.phone || '',
      email:       bizData.email || '',
      menu:        bizData.menu || '',
      live_url:    bizData.live_url || '',
      areas_served: bizData.areasServed || [],
      updated_at:  new Date().toISOString(),
    }
    // Only ever set on the very first save (no `profile` yet) — later edits
    // must never touch either column, or a re-save could hand someone a
    // fresh referral_code (breaking any link they've already shared) or
    // overwrite a real referred_by with whatever's currently in
    // localStorage (which could be stale or belong to a different visit).
    if (!profile) {
      payload.referral_code = Math.random().toString(36).slice(2, 10)
      let ref = null
      try { ref = localStorage.getItem(REFERRAL_KEY) } catch {}
      if (ref) payload.referred_by = ref
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (data && !error) {
      setProfile(data)
      if (payload.referred_by) { try { localStorage.removeItem(REFERRAL_KEY) } catch {} }
    }
    return { data, error }
  }

  const handleJourneyComplete = async (journeyData) => {
    const intake = journeyData.intake || journeyData.bizInfo || {}
    await saveProfile({
      owner:       intake.owner_name || journeyData.name || '',
      name:        intake.biz_name || journeyData.name || 'My Business',
      bizType:     journeyData.bizType || 'local',
      suburb:      intake.base_suburb || '',
      industry:    intake.industry || '',
      description: intake.description || '',
      phone:       intake.phone || '',
      email:       intake.email || '',
      menu:        intake.menu || intake.services || '',
      website:     journeyData.url || intake.url || '',
      live_url:    journeyData.liveUrl || '',
    })
    setJourneyComplete(true)
    // Fire-and-forget — the daily cron batch re-checks this as a safety
    // net, so a failed request here (closed tab, network blip) doesn't
    // lose the welcome email, just delays it to the next cron run.
    fetch('/api/onboarding-email', { method: 'POST', headers: await authHeaders() }).catch(() => {})
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // A password-recovery link was just clicked — this takes priority over
  // everything else below, including the normal loading/session checks,
  // since the user needs to actually set a new password before doing
  // anything else with this temporary session.
  if (passwordRecovery) return (
    <PasswordResetScreen onDone={() => setPasswordRecovery(false)} />
  )

  // Just back from Paddle checkout — wait for the webhook rather than
  // re-checking a possibly-stale profile and bouncing back to the paywall.
  // Takes priority over the plain "loading" screen below so the message
  // stays consistent through every re-fetch in the poll, not just the first.
  if (confirmingPayment) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F8F9FA', fontFamily:"'Inter',system-ui,sans-serif",
      flexDirection:'column', gap:'12px', padding:'24px', textAlign:'center',
    }}>
      <div style={{fontSize:'1.8rem', fontWeight:900, letterSpacing:'-0.04em'}}>
        <span style={{color:'#2563EB'}}>⚡</span>Akus<span style={{color:'#D97706'}}>.</span>
      </div>
      <div style={{fontSize:'0.85em', color:'#6B7280'}}>Confirming your payment — this only takes a few seconds...</div>
    </div>
  )

  // Loading
  if (loading) return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F8F9FA', fontFamily:"'Inter',system-ui,sans-serif",
      flexDirection:'column', gap:'12px',
    }}>
      <div style={{fontSize:'1.8rem', fontWeight:900, letterSpacing:'-0.04em'}}>
        <span style={{color:'#2563EB'}}>⚡</span>Akus<span style={{color:'#D97706'}}>.</span>
      </div>
      <div style={{fontSize:'0.85em', color:'#6B7280'}}>Loading your workspace...</div>
    </div>
  )

  // Not logged in — show auth with demo context if arriving from homepage
  if (!session) return (
    <div>
      {demoParams && (
        <div style={{
          background:'linear-gradient(135deg,#052E16,#166534)',
          padding:'14px 24px',
          textAlign:'center',
          fontFamily:"'Inter',system-ui,sans-serif",
          fontSize:'0.88rem',
          color:'#fff',
          fontWeight:600,
        }}>
          🎉 Building your website for <strong>{demoParams.biz}</strong> in <strong>{demoParams.suburb}</strong> — sign up free to see it live!
        </div>
      )}
      <AuthScreen demoParams={demoParams}/>
    </div>
  )

  // Admin viewing the customer directory
  if (showAdminPanel) return (
    <AdminPanel onClose={() => setShowAdminPanel(false)} onImpersonate={impersonate} />
  )

  const impersonationBanner = impersonating && (
    <div style={{
      background: '#1E293B', color: '#fff', padding: '10px 24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
      fontFamily: "'Inter',system-ui,sans-serif", fontSize: '0.85em', fontWeight: 600,
      position: 'sticky', top: 0, zIndex: 999,
    }}>
      <span>👀 Viewing as {profile?.biz_name || 'this customer'}</span>
      <button onClick={exitImpersonation} style={{
        background: '#fff', color: '#1E293B', border: 'none', borderRadius: '6px',
        padding: '5px 12px', fontSize: '0.9em', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Exit to admin
      </button>
    </div>
  )

  // New user — show the guided journey
  if (!journeyComplete) return (
    <>
      {impersonationBanner}
      <Journey onComplete={handleJourneyComplete} session={session}/>
    </>
  )

  // Returning user — show the full dashboard
  return (
    <>
      {impersonationBanner}
      <Dashboard
        session={session}
        profile={profile}
        onSaveProfile={saveProfile}
        onSignOut={signOut}
        supabase={supabase}
        isAdmin={isAdmin && !impersonating}
        onOpenAdmin={() => setShowAdminPanel(true)}
        // Fired by the Paddle.js overlay's own 'checkout.completed' event —
        // no redirect/reload involved now, so this fires immediately rather
        // than depending on a page reload racing the webhook. Reuses the
        // same bounded wait as the (still-kept, belt-and-braces) redirect
        // path in case the overlay event is ever missed.
        onCheckoutCompleted={() => { setConfirmingPayment(true); pollForPaidPlan(session.user.id, profile) }}
      />
    </>
  )
}

function PasswordResetScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords don\'t match.'); return }
    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) { setError(updateError.message); return }
    setDone(true)
  }

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#F8F9FA', fontFamily:"'Inter',system-ui,sans-serif", padding:'20px',
    }}>
      <div style={{width:'100%', maxWidth:'380px', background:'#fff', borderRadius:'16px', border:'1px solid #E5E7EB', padding:'32px'}}>
        <div style={{fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.03em', marginBottom:'6px', textAlign:'center'}}>
          <span style={{color:'#2563EB'}}>⚡</span>Akus<span style={{color:'#D97706'}}>.</span>
        </div>
        {done ? (
          <>
            <p style={{textAlign:'center', color:'#111827', fontWeight:700, margin:'20px 0 8px'}}>Password updated ✓</p>
            <p style={{textAlign:'center', color:'#6B7280', fontSize:'0.88em', marginBottom:'20px'}}>You can now continue to your dashboard.</p>
            <button onClick={onDone} style={{
              width:'100%', padding:'13px', borderRadius:'9px', border:'none',
              background:'#2563EB', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
            }}>Continue →</button>
          </>
        ) : (
          <form onSubmit={submit}>
            <p style={{textAlign:'center', color:'#6B7280', fontSize:'0.88em', margin:'8px 0 20px'}}>Set a new password for your account.</p>
            <input
              type="password" value={password} onChange={e=>setPassword(e.target.value)}
              placeholder="New password" autoFocus
              style={{width:'100%', padding:'12px 14px', borderRadius:'9px', border:'1.5px solid #E5E7EB', fontSize:'0.95em', marginBottom:'10px', boxSizing:'border-box', fontFamily:'inherit'}}
            />
            <input
              type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              placeholder="Confirm new password"
              style={{width:'100%', padding:'12px 14px', borderRadius:'9px', border:'1.5px solid #E5E7EB', fontSize:'0.95em', marginBottom:'14px', boxSizing:'border-box', fontFamily:'inherit'}}
            />
            {error && <div style={{color:'#DC2626', fontSize:'0.85em', marginBottom:'12px'}}>{error}</div>}
            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'13px', borderRadius:'9px', border:'none',
              background:'#2563EB', color:'#fff', fontWeight:700, cursor:'pointer', fontFamily:'inherit',
              opacity: loading?0.7:1,
            }}>{loading ? 'Updating...' : 'Update Password'}</button>
          </form>
        )}
      </div>
    </div>
  )
}
