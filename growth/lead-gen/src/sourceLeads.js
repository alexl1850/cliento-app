const SEARCH_ENDPOINT = 'https://places.googleapis.com/v1/places:searchText';

// Fields chosen for lead-qualification purposes. Phone/website fields push
// requests into Google's higher-cost "Enterprise" SKU tier -- check current
// per-field billing tiers before scaling volume, they change over time:
// https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.websiteUri',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.googleMapsUri',
].join(',');

async function searchOne(textQuery, apiKey) {
  const res = await fetch(SEARCH_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Places API error ${res.status} for "${textQuery}": ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.places || [];
}

const AU_STATE_ABBR = /^(.*),\s*([A-Za-z ]+?)\s+(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)\s+\d{4}/i;

function parseSuburb(address) {
  if (!address) return null;
  const match = address.match(AU_STATE_ABBR);
  return match ? match[2].trim() : null;
}

function normalize(place, category) {
  const address = place.formattedAddress || null;
  return {
    placeId: place.id,
    name: place.displayName?.text || place.displayName || 'Unknown',
    address,
    suburb: parseSuburb(address),
    phone: place.nationalPhoneNumber || null,
    website: place.websiteUri || null,
    rating: place.rating ?? null,
    reviewCount: place.userRatingCount ?? null,
    types: place.types || [],
    mapsUrl: place.googleMapsUri || null,
    sourceCategory: category,
  };
}

// One Text Search page returns up to 20 results per query. For a pilot batch
// this is plenty -- add pageToken-based pagination later if you need more
// than ~20 per category/location combo.
export async function sourceLeads({ location, categories, apiKey = process.env.GOOGLE_PLACES_API_KEY }) {
  if (!apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set');

  const seen = new Map();
  for (const category of categories) {
    const places = await searchOne(`${category} in ${location}`, apiKey);
    for (const place of places) {
      if (!place.id || seen.has(place.id)) continue;
      seen.set(place.id, normalize(place, category));
    }
  }
  return [...seen.values()];
}
