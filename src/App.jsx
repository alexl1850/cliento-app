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

export default function App() {
  const [session,         setSession]         = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [profile,         setProfile]         = useState(null)
  const [journeyComplete, setJourneyComplete] = useState(false)
  const [isAdmin,         setIsAdmin]         = useState(false)
  const [showAdminPanel,  setShowAdminPanel]  = useState(false)
  const [impersonating,   setImpersonating]   = useState(() => !!sessionStorage.getItem(ADMIN_RETURN_KEY))

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false); setJourneyComplete(false) }
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
      sessionStorage.setItem(ADMIN_RETURN_KEY, JSON.stringify({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      }))
    }
    setShowAdminPanel(false)
    setImpersonating(true)
    await supabase.auth.setSession({ access_token: json.access_token, refresh_token: json.refresh_token })
  }

  const exitImpersonation = async () => {
    const stashed = sessionStorage.getItem(ADMIN_RETURN_KEY)
    sessionStorage.removeItem(ADMIN_RETURN_KEY)
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
      if (data.biz_name) setJourneyComplete(true)
    }
    setLoading(false)
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
      updated_at:  new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single()

    if (data && !error) setProfile(data)
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
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

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
      />
    </>
  )
}
