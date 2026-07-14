import { requireAuth } from './_lib/checkAccess.js';
import { SEQUENCE, sendLifecycleEmail, markEmailSent } from './_lib/onboardingEmails.js';

// Fires the immediate Day-0 "welcome" email right after a customer finishes
// onboarding (called from src/App.jsx once handleJourneyComplete's
// saveProfile succeeds). The daily cron batch (api/cron-daily.js) also
// re-checks day:0 as a safety net — if this call fails for any reason
// (network blip, tab closed mid-request), the welcome email still goes out
// on the next cron run instead of being silently lost. Idempotent either
// way via profiles.onboarding_emails_sent.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAuth(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const profRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}&select=user_id,owner,biz_name,email,plan,created_at,trial_ends,onboarding_emails_sent`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const rows = profRes.ok ? await profRes.json() : [];
    const profile = rows[0];
    if (!profile) return res.status(404).json({ error: 'No profile found' });

    const already = Array.isArray(profile.onboarding_emails_sent) ? profile.onboarding_emails_sent : [];
    if (already.includes('welcome')) return res.status(200).json({ sent: false, reason: 'already-sent' });

    const step = SEQUENCE.find(s => s.key === 'welcome');
    const result = await sendLifecycleEmail(step, profile);
    if (result.sent) await markEmailSent(access.userId, 'welcome', already);

    return res.status(200).json({ sent: result.sent });
  } catch (err) {
    console.error('onboarding-email error:', err);
    return res.status(200).json({ sent: false }); // never block the user's signup flow over an email
  }
}
