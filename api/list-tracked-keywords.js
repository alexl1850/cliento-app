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
    const keywordsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rank_keywords?user_id=eq.${access.userId}&active=eq.true&select=id,keyword,suburb,created_at&order=created_at.asc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!keywordsRes.ok) throw new Error('Could not load tracked keywords');
    const keywords = await keywordsRes.json();
    if (!keywords.length) return res.status(200).json({ success: true, keywords: [] });

    const ids = keywords.map(k => k.id).join(',');
    const historyRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rank_history?keyword_id=in.(${ids})&select=keyword_id,position,checked_at&order=checked_at.desc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const history = historyRes.ok ? await historyRes.json() : [];

    const result = keywords.map(k => {
      // history is already newest-first; take up to 8 points per keyword
      // for a trend view without shipping unbounded history to the client.
      const points = history.filter(h => h.keyword_id === k.id).slice(0, 8).reverse();
      return {
        id: k.id,
        keyword: k.keyword,
        suburb: k.suburb,
        latestPosition: points[points.length - 1]?.position ?? null,
        history: points.map(p => ({ position: p.position, checkedAt: p.checked_at })),
      };
    });

    return res.status(200).json({ success: true, keywords: result });

  } catch (err) {
    console.error('List tracked keywords error:', err);
    return res.status(500).json({ error: err.message });
  }
}
