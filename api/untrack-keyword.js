import { requireActiveAccount } from './_lib/checkAccess.js';

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
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id required' });

    // Soft delete (active=false), not a real DELETE — preserves rank_history
    // in case the keyword is ever re-tracked. Scoped to id AND user_id so
    // one account can't untrack another's keyword.
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/rank_keywords?id=eq.${id}&user_id=eq.${access.userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ active: false }),
    });
    if (!res2.ok) return res.status(500).json({ error: 'Could not untrack this keyword' });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Untrack keyword error:', err);
    return res.status(500).json({ error: err.message });
  }
}
