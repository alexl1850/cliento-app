// Fixed, human-written 6-email cold outreach sequence — NOT AI-generated per
// lead. Only the merge values (business name, suburb, demo link, competitor
// type, owner first name if found) change between leads; the copy itself is
// the same reviewed-once text for everyone, which is why the per-lead
// "review sample" concept shifted from "does this AI copy read well" to
// "does this lead's merge data look sane" (see admin-generate-outreach.js).
//
// Every step's greeting is normalized to a single computed line instead of
// literally substituting {{FirstName}} in place, since "Hi there," reads
// fine but a bare "there," on its own line (the original template's style
// for steps 2-6) does not — this keeps every step grammatical whether or
// not a first name was found.
//
// Every step ends with the same compliant footer (Spam Act 2003 requires
// sender identification + a working opt-out on every commercial email, not
// just the first one in a sequence).
const FOOTER = `—
Akus Voice (ABN 90 632 856 615) · Shellharbour, NSW
Reply "stop" any time and I'll leave you alone — no hard feelings (well, maybe a few).`;

// Naive English pluralizer — good enough for the trade/business category
// words this app already uses (plumber, electrician, cafe, bakery, hair
// salon, ...). Not linguistically complete, just needs to not sound broken
// for "other {{CompetitorType}}" in Email 3.
export function pluralize(word) {
  const w = (word || 'business').trim();
  if (/[^aeiou]y$/i.test(w)) return w.slice(0, -1) + 'ies';
  if (/(s|x|z|ch|sh)$/i.test(w)) return w + 'es';
  return w + 's';
}

export function renderSequence({ businessName, suburb, category, demoUrl, ownerFirstName }) {
  const biz = businessName;
  const competitorType = `other ${pluralize(category)}`;
  const greeting = ownerFirstName ? `Hi ${ownerFirstName},` : 'Hi there,';

  const steps = [
    {
      step: 1,
      delayDays: 0,
      subject: `I built ${biz} a website (it's already live)`,
      body: `${greeting}

This is going to sound weird, so I'll just say it:

I built you a website. It's done. It's live on the internet right now.

👉 ${demoUrl}

Nobody asked me to. There's no invoice attached. I built it because I could see ${biz} doing good work in ${suburb} without the online presence to match — and I figured showing you beats telling you.

Go click the link. Takes 30 seconds. If you hate it, delete this email and we never speak again.

If you like it, reply "keep it" and it's yours — 7-day free trial, no credit card required, then $50/month. Not $50/month plus setup. Not $50/month locked in for 12 months. Fifty bucks, cancel whenever.

The website is just the front door, by the way. Behind it is a dashboard where you do everything an agency does — social posts, emails, blog content, Google reviews, ads — in about 5 minutes a day. And because it's all built for local SEO, businesses start climbing the Google rankings in ${suburb} fast, not "give it 6–12 months" agency-speak fast.

One thing to be clear on: we're not an agency. I've watched agencies charge local businesses $2,500+ for a website, lock them into 12-month contracts, and then vanish into "strategy meetings" — and honestly, I'm sick of it. Akus exists because local businesses deserve better than that.

Cheers,
Alex
Akus — Shellharbour, NSW

P.S. Yes, it's a real website. Yes, it's actually live. Yes, I know that's strange. Click it.

${FOOTER}`,
    },
    {
      step: 2,
      delayDays: 3,
      subject: `the maths on your free website`,
      body: `${greeting}

Quick recap in case my last email got buried under quote requests (a good problem — one I'd like to make worse for you):

I built ${biz} a live website. It's here: ${demoUrl}

Now the maths, because I know you don't make decisions on vibes:

Agency website: $2,500+ and 6 weeks of "circling back"
Agency social posts: $500/month
Agency email campaigns: $400/month
Akus (website + all of the above + about 12 other things): $50/month

That's not a discount. That's a different sport. And it's not "cheap because you do all the work" either — everything an agency would do for you gets done from one dashboard in about 5 minutes a day, with local SEO baked in so you actually start ranking on Google instead of paying someone $1,500/month to "monitor your visibility."

And no — we're not an agency undercutting other agencies. We're a Shellharbour business that got fed up watching agencies bleed local operators dry with lock-in contracts and invoices for "brand strategy." We built the tool we wished existed instead.

And here's the part where I put my money where my mouth is: if Akus doesn't save you at least $500 in your first 30 days, I refund every cent. No forms, no "retention specialist" calling you. One email, refunded within 24 hours.

So the worst-case scenario is: you get a free website, try everything for 7 days without even entering a credit card, and if you do subscribe and it doesn't save you $500 — you get your money back anyway.

The best case is you stop paying agency prices forever.

Reply "keep it" and I'll send you the login.

Alex

${FOOTER}`,
    },
    {
      step: 3,
      delayDays: 6,
      subject: `${competitorType} in ${suburb} will love this email`,
      body: `${greeting}

Here's a fun exercise. Google "${competitorType} ${suburb}" right now.

See who comes up first? That business isn't better than you. They just show up better than you.

Every job that starts with a Google search is going to whoever looks the most legit online. Right now, that might not be ${biz} — which is a bit painful given I've already fixed it and it's sitting here unclaimed:

👉 ${demoUrl}

That site comes with local SEO built in, Google review tools, and content structured so even ChatGPT recommends you when someone in ${suburb} asks for a recommendation. (Yes, people ask ChatGPT to find tradies now. Welcome to 2026.)

I'm not going to pretend there's a fake deadline. But I do delete demo sites eventually to make room for the next batch, and it'd be a shame for yours to go to the great recycle bin in the sky.

Reply "keep it" — takes you 8 seconds.

Alex

P.S. If you already have a website you love, no stress — but open both side by side and be honest with yourself.

${FOOTER}`,
    },
    {
      step: 4,
      delayDays: 9,
      subject: `"yeah but what's the catch"`,
      body: `${greeting}

If I got an email saying "here's a free website," my first thought would be what's the catch? So let me kill every catch you're imagining:

"It'll be $50/month then $200/month later." Nope. One plan, $50, everything included. It's on the pricing page in writing.

"There'll be a lock-in contract." No lock-in. Cancel any time. Agencies need contracts because their results don't keep you. We're not an agency — we're a local Shellharbour outfit that built this because we were sick of watching agencies do that exact thing to businesses around here.

"I'm not techy enough." You answered harder questions on your last insurance form. The website's already built — the rest is clicking buttons.

"I don't have time." That's the whole point. Most members knock out 7+ marketing tasks in their first 30 minutes. Your entire month of marketing, done before smoko.

"It's probably rubbish." It's live. Look at it: ${demoUrl}. I can't hide behind a pitch deck when the actual product is one click away.

And the guarantee underneath all of it: save $500 in month one or get every dollar back. The risk is 100% mine. You're risking the effort of typing "keep it" and pressing send.

Alex

${FOOTER}`,
    },
    {
      step: 5,
      delayDays: 13,
      subject: `she put it off for 3 years`,
      body: `${greeting}

Quick story about a café owner near us here in Shellharbour named Sandra.

For three years, "sort out the marketing" sat on her to-do list. Not because she was lazy — because every option was either $3,000/month or 40 hours of DIY she didn't have.

She tried Akus. In 40 minutes she had a live website, a month of social posts, email campaigns, and Google review responses done. Her words: she did more in 40 minutes than in the previous three years combined.

Here's the thing — Sandra had to start from scratch. You don't. Your website already exists:

👉 ${demoUrl}

You're not three years behind. You're one reply behind.

Reply "keep it" and I'll have you set up today.

Alex

${FOOTER}`,
    },
    {
      step: 6,
      delayDays: 17,
      subject: `taking your website out back 🪦`,
      body: `${greeting}

This is my last email — I promise I'm annoying, not that annoying.

The demo site I built for ${biz} gets deleted this week. Last look:

👉 ${demoUrl}

Before it goes, the whole offer one final time:

That website is yours — 7-day free trial, no credit card required
Plus unlimited social posts, emails, blog posts, ads, review tools, and a CRM — all done from one dashboard in about 5 minutes a day
$50/month after the trial, cancel any time
Don't save $500 in your first 30 days? Full refund, no questions

If the answer is no, all good — genuinely. Delete this, and if you ever change your mind, akus.com.au will build you a new one in 60 seconds.

But if some part of you has been meaning to sort this out — this is the version where someone already did the hard bit for you.

Reply "keep it". Eight seconds. That's the whole ask.

Alex
Akus — Shellharbour, NSW (not an agency, never will be)

P.S. This is where I'm supposed to say "last chance!!" with fake urgency. Instead I'll just say: your competitors' websites aren't getting deleted this week. Yours is. Do with that what you will.

${FOOTER}`,
    },
  ];

  return steps;
}
