export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { instruction, currentUrl, currentHtml, biz } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    if (!instruction) return res.status(400).json({ error: 'No instruction provided' });
    if (!currentHtml || currentHtml.length < 200) {
      return res.status(400).json({ error: 'No website HTML found. Please rebuild your website first using the My Website tool, then try editing again.' });
    }

    // ── Apply the instruction to the current HTML ─────────────────────────────
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
You receive a business website's HTML and a specific instruction for what to change.
Make ONLY the requested changes — preserve all other content, CSS, JavaScript, and structure exactly.
Return ONLY the complete updated HTML — no explanation, no markdown, no code fences.
Australian spelling throughout.`,
        messages: [{
          role: 'user',
          content: `Business: ${biz?.name || 'Local Business'} in ${biz?.suburb || 'Australia'}

INSTRUCTION: ${instruction}

CURRENT WEBSITE HTML:
${currentHtml.slice(0, 60000)}

Apply the instruction to this website and return the complete updated HTML.`
        }]
      })
    });

    const editData = await editRes.json();
    if (editData.error) throw new Error(editData.error.message || 'AI error');

    let updatedHtml = editData.content[0].text.trim()
      .replace(/^```html\n?/, '').replace(/\n?```$/, '').trim();

    if (!updatedHtml.includes('<html') && !updatedHtml.includes('<!DOCTYPE')) {
      throw new Error('Please try again with a more specific instruction — e.g. "Change the headline to..." or "Add a section about..."');
    }

    // ── Deploy the updated HTML ───────────────────────────────────────────────
    const slug = (biz?.name || 'my-business')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `akus-${slug}`,
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
      html: updatedHtml, // return updated HTML so client can cache it
      instruction,
    });

  } catch (err) {
    console.error('Edit website error:', err);
    return res.status(500).json({ error: err.message });
  }
}
