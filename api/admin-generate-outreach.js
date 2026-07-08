import { requireAdmin } from './_lib/checkAccess.js';
import { generateSiteHtml, safe } from './_lib/generateSite.js';
import { mapWithConcurrency } from './_lib/concurrency.js';
import { buildSequencePrompt, renderSequence, pluralize, REFERENCE_TEMPLATE, FOOTER } from './_lib/outreachSequence.js';

// The AI-generated copy below is plain-text email content, not HTML — it
// must NOT go through generateSite.js's safe(), which HTML-entity-escapes
// quotes/angle-brackets for embedding into a web page. This sequence is
// full of quoted phrases ("keep it", "yeah but what's the catch") that
// would render as literal "&quot;keep it&quot;" in a real inbox if escaped
// that way. Just coerce to a trimmed string instead.
const plain = (s) => String(s ?? '').trim();

// The sequence copy is now AI-personalized per lead (not just merge-tag
// substitution) using the user's hand-written sequence as a style/structure
// reference — see _lib/outreachSequence.js. So the sample review below is
// spot-checking the actual generated copy again (does it stay on-brief,
// does it avoid inventing false claims about the business), the same
// reason this sampling existed for the original single-email flow.
const REVIEW_SAMPLE_RATE = 0.05;

async function generatePersonalizedSequence({ businessName, suburb, category, demoUrl, ownerFirstName }) {
  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  const { system, user } = buildSequencePrompt({ businessName, suburb, category, demoUrl, ownerFirstName });
  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const aiData = await aiRes.json();
  if (aiData.error) throw new Error(aiData.error.message || JSON.stringify(aiData.error));

  let parsed;
  try {
    parsed = JSON.parse(aiData.content[0].text.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('AI returned invalid JSON for outreach sequence');
  }
  if (!Array.isArray(parsed) || parsed.length !== 6) {
    throw new Error(`AI returned ${Array.isArray(parsed) ? parsed.length : typeof parsed} steps instead of 6`);
  }

  return parsed.map((item, i) => ({
    step: REFERENCE_TEMPLATE[i].step,
    delayDays: REFERENCE_TEMPLATE[i].delayDays,
    subject: plain(item.subject) || REFERENCE_TEMPLATE[i].subject,
    body: `${plain(item.body)}\n\n${FOOTER}`,
  }));
}

async function draftOne(lead, { SUPABASE_URL, SUPABASE_KEY }) {
  // Two versions of the same fields: HTML-escaped for the demo site (which
  // is real HTML embedding untrusted-ish data), raw for the plain-text
  // email sequence (which should never contain HTML entities).
  const bizRaw = lead.business_name;
  const suburbRaw = lead.suburb;
  const categoryRaw = lead.category || '';
  const ownerFirstName = lead.owner_first_name || null;

  const bizHtml = safe(bizRaw);
  const suburbHtml = safe(suburbRaw);
  const categoryHtml = safe(categoryRaw);

  // 1. Generate a real demo site for this exact business, same pipeline the
  // public homepage demo uses, so the link in the sequence is a genuinely
  // working, already-built website.
  const { html, themeName } = await generateSiteHtml({ biz: bizHtml, suburb: suburbHtml, bizType: categoryHtml, ownerName: '', phone: '', email: '', description: '' });
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
      biz_name: bizHtml,
      suburb: suburbHtml,
      biz_type: categoryHtml || themeName,
      html,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // longer TTL than the public demo — outreach recipients may take weeks to open the email
    }),
  });
  const demoUrl = `https://app.akus.com.au/api/demo-view?id=${demoId}`;

  // 2. Personalize the fixed sequence for this exact business via Claude,
  // using the reference template as structure/tone guidance. Falls back to
  // plain merge-tag substitution if the AI call fails, so a lead never ends
  // up with no draft at all.
  let sequence;
  try {
    sequence = await generatePersonalizedSequence({ businessName: bizRaw, suburb: suburbRaw, category: categoryRaw, demoUrl, ownerFirstName });
  } catch (err) {
    console.error(`Personalized sequence generation failed for lead ${lead.id}, falling back to template substitution:`, err.message);
    sequence = renderSequence({ businessName: bizRaw, suburb: suburbRaw, category: categoryRaw, demoUrl, ownerFirstName });
  }
  const competitorType = `other ${pluralize(categoryRaw)}`;

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
  // Cap batch size — each lead now does a demo-site AI call PLUS a full
  // 6-email sequence AI call, so a large batch risks the serverless function
  // timing out even with concurrency (below). Reaching genuinely high volume
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
