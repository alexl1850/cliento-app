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
