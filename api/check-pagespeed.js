import { requireActiveAccount } from './_lib/checkAccess.js';
import { checkPagespeed } from './_lib/pagespeedCheck.js';

// Google's PageSpeed Insights API technically works unauthenticated, but the
// shared/unkeyed quota turned out to be exhausted almost immediately in
// practice — GOOGLE_PAGESPEED_API_KEY (a free, instant, self-serve Google
// Cloud API key, no approval wait) is effectively required, not just an
// at-scale nice-to-have.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'No website URL to check — build your website first.' });

  try {
    const { score, metrics } = await checkPagespeed(url);

    // Cache the result so the Health Score panel can show it without
    // re-checking on every view — best-effort, doesn't block the response.
    try {
      await fetch(`${process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ pagespeed_score: score, pagespeed_checked_at: new Date().toISOString() }),
      });
    } catch (saveErr) {
      console.error('Failed to cache pagespeed score (non-fatal):', saveErr.message);
    }

    return res.status(200).json({ score, metrics, checkedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'PageSpeed check failed' });
  }
}
