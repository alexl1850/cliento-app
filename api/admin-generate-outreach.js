import { requireAdmin } from './_lib/checkAccess.js';
import { generateSiteHtml, safe } from './_lib/generateSite.js';
import { mapWithConcurrency } from './_lib/concurrency.js';
import { renderSequence, pluralize } from './_lib/outreachSequence.js';

// The outreach copy is now a fixed, human-written 6-email sequence (see
// _lib/outreachSequence.js) — not AI-generated per lead. So the sample
// review below isn't spot-checking copy quality anymore (the copy is the
// same reviewed-once text for everyone); it's checking that this lead's
// merge data (owner name found, competitor phrasing, the demo itself)
// actually reads sensibly before it's exportable.
const REVIEW_SAMPLE_RATE = 0.05;

async function draftOne(lead, { SUPABASE_URL, SUPABASE_KEY }) {
  const biz = safe(lead.business_name);
  const suburb = safe(lead.suburb);
  const category = safe(lead.category || '');
  const ownerFirstName = lead.owner_first_name ? safe(lead.owner_first_name) : null;

  // 1. Generate a real demo site for this exact business, same pipeline the
  // public homepage demo uses, so the link in the sequence is a genuinely
  // working, already-built website.
  const { html, themeName } = await generateSiteHtml({ biz, suburb, bizType: category, ownerName: '', phone: '', email: '', description: '' });
  const demoId = `demo_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  await fetch(`${SUPABASE_URL}/rest/v1/demo_sites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      demo_id: demoId,
      biz_name: biz,
      suburb,
      biz_type: category || themeName,
      html,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // longer TTL than the public demo — outreach recipients may take weeks to open the email
    }),
  });
  const demoUrl = `https://app.akus.com.au/api/demo-view?id=${demoId}`;

  // 2. Fill the fixed 6-email sequence with this lead's merge data.
  const sequence = renderSequence({ businessName: biz, suburb, category, demoUrl, ownerFirstName });
  const competitorType = `other ${pluralize(category)}`;

  // 3. Roll the dice on whether this one needs a human look before it's
  // exportable — see REVIEW_SAMPLE_RATE above.
  const reviewSample = Math.random() < REVIEW_SAMPLE_RATE;
  const status = reviewSample ? 'drafted' : 'approved';

  // 4. Persist — step 1 mirrors into draft_subject/draft_body so the
  // existing single-draft review UI still shows something meaningful; the
  // full sequence lives in the `sequence` JSONB column for export.
  await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      demo_id: demoId,
      demo_url: demoUrl,
      competitor_type: competitorType,
      draft_subject: sequence[0].subject,
      draft_body: sequence[0].body,
      sequence,
      status,
      review_sample: reviewSample,
      updated_at: new Date().toISOString(),
    }),
  });

  return { id: lead.id, subject: sequence[0].subject, demoUrl, status, reviewSample };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const leadIds = req.body?.leadIds || (req.body?.leadId ? [req.body.leadId] : []);
  if (leadIds.length === 0) return res.status(400).json({ error: 'leadId or leadIds required' });
  // Cap batch size — each lead still does a real AI content-generation call
  // for its demo site, so a large batch risks the serverless function timing
  // out even with concurrency (below). Reaching genuinely high volume
  // (thousands/day) means calling this endpoint many times, not raising
  // this cap indefinitely.
  const boundedIds = leadIds.slice(0, 20);
  const CONCURRENCY = 5;

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const outcomes = await mapWithConcurrency(boundedIds, CONCURRENCY, async (id) => {
    try {
      const leadRes = await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${id}&select=*`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
      });
      const [lead] = await leadRes.json();
      if (!lead) return { ok: false, id, error: 'Lead not found' };
      const result = await draftOne(lead, { SUPABASE_URL, SUPABASE_KEY });
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, id, error: err.message };
    }
  });

  const results = outcomes.filter(o => o.ok);
  const errors = outcomes.filter(o => !o.ok).map(({ id, error }) => ({ id, error }));

  return res.status(200).json({ drafted: results, errors });
}
