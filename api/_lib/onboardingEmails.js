import { sendEmail, escapeHtml as safe } from './email.js';

const APP_URL = 'https://app.akus.com.au';
const FROM_NAME = 'Alex at Akus';

function sbUrl() { return process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL; }
function sbKey() { return process.env.SUPABASE_SERVICE_KEY; }

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function wrap(bodyHtml) {
  return `<div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;color:#111827;line-height:1.65;font-size:15px">${bodyHtml}<p style="margin-top:32px;font-size:12px;color:#9CA3AF">Akus · Wollongong, NSW, Australia · <a href="${APP_URL}" style="color:#9CA3AF">Manage your account</a></p></div>`;
}

function btn(href, label) {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;padding:13px 24px;border-radius:8px;background:#2563EB;color:#fff;font-weight:700;text-decoration:none">${label}</a></p>`;
}

// Adapted from email-sequences.md's 7-day trial sequence (Cliento → Akus,
// real links added), plus new day10/14/30 lifecycle steps this project's
// growth plan called for. `requires` gates each step by the customer's
// CURRENT plan at send time (not signup time) — this is what implements
// "stop the trial sequence the moment someone converts" and "only send the
// paying-customer check-ins to people who are actually paying".
export const SEQUENCE = [
  {
    key: 'welcome', day: 0, requires: null,
    subject: (ctx) => `Welcome to Akus, ${ctx.firstName} 👋 (do this one thing first)`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>You just made a smart decision.</p>
      <p>I'm Alex, and I built Akus because I was tired of watching local business owners pay $2,000–$5,000 a month to marketing agencies for things that should take 60 seconds.</p>
      <p>You've got 7 days free. Here's the ONE thing I want you to do today:</p>
      <p><strong>→ Go to your dashboard and build your website</strong></p>
      <p>Fill in your business details, hit generate, and in about 30 seconds you'll have a complete website written in your voice. Most people can't believe it actually sounds like them.</p>
      <p>Once you've done that, reply to this email and tell me what you think. I read every reply.</p>
      ${btn(APP_URL, 'Open my dashboard →')}
      <p>Alex<br>Founder, Akus</p>
      <p style="font-size:13px;color:#6B7280">P.S. — Your trial runs until ${fmtDate(ctx.trialEnds)}. No credit card needed until then.</p>
    `),
  },
  {
    key: 'day2', day: 2, requires: 'trial',
    subject: () => `Sandra got 7 posts in 30 seconds. Here's how.`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>Sandra runs a café in Wollongong. She told me:</p>
      <p style="border-left:3px solid #2563EB;padding-left:14px;font-style:italic;color:#374151">"I spent two hours trying to write one Facebook post and gave up. Akus wrote seven in 30 seconds. I nearly fell off my chair."</p>
      <p>Today's challenge: try the <strong>Social Posts</strong> tool.</p>
      <p>Tell it what you've got on this week — a special, a new product, or just "regular business week" — and it'll write 7 Facebook and Instagram posts ready to copy and paste.</p>
      <p>Takes about 45 seconds.</p>
      ${btn(APP_URL, 'Write my social posts →')}
      <p>Alex</p>
    `),
  },
  {
    key: 'day3', day: 3, requires: 'trial',
    subject: () => `The tool that gets the most results (most people miss this one)`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>Out of everything in Akus, the Google Review tools drive the most visible results for local businesses.</p>
      <p>Here's why: businesses with 4.5+ stars on Google get 3× more enquiries than those with 4.0. Most businesses sit around 4.0–4.2 because they never ask for reviews.</p>
      <p>Today, try <strong>"Ask for a Review"</strong> — it'll write you an SMS and email you can send to your happy customers right now.</p>
      <p>One business owner told me he sent the SMS to 12 customers on a Thursday. By Monday he had 6 new reviews and his rating went from 4.1 to 4.6.</p>
      ${btn(APP_URL, 'Get my review tools →')}
      <p>Alex</p>
    `),
  },
  {
    key: 'day5', day: 5, requires: 'trial',
    subject: () => `Your marketing health score — here's what it means`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>In your dashboard, there's a tab called <strong>💚 Health Score</strong>.</p>
      <p>It scores your marketing out of 100 based on what you've done in Akus. Right now, if you haven't done much, it's probably sitting low.</p>
      <p>That's not a problem — it's just your starting point.</p>
      <p>Open the Health Score tab today. Most people read it over their Monday morning coffee.</p>
      ${btn(APP_URL, 'See my health score →')}
      <p>Alex</p>
    `),
  },
  {
    key: 'day6', day: 6, requires: 'trial',
    subject: (ctx) => `Tomorrow your trial ends — have you tried everything?`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>Your 7-day free trial ends tomorrow.</p>
      <p>Before it does, I want to make sure you've seen everything:</p>
      <ul style="padding-left:20px">
        <li>My Website — your complete website, written for you</li>
        <li>Social Posts — 7 posts ready to copy and paste</li>
        <li>Google Reviews — ask for reviews, reply to them</li>
        <li>Blog Post for Google — ranks you on search</li>
        <li>🚀 Grow tab — win-back campaigns and tools</li>
        <li>👥 Customers — your CRM with one-tap personal messages</li>
        <li>🔗 Network — free link building with other local members</li>
      </ul>
      <p>If there's anything you haven't tried, today's the day.</p>
      ${btn(APP_URL, 'Open my dashboard →')}
      <p>Alex</p>
      <p style="font-size:13px;color:#6B7280">P.S. — Reply to this email if you have any questions. I answer personally.</p>
    `),
  },
  {
    key: 'day7', day: 7, requires: 'trial',
    subject: (ctx) => `Your Akus trial ends today, ${ctx.firstName}`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>Your 7-day free trial ends today.</p>
      <p>To keep using Akus — and keep everything you've built — it's <strong>$50/month</strong> (or <strong>$500/year</strong>, which saves you $100). No contract, no lock-in, cancel any time.</p>
      <p>To put that in perspective: the cheapest social media manager I know charges $800/month. Just for posts. Akus does posts, your website, emails, ads, Google reviews, seasonal campaigns, your customer list, weekly health scores, and local SEO — for $50.</p>
      <p>If Akus has helped you, even a little, I'd love to keep helping you.</p>
      ${btn(APP_URL, 'Continue with Akus →')}
      <p>If it hasn't been useful, I genuinely want to know why. Hit reply and tell me — I'll try to fix it.</p>
      <p>Alex</p>
    `),
  },
  {
    key: 'day10', day: 10, requires: 'nonpro',
    subject: () => `Still thinking about it? Here's what you'd be missing`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>Your Akus trial ended a few days ago and I noticed you haven't activated yet.</p>
      <p>No hard sell — I just want to make sure it wasn't something we did wrong.</p>
      <p>The most common reason people don't continue is they didn't get a chance to properly try it during the trial. If that's you: <strong>reply to this email with the word EXTEND</strong> and I'll give you another 7 days free. No catch, no credit card.</p>
      <p>Alex</p>
      <p style="font-size:13px;color:#6B7280">P.S. — If Akus isn't right for you, that's okay too. I'd just love to know why so I can make it better for the next person.</p>
    `),
  },
  {
    key: 'day14', day: 14, requires: 'pro',
    subject: () => `How's it going?`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>You've been with Akus two weeks now — just wanted to check in properly, not with an automated "here are some tips" email.</p>
      <p>How's it actually going? Genuinely — hit reply and tell me. If something's confusing, missing, or just not working the way you expected, I want to know.</p>
      <p>And if it's going well, I'd love to hear that too.</p>
      <p>Alex</p>
    `),
  },
  {
    key: 'day30', day: 30, requires: 'pro',
    subject: () => `One month in — quick favour?`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>You've been with Akus a full month now. Hope it's been worth it.</p>
      <p>If it has, would you mind leaving a quick Google review for your own business using the tools in your <strong>Reviews</strong> tab — and if you know another local business owner drowning in the same $2,000/month agency bill you used to pay, send them this way. I'd genuinely appreciate it.</p>
      ${btn(APP_URL, 'Open my dashboard →')}
      <p>Alex</p>
    `),
  },
];

// Keyed off last_active_at (pinged from the dashboard on load) rather than
// created_at — these two are independent of the day-N SEQUENCE above and
// only ever apply to paying customers who've gone quiet, not trial users.
const REENGAGEMENT = [
  {
    key: 'reengage14', afterDays: 14,
    subject: () => `We noticed you haven't logged in`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>It's been a couple of weeks since you were last in Akus — just checking in.</p>
      <p>If something's not working, or you're stuck on a tool, reply and tell me. If you're just busy running ${ctx.bizName}, no worries at all — everything's still there whenever you're ready.</p>
      ${btn(APP_URL, 'Open my dashboard →')}
      <p>Alex</p>
    `),
  },
  {
    key: 'reengage30', afterDays: 30,
    subject: () => `Still here if you need anything`,
    html: (ctx) => wrap(`
      <p>Hi ${ctx.firstName},</p>
      <p>It's been about a month since you last opened Akus. I'd genuinely rather know now if something's not working than have you quietly cancel later.</p>
      <p>Reply and let me know what's going on — even just "too busy right now" is useful for me to hear.</p>
      <p>Alex</p>
    `),
  },
];

export function dueReengagementFor(profile) {
  if (profile.plan !== 'pro' || !profile.last_active_at) return [];
  const daysSinceActive = Math.floor((Date.now() - new Date(profile.last_active_at).getTime()) / 86400000);
  const alreadySent = Array.isArray(profile.onboarding_emails_sent) ? profile.onboarding_emails_sent : [];
  return REENGAGEMENT.filter(step => daysSinceActive >= step.afterDays && !alreadySent.includes(step.key));
}

export async function sendReengagementEmail(step, profile) {
  const email = await fetchAccountEmail(profile.user_id, profile.email);
  if (!email) return { sent: false, reason: 'no-email' };
  const ctx = {
    firstName: (profile.owner || profile.biz_name || 'there').split(' ')[0],
    bizName: profile.biz_name || 'your business',
  };
  return sendEmail(email, step.subject(ctx), step.html(ctx));
}

async function fetchAccountEmail(userId, profileEmail) {
  if (profileEmail) return profileEmail;
  try {
    const res = await fetch(`${sbUrl()}/auth/v1/admin/users/${userId}`, {
      headers: { apikey: sbKey(), Authorization: `Bearer ${sbKey()}` },
    });
    if (!res.ok) return null;
    return (await res.json())?.email || null;
  } catch {
    return null;
  }
}

function planBucket(plan) {
  if (plan === 'pro') return 'pro';
  return 'trial'; // trial | cancelled | past_due all read as "not yet converted"
}

function isDue(step, daysSinceSignup, plan, alreadySent) {
  if (alreadySent.includes(step.key)) return false;
  if (daysSinceSignup < step.day) return false;
  if (step.requires === 'pro') return plan === 'pro';
  if (step.requires === 'trial') return planBucket(plan) === 'trial';
  if (step.requires === 'nonpro') return plan !== 'pro';
  return true; // requires === null
}

// One profile → at most one email per cron run isn't required (idempotency
// means it's safe to send several if the cron was down for days), but in
// normal daily operation this returns 0 or 1 due step per profile.
export function dueStepsFor(profile) {
  const daysSinceSignup = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / 86400000);
  const alreadySent = Array.isArray(profile.onboarding_emails_sent) ? profile.onboarding_emails_sent : [];
  return SEQUENCE.filter(step => isDue(step, daysSinceSignup, profile.plan, alreadySent));
}

export async function sendLifecycleEmail(step, profile) {
  const email = await fetchAccountEmail(profile.user_id, profile.email);
  if (!email) return { sent: false, reason: 'no-email' };

  const ctx = {
    firstName: (profile.owner || profile.biz_name || 'there').split(' ')[0],
    bizName: profile.biz_name || 'your business',
    trialEnds: profile.trial_ends || new Date(),
  };

  const result = await sendEmail(email, step.subject(ctx), step.html(ctx));
  return result;
}

export async function markEmailSent(userId, key, currentSent) {
  const next = Array.isArray(currentSent) ? [...new Set([...currentSent, key])] : [key];
  await fetch(`${sbUrl()}/rest/v1/profiles?user_id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      apikey: sbKey(),
      Authorization: `Bearer ${sbKey()}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ onboarding_emails_sent: next }),
  });
}

// Every profile that could plausibly have a step due today — the cheap
// prefilter before per-profile date math. select=* here isn't wasteful:
// there are no wide/rare columns on profiles the batch doesn't need (plan,
// created_at, trial_ends, last_active_at, owner, biz_name, email,
// onboarding_emails_sent are all read for the day-picker, the
// re-engagement picker, or the email content itself).
export async function fetchCandidateProfiles() {
  const res = await fetch(
    `${sbUrl()}/rest/v1/profiles?select=user_id,owner,biz_name,email,plan,created_at,trial_ends,last_active_at,onboarding_emails_sent`,
    { headers: { apikey: sbKey(), Authorization: `Bearer ${sbKey()}` } }
  );
  if (!res.ok) throw new Error('Could not load profiles for lifecycle email batch');
  return res.json();
}
