export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { instruction, currentUrl, biz } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    if (!instruction) return res.status(400).json({ error: 'No instruction provided' });
    if (!currentUrl) return res.status(400).json({ error: 'No current website URL provided' });

    // ── 1. Fetch the current website HTML ────────────────────────────────────
    let currentHtml = "";
    try {
      const fetchRes = await fetch(currentUrl);
      currentHtml = await fetchRes.text();
    } catch (e) {
      return res.status(400).json({ error: `Could not fetch current website at ${currentUrl}` });
    }

    if (!currentHtml || currentHtml.length < 100) {
      return res.status(400).json({ error: 'Could not read the current website content' });
    }

    // ── 2. Apply the changes via Claude ──────────────────────────────────────
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
You make ONLY the requested changes — do not rewrite or restructure anything else.
Preserve all existing CSS, JavaScript, layout, and content that wasn't mentioned in the instruction.
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

    let updatedHtml = editData.content[0].text.trim();

    // Strip any markdown fences if Claude wrapped it
    updatedHtml = updatedHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    if (!updatedHtml.includes('<!DOCTYPE') && !updatedHtml.includes('<html')) {
      throw new Error('AI returned invalid HTML — please try again with a clearer instruction');
    }

    // ── 3. Deploy updated HTML to Vercel ─────────────────────────────────────
    const slug = (biz?.name || 'my-business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `cliento-${slug}`,
        files: [{
          file: 'index.html',
          data: Buffer.from(updatedHtml).toString('base64'),
          encoding: 'base64',
        }],
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);

    const liveUrl = `https://${deployData.alias?.[0] || deployData.url}`;

    return res.status(200).json({
      success: true,
      url: liveUrl,
      deployId: deployData.id,
      instruction,
    });

  } catch (err) {
    console.error('Edit website error:', err);
    return res.status(500).json({ error: err.message });
  }
}
