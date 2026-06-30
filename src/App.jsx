import { useState, useEffect } from 'react'
import { supabase } from './supabase.js'
import AuthScreen from './AuthScreen.jsx'
import Dashboard from './Dashboard.jsx'

export default function App() {
  const [session,  setSession]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [profile,  setProfile]  = useState(null)   // saved business profile from DB

  // ── Listen to auth state changes ───────────────────────────────
  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else setLoading(false)
    })

    // Subscribe to auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) loadProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Load saved business profile from Supabase ──────────────────
  const loadProfile = async (userId) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (data && !error) {
      setProfile(data)
    }
    setLoading(false)
  }

  // ── Save business profile to Supabase ──────────────────────────
  const saveProfile = async (bizData) => {
    if (!session) return
    const payload = {
      user_id:     session.user.id,
      owner:       bizData.owner,
      biz_name:    bizData.name,
      biz_type:    bizData.bizType || 'local',
      industry:    bizData.industry,
      suburb:      bizData.suburb,
      description: bizData.description,
      goal:        bizData.goal,
      website:     bizData.website || '',
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

  // ── Sign out ────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // ── Loading screen ──────────────────────────────────────────────
  if (loading) return (
    <div style={{
      minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'#F8F9FA',fontFamily:"'Segoe UI',system-ui,sans-serif",
      flexDirection:'column',gap:'12px',
    }}>
      <div style={{fontSize:'1.8rem',fontWeight:900,letterSpacing:'-0.04em'}}>
        <span style={{color:'#2563EB'}}>⚡</span>Cliento<span style={{color:'#D97706'}}>.</span>
      </div>
      <div style={{fontSize:'0.85em',color:'#6B7280'}}>Loading your workspace...</div>
    </div>
  )

  // ── Route: Auth or Dashboard ────────────────────────────────────
  if (!session) return <AuthScreen />

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
