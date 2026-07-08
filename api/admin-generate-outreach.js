import { requireAdmin } from './_lib/checkAccess.js';
import { generateSiteHtml, safe } from './_lib/generateSite.js';
import { checkPagespeed } from './_lib/pagespeedCheck.js';
import { mapWithConcurrency } from './_lib/concurrency.js';

// Fixed, non-AI-generated compliance footer — Australian Spam Act 2003
// requires accurate sender self-identification and a working way to opt
// out on every commercial email. A reply-based opt-out is used here since
// it works regardless of which sending platform this eventually goes
// through (most also add their own unsubscribe link on top).
const FOOTER = `—
Akus Voice (ABN 90 632 856 615)
This email was sent because your business's contact details are publicly published on your own website. If you'd rather not hear from us again, just reply and let me know.`;

// At real send volume (thousands/month) a human can't click approve on
// every single draft — instead, only a random sample gets held for manual
// review; everything else auto-approves straight into the exportable
// pool. This trades full manual review for an ongoing spot-check on
// quality/compliance drift, which the admin can raise or lower over time
// once they've seen how the sampled drafts look.
const REVIEW_SAMPLE_RATE = 0.05;

async function draftOne(lead, { SUPABASE_URL, SUPABASE_KEY }) {
  const biz = safe(lead.business_name);
  const suburb = safe(lead.suburb);
  const category = safe(lead.category || '');

  // 1. Generate a real demo site for this exact business, same pipeline the
  // public homepage demo uses, so the link in the email is a genuinely
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

  // 2. Real PageSpeed score on their existing site, if we can get one —
  // non-fatal if it fails (some sites block automated checks, or the URL is
  // no longer live), the draft still works without it.
  let pagespeedScore = null;
  try {
    const { score } = await checkPagespeed(lead.website_url);
    pagespeedScore = score;
  } catch (err) {
    console.error(`PageSpeed check failed for ${lead.website_url} (non-fatal):`, err.message);
  }

  // 3. Draft the pitch itself.
  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You write short, genuinely personal cold outreach emails from a small Australian web design/marketing business called Akus to local business owners. The tone is a real person writing to another real person — specific, warm, no hype, no exclamation-point energy, no "I hope this email finds you well." Never use template-speak like {{firstName}} or generic flattery. Return ONLY valid JSON, no markdown.`,
      messages: [{ role: 'user', content: `Write a cold outreach email to the owner of this business:

Business: ${biz}
Suburb: ${suburb}
Category: ${category || 'local business'}
${pagespeedScore !== null ? `Their current website's mobile PageSpeed score: ${pagespeedScore}/100 (mention this specific, real number naturally if it's low — under 60 — otherwise don't dwell on speed)` : `(No speed score available — don't mention page speed at all)`}
A real, live demo website already built for them (not a mockup, an actual working site): ${demoUrl}

The email should: mention the demo link as something already built and ready to look at, be under 110 words, have a subject line under 8 words that isn't clickbait, and end with a soft, low-pressure question (not "book a call now"). Do not include a footer, signature block, or unsubscribe line — that gets added separately.

Return JSON: {"subject": "...", "body": "..."}` }],
    }),
  });
  const aiData = await aiRes.json();
  if (aiData.error) throw new Error(aiData.error.message || JSON.stringify(aiData.error));
  let draft;
  try {
    draft = JSON.parse(aiData.content[0].text.replace(/```json|```/g, '').trim());
  } catch {
    throw new Error('AI returned invalid JSON for outreach draft');
  }

  const subject = safe(draft.subject) || `A website for ${biz}`;
  const body = `${safe(draft.body)}\n\n${FOOTER}`;

  // 4. Roll the dice on whether this one needs a human look before it's
  // exportable — see REVIEW_SAMPLE_RATE above.
  const reviewSample = Math.random() < REVIEW_SAMPLE_RATE;
  const status = reviewSample ? 'drafted' : 'approved';

  // 5. Persist the draft onto the lead row.
  await fetch(`${SUPABASE_URL}/rest/v1/leads?id=eq.${lead.id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      pagespeed_score: pagespeedScore,
      demo_id: demoId,
      demo_url: demoUrl,
      draft_subject: subject,
      draft_body: body,
      status,
      review_sample: reviewSample,
      updated_at: new Date().toISOString(),
    }),
  });

  return { id: lead.id, subject, demoUrl, pagespeedScore, status, reviewSample };
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
  // Cap batch size — each lead does a real AI content generation call plus an
  // AI drafting call plus a live PageSpeed check, so a large batch risks the
  // serverless function timing out even with concurrency (below). Reaching
  // genuinely high volume (thousands/day) means calling this endpoint many
  // times rather than raising this cap indefinitely.
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
