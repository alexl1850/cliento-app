# Cliento Lead-Gen Pipeline

Sources real local businesses, scores their existing website (or flags they
have none), builds a personalized Cliento demo link for each, and drafts a
casual opening message -- then stops. **It does not send anything.** You (or
a rate-limited send step, later) work the output queue by hand.

This exists because mass automated cold-email in Australia is a real Spam
Act 2003 compliance risk (no blanket B2B exemption -- see ACMA), so the
scalable/legal path is: automate the research and personalization, keep the
actual send human-paced via phone or social DM.

## Setup

```
npm install
cp .env.example .env
# GOOGLE_PLACES_API_KEY (Google Cloud Console -> enable "Places API (New)")
# ANTHROPIC_API_KEY
```

## Run

```
npm run leads -- --location="Fremantle, WA, Australia" --categories="plumber,electrician,cafe" --limit=50
```

- `--location` -- anything Google Places will geocode (suburb, city, region)
- `--categories` -- comma-separated business types, searched as "{category} in {location}"
- `--limit` -- how many of the highest-priority leads get a drafted message
  (controls Claude spend; the full scored list is saved regardless)

## Output (`output/`, gitignored)

- `{location}-all-leads.csv` -- every business found, with a free heuristic
  site-quality score (0-100, no LLM cost) and the reasons behind it. Sorted
  worst-site-first, since "no website" or a bad one is the strongest pitch.
- `{location}-outreach-queue.csv` -- the top `--limit` leads, each with a
  live demo link (`cliento.com.au/?demo=1&biz=...&suburb=...&type=...`,
  matching the hand-off `App.jsx` already reads) and a drafted opener ready
  to paste into a DM or read from on a call.

## Cost per run

- Google Places API: free up to the monthly per-SKU threshold (currently
  1,000 free "Enterprise"-tier calls, which is what phone/website fields
  require) -- a pilot batch across a handful of categories costs nothing.
  Beyond the free tier, check current per-field billing tiers before scaling:
  https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- Site scoring: free (no LLM call, plain heuristic).
- Message drafting: `claude-haiku-4-5`, a few hundred tokens per lead --
  a batch of 50 costs well under $1.

## Known limitations (untested end-to-end -- see below)

Built in a sandbox with no outbound access to `places.googleapis.com` or
`api.anthropic.com`, so the Places API request shape is built from Google's
published docs/examples rather than a live call, and the full pipeline
hasn't run against real data yet. Before working a real batch:

1. Run it once against a small `--limit` and sanity-check the CSV output --
   in particular confirm `displayName`/address parsing behaves as expected.
2. Demo links only work once Cliento is actually live and the `?demo=1`
   hand-off is deployed -- don't send any until that's confirmed working.
3. The suburb parser assumes standard Australian address formatting
   (`..., Suburb STATE 1234`) -- spot check a few addresses per run.
4. No dedupe against businesses you've already contacted in a prior run --
   worth tracking contacted `placeId`s somewhere (a Supabase table would fit
   the existing stack) before this scales past a handful of manual runs.
