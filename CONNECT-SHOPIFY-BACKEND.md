# Connect My Shopify Store — Backend Wiring Notes

## What's built (frontend, working today)

The full UI flow is live in the app, on the Products tab:
1. "Do you already have a Shopify store?" fork
2. **No store** → "Help me start a Shopify store" button opens your Shopify
   affiliate/referral link in a new tab (Shopify's free trial signup)
3. **Has a store** → enter their store URL, see a plain-English 3-step
   explanation of what connecting involves, then a simulated "Connecting..."
   progress bar and a "Connected!" confirmation screen

**The actual OAuth connection and product sync is simulated for now** — same
approach as the Publish My Website flow. This ships the full UX today without
blocking on Shopify's app review process.

---

## STEP 1 — Add your Shopify affiliate link

In `src/Dashboard.jsx`, find:

```js
const SHOPIFY_AFFILIATE_URL = "https://www.shopify.com/free-trial";
```

Replace with your tracked referral link once approved. Sign up at:
**partners.shopify.com → Affiliate Program**

Shopify's affiliate program typically pays a commission for each merchant who
signs up and stays subscribed past their trial — a clean second revenue
stream alongside the domain affiliate flow, paid for people who don't yet
have a store.

---

## STEP 2 — Build the real Shopify OAuth connection

This requires registering Cliento as a Shopify app via the **Shopify Partner
Dashboard** (free to create). Two paths:

### Option A — Custom app (fastest, no review queue)
Each Cliento customer installs a privately-distributed app via a direct link
you generate per-customer. No Shopify App Store review needed. Good for
getting this live fast with your first batch of Shopify customers.

### Option B — Public app (more work, more reach)
Lists on the Shopify App Store, available to anyone. Requires Shopify's
formal app review (can take 1-3+ weeks) but gives organic discovery.

**Recommendation: start with Option A.** You can always submit for public
listing later once the integration is proven with real customers.

### The OAuth flow (Option A):
1. Register your app in the Partner Dashboard, get a Client ID + Client Secret
2. Customer clicks "Connect My Store" → redirected to:
   `https://{shop}.myshopify.com/admin/oauth/authorize?client_id={id}&scope=read_products,write_products&redirect_uri={your_callback}`
3. Shopify redirects back to your callback URL with an authorization code
4. Your backend exchanges that code for a permanent access token:
   `POST https://{shop}.myshopify.com/admin/oauth/access_token`
5. Store the access token in Supabase, linked to the user's account
6. Use the token to call the Shopify Admin API:
   `GET https://{shop}.myshopify.com/admin/api/2025-01/products.json`

### Database table needed:

```sql
CREATE TABLE shopify_connections (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  shop_domain   TEXT NOT NULL,          -- e.g. lunacandles.myshopify.com
  access_token  TEXT NOT NULL,          -- encrypt at rest if possible
  scopes        TEXT,
  connected_at  TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ
);

ALTER TABLE shopify_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own connection" ON shopify_connections FOR SELECT USING (auth.uid()=user_id);
CREATE POLICY "Users insert own connection" ON shopify_connections FOR INSERT WITH CHECK (auth.uid()=user_id);
```

**Never store the access token or call the OAuth exchange from frontend
code** — this needs a serverless function (Vercel Function or Supabase Edge
Function) since it involves your Client Secret.

---

## STEP 3 — Once connected: what becomes possible

- Auto-populate the Product Description tool's dropdown with their real
  product list (no retyping names)
- Pull real order/revenue numbers directly into the Shopify Report tool
  instead of manual entry
- Push generated descriptions straight back to Shopify via
  `PUT /admin/api/2025-01/products/{id}.json`
- Detect abandoned carts via the Shopify Checkouts API and auto-trigger
  the Abandoned Cart Sequence tool

---

## Why this matters for retention

Once a customer's product catalogue lives inside Cliento (synced, not
retyped), switching to a competitor means losing that convenience —
a meaningful, organic reason to stay subscribed beyond the content tools
alone, same logic as the published-website lock-in.
