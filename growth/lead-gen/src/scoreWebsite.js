import * as cheerio from 'cheerio';

const UA = 'Mozilla/5.0 (compatible; ClientoLeadBot/1.0; +https://cliento.com.au)';

async function fetchHtml(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: controller.signal, redirect: 'follow' });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true, body: await res.text() };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// Deterministic 0-100 heuristic -- no LLM call, safe to run against every
// lead. Used purely to prioritize outreach, not as a client deliverable
// (that's what the seo-audit bot is for).
export async function scoreWebsite(url) {
  if (!url) {
    return { score: 0, hasWebsite: false, reasons: ['No website listed on Google Business Profile'] };
  }

  const page = await fetchHtml(url);
  if (!page.ok) {
    return { score: 5, hasWebsite: true, reachable: false, reasons: [`Website listed but unreachable (${page.error})`] };
  }

  const $ = cheerio.load(page.body);
  const reasons = [];
  let score = 100;

  const isHttps = url.startsWith('https://');
  if (!isHttps) { score -= 20; reasons.push('Not using HTTPS'); }

  const hasViewport = Boolean($('meta[name="viewport"]').attr('content'));
  if (!hasViewport) { score -= 20; reasons.push('No mobile viewport tag -- likely not mobile-friendly'); }

  const title = $('title').first().text().trim();
  if (!title) { score -= 15; reasons.push('Missing page title'); }

  const metaDesc = $('meta[name="description"]').attr('content')?.trim();
  if (!metaDesc) { score -= 15; reasons.push('Missing meta description'); }

  const wordCount = $('body').text().replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  if (wordCount < 100) { score -= 15; reasons.push('Very thin content (under 100 words)'); }

  const lastModified = page.body.match(/copyright|©\s*20\d{2}/i);
  if (lastModified) {
    const yearMatch = page.body.match(/20\d{2}/);
    const year = yearMatch ? parseInt(yearMatch[0], 10) : null;
    if (year && year < new Date().getFullYear() - 3) {
      score -= 10;
      reasons.push(`Copyright year suggests the site hasn't been updated since ${year}`);
    }
  }

  score = Math.max(0, score);
  if (reasons.length === 0) reasons.push('No major issues detected by heuristic scan');

  return { score, hasWebsite: true, reachable: true, reasons };
}
