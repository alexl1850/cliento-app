import { requireAdmin } from './_lib/checkAccess.js';
import { mapWithConcurrency } from './_lib/concurrency.js';

// Domains that show up constantly as false-positive "contact emails" scraped
// off small-business sites — tracking pixels, website-builder boilerplate,
// placeholder addresses in templates — never real business contacts.
const JUNK_EMAIL_DOMAINS = [
  'sentry.io', 'wixpress.com', 'godaddy.com', 'schema.org', 'w3.org',
  'example.com', 'yourdomain.com', 'domain.com', 'squarespace.com',
  'wordpress.com', 'sentry-next.wixpress.com',
];

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

function extractEmail(html) {
  if (!html) return null;
  // Prefer a mailto: link — the clearest signal of a deliberately published
  // contact address, as opposed to an email that just happens to appear in
  // page text (e.g. inside a testimonial or a linked article).
  const mailtoMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  const candidates = mailtoMatch ? [mailtoMatch[1]] : (html.match(EMAIL_RE) || []);
  for (const raw of candidates) {
    const email = raw.toLowerCase().replace(/[.,;]+$/, '');
    const domain = email.split('@')[1] || '';
    if (JUNK_EMAIL_DOMAINS.some(j => domain.endsWith(j))) continue;
    if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(email)) continue; // image filenames that look like emails
    return email;
  }
  return null;
}

async function fetchWithTimeout(url, ms) {
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

async function findPublishedEmail(websiteUrl) {
  const homepage = await fetchWithTimeout(websiteUrl, 6000);
  let email = extractEmail(homepage);
  if (email) return email;

  // Try a couple of common contact-page paths before giving up — many small
  // business sites only publish the email on a dedicated contact page.
  try {
    const base = new URL(websiteUrl);
    for (const path of ['/contact', '/contact-us']) {
      const contactHtml = await fetchWithTimeout(`${base.origin}${path}`, 5000);
      email = extractEmail(contactHtml);
      if (email) return email;
    }
  } catch {
    // invalid URL — nothing more to try
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const { category, suburbs } = req.body || {};
  if (!category || !Array.isArray(suburbs) || suburbs.length === 0) {
    return res.status(400).json({ error: 'category and a non-empty suburbs array are required' });
  }
  // Keep each request bounded — this fetches a live third-party website per
  // result, so a large fan-out risks the serverless function timing out even
  // with the concurrency-capped fetching below. Reaching genuinely high
  // sourcing volume means calling this endpoint many times, not raising
  // this cap indefinitely.
  const boundedSuburbs = suburbs.slice(0, 8);
  const CONCURRENCY = 5;

  const PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!PLACES_API_KEY) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY is not configured' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  let sourced = 0, phoneLeadsSourced = 0, skippedNoWebsite = 0, skippedNoEmail = 0, skippedDuplicate = 0;
  const newLeads = [];

  try {
    for (const suburb of boundedSuburbs) {
      const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.websiteUri,places.nationalPhoneNumber,places.id',
        },
        body: JSON.stringify({ textQuery: `${category} in ${suburb}`, maxResultCount: 15 }),
      });
      const placesData = await placesRes.json();
      if (!placesRes.ok) {
        console.error('Places API error:', placesData.error?.message || placesData);
        continue;
      }

      const outcomes = await mapWithConcurrency(placesData.places || [], CONCURRENCY, async (place) => {
        const websiteUrl = place.websiteUri;
        const phone = place.nationalPhoneNumber || null;
        const businessName = place.displayName?.text || 'Unknown business';

        // Skip if we've already sourced this exact business+suburb before
        // (either as an email lead or a phone lead), so re-running a search
        // doesn't spam duplicate rows.
        const existingRes = await fetch(
          `${SUPABASE_URL}/rest/v1/leads?business_name=eq.${encodeURIComponent(businessName)}&suburb=eq.${encodeURIComponent(suburb)}&select=id`,
          { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
        );
        const existing = existingRes.ok ? await existingRes.json() : [];
        if (existing.length > 0) return { skip: 'duplicate' };

        if (!websiteUrl) {
          // No website means no legitimate way to find a publicly-published
          // email — but their phone number is still fair game to call (phone
          // calls aren't covered by the Spam Act at all), so keep them as a
          // separate call-list lead instead of just discarding them.
          if (!phone) return { skip: 'noWebsite' };
          const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify({
              business_name: businessName,
              suburb,
              category,
              phone,
              status: 'phone_lead',
            }),
          });
          if (!insertRes.ok) return { skip: 'insertFailed' };
          const [row] = await insertRes.json();
          return { row, phoneLead: true };
        }

        const discoveredEmail = await findPublishedEmail(websiteUrl);
        if (!discoveredEmail) return { skip: 'noEmail' };

        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            business_name: businessName,
            suburb,
            category,
            website_url: websiteUrl,
            discovered_email: discoveredEmail,
            phone,
            status: 'sourced',
          }),
        });
        if (!insertRes.ok) return { skip: 'insertFailed' };
        const [row] = await insertRes.json();
        return { row };
      });

      for (const o of outcomes) {
        if (o.row && o.phoneLead) { newLeads.push(o.row); phoneLeadsSourced++; }
        else if (o.row) { newLeads.push(o.row); sourced++; }
        else if (o.skip === 'noWebsite') skippedNoWebsite++;
        else if (o.skip === 'duplicate') skippedDuplicate++;
        else if (o.skip === 'noEmail') skippedNoEmail++;
      }
    }

    return res.status(200).json({ sourced, phoneLeadsSourced, skippedNoWebsite, skippedNoEmail, skippedDuplicate, leads: newLeads });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Lead sourcing failed' });
  }
}
