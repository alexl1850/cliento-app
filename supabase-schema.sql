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
