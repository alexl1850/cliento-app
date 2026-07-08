import { requireAdmin } from './_lib/checkAccess.js';

const ALLOWED_STATUSES = ['sourced', 'drafted', 'approved', 'rejected', 'exported'];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const { id, status, draftSubject, draftBody } = req.body || {};
  if (!id) return res.status(400).json({ error: 'id required' });
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const patch = { updated_at: new Date().toISOString() };
  if (status) patch.status = status;
  if (draftSubject !== undefined) patch.draft_subject = draftSubject;
  if (draftBody !== undefined) patch.draft_body = draftBody;

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(patch),
    });
    if (!patchRes.ok) return res.status(500).json({ error: 'Could not update lead' });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}
