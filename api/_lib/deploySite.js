import { buildSitemapXml, buildRobotsTxt } from './sitemap.js';
import { buildBlogIndexHtml, buildBlogPostHtml } from './blogTemplates.js';

// Builds the full Vercel deploy `files` array for a customer site. Always
// re-includes every blog post page — a Vercel deployment fully replaces the
// previous file set rather than patching it, so any deploy that omitted
// these (e.g. a homepage text edit) would silently wipe the customer's
// blog off their live site.
export function buildSiteFiles({ homeHtml, siteUrl, biz, palette, posts = [] }) {
  const sitemapXml = buildSitemapXml(siteUrl, ['/', '/blog', ...posts.map(p => `/blog/${p.slug}`)]);
  const robotsTxt = buildRobotsTxt(siteUrl);
  const vercelJson = JSON.stringify({ cleanUrls: true });
  const blogIndexHtml = buildBlogIndexHtml({ biz, palette, posts, siteUrl });

  return [
    { file: 'index.html', data: Buffer.from(homeHtml).toString('base64'), encoding: 'base64' },
    { file: 'sitemap.xml', data: Buffer.from(sitemapXml).toString('base64'), encoding: 'base64' },
    { file: 'robots.txt', data: Buffer.from(robotsTxt).toString('base64'), encoding: 'base64' },
    { file: 'vercel.json', data: Buffer.from(vercelJson).toString('base64'), encoding: 'base64' },
    { file: 'blog/index.html', data: Buffer.from(blogIndexHtml).toString('base64'), encoding: 'base64' },
    ...posts.map(p => ({
      file: `blog/${p.slug}/index.html`,
      data: Buffer.from(buildBlogPostHtml({ biz, palette, post: p, siteUrl })).toString('base64'),
      encoding: 'base64',
    })),
  ];
}

export async function fetchUserPosts(supabaseUrl, serviceKey, userId) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/blog_posts?user_id=eq.${userId}&select=*&order=published_at.desc`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
  );
  if (!res.ok) throw new Error('Could not load blog posts');
  return res.json();
}
