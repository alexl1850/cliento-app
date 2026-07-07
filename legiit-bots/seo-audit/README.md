# SEO Audit Bot

Crawls a client's website, pulls PageSpeed Insights data, and generates a
scored, client-ready SEO audit report (JSON + branded HTML) via Claude.

No third-party accounts, no CAPTCHA, no proxies -- the only dependencies are
the target site being publicly reachable and PageSpeed Insights.

## Setup

```
npm install
cp .env.example .env
# fill in ANTHROPIC_API_KEY (required) and PAGESPEED_API_KEY (recommended)
```

## Run

```
npm run audit -- --url=https://example.com --business="Example Plumbing" --location="Perth, WA" --keywords="emergency plumber perth,blocked drains perth"
```

Output lands in `output/<business-slug>-audit.json` and `.html`. The HTML
file is the client deliverable -- open it directly or convert to PDF.

## What it checks

- **On-page**: title, meta description, H1/H2 structure, image alt coverage,
  word count, internal/external link counts, schema.org markup
- **Technical**: HTTPS, canonical tag, robots.txt, sitemap.xml, robots meta
- **Page speed**: PageSpeed Insights (mobile + desktop) -- performance score,
  LCP, CLS, TBT, top opportunities
- Claude synthesizes all of the above into scored categories, quick wins, and
  prioritized recommendations -- grounded only in the data it was actually
  given (the system prompt explicitly forbids inventing findings).

## Cost per audit

Roughly $0.05-0.15 on `claude-opus-4-8` (the default). PageSpeed Insights is
free. Total cost is negligible next to any realistic gig price.

## Known limitations (untested against a live site so far)

This was built in a sandboxed environment with no outbound access to
arbitrary external domains, so it has **not yet been run end-to-end against
a real website**. Before selling this as a gig:

1. Run it against a handful of real client sites and sanity-check the output.
2. Sites that block scrapers/bots (Cloudflare challenge pages, aggressive
   WAFs) will fail the crawl step -- decide how to handle that (retry with a
   headless browser, or flag it as a manual-review case).
3. Unauthenticated PageSpeed Insights requests rate-limit hard -- get the
   free API key before running more than a handful of audits.
4. Consider adding a lightweight cache/retry layer if this gets wired into
   an actual Legiit order-fulfillment pipeline.
