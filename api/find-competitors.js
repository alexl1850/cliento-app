import { requireActiveAccount } from './_lib/checkAccess.js';
import { searchPlace, searchCompetitors } from './_lib/placesApi.js';

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}&select=biz_name,suburb,industry,gbp_place_id`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!profileRes.ok) throw new Error('Could not load your business profile');
    const profile = (await profileRes.json())?.[0];
    if (!profile?.biz_name) {
      return res.status(400).json({ error: 'Set up your business profile first before comparing competitors.' });
    }

    // A real cooldown (not just a UI hint) — every refresh here is billed
    // Places API spend. Reuse whatever was cached last time if still fresh.
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/competitors?user_id=eq.${access.userId}&select=*&order=fetched_at.desc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const existing = existingRes.ok ? await existingRes.json() : [];
    const lastFetched = existing[0]?.fetched_at ? new Date(existing[0].fetched_at).getTime() : 0;
    if (Date.now() - lastFetched < COOLDOWN_MS && existing.length) {
      return res.status(200).json({ success: true, cached: true, competitors: existing });
    }

    let placeId = profile.gbp_place_id;
    if (!placeId) {
      const match = await searchPlace({ bizName: profile.biz_name, suburb: profile.suburb });
      placeId = match?.id || null;
    }

    const category = profile.industry || 'local business';
    const results = await searchCompetitors({ category, suburb: profile.suburb, excludePlaceId: placeId, limit: 3 });

    const competitors = results.map(r => ({
      place_id: r.id,
      business_name: r.displayName?.text || 'Unknown business',
      rating: r.rating ?? null,
      user_rating_count: r.userRatingCount ?? 0,
      website_url: r.websiteUri || null,
    }));

    // Replace the whole cached set rather than upserting individually, so a
    // competitor that no longer shows up in the fresh search doesn't linger
    // as a stale row forever.
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/competitors?user_id=eq.${access.userId}`, {
        method: 'DELETE',
        headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, Prefer: 'return=minimal' },
      });
      if (competitors.length) {
        await fetch(`${SUPABASE_URL}/rest/v1/competitors`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(competitors.map(c => ({ ...c, user_id: access.userId }))),
        });
      }
      if (placeId && placeId !== profile.gbp_place_id) {
        await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}`, {
          method: 'PATCH',
          headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
          body: JSON.stringify({ gbp_place_id: placeId }),
        });
      }
    } catch (saveErr) {
      console.error('Failed to cache competitors (non-fatal):', saveErr.message);
    }

    return res.status(200).json({ success: true, cached: false, competitors });

  } catch (err) {
    console.error('Find competitors error:', err);
    return res.status(500).json({ error: err.message });
  }
}
