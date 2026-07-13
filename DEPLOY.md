# Cliento — Deployment Guide
## Get live on cliento.com.au in under 2 hours

---

## STEP 1 — Set up Supabase (10 minutes)

1. Go to **supabase.com** → Sign up (free)
2. Click **New Project** → Name it "cliento" → Set a database password → Create
3. Wait ~2 minutes for the project to start
4. Go to **SQL Editor** (left sidebar)
5. Paste the entire contents of `supabase-schema.sql` → Click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Publishable anon key** (long string starting with `eyJ...`)

---

## STEP 2 — Set up GitHub (5 minutes)

1. Go to **github.com** → Sign up / sign in
2. Click **New repository** → Name it `cliento` → Private → Create
3. On your computer, open Terminal and run:

```bash
cd /path/to/cliento-folder
git init
git add .
git commit -m "Initial Cliento build"
git remote add origin https://github.com/YOUR_USERNAME/cliento.git
git push -u origin main
```

---

## STEP 3 — Deploy to Vercel (10 minutes)

1. Go to **vercel.com** → Sign up with GitHub
2. Click **Add New Project** → Import your `cliento` repo
3. Framework Preset: **Vite**
4. Click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase publishable key
   - `VITE_ANTHROPIC_KEY` = your Anthropic API key (from console.anthropic.com)
5. Click **Deploy** → Wait ~2 minutes → Your app is live!

---

## STEP 4 — Connect your domain (10 minutes)

1. In Vercel, go to your project → **Settings → Domains**
2. Add `cliento.com.au` and `www.cliento.com.au`
3. Vercel will show you DNS records to add
4. Log in to your domain registrar (where you bought cliento.com.au)
5. Add the DNS records Vercel shows you (usually 2 records)
6. Wait 5–60 minutes for DNS to propagate

---

## STEP 5 — Update Supabase auth settings (5 minutes)

1. In Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to `https://cliento.com.au`
3. Add to **Redirect URLs**:
   - `https://cliento.com.au`
   - `https://www.cliento.com.au`
   - `https://cliento.com.au/reset`
4. Save

---

## STEP 6 — Set up Paddle (30 minutes)

1. Go to **paddle.com** → Sign up
2. Complete business verification (needs your ABN and cliento.com.au URL)
3. Create product: "Cliento Pro" → $50 AUD/month recurring
4. Get your **Price ID** (looks like `pri_01abc...`)
5. Get an **API key** (Developer Tools → Authentication) and your webhook's
   **Notification ID** (Developer Tools → Notifications)
6. Add to Vercel env vars — no `VITE_` prefix on any of these, they're only
   ever read server-side (`api/paddle-checkout.js`, `api/paddle-webhook.js`):
   `PADDLE_API_KEY`, `PADDLE_PRICE_ID`, `PADDLE_NOTIFICATION_ID`

---

## STEP 7 — Set up email sequences (30 minutes)

1. Go to **resend.com** → Sign up (free — 3,000 emails/month)
2. Verify `cliento.com.au` domain
3. Get API key → Add to Vercel: `VITE_RESEND_KEY`
4. The 7-day onboarding sequence is pre-written in `email-sequences.md`
   → Copy each into Resend's broadcast or use their API

---

## WHAT USERS EXPERIENCE

### New user flow:
1. Visit cliento.com.au → clicks "Start Free Trial"
2. Auth screen → enters name, email, password → account created
3. Email verification sent by Supabase automatically
4. User clicks verify link → redirected to app
5. 3-step setup wizard → business details saved to Supabase
6. Dashboard loads with all 7 tabs

### Returning user flow:
1. Visit cliento.com.au
2. Auth screen → email + password → instant dashboard load
3. All their content, customers, and business profile is there

### Password reset:
1. Clicks "Forgot password" → enters email
2. Supabase sends reset email automatically
3. Clicks link → enters new password → back in

---

## DATABASE STRUCTURE

Each user gets their own isolated data thanks to Row Level Security:

| Table | What it stores |
|---|---|
| `profiles` | Business name, industry, suburb, plan status, trial end date |
| `customers` | Their customer list — names, phones, tags, notes |
| `saved_content` | Every piece of content they've saved |

Users can ONLY see their own data. Even if someone guessed another user's ID, they'd get nothing.

---

## MANAGING USERS (your admin view)

In Supabase Dashboard:
- **Authentication → Users** — see all signups, confirm emails manually if needed
- **Table Editor → profiles** — see all business profiles and plan status
- **SQL Editor** → run `SELECT * FROM trial_status` to see who's in trial and how many days left

---

## COSTS AT SCALE

| Users | Monthly cost |
|---|---|
| 0–500 | $0 (Supabase free tier, Vercel free) |
| 500–1,000 | ~$25/month (Supabase Pro) |
| 1,000–5,000 | ~$50/month |
| Revenue at 1,000 users | $50,000/month |

---

## NEXT STEPS AFTER LAUNCH

1. ✅ Set up the 7-day email sequence in Resend
2. ✅ Add Paddle checkout (wire up the "Start Trial" button to Paddle)
3. ✅ Add webhook: when Paddle payment succeeds → update `profiles.plan = 'pro'`
4. ✅ Add trial expiry check: if `trial_ends < NOW()` and `plan = 'trial'` → show upgrade prompt
5. ✅ Set up the cancellation flow
