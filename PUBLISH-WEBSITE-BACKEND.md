# Publish My Website — Backend Wiring Notes

## What's built (frontend, working today)

The full UI flow is live in the app:
1. Domain check — "Do you already have a domain?"
2. No domain → 5 AI-generated domain suggestions, each with a "Buy this" button
   that opens your affiliate link in a new tab with the domain pre-filled
3. Has domain → plain-English DNS connection walkthrough (A record + CNAME)
4. Skip → instant free `yourbusiness.cliento.site` subdomain
5. A simulated "Publishing..." progress bar, then a "Your website is live!" screen

**Right now the actual publish/deploy step is simulated** (a fake progress bar) —
this was intentional, so you can ship the full UX today and wire up real hosting
without blocking on it. Here's exactly what to build to make it real.

---

## STEP 1 — Add your domain affiliate link

In `src/Dashboard.jsx`, find this line near the top of the `PublishWebsite` component:

```js
const DOMAIN_AFFILIATE_BASE_URL = "https://www.namecheap.com/domains/registration/results/?domain=";
```

Replace with your actual affiliate tracking URL once you're approved for a
registrar's affiliate program. Common options:

- **Namecheap Affiliate Program** — affiliates.namecheap.com
- **Crazy Domains Affiliate Program** — has an Australian-focused option
- **VentraIP Reseller/Affiliate** — good for the .com.au market specifically

Most programs give you a tracking parameter to append, e.g.:
```
https://www.namecheap.com/domains/registration/results/?domain=sandyscafe.com.au&affiliate=YOUR_ID
```

---

## STEP 2 — Build the real website generator + deploy pipeline

This needs a small backend (a Vercel Serverless Function or Supabase Edge
Function) since it requires your Vercel API token, which must never be exposed
in frontend code.

### What it needs to do:
1. Receive the user's website content (already generated and saved in `results.website`)
2. Drop that content into an HTML template (a clean, mobile-friendly single-page site)
3. Call the Vercel API to create a new deployment for that content
4. If the user has a custom domain, attach it via Vercel's Domains API
5. Return the live URL back to the frontend

### Vercel APIs you'll use:
- `POST https://api.vercel.com/v13/deployments` — create a deployment from files
- `POST https://api.vercel.com/v10/projects/{projectId}/domains` — attach a custom domain
- Auth: `Authorization: Bearer YOUR_VERCEL_API_TOKEN` (generate at vercel.com/account/tokens)

### Example serverless function shape (pseudocode):

```js
// /api/publish-website.js  (Vercel serverless function)
export default async function handler(req, res) {
  const { businessSlug, websiteContent, customDomain } = req.body;

  // 1. Build the HTML from a template
  const html = buildWebsiteHTML(websiteContent);

  // 2. Deploy to Vercel
  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: businessSlug,
      files: [{ file: 'index.html', data: html }],
      target: 'production',
    }),
  });
  const deployment = await deployRes.json();

  // 3. Attach custom domain if provided
  if (customDomain) {
    await fetch(`https://api.vercel.com/v10/projects/${deployment.projectId}/domains`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: customDomain }),
    });
  }

  // 4. Save the deployment record to Supabase (which site belongs to which user)
  await supabase.from('published_sites').upsert({
    user_id: req.userId,
    domain: customDomain || `${businessSlug}.cliento.site`,
    deployment_id: deployment.id,
    published_at: new Date().toISOString(),
  });

  res.json({ liveUrl: customDomain || `${businessSlug}.cliento.site` });
}
```

### Database table needed:

```sql
CREATE TABLE published_sites (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain        TEXT NOT NULL,
  deployment_id TEXT,
  content_hash  TEXT,  -- to detect when content changed and needs republishing
  published_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE published_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own sites" ON published_sites FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Users insert own sites" ON published_sites FOR INSERT WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users update own sites" ON published_sites FOR UPDATE USING (auth.uid()=user_id);
```

---

## STEP 3 — Wire the frontend to call the real API

In `PublishWebsite`, replace the `startDeploy` function's simulated progress
bar with a real fetch call to your new `/api/publish-website` endpoint, and
update progress based on actual response (or just show indeterminate progress
since a real deploy typically takes 5-15 seconds).

---

## Why this design

- Hosting via Vercel (not a VPS) means every published customer site is just
  another deployment on infrastructure you already use for the main app —
  no second system to maintain.
- Free `.cliento.site` subdomains mean every customer gets a live URL
  immediately, even before they buy a real domain — removing friction and
  giving Cliento implicit advertising on every customer's free URL.
- A customer's live website depends on staying subscribed — meaningfully
  increases retention beyond the content tools alone.
- The domain affiliate flow is a clean secondary revenue stream that costs
  nothing to run and helps the customer at the same time.
