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

    // Email export includes both the raw merge-tag values (for platforms
    // that run the sequence template themselves, e.g. Instantly/Smartlead —
    // column names match the {{FirstName}}-style tags in
    // _lib/outreachSequence.js) and the fully-rendered 6 steps (for
    // platforms that need literal per-lead content, or just for reference).
    const header = isPhone
      ? ['business_name', 'suburb', 'category', 'phone']
      : ['email', 'FirstName', 'BusinessName', 'Suburb', 'DemoLink', 'CompetitorType',
         'Subject1', 'Body1', 'Subject2', 'Body2', 'Subject3', 'Body3',
         'Subject4', 'Body4', 'Subject5', 'Body5', 'Subject6', 'Body6'];
    const rows = leads.map(l => {
      if (isPhone) return [l.business_name, l.suburb, l.category, l.phone].map(csvField).join(',');
      const seq = Array.isArray(l.sequence) ? l.sequence : [];
      const step = n => seq.find(s => s.step === n) || {};
      return [
        l.discovered_email, l.owner_first_name || '', l.business_name, l.suburb, l.demo_url, l.competitor_type || '',
        ...[1, 2, 3, 4, 5, 6].flatMap(n => [step(n).subject || '', step(n).body || '']),
      ].map(csvField).join(',');
    });
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
