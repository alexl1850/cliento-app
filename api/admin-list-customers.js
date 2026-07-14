import { requireAdmin } from './_lib/checkAccess.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const profilesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=*&order=created_at.desc`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    if (!profilesRes.ok) return res.status(500).json({ error: 'Could not load customers' });
    const profiles = await profilesRes.json();

    // auth.users isn't exposed over PostgREST — fetch emails via the admin
    // auth API and merge them in by user_id so the directory can show them.
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const emailById = {};
    if (usersRes.ok) {
      const usersJson = await usersRes.json();
      for (const u of usersJson.users || []) emailById[u.id] = u.email;
    }

    const now = Date.now();
    const customers = profiles.map(p => {
      const trialEnds = p.trial_ends ? new Date(p.trial_ends).getTime() : null;
      const lastActive = p.last_active_at ? new Date(p.last_active_at).getTime() : null;
      const daysSinceActive = lastActive ? Math.floor((now - lastActive) / 86400000) : null;
      return {
        userId: p.user_id,
        email: emailById[p.user_id] || null,
        bizName: p.biz_name,
        owner: p.owner,
        bizType: p.biz_type,
        industry: p.industry,
        suburb: p.suburb,
        plan: p.plan || 'trial',
        trialEnds: p.trial_ends,
        isTrialActive: trialEnds ? trialEnds > now : null,
        daysRemaining: trialEnds ? Math.ceil((trialEnds - now) / 86400000) : null,
        liveUrl: p.live_url || '',
        createdAt: p.created_at,
        lastActiveAt: p.last_active_at,
        daysSinceActive,
        // Only meaningful for paying customers — a quiet trial isn't a
        // retention risk the way a quiet paying account is.
        churnRisk: p.plan === 'pro' && daysSinceActive !== null && daysSinceActive >= 30,
        referralCreditMonths: p.referral_credit_months || 0,
      };
    });

    return res.status(200).json({ customers });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}
