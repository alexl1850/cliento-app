import { requireActiveAccount } from './_lib/checkAccess.js';
import { searchPlace, getPlaceDetails } from './_lib/placesApi.js';
import { sendEmail } from './_lib/email.js';

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
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}&select=owner,biz_name,suburb,email,gbp_place_id,reviews_data,reviews_synced_at`,
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

    // A nice-to-have nudge, not a promise of real-time detection — this
    // only fires when the customer actually clicks "Pull reviews" (or the
    // 24h cooldown lets a later click through), since nothing else in the
    // app polls Google for new reviews automatically.
    const previousCount = profile.reviews_data?.userRatingCount || 0;
    if (reviewsData.userRatingCount > previousCount) {
      try {
        let ownerEmail = profile.email;
        if (!ownerEmail) {
          const acctRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${access.userId}`, {
            headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` },
          });
          if (acctRes.ok) ownerEmail = (await acctRes.json())?.email;
        }
        if (ownerEmail) {
          const gained = reviewsData.userRatingCount - previousCount;
          const firstName = (profile.owner || profile.biz_name || 'there').split(' ')[0];
          await sendEmail(
            ownerEmail,
            `Nice! You just got ${gained > 1 ? `${gained} new reviews` : 'a new review'} 🎉`,
            `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;color:#111827;line-height:1.65;font-size:15px">
              <p>Hi ${firstName},</p>
              <p>Your Google rating for ${profile.biz_name || 'your business'} just went up — you're now at <strong>${reviewsData.rating ?? '—'} stars</strong> across <strong>${reviewsData.userRatingCount} reviews</strong>.</p>
              <p>Worth a share — it's already live on your Akus website.</p>
              <p style="margin-top:24px"><a href="https://app.akus.com.au" style="display:inline-block;padding:13px 24px;border-radius:8px;background:#2563EB;color:#fff;font-weight:700;text-decoration:none">Open my dashboard →</a></p>
              <p>Alex</p>
            </div>`
          );
        }
      } catch (emailErr) {
        console.error('Review-congrats email failed (non-fatal):', emailErr.message);
      }
    }

    return res.status(200).json({ success: true, cached: false, reviews: reviewsData });

  } catch (err) {
    console.error('Pull reviews error:', err);
    return res.status(500).json({ error: err.message });
  }
}
