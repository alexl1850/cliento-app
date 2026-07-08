// The 6-email, 17-day cold outreach sequence the user wrote by hand — used
// as a STYLE AND STRUCTURE REFERENCE for a per-lead AI rewrite (see
// buildSequencePrompt below), not sent verbatim. Each lead gets a genuinely
// personalized version generated from this reference, not just merge-tag
// substitution — REFERENCE_TEMPLATE below is the raw {{token}} text handed
// to Claude as the example to follow; renderSequence() (below) does plain
// substitution and exists only as an offline fallback if the AI call fails.
//
// Every step ends with the same compliant footer, appended programmatically
// after generation (never trusted to the AI) — Spam Act 2003 requires
// sender identification + a working opt-out on every commercial email, not
// just the first one in a sequence.
export const FOOTER = `—
Akus Voice (ABN 90 632 856 615) · Shellharbour, NSW
Reply "stop" any time and I'll leave you alone — no hard feelings (well, maybe a few).`;

export const REFERENCE_TEMPLATE = [
  {
    step: 1,
    delayDays: 0,
    subject: `I built {{BusinessName}} a website (it's already live)`,
    body: `Hi {{FirstName}},

This is going to sound weird, so I'll just say it:

I built you a website. It's done. It's live on the internet right now.

👉 {{DemoLink}}

Nobody asked me to. There's no invoice attached. I built it because I could see {{BusinessName}} doing good work in {{Suburb}} without the online presence to match — and I figured showing you beats telling you.

Go click the link. Takes 30 seconds. If you hate it, delete this email and we never speak again.

If you like it, reply "keep it" and it's yours — 7-day free trial, no credit card required, then $50/month. Not $50/month plus setup. Not $50/month locked in for 12 months. Fifty bucks, cancel whenever.

The website is just the front door, by the way. Behind it is a dashboard where you do everything an agency does — social posts, emails, blog content, Google reviews, ads — in about 5 minutes a day. And because it's all built for local SEO, businesses start climbing the Google rankings in {{Suburb}} fast, not "give it 6–12 months" agency-speak fast.

One thing to be clear on: we're not an agency. I've watched agencies charge local businesses $2,500+ for a website, lock them into 12-month contracts, and then vanish into "strategy meetings" — and honestly, I'm sick of it. Akus exists because local businesses deserve better than that.

Cheers,
Alex
Akus — Shellharbour, NSW

P.S. Yes, it's a real website. Yes, it's actually live. Yes, I know that's strange. Click it.`,
  },
  {
    step: 2,
    delayDays: 3,
    subject: `the maths on your free website`,
    body: `{{FirstName}},

Quick recap in case my last email got buried under quote requests (a good problem — one I'd like to make worse for you):

I built {{BusinessName}} a live website. It's here: {{DemoLink}}

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

Alex`,
  },
  {
    step: 3,
    delayDays: 6,
    subject: `{{CompetitorType}} in {{Suburb}} will love this email`,
    body: `{{FirstName}},

Here's a fun exercise. Google "{{CompetitorType}} {{Suburb}}" right now.

See who comes up first? That business isn't better than you. They just show up better than you.

Every job that starts with a Google search is going to whoever looks the most legit online. Right now, that might not be {{BusinessName}} — which is a bit painful given I've already fixed it and it's sitting here unclaimed:

👉 {{DemoLink}}

That site comes with local SEO built in, Google review tools, and content structured so even ChatGPT recommends you when someone in {{Suburb}} asks for a recommendation. (Yes, people ask ChatGPT to find tradies now. Welcome to 2026.)

I'm not going to pretend there's a fake deadline. But I do delete demo sites eventually to make room for the next batch, and it'd be a shame for yours to go to the great recycle bin in the sky.

Reply "keep it" — takes you 8 seconds.

Alex

P.S. If you already have a website you love, no stress — but open both side by side and be honest with yourself.`,
  },
  {
    step: 4,
    delayDays: 9,
    subject: `"yeah but what's the catch"`,
    body: `{{FirstName}},

If I got an email saying "here's a free website," my first thought would be what's the catch? So let me kill every catch you're imagining:

"It'll be $50/month then $200/month later." Nope. One plan, $50, everything included. It's on the pricing page in writing.

"There'll be a lock-in contract." No lock-in. Cancel any time. Agencies need contracts because their results don't keep you. We're not an agency — we're a local Shellharbour outfit that built this because we were sick of watching agencies do that exact thing to businesses around here.

"I'm not techy enough." You answered harder questions on your last insurance form. The website's already built — the rest is clicking buttons.

"I don't have time." That's the whole point. Most members knock out 7+ marketing tasks in their first 30 minutes. Your entire month of marketing, done before smoko.

"It's probably rubbish." It's live. Look at it: {{DemoLink}}. I can't hide behind a pitch deck when the actual product is one click away.

And the guarantee underneath all of it: save $500 in month one or get every dollar back. The risk is 100% mine. You're risking the effort of typing "keep it" and pressing send.

Alex`,
  },
  {
    step: 5,
    delayDays: 13,
    subject: `she put it off for 3 years`,
    body: `{{FirstName}},

Quick story about a café owner near us here in Shellharbour named Sandra.

For three years, "sort out the marketing" sat on her to-do list. Not because she was lazy — because every option was either $3,000/month or 40 hours of DIY she didn't have.

She tried Akus. In 40 minutes she had a live website, a month of social posts, email campaigns, and Google review responses done. Her words: she did more in 40 minutes than in the previous three years combined.

Here's the thing — Sandra had to start from scratch. You don't. Your website already exists:

👉 {{DemoLink}}

You're not three years behind. You're one reply behind.

Reply "keep it" and I'll have you set up today.

Alex`,
  },
  {
    step: 6,
    delayDays: 17,
    subject: `taking your website out back 🪦`,
    body: `{{FirstName}},

This is my last email — I promise I'm annoying, not that annoying.

The demo site I built for {{BusinessName}} gets deleted this week. Last look:

👉 {{DemoLink}}

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

P.S. This is where I'm supposed to say "last chance!!" with fake urgency. Instead I'll just say: your competitors' websites aren't getting deleted this week. Yours is. Do with that what you will.`,
  },
];

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

// Builds the prompt that asks Claude to write a genuinely personalized
// version of the reference sequence for one specific business — same 6-step
// structure, same day cadence, same offers/guarantee/pricing/breakup joke,
// same voice, but real specifics woven in rather than the same sentences
// with names swapped. The footer is explicitly excluded from what the AI
// writes — it's appended programmatically afterwards so compliance never
// depends on the model remembering to include it correctly.
export function buildSequencePrompt({ businessName, suburb, category, demoUrl, ownerFirstName }) {
  const referenceText = REFERENCE_TEMPLATE.map(s =>
    `--- Step ${s.step} (Day ${s.delayDays}) ---\nSubject: ${s.subject}\n\n${s.body}`
  ).join('\n\n');

  const nameNote = ownerFirstName
    ? `Their first name is "${ownerFirstName}" — use it in greetings the way the reference does.`
    : `We don't know their name. Don't invent one and don't use a placeholder — use a warm, name-free greeting instead (e.g. "Hi there," or something equally natural).`;

  return {
    system: `You write cold outreach email sequences for Akus, a self-serve website/marketing platform built by a small team in Shellharbour, NSW. You'll be given a proven reference sequence — preserve its structure, day cadence, offers, guarantee, pricing, tone, and the running "not an agency" theme, but write a genuinely NEW, personalized version for each business: real, plausible specifics about their trade and suburb woven naturally into the copy, not the same sentences with the business name swapped in. Never invent false claims about the business (no fake reviews, no fake specifics you can't know) — personalize through relevant, generic-but-true trade/suburb detail (e.g. what a ${category || 'local business'} in that area would plausibly care about), not fabricated facts about this specific business. Return ONLY valid JSON, no markdown.`,
    user: `Reference sequence (structure and voice to follow, not to copy verbatim):

${referenceText}

Now write a new, personalized 6-email version of this exact sequence for:

Business: ${businessName}
Suburb: ${suburb}
Category: ${category || 'local business'}
${nameNote}
Real, live demo website already built for them (not a mockup — an actual working site): ${demoUrl}

Keep each step's subject and general theme/beat matching the reference (Step 1 = the gift, Step 2 = the maths, Step 3 = the competitor poke, Step 4 = objection killer, Step 5 = the story, Step 6 = the breakup) but make the actual wording feel freshly written for this specific business, not templated. Do not include a footer, signature block, or unsubscribe line in any step — that gets added separately.

Return ONLY a JSON array of exactly 6 objects in order: [{"subject":"...","body":"..."}, ...]`,
  };
}

// Deterministic fallback — plain merge-tag substitution with no AI call.
// Used only if the personalized generation above fails, so a lead never
// ends up with zero draft at all.
export function renderSequence({ businessName, suburb, category, demoUrl, ownerFirstName }) {
  const competitorType = `other ${pluralize(category)}`;
  const greeting = ownerFirstName ? `Hi ${ownerFirstName},` : 'Hi there,';

  return REFERENCE_TEMPLATE.map(s => ({
    step: s.step,
    delayDays: s.delayDays,
    subject: s.subject
      .replace(/\{\{BusinessName\}\}/g, businessName)
      .replace(/\{\{Suburb\}\}/g, suburb)
      .replace(/\{\{CompetitorType\}\}/g, competitorType),
    body: s.body
      .replace(/^\{\{FirstName\}\},$|Hi \{\{FirstName\}\},/, greeting)
      .replace(/\{\{BusinessName\}\}/g, businessName)
      .replace(/\{\{Suburb\}\}/g, suburb)
      .replace(/\{\{CompetitorType\}\}/g, competitorType)
      .replace(/\{\{DemoLink\}\}/g, demoUrl)
      + `\n\n${FOOTER}`,
  }));
}
