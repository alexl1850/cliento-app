import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase env vars missing — auth features will not work.')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')
export const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY || ''

// Attach the current user's session token so gated API endpoints can verify
// the caller server-side instead of trusting the frontend's paywall alone.
export async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}
