import { requireActiveAccount } from './_lib/checkAccess.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}&select=live_url`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!profileRes.ok) throw new Error('Could not load your business profile');
    const liveUrl = ((await profileRes.json())?.[0]?.live_url || '').replace(/\/$/, '');

    const pagesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/location_pages?user_id=eq.${access.userId}&select=id,suburb,slug,updated_at&order=suburb.asc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!pagesRes.ok) throw new Error('Could not load location pages');
    const rows = await pagesRes.json();

    const pages = rows.map(r => ({
      id: r.id,
      suburb: r.suburb,
      slug: r.slug,
      updatedAt: r.updated_at,
      url: liveUrl ? `${liveUrl}/location/${r.slug}` : null,
    }));

    return res.status(200).json({ success: true, pages });

  } catch (err) {
    console.error('List location pages error:', err);
    return res.status(500).json({ error: err.message });
  }
}
