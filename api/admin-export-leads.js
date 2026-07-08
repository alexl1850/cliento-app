import { requireAdmin } from './_lib/checkAccess.js';

function csvField(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const isPhone = req.query?.type === 'phone';

  try {
    const leadsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/leads?status=eq.${isPhone ? 'phone_lead' : 'approved'}&select=*&order=created_at.asc`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    if (!leadsRes.ok) return res.status(500).json({ error: `Could not load ${isPhone ? 'phone' : 'approved'} leads` });
    const leads = await leadsRes.json();

    if (leads.length === 0) {
      return res.status(200).json({ error: `No ${isPhone ? 'phone leads' : 'approved leads'} to export` });
    }

    const header = isPhone
      ? ['business_name', 'suburb', 'category', 'phone']
      : ['email', 'business_name', 'suburb', 'subject', 'body', 'demo_url'];
    const rows = leads.map(l => (isPhone
      ? [l.business_name, l.suburb, l.category, l.phone]
      : [l.discovered_email, l.business_name, l.suburb, l.draft_subject, l.draft_body, l.demo_url]
    ).map(csvField).join(','));
    const csv = [header.join(','), ...rows].join('\n');

    // Mark exported so a repeat export doesn't re-send the same leads.
    const ids = leads.map(l => l.id);
    await fetch(`${SUPABASE_URL}/rest/v1/leads?id=in.(${ids.join(',')})`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: 'exported', updated_at: new Date().toISOString() }),
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="akus-outreach-${Date.now()}.csv"`);
    return res.status(200).send(csv);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Export failed' });
  }
}
