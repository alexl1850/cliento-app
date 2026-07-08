import { checkRateLimit } from './_lib/rateLimit.js';
import { generateSiteHtml, safe } from './_lib/generateSite.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.akus.com.au');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // No login on this endpoint (it's the public homepage demo) — every hit
  // costs a real Anthropic call, so cap it per IP rather than leaving it
  // wide open to scripted abuse.
  const rateLimit = await checkRateLimit(req, 'demo', 5, 3600);
  if (!rateLimit.ok) return res.status(rateLimit.status).json({ error: rateLimit.error });

  try {
    let { biz, suburb, bizType, ownerName, phone, email, description } = req.body;
    if (!biz || !suburb) return res.status(400).json({ error: 'Business name and suburb required' });

    // Sanitize every visitor-supplied field before it touches the AI prompt
    // or the generated HTML — this endpoint is public and unauthenticated,
    // and the generated page is served from the same origin as the real
    // logged-in dashboard, so unescaped input here is a stored XSS risk.
    biz = safe(biz);
    suburb = safe(suburb);
    ownerName = safe(ownerName);
    phone = safe(phone);
    email = safe(email);
    description = safe(description);
    bizType = safe(bizType);

    const { html, themeName } = await generateSiteHtml({ biz, suburb, bizType, ownerName, phone, email, description });

    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

    // ── Generate unique ID ─────────────────────────────────────────────────
    const demoId = `demo_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

    // ── Save to Supabase (non-blocking) ────────────────────────────────────
    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
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
            biz_type: bizType||themeName,
            html,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
          })
        });

        if (email || phone) {
          await fetch(`${SUPABASE_URL}/rest/v1/demo_leads`, {
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
              biz_type: bizType||themeName,
              owner_name: ownerName||'',
              phone: phone||'',
              email: email||'',
              description: description||'',
              created_at: new Date().toISOString(),
            })
          });
        }
      }
    } catch(dbErr) {
      console.error('Supabase save error (non-fatal):', dbErr.message);
      // Continue — return the demo URL even if DB save fails
    }

    // Return the demo URL — served by demo-view.js
    const demoUrl = `https://app.akus.com.au/api/demo-view?id=${demoId}`;
    return res.status(200).json({ success: true, url: demoUrl, demoId });

  } catch(err) {
    console.error('Demo error:', err);
    return res.status(500).json({ error: err.message });
  }
}
