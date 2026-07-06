import { requireActiveAccount } from './_lib/checkAccess.js';

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
    const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
    const params = new URLSearchParams({ url, strategy: 'mobile', category: 'performance' });
    if (apiKey) params.set('key', apiKey);

    const psiRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
    const psiData = await psiRes.json();
    if (!psiRes.ok) {
      const rawMessage = psiData.error?.message || 'PageSpeed check failed';
      console.error('PageSpeed API error:', rawMessage);
      // Don't leak raw Google Cloud quota/project internals to the customer —
      // show a clean, generic message instead for anything that isn't just a
      // bad URL from them.
      const isQuota = /quota/i.test(rawMessage);
      throw new Error(isQuota ? 'Speed checks are temporarily unavailable — please try again later.' : 'Could not check that URL — make sure it\'s a valid, live website address.');
    }

    const audits = psiData.lighthouseResult?.audits || {};
    const score = Math.round((psiData.lighthouseResult?.categories?.performance?.score || 0) * 100);
    const metrics = {
      firstContentfulPaint: audits['first-contentful-paint']?.displayValue || null,
      largestContentfulPaint: audits['largest-contentful-paint']?.displayValue || null,
      speedIndex: audits['speed-index']?.displayValue || null,
    };

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
