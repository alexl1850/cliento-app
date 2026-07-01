import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import AuthScreen from './AuthScreen.jsx'
import Dashboard from './Dashboard.jsx'
import Journey from './Journey.jsx'

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
    // Save profile from what was collected during the journey
    const biz = journeyData.bizInfo || {}
    await saveProfile({
      owner:       journeyData.name || biz.name || '',
      name:        biz.name || journeyData.name || 'My Business',
      bizType:     journeyData.bizType || 'local',
      suburb:      biz.suburb || '',
      industry:    biz.industry || '',
      description: biz.description || '',
      website:     journeyData.url || '',
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
      background:'#F8F9FA', fontFamily:"'Segoe UI',system-ui,sans-serif",
      flexDirection:'column', gap:'12px',
    }}>
      <div style={{fontSize:'1.8rem', fontWeight:900, letterSpacing:'-0.04em'}}>
        <span style={{color:'#2563EB'}}>⚡</span>Cliento<span style={{color:'#D97706'}}>.</span>
      </div>
      <div style={{fontSize:'0.85em', color:'#6B7280'}}>Loading your workspace...</div>
    </div>
  )

  // Not logged in
  if (!session) return <AuthScreen />

  // New user — show the guided journey
  if (!journeyComplete) return (
    <Journey onComplete={handleJourneyComplete}/>
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
