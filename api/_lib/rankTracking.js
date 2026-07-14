// Thin wrapper over SerpApi's Google Search API — isolated in one file so
// swapping providers later only touches this file plus one env var, per
// the "don't over-engineer" call made when this was planned. Synchronous
// JSON response (unlike some providers' async task-queue model), which
// matters since this runs inside a single daily cron invocation with no
// room for a second poll round-trip.
export async function checkRank({ keyword, suburb, domain }) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY is not configured');

  const q = suburb ? `${keyword} ${suburb}` : keyword;
  const params = new URLSearchParams({
    engine: 'google',
    q,
    location: suburb ? `${suburb}, Australia` : 'Australia',
    google_domain: 'google.com.au',
    gl: 'au',
    hl: 'en',
    num: '30',
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const hostname = (domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const results = data.organic_results || [];
  const match = hostname ? results.find(r => (r.link || '').includes(hostname)) : null;

  return { position: match?.position ?? null };
}

// Deterministic hash on a keyword row's own (never-changing) id, spreading
// all active keywords evenly across the week without needing a separate
// "assigned day" column the way blog_auto_day works for auto-publish.
function hashToDay(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % 7;
}

// Every active keyword whose hash matches today, joined with its owner's
// live domain (keywords for a customer with no live site yet are skipped —
// nothing to check a rank against).
export async function pickDueRankKeywords() {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const today = new Date().getDay();

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/rank_keywords?active=eq.true&select=id,user_id,keyword,suburb`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  if (!res.ok) throw new Error('Could not load tracked keywords');
  const all = await res.json();

  const due = all.filter(k => hashToDay(k.id) === today);
  if (!due.length) return [];

  const userIds = [...new Set(due.map(k => k.user_id))];
  const profilesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?user_id=in.(${userIds.join(',')})&select=user_id,live_url`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const profiles = profilesRes.ok ? await profilesRes.json() : [];
  const domainByUser = new Map(profiles.map(p => [p.user_id, (p.live_url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')]));

  return due.map(k => ({ ...k, domain: domainByUser.get(k.user_id) || null })).filter(k => k.domain);
}

export async function recordRankCheck(keywordId, position) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  await fetch(`${SUPABASE_URL}/rest/v1/rank_history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ keyword_id: keywordId, position }),
  });
}
