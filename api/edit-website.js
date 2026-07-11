import { requireActiveAccount } from './_lib/checkAccess.js';
import { getPalette } from './_lib/palettes.js';
import { buildSiteFiles, fetchUserPosts } from './_lib/deploySite.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

  try {
    const { instruction, currentUrl, currentHtml, biz } = req.body;

    if (!instruction) return res.status(400).json({ error: 'No instruction provided' });
    if (!currentHtml || currentHtml.length < 200) {
      return res.status(400).json({ error: 'No website HTML found. Please rebuild your website first using the My Website tool, then try editing again.' });
    }

    // Site identity (slug/palette/live URL) is resolved server-side from the
    // account's own profile row — never trusted from the client — so an
    // edit always deploys to the right project with the right theme.
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}&select=site_slug,site_palette,live_url`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!profileRes.ok) throw new Error('Could not load your business profile');
    const profile = (await profileRes.json())?.[0];
    if (!profile?.site_slug) {
      return res.status(400).json({ error: 'No website found. Please build your website first using the My Website tool.' });
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

    // ── Deploy the updated HTML — re-including sitemap/robots/vercel.json
    // and every existing blog page, since a deployment here only re-uploads
    // whatever's in `files`; without re-including them they'd silently
    // disappear from the live site on every edit. ─────────────────────────
    const siteUrl = (profile.live_url || currentUrl || '').replace(/\/$/, '');
    const posts = await fetchUserPosts(SUPABASE_URL, SUPABASE_SERVICE_KEY, access.userId);
    const files = buildSiteFiles({
      homeHtml: updatedHtml,
      siteUrl,
      biz: { name: biz?.name, suburb: biz?.suburb, description: biz?.description },
      palette: getPalette(profile.site_palette),
      posts,
    });

    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `akus-${profile.site_slug}`,
        files,
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);
    const liveUrl = `https://${deployData.alias?.[0] || deployData.url}`;

    // ── Persist the edited HTML so it becomes the new source of truth —
    // without this, the next blog publish would silently revert this edit,
    // since blog-publish patches from profiles.site_html. ─────────────────
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${access.userId}`, {
        method: 'PATCH',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({ site_html: updatedHtml, live_url: liveUrl }),
      });
    } catch (saveErr) {
      console.error('Failed to persist edited site_html (non-fatal):', saveErr.message);
    }

    return res.status(200).json({
      success: true,
      url: liveUrl,
      html: updatedHtml, // return updated HTML so client can cache it
      instruction,
    });

  } catch (err) {
    console.error('Edit website error:', err);
    return res.status(500).json({ error: err.message });
  }
}
