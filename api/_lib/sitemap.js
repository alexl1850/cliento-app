// Shared sitemap.xml/robots.txt builders — extracted from near-duplicate
// inline versions in build-website.js and edit-website.js. `paths` accepts
// either a plain route string (e.g. '/', '/blog') or an
// {path, priority, changefreq, images} object for finer control (used by
// blog publishing, which adds one <url> per post, and the homepage entry,
// which can list its gallery/hero photos via the image sitemap extension
// so Google can index them without a separate images.xml).
export function buildSitemapXml(siteUrl, paths) {
  const today = new Date().toISOString().slice(0, 10);
  const usesImages = paths.some(p => typeof p === 'object' && p.images?.length);
  const urls = paths.map((p) => {
    const path = typeof p === 'string' ? p : p.path;
    const priority = (typeof p === 'object' && p.priority != null ? p.priority : (path === '/' ? 1.0 : 0.7)).toFixed(1);
    const changefreq = (typeof p === 'object' && p.changefreq) || 'weekly';
    const images = (typeof p === 'object' && p.images) || [];
    const imageTags = images.map(img => `
    <image:image>
      <image:loc>${img}</image:loc>
    </image:image>`).join('');
    return `  <url>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageTags}
  </url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${usesImages ? ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : ''}>
${urls}
</urlset>`;
}

export function buildRobotsTxt(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}
