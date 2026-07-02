export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { instruction, currentUrl, currentHtml: passedHtml, biz } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    if (!instruction) return res.status(400).json({ error: 'No instruction provided' });

    let currentHtml = passedHtml || "";

    // ── 1. Get current HTML ───────────────────────────────────────────────────
    // Strategy 1: use passed HTML if provided (from localStorage cache)
    // Strategy 2: fetch with auth header (works for Vercel deployments)
    // Strategy 3: try public fetch with different headers
    if (!currentHtml && currentUrl) {
      // Try fetching with Vercel auth token — works for deployment URLs
      const attempts = [
        // Try with bearer token
        () => fetch(currentUrl, {
          headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
        }),
        // Try plain fetch (works if deployment is actually public)
        () => fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ClientoBot/1.0)',
            'Accept': 'text/html',
          }
        }),
        // Try www prefix
        () => currentUrl.includes('://') && !currentUrl.includes('www.')
          ? fetch(currentUrl.replace('://', '://www.'))
          : null,
      ];

      for (const attempt of attempts) {
        if (!attempt) continue;
        try {
          const r = await attempt();
          if (r && r.ok) {
            const html = await r.text();
            if (html && html.length > 200 && html.includes('<html')) {
              currentHtml = html;
              break;
            }
          }
        } catch(e) { /* try next */ }
      }
    }

    // ── 2. If we still don't have HTML, rebuild from biz data ─────────────────
    // This is the reliable fallback — we know the business details, so we can
    // regenerate the full website with the instruction applied
    if (!currentHtml || currentHtml.length < 200) {
      // Generate updated website from scratch with the instruction incorporated
      const editRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: `You are a website builder for Australian local businesses. Build a complete, professional website and apply the requested change. Return ONLY the complete HTML — no explanation, no markdown, no code fences. Australian spelling.`,
          messages: [{
            role: 'user',
            content: `Rebuild this business website and apply this specific change:

Business: ${biz?.name || 'Local Business'} in ${biz?.suburb || 'Australia'}
Description: ${biz?.description || ''}
Phone: ${biz?.phone || ''}
Email: ${biz?.email || ''}

SPECIFIC CHANGE TO APPLY: ${instruction}

Build a complete, professional website for this business incorporating that change. Include: navigation, hero section, services, about, contact. Make it look premium. Return only the HTML.`
          }]
        })
      });

      const editData = await editRes.json();
      if (editData.error) throw new Error(editData.error.message);
      let updatedHtml = editData.content[0].text.trim().replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

      const slug = (biz?.name || 'my-business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
      const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `cliento-${slug}`,
          files: [{ file: 'index.html', data: Buffer.from(updatedHtml).toString('base64'), encoding: 'base64' }],
          projectSettings: { framework: null },
          target: 'production',
        })
      });
      const deployData = await deployRes.json();
      if (deployData.error) throw new Error(deployData.error.message);
      return res.status(200).json({
        success: true,
        url: `https://${deployData.alias?.[0] || deployData.url}`,
        deployId: deployData.id,
        instruction,
        html: updatedHtml,
      });
    }

    // ── 3. Apply the edit to existing HTML ────────────────────────────────────
    const editRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8000,
        system: `You are a website editor for Australian local businesses.
You receive an existing website's HTML and an instruction describing what to change.
Make ONLY the requested changes — preserve everything else exactly.
Return ONLY the complete updated HTML — no explanation, no markdown, no code fences.
Australian spelling throughout.`,
        messages: [{
          role: 'user',
          content: `Business: ${biz?.name || 'Local Business'} in ${biz?.suburb || 'Australia'}

INSTRUCTION: ${instruction}

CURRENT WEBSITE HTML:
${currentHtml.slice(0, 60000)}

Apply the instruction and return the complete updated HTML.`
        }]
      })
    });

    const editData = await editRes.json();
    if (editData.error) throw new Error(editData.error.message);

    let updatedHtml = editData.content[0].text.trim().replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    if (!updatedHtml.includes('<!DOCTYPE') && !updatedHtml.includes('<html')) {
      throw new Error('Please try again with a more specific instruction');
    }

    // ── 4. Deploy ─────────────────────────────────────────────────────────────
    const slug = (biz?.name || 'my-business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `cliento-${slug}`,
        files: [{ file: 'index.html', data: Buffer.from(updatedHtml).toString('base64'), encoding: 'base64' }],
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);

    return res.status(200).json({
      success: true,
      url: `https://${deployData.alias?.[0] || deployData.url}`,
      deployId: deployData.id,
      instruction,
      html: updatedHtml, // return HTML so client can cache it
    });

  } catch (err) {
    console.error('Edit website error:', err);
    return res.status(500).json({ error: err.message });
  }
}
