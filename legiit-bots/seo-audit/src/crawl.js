import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (compatible; ClientoAuditBot/1.0; +https://cliento.com.au)';

async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal });
    return { ok: res.ok, status: res.status, body: res.ok ? await res.text() : null };
  } catch (err) {
    return { ok: false, status: null, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

export async function crawlSite(targetUrl) {
  const url = new URL(targetUrl);
  const page = await fetchText(url.toString());
  if (!page.ok) {
    return { url: url.toString(), fetchError: page.error || `HTTP ${page.status}` };
  }

  const $ = cheerio.load(page.body);
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const images = $('img');
  const imagesMissingAlt = images.filter((_, el) => !$(el).attr('alt')?.trim()).length;

  const links = $('a[href]');
  let internalLinks = 0;
  let externalLinks = 0;
  links.each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const linkUrl = new URL(href, url);
      if (linkUrl.hostname === url.hostname) internalLinks++;
      else externalLinks++;
    } catch {
      // ignore malformed hrefs
    }
  });

  const jsonLdBlocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).html())
    .get();

  const [robotsTxt, sitemapXml] = await Promise.all([
    fetchText(new URL('/robots.txt', url).toString()),
    fetchText(new URL('/sitemap.xml', url).toString()),
  ]);

  return {
    url: url.toString(),
    isHttps: url.protocol === 'https:',
    title: $('title').first().text().trim() || null,
    titleLength: $('title').first().text().trim().length,
    metaDescription: $('meta[name="description"]').attr('content')?.trim() || null,
    metaDescriptionLength: ($('meta[name="description"]').attr('content') || '').trim().length,
    canonical: $('link[rel="canonical"]').attr('href') || null,
    viewportMeta: $('meta[name="viewport"]').attr('content') || null,
    robotsMeta: $('meta[name="robots"]').attr('content') || null,
    h1: $('h1').map((_, el) => $(el).text().trim()).get(),
    h2Count: $('h2').length,
    wordCount: bodyText.split(' ').filter(Boolean).length,
    imageCount: images.length,
    imagesMissingAlt,
    internalLinks,
    externalLinks,
    hasSchemaMarkup: jsonLdBlocks.length > 0,
    schemaTypes: jsonLdBlocks
      .map((block) => {
        try {
          const parsed = JSON.parse(block);
          return parsed['@type'] || null;
        } catch {
          return null;
        }
      })
      .filter(Boolean),
    hasRobotsTxt: robotsTxt.ok,
    hasSitemapXml: sitemapXml.ok,
    pageSizeBytes: Buffer.byteLength(page.body, 'utf8'),
  };
}
