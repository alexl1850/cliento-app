import { getPalette } from './palettes.js';
import { buildBlogSectionHtml } from './blogTemplates.js';
import { buildSiteFiles, fetchUserPosts } from './deploySite.js';

// Shared "rebuild every page + redeploy" step used by publish-blog.js (after
// inserting a new post), delete-blog-post.js (after removing one), and any
// future action that changes the set of posts. Re-reads the account's own
// profile + all posts server-side, so callers never need to assemble this
// themselves or risk deploying a stale file set.
export async function regenerateAndDeploy(userId) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=biz_name,owner,suburb,description,site_html,site_slug,site_palette,live_url,site_paused`,
    { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` } }
  );
  if (!profileRes.ok) throw new Error('Could not load your business profile');
  const profile = (await profileRes.json())?.[0];

  if (!profile?.site_slug || !profile?.site_html || profile.site_paused) {
    return { skipped: true, reason: 'no_website' };
  }

  const biz = { name: profile.biz_name, owner: profile.owner, suburb: profile.suburb, description: profile.description };
  const p = getPalette(profile.site_palette);
  const siteUrl = (profile.live_url || '').replace(/\/$/, '');
  const posts = await fetchUserPosts(SUPABASE_URL, SUPABASE_SERVICE_KEY, userId);

  // Patch (or remove, if the last post was just deleted) the homepage's
  // blog teaser section from the trusted DB HTML — never a live HTTP fetch
  // of the customer's own domain.
  let homeHtml = profile.site_html;
  if (homeHtml.includes('<!-- BLOG SECTION')) {
    homeHtml = posts.length
      ? homeHtml.replace(/<!-- BLOG SECTION[\s\S]*?<!-- END BLOG SECTION -->/, buildBlogSectionHtml({ biz, palette: p, posts }))
      : homeHtml.replace(/\n?<!-- BLOG SECTION[\s\S]*?<!-- END BLOG SECTION -->/, '');
  } else if (posts.length) {
    homeHtml = homeHtml.replace('<footer', `${buildBlogSectionHtml({ biz, palette: p, posts })}\n<footer`);
  }

  const files = buildSiteFiles({ homeHtml, siteUrl, biz, palette: p, posts });

  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: `akus-${profile.site_slug}`, files, projectSettings: { framework: null }, target: 'production' }),
  });
  const deployData = await deployRes.json();
  if (deployData.error) throw new Error(deployData.error.message);
  const liveUrl = `https://${deployData.alias?.[0] || deployData.url}`;

  // Persist the patched homepage so the *next* regenerate patches from
  // current state, not a stale/duplicate teaser section.
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ site_html: homeHtml }),
    });
  } catch (saveErr) {
    console.error('Failed to persist patched site_html (non-fatal):', saveErr.message);
  }

  return { skipped: false, liveUrl, posts };
}
