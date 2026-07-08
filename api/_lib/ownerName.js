import { fetchWithTimeout } from './httpFetch.js';

// Best-effort only — most small-business sites never state the owner's name
// anywhere machine-readable. This tries a few common signals before giving
// up; callers must treat null as the normal, expected outcome, not an error.
const NAME_RE = /[A-Z][a-z]{1,15}/;

function extractFromHtml(html) {
  if (!html) return null;

  // Schema.org structured data is the most reliable signal when present —
  // e.g. {"@type":"Person","name":"Sarah Mitchell", ...} for a founder/owner.
  const ldJsonMatch = html.match(/"@type"\s*:\s*"Person"[^}]*"name"\s*:\s*"([^"]+)"/i)
    || html.match(/"name"\s*:\s*"([^"]+)"[^}]*"@type"\s*:\s*"Person"/i);
  if (ldJsonMatch) {
    const firstName = ldJsonMatch[1].trim().split(/\s+/)[0];
    if (NAME_RE.test(firstName)) return firstName;
  }

  // Plain-text proximity heuristic: "Owner: Sarah", "Founded by Sarah",
  // "Meet Sarah", "run by Sarah Mitchell", etc.
  const proximityMatch = html.match(/(?:owner|founder|director|proprietor|founded by|run by|managed by|meet)\s*[:\-]?\s*([A-Z][a-z]{1,15})\b/i);
  if (proximityMatch && NAME_RE.test(proximityMatch[1])) return proximityMatch[1];

  return null;
}

export async function findOwnerFirstName(websiteUrl) {
  const homepage = await fetchWithTimeout(websiteUrl, 6000);
  const fromHome = extractFromHtml(homepage);
  if (fromHome) return fromHome;

  try {
    const base = new URL(websiteUrl);
    for (const path of ['/about', '/about-us', '/our-story']) {
      const aboutHtml = await fetchWithTimeout(`${base.origin}${path}`, 5000);
      const found = extractFromHtml(aboutHtml);
      if (found) return found;
    }
  } catch {
    // invalid URL — nothing more to try
  }
  return null;
}
