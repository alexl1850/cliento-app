import { requireActiveAccount } from './_lib/checkAccess.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

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
        system: `Today's date is ${new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}. If any new content references a year, use the current one — never an earlier one.

You are a website editor for Australian local businesses.
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

    // sitemap.xml/robots.txt live as separate files from a build-website.js
    // deploy — a deployment here only re-uploads whatever's in `files`, so
    // without re-including them they'd silently disappear on the next edit.
    const siteUrl = (currentUrl || '').replace(/\/$/, '');
    const sitemapXml = siteUrl ? `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${siteUrl}/</loc>
    <lastmod>${new Date().toISOString().slice(0,10)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>` : null;
    const robotsTxt = siteUrl ? `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n` : null;

    const deployFiles = [{ file: 'index.html', data: Buffer.from(updatedHtml).toString('base64'), encoding: 'base64' }];
    if (sitemapXml) deployFiles.push({ file: 'sitemap.xml', data: Buffer.from(sitemapXml).toString('base64'), encoding: 'base64' });
    if (robotsTxt) deployFiles.push({ file: 'robots.txt', data: Buffer.from(robotsTxt).toString('base64'), encoding: 'base64' });

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `akus-${slug}`,
        files: deployFiles,
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
