// Verifies the caller is an authenticated user on an active trial or paid plan.
// Mirrors the client-side gate in DashboardA.jsx (needsUpgrade) so the API
// can't be called directly to bypass the paywall.
export async function requireActiveAccount(req) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: 'Not authenticated' };

  // Verify the token with Supabase Auth and get the real user id — never trust
  // a userId passed in the request body, since that could be spoofed.
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!userRes.ok) return { ok: false, status: 401, error: 'Invalid or expired session' };
  const user = await userRes.json();
  const userId = user?.id;
  if (!userId) return { ok: false, status: 401, error: 'Invalid or expired session' };

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=plan,trial_ends`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!profileRes.ok) return { ok: false, status: 500, error: 'Could not verify account status' };
  const rows = await profileRes.json();
  const profile = rows?.[0];

  // No profile row yet means a brand-new signup still in onboarding — same
  // as the frontend, treat this as an unstarted trial and allow it.
  if (!profile) return { ok: true, userId };

  const plan = profile.plan || 'trial';
  const trialEnds = profile.trial_ends ? new Date(profile.trial_ends) : null;
  const trialExpired = trialEnds && new Date() > trialEnds;
  const needsUpgrade = plan === 'cancelled' || plan === 'past_due' || (plan === 'trial' && trialExpired);

  if (needsUpgrade) {
    return { ok: false, status: 402, error: 'Your trial has ended — please subscribe to continue using Akus.' };
  }

  return { ok: true, userId };
}

// Verifies the caller is authenticated AND their email is on the admin
// allowlist (ADMIN_EMAILS env var, comma-separated, server-side only —
// never exposed to the frontend bundle). Used to gate the admin panel
// endpoints that can read/act on every customer's data.
export async function requireAdmin(req) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return { ok: false, status: 401, error: 'Not authenticated' };

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!userRes.ok) return { ok: false, status: 401, error: 'Invalid or expired session' };
  const user = await userRes.json();
  const userId = user?.id;
  const email = (user?.email || '').toLowerCase();
  if (!userId || !email) return { ok: false, status: 401, error: 'Invalid or expired session' };

  const allowlist = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowlist.includes(email)) {
    return { ok: false, status: 403, error: 'Not authorized' };
  }

  return { ok: true, userId, email };
}
