// Shared timeout-bounded fetch for scraping third-party sites (email
// discovery, owner-name discovery) — used anywhere the outreach tool fetches
// a prospect's own website, since those requests must never hang the
// serverless function waiting on a slow/unresponsive external server.
export async function fetchWithTimeout(url, ms) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AkusOutreachBot/1.0)' } });
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
