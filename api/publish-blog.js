import { requireActiveAccount } from './_lib/checkAccess.js';
import { excerptOf } from './_lib/blogTemplates.js';
import { regenerateAndDeploy } from './_lib/regenerateAndDeploy.js';

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

  try {
    const { post } = req.body;
    if (!post?.title || !post?.content) {
      return res.status(400).json({ error: 'Post title and content are required' });
    }

    // ── 1. Resolve a unique slug — suffix on collision with an existing post
    const baseSlug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'post';
    const existingRes = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?user_id=eq.${access.userId}&select=slug`,
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
    );
    if (!existingRes.ok) throw new Error('Could not check for existing posts');
    const existingSlugs = new Set((await existingRes.json()).map(r => r.slug));
    let slug = baseSlug, n = 2;
    while (existingSlugs.has(slug)) { slug = `${baseSlug}-${n}`; n++; }

    // ── 2. Insert the new post — saved regardless of whether a site exists
    // yet, so it's ready to go live the moment one is built. ────────────────
    const excerpt = excerptOf(post.content);
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        user_id: access.userId,
        slug,
        title: post.title,
        meta_title: post.meta_title || null,
        meta_desc: post.meta_desc || null,
        content: post.content,
        excerpt,
      }),
    });
    if (!insertRes.ok) throw new Error('Could not save the new post');

    // ── 3. Rebuild every page + redeploy in one shot ─────────────────────
    const result = await regenerateAndDeploy(access.userId);

    if (result.skipped) {
      return res.status(200).json({
        success: false,
        skippedReason: result.reason,
        error: 'Your post has been saved — build your website first using the My Website tool, then it will go live automatically on your next publish.',
        post: { title: post.title, slug, excerpt },
      });
    }

    return res.status(200).json({
      success: true,
      postUrl: `${result.liveUrl}/blog/${slug}`,
      liveUrl: result.liveUrl,
      homepageUpdated: true,
      post: {
        title: post.title,
        slug,
        url: `${result.liveUrl}/blog/${slug}`,
        date: new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
        excerpt,
      },
    });

  } catch (err) {
    console.error('Publish blog error:', err);
    return res.status(500).json({ error: err.message });
  }
}
