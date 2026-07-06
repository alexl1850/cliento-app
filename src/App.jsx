import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import AuthScreen from './AuthScreen.jsx'
import Dashboard from './DashboardA.jsx'
import Journey from './Journey.jsx'

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

  // New user — show the guided journey
  if (!journeyComplete) return (
    <Journey onComplete={handleJourneyComplete} session={session}/>
  )

  // Returning user — show the full dashboard
  return (
    <Dashboard
      session={session}
      profile={profile}
      onSaveProfile={saveProfile}
      onSignOut={signOut}
      supabase={supabase}
    />
  )
}
