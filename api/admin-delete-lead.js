import { requireAdmin } from './_lib/checkAccess.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const ids = req.body?.ids || (req.body?.id ? [req.body.id] : []);
  if (ids.length === 0) return res.status(400).json({ error: 'id or ids required' });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=in.(${ids.join(',')})`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
    });
    if (!delRes.ok) return res.status(500).json({ error: 'Could not delete lead(s)' });
    return res.status(200).json({ success: true, deleted: ids.length });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}
