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
    const res2 = await fetch(
      `${SUPABASE_URL}/rest/v1/competitors?user_id=eq.${access.userId}&select=*&order=rating.desc`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!res2.ok) throw new Error('Could not load competitors');
    const competitors = await res2.json();

    return res.status(200).json({ success: true, competitors });

  } catch (err) {
    console.error('List competitors error:', err);
    return res.status(500).json({ error: err.message });
  }
}
