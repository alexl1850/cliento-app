-- ═══════════════════════════════════════════════════
-- CLIENTO DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════

-- 1. Business Profiles
-- Stores each user's business setup details
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  owner        TEXT,
  biz_name     TEXT,
  biz_type     TEXT DEFAULT 'local',  -- local | shopify
  industry     TEXT,
  suburb       TEXT,
  description  TEXT,
  goal         TEXT,
  website      TEXT DEFAULT '',
  trial_ends   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  plan         TEXT DEFAULT 'trial',   -- trial | pro | cancelled
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customers (CRM)
-- Each user's customer list
CREATE TABLE IF NOT EXISTS customers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  phone        TEXT DEFAULT '',
  email        TEXT DEFAULT '',
  tag          TEXT DEFAULT 'new',   -- regular | vip | new | lapsed | lead
  last_visit   DATE,
  notes        TEXT DEFAULT '',
  job_history  TEXT DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Generated content (saved results)
-- Stores content each user has generated and saved
CREATE TABLE IF NOT EXISTS saved_content (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tool_id      TEXT NOT NULL,         -- e.g. 'website', 'posts', 'blog'
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────
-- Users can only see and edit their own data

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_content ENABLE ROW LEVEL SECURITY;

-- Profiles: each user can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Customers: each user can only access their own customers
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE USING (auth.uid() = user_id);

-- Saved content: each user can only access their own content
CREATE POLICY "Users can view own content"
  ON saved_content FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content"
  ON saved_content FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content"
  ON saved_content FOR DELETE USING (auth.uid() = user_id);

-- ─── USEFUL VIEWS ─────────────────────────────────────────────────

-- View: trial status (handy for admin dashboard later)
CREATE OR REPLACE VIEW trial_status AS
SELECT
  p.user_id,
  p.biz_name,
  p.owner,
  p.plan,
  p.trial_ends,
  p.trial_ends > NOW() AS is_trial_active,
  EXTRACT(DAY FROM (p.trial_ends - NOW())) AS days_remaining,
  p.created_at AS joined_at
FROM profiles p;

-- ─── ADMIN PANEL ──────────────────────────────────────────────────
-- No RLS policies here on purpose: this table is only ever read/written
-- via the admin API endpoints using the service-role key, never from the
-- browser client, so there is no auth.uid() to check against.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id  UUID NOT NULL,
  admin_email    TEXT NOT NULL,
  target_user_id UUID NOT NULL,
  target_email   TEXT,
  action         TEXT NOT NULL,   -- e.g. 'impersonate'
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies added: with RLS enabled and zero policies,
-- PostgREST denies all access through the anon/authenticated roles, so this
-- table is reachable only via the service-role key (which bypasses RLS).

-- ─── LOCAL SEO / CITATION BUILDER ─────────────────────────────────
-- Tracks which business directories the customer has told us they've
-- submitted their listing to (self-reported checklist, not verified) —
-- read/written directly from the dashboard under the existing
-- "Users can update own profile" RLS policy, no new policy needed.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS citations_done JSONB DEFAULT '[]'::jsonb;

-- Cached result of the last Google PageSpeed check (see api/check-pagespeed.js)
-- so the Health Score panel can show it without re-hitting Google's API on
-- every page view — checks are user-triggered, not automatic.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pagespeed_score INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pagespeed_checked_at TIMESTAMPTZ;

-- ─── IP RATE LIMITING ───────────────────────────────────────────────
-- Backs api/_lib/rateLimit.js — protects public, unauthenticated
-- endpoints (the homepage demo generator, the instant-estimate widget)
-- from being scripted/abused, since each hit costs a real Anthropic
-- API call. Service-role only, no RLS policies needed (never touched
-- from the browser).
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT PRIMARY KEY,   -- e.g. "demo:203.0.113.5"
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  count        INTEGER NOT NULL DEFAULT 0
);

-- Atomic check-and-increment — the whole reset-if-expired / increment-if-
-- active logic happens in one upsert so concurrent requests from the same
-- IP can't race past each other and both slip through under the cap.
CREATE OR REPLACE FUNCTION increment_rate_limit(p_key TEXT, p_window_seconds INT, p_max INT)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INT;
BEGIN
  INSERT INTO rate_limits (key, window_start, count)
  VALUES (p_key, NOW(), 1)
  ON CONFLICT (key) DO UPDATE SET
    count = CASE WHEN rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL
                 THEN 1 ELSE rate_limits.count + 1 END,
    window_start = CASE WHEN rate_limits.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL
                 THEN NOW() ELSE rate_limits.window_start END
  RETURNING count INTO v_count;
  RETURN v_count <= p_max;
END;
$$ LANGUAGE plpgsql;

-- ─── OUTREACH / LEAD GENERATION ───────────────────────────────────
-- Backs the admin-only Outreach tab (api/admin-source-leads.js,
-- admin-generate-outreach.js, admin-list-leads.js, admin-export-leads.js).
-- Sourced prospect businesses move through sourced -> drafted -> approved/
-- rejected -> exported. Nothing is ever sent automatically. At low volume
-- every draft waited for a human approve/reject click; at real send volume
-- (thousands/month) that doesn't scale, so only a random sample of drafts
-- (review_sample = true) still require a manual click — the rest are
-- auto-approved, trading full manual review for a spot-check on quality/
-- compliance drift. Service-role only, no RLS policies needed (never
-- touched from the browser — only from admin-gated API endpoints).
CREATE TABLE IF NOT EXISTS leads (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name     TEXT NOT NULL,
  suburb            TEXT NOT NULL,
  category          TEXT,
  website_url       TEXT,
  discovered_email  TEXT,
  phone             TEXT,
  owner_first_name  TEXT,
  competitor_type   TEXT,
  pagespeed_score   INTEGER,
  demo_id           TEXT,
  demo_url          TEXT,
  draft_subject     TEXT,
  draft_body        TEXT,
  sequence          JSONB,   -- full 6-step rendered email sequence, see api/_lib/outreachSequence.js
  status            TEXT DEFAULT 'sourced', -- sourced | drafted | approved | rejected | exported | phone_lead
  review_sample     BOOLEAN DEFAULT false,   -- true = randomly picked for manual review before approval
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS review_sample BOOLEAN DEFAULT false;
-- phone_lead: businesses with no website (so no legitimate way to find a
-- publicly-published email) but a real phone number from Google Places —
-- phone calls aren't covered by the Spam Act at all, so these are kept as a
-- separate call list instead of being discarded.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone TEXT;
-- Best-effort owner first name (scraped from the lead's own site) and a
-- derived "other <category>s" phrase — merge-tag inputs for the fixed
-- 6-email sequence in api/_lib/outreachSequence.js, which replaced
-- per-lead AI-drafted copy with a single reviewed-once template.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_first_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS competitor_type TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sequence JSONB;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies added: same reasoning as admin_audit_log/
-- rate_limits above — RLS enabled with zero policies denies anon/
-- authenticated access entirely, reachable only via the service-role key.

-- ─── DEMO SITE GENERATOR ───────────────────────────────────────────
-- Backs api/demo.js (public homepage demo), api/demo-view.js (serves the
-- generated page by demo_id), and api/admin-generate-outreach.js (which
-- generates the same kind of demo site for sourced outreach leads).
-- Service-role only, no RLS policies needed (never touched from the
-- browser — demo_id is an unguessable server-generated token, not a
-- browser-facing auth boundary).
CREATE TABLE IF NOT EXISTS demo_sites (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_id      TEXT NOT NULL UNIQUE,
  biz_name     TEXT,
  suburb       TEXT,
  biz_type     TEXT,
  html         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);

ALTER TABLE demo_sites ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies added: same reasoning as leads/admin_audit_log
-- above — RLS enabled with zero policies denies anon/authenticated access
-- entirely, reachable only via the service-role key.

-- Leads captured from the public demo form when a visitor leaves contact
-- details alongside their generated demo (see api/demo.js) — distinct from
-- the outreach `leads` table above, which is sourced by admins rather than
-- self-submitted by visitors.
CREATE TABLE IF NOT EXISTS demo_leads (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demo_id      TEXT,
  biz_name     TEXT,
  suburb       TEXT,
  biz_type     TEXT,
  owner_name   TEXT,
  phone        TEXT,
  email        TEXT,
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE demo_leads ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies added: same reasoning as demo_sites above.

-- ─── CUSTOMER WEBSITE PERSISTENCE ──────────────────────────────────
-- Backs api/build-website.js, api/edit-website.js, api/publish-blog.js and
-- api/paddle-webhook.js. site_html is the exact live homepage HTML string,
-- persisted so a lapsed-subscription "renew" splash page (paddle-webhook.js)
-- can restore the real site, and so blog-publish can patch from a trusted
-- DB value instead of an unreliable live HTTP fetch of the customer's own
-- domain. These columns were previously added directly in Supabase without
-- ever being tracked here — added now so this file stays authoritative.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS site_html TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS site_slug TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS live_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS site_paused BOOLEAN DEFAULT false;
-- Which colour palette (see api/_lib/palettes.js) the customer's site was
-- built with — persisted so blog post pages can reuse the exact same theme
-- server-side instead of trusting a client-supplied palette on every publish.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS site_palette TEXT DEFAULT 'slate';

-- ─── BLOG POSTS ─────────────────────────────────────────────────────
-- Backs api/publish-blog.js, api/list-blog-posts.js, api/delete-blog-post.js.
-- Source of truth for a customer's blog posts, so a single publish/delete
-- can regenerate every past post's page in one deploy (a Vercel deployment
-- fully replaces the previous file set — there's no incremental add).
CREATE TABLE IF NOT EXISTS blog_posts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug         TEXT NOT NULL,
  title        TEXT NOT NULL,
  meta_title   TEXT,
  meta_desc    TEXT,
  content      TEXT NOT NULL,
  excerpt      TEXT,
  palette      TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blog posts"
  ON blog_posts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own blog posts"
  ON blog_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own blog posts"
  ON blog_posts FOR DELETE USING (auth.uid() = user_id);

-- Distinguishes cron-generated posts (api/_lib/blogAutoPublish.js) from a
-- customer's own manual publish, and records which rotated keyword a
-- scheduled post targeted (for a future link to rank_keywords below).
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS scheduled BOOLEAN DEFAULT false;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT true;
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS source_keyword TEXT;

-- ─── TECHNICAL SEO / REAL REVIEWS ───────────────────────────────────
-- Backs api/pull-reviews.js, api/find-competitors.js, api/build-website.js.
-- gbp_place_id is cached after the first Places searchText match so later
-- pulls hit the Place Details endpoint directly instead of re-searching by
-- name every time. reviews_data holds real Google reviews/rating — the
-- prerequisite for ever emitting Review/AggregateRating JSON-LD, since the
-- site's testimonials were previously entirely AI-fabricated and must never
-- be the thing structured data is generated from.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gbp_place_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviews_data JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reviews_synced_at TIMESTAMPTZ;

-- Suburbs a business serves beyond their home suburb (profiles.suburb) —
-- drives per-suburb location page generation in api/build-website.js.
-- Empty by default so existing customers see no behaviour change until
-- they explicitly opt in.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS areas_served JSONB DEFAULT '[]'::jsonb;

-- ─── LOCATION PAGES ─────────────────────────────────────────────────
-- One row per suburb in profiles.areas_served. Content is stored as JSON
-- (not full HTML) since the page is rebuilt from the shared template on
-- every deploy, the same pattern blog_posts already uses.
CREATE TABLE IF NOT EXISTS location_pages (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  suburb       TEXT NOT NULL,
  slug         TEXT NOT NULL,
  content      JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

ALTER TABLE location_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own location pages"
  ON location_pages FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location pages"
  ON location_pages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own location pages"
  ON location_pages FOR DELETE USING (auth.uid() = user_id);

-- ─── SCHEDULED BLOG AUTO-PUBLISH ────────────────────────────────────
-- Backs api/cron-daily.js + api/_lib/blogAutoPublish.js. blog_auto_day is
-- assigned once at opt-in time (a value 0-6) so the single Hobby-plan daily
-- cron can spread customers across the week instead of every opted-in
-- customer firing on the same day. blog_topic_queue is a persisted rotation
-- of AI-suggested topics — replaces the previous ephemeral one-shot keyword
-- flow (Journey.jsx's findKeywords) with something the cron can consume
-- over time without repeating.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_auto_enabled BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_auto_frequency TEXT DEFAULT 'weekly';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_auto_day SMALLINT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_last_auto_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS blog_topic_queue JSONB DEFAULT '[]'::jsonb;

-- ─── RANK TRACKING ──────────────────────────────────────────────────
-- Backs api/track-keyword.js, api/list-tracked-keywords.js,
-- api/untrack-keyword.js, api/cron-daily.js. rank_history is a separate
-- time-series table (not a JSONB array on rank_keywords) so the daily
-- cron's inserts never race a concurrent read/write of the same row.
CREATE TABLE IF NOT EXISTS rank_keywords (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword      TEXT NOT NULL,
  suburb       TEXT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, keyword, suburb)
);

ALTER TABLE rank_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracked keywords"
  ON rank_keywords FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracked keywords"
  ON rank_keywords FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracked keywords"
  ON rank_keywords FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracked keywords"
  ON rank_keywords FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS rank_history (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id   UUID REFERENCES rank_keywords(id) ON DELETE CASCADE NOT NULL,
  position     INTEGER,
  checked_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rank_history ENABLE ROW LEVEL SECURITY;

-- Only a SELECT policy — rows are written exclusively by api/cron-daily.js
-- via the service-role key, which bypasses RLS entirely, so no INSERT
-- policy is needed (same reasoning as leads/admin_audit_log elsewhere in
-- this file).
CREATE POLICY "Users can view own rank history"
  ON rank_history FOR SELECT USING (
    EXISTS (SELECT 1 FROM rank_keywords k WHERE k.id = rank_history.keyword_id AND k.user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_rank_history_keyword_time ON rank_history(keyword_id, checked_at DESC);

-- ─── COMPETITOR COMPARISON ──────────────────────────────────────────
-- Backs api/find-competitors.js, api/list-competitors.js. A cache, not a
-- live-fetched-every-page-load table — fetched_at drives a cooldown so a
-- customer can't rack up Places API spend by refreshing repeatedly.
CREATE TABLE IF NOT EXISTS competitors (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  place_id           TEXT NOT NULL,
  business_name      TEXT,
  rating             NUMERIC,
  user_rating_count  INTEGER,
  website_url        TEXT,
  fetched_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, place_id)
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitors"
  ON competitors FOR SELECT USING (auth.uid() = user_id);
