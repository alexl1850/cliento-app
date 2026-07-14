import { requireActiveAccount } from './_lib/checkAccess.js';
import { searchPlace, getPlaceDetails } from './_lib/placesApi.js';

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
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}&select=biz_name,suburb,gbp_place_id,reviews_data,reviews_synced_at`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!profileRes.ok) throw new Error('Could not load your business profile');
    const profile = (await profileRes.json())?.[0];
    if (!profile?.biz_name) {
      return res.status(400).json({ error: 'Set up your business profile first before pulling reviews.' });
    }

    // A real cooldown (not just a UI hint) — every call here is billed
    // Places API spend, so a stale-but-recent cached result is served
    // straight back rather than re-fetching.
    const lastSynced = profile.reviews_synced_at ? new Date(profile.reviews_synced_at).getTime() : 0;
    if (Date.now() - lastSynced < COOLDOWN_MS && profile.reviews_data) {
      return res.status(200).json({ success: true, cached: true, reviews: profile.reviews_data });
    }

    let placeId = profile.gbp_place_id;
    if (!placeId) {
      const match = await searchPlace({ bizName: profile.biz_name, suburb: profile.suburb });
      if (!match?.id) {
        return res.status(200).json({ success: true, cached: false, reviews: null, reason: 'not_found' });
      }
      placeId = match.id;
    }

    const details = await getPlaceDetails(placeId, 'rating,userRatingCount,reviews');
    const reviews = (details.reviews || []).map(r => ({
      author: r.authorAttribution?.displayName || 'Google user',
      rating: r.rating ?? null,
      text: r.text?.text || '',
      relativeTime: r.relativePublishTimeDescription || '',
    }));
    const reviewsData = {
      rating: details.rating ?? null,
      userRatingCount: details.userRatingCount ?? 0,
      reviews,
      fetched_at: new Date().toISOString(),
    };

    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          gbp_place_id: placeId,
          reviews_data: reviewsData,
          reviews_synced_at: new Date().toISOString(),
        }),
      });
    } catch (saveErr) {
      console.error('Failed to cache pulled reviews (non-fatal):', saveErr.message);
    }

    return res.status(200).json({ success: true, cached: false, reviews: reviewsData });

  } catch (err) {
    console.error('Pull reviews error:', err);
    return res.status(500).json({ error: err.message });
  }
}
