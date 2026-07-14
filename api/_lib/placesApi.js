// Shared Google Places API (New) wrapper — extracted from the proven
// pattern in admin-source-leads.js (POST places:searchText with
// X-Goog-Api-Key/X-Goog-FieldMask headers) so review-pulling and
// competitor lookup share one request shape/error handling instead of
// three copy-pasted fetches.
const PLACES_BASE = 'https://places.googleapis.com/v1';

function apiKey() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error('GOOGLE_PLACES_API_KEY is not configured');
  return key;
}

// Finds the single best-match Place for a business — used to resolve and
// cache profiles.gbp_place_id once, rather than re-searching by name on
// every review pull.
export async function searchPlace({ bizName, suburb }) {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.websiteUri',
    },
    body: JSON.stringify({ textQuery: `${bizName} ${suburb}`, maxResultCount: 1 }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Places API search failed');
  return data.places?.[0] || null;
}

// Finds up to `limit` OTHER businesses in a category+suburb, excluding the
// caller's own place_id — used for competitor comparison. rating/
// userRatingCount come straight back from searchText, no separate Details
// call needed per competitor.
export async function searchCompetitors({ category, suburb, excludePlaceId, limit = 3 }) {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.websiteUri',
    },
    body: JSON.stringify({ textQuery: `${category} in ${suburb}`, maxResultCount: Math.min(limit + 1, 20) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Places API search failed');
  return (data.places || []).filter(p => p.id !== excludePlaceId).slice(0, limit);
}

// Fetches richer fields for one known Place — used for pulling real
// reviews (fieldMask should include 'rating,userRatingCount,reviews').
export async function getPlaceDetails(placeId, fieldMask) {
  const res = await fetch(`${PLACES_BASE}/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey(),
      'X-Goog-FieldMask': fieldMask,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Places API details lookup failed');
  return data;
}
