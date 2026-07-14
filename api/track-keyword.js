import { requireActiveAccount } from './_lib/checkAccess.js';

// A flat cap for now (not yet tiered per plan) — the real cost driver is
// customers x keywords x weekly SerpApi checks, so this is enforced
// server-side, not just suggested in the UI.
const KEYWORD_CAP = 5;

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
    const { keyword, suburb } = req.body || {};
    if (!keyword) return res.status(400).json({ error: 'keyword is required' });

    const countRes = await fetch(
      `${SUPABASE_URL}/rest/v1/rank_keywords?user_id=eq.${access.userId}&active=eq.true&select=id`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!countRes.ok) throw new Error('Could not check your tracked keywords');
    const activeCount = (await countRes.json()).length;
    if (activeCount >= KEYWORD_CAP) {
      return res.status(400).json({ error: `You can track up to ${KEYWORD_CAP} keywords at once — untrack one first to add another.` });
    }

    // Merge-duplicates on the (user_id, keyword, suburb) unique constraint
    // so re-adding a previously untracked (soft-deleted) keyword reactivates
    // it instead of erroring, and keeps its existing rank_history.
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/rank_keywords?on_conflict=user_id,keyword,suburb`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({ user_id: access.userId, keyword, suburb: suburb || null, active: true }),
    });
    if (!insertRes.ok) throw new Error('Could not save this keyword');
    const [row] = await insertRes.json();

    return res.status(200).json({ success: true, keyword: row });

  } catch (err) {
    console.error('Track keyword error:', err);
    return res.status(500).json({ error: err.message });
  }
}
