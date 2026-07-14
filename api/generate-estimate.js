import { checkRateLimit } from './_lib/rateLimit.js';
import { sendEmail, escapeHtml as safe } from './_lib/email.js';

// Public endpoint — called anonymously from a customer's live website by a
// visitor filling in the "Instant Estimate" widget, so there's no logged-in
// session to check with requireActiveAccount. Instead it verifies ownerId
// corresponds to a real Akus profile before spending an Anthropic call or
// writing a lead, so a made-up id can't be used to abuse either.
//
// Email notifications go through Resend (RESEND_API_KEY) — optional: if it's
// not set, emails are silently skipped and the estimate/lead capture still
// works, just without the notification.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // No login on this endpoint (visitors on a customer's site aren't Akus
  // accounts) — every hit costs a real Anthropic call and can spam a real
  // lead into someone's CRM, so cap it per IP.
  const rateLimit = await checkRateLimit(req, 'estimate', 5, 3600);
  if (!rateLimit.ok) return res.status(rateLimit.status).json({ error: rateLimit.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const { ownerId, bizName, trade, suburb, jobDetails, name, phone, email } = req.body || {};

    if (!ownerId || !jobDetails || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Basic sanity caps — this is a public, unauthenticated endpoint.
    if (String(jobDetails).length > 1000 || String(name).length > 200) {
      return res.status(400).json({ error: 'Input too long' });
    }

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${ownerId}&select=user_id,biz_name,email,phone,live_url`,
      { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    const profileRows = await profileRes.json();
    const ownerProfile = profileRows?.[0];
    if (!profileRes.ok || !ownerProfile) {
      return res.status(404).json({ error: 'Unknown business' });
    }

    const todayStr = new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        system: `Today's date is ${todayStr}. You are a realistic, honest pricing estimator for a ${trade || 'trades'} business called "${bizName || 'this business'}" in ${suburb || 'Australia'}. Give a ballpark AUD price RANGE for the described job, based on typical Australian trade pricing — never wildly high or low. Always make clear this is a rough, non-binding estimate and a final price needs an in-person or phone assessment. Return ONLY valid JSON, no markdown, no code fences: {"low": number, "high": number, "reasoning": "2-3 sentences explaining the range and what could move the price"}`,
        messages: [{ role: 'user', content: `Job description from a potential customer: "${jobDetails}"` }],
      }),
    });
    const claudeData = await claudeRes.json();
    if (claudeData.error) throw new Error(claudeData.error.message);
    const cleaned = claudeData.content[0].text.replace(/```json|```/g, '').trim();
    const estimate = JSON.parse(cleaned);

    // Best-effort lead capture — don't fail the estimate if this fails.
    fetch(`${SUPABASE_URL}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: ownerId,
        name: String(name).slice(0, 200),
        phone: phone ? String(phone).slice(0, 50) : '',
        email: email ? String(email).slice(0, 200) : '',
        tag: 'lead',
        notes: `Instant estimate request via website — ${suburb || 'suburb not given'}. Job: ${jobDetails}. AI estimate shown: $${estimate.low}–$${estimate.high}.`,
        job_history: '',
      }),
    }).catch(() => {});

    // Notify both sides by email, best-effort — neither should block the
    // response the visitor is waiting on. Everything visitor-supplied is
    // HTML-escaped first (safe()) since this is a public endpoint — only
    // ownerProfile fields (from our own database) and the AI's own output
    // are trusted as-is.
    const displayBizName = safe(ownerProfile.biz_name) || 'the business';
    const range = `$${estimate.low.toLocaleString()}–$${estimate.high.toLocaleString()}`;
    const safeName = safe(name);
    const safeJobDetails = safe(jobDetails);
    const safePhone = safe(phone);

    if (email) {
      sendEmail(email, `Your estimate from ${displayBizName}: ${range}`, `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#111827">Your ballpark estimate</h2>
          <p style="font-size:1.6em;font-weight:800;color:#111827">${range}</p>
          <p style="color:#4B5563;line-height:1.6">${safe(estimate.reasoning)}</p>
          <p style="color:#6B7280;font-size:0.85em">This is a rough guide only — ${displayBizName} will follow up with you directly for a firm, no-obligation quote.</p>
          <p style="color:#374151">Job details you provided: <em>${safeJobDetails}</em></p>
          ${ownerProfile.phone ? `<p style="color:#374151">You can also reach them directly on <a href="tel:${String(ownerProfile.phone).replace(/\s/g,'')}">${safe(ownerProfile.phone)}</a>.</p>` : ''}
        </div>
      `).catch(() => {});
    }

    // The owner's business email (entered during setup) is who customer
    // enquiries should reach — fall back to their account signup email if
    // that hasn't been filled in.
    let ownerEmail = ownerProfile.email;
    if (!ownerEmail) {
      try {
        const acctRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${ownerId}`, {
          headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
        });
        if (acctRes.ok) ownerEmail = (await acctRes.json())?.email;
      } catch { /* best-effort */ }
    }
    if (ownerEmail) {
      sendEmail(ownerEmail, `New lead from your website: ${safeName}`, `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto">
          <h2 style="color:#111827">New instant-estimate lead 🎉</h2>
          <p style="color:#374151"><strong>${safeName}</strong> just requested an estimate on your website.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:6px 0;color:#6B7280">Job</td><td style="padding:6px 0;color:#111827">${safeJobDetails}</td></tr>
            ${phone ? `<tr><td style="padding:6px 0;color:#6B7280">Phone</td><td style="padding:6px 0;color:#111827">${safePhone}</td></tr>` : ''}
            ${email ? `<tr><td style="padding:6px 0;color:#6B7280">Email</td><td style="padding:6px 0;color:#111827">${safe(email)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#6B7280">Estimate shown</td><td style="padding:6px 0;color:#111827">${range}</td></tr>
          </table>
          <p style="color:#6B7280;font-size:0.85em">This lead has also been added to your Customers list in Akus.</p>
        </div>
      `).catch(() => {});
    }

    return res.status(200).json({ low: estimate.low, high: estimate.high, reasoning: estimate.reasoning });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Could not generate an estimate' });
  }
}
