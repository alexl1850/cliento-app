# Citation directory datasets

Seed data for the citation-building bot, one file per market.

## Confidence levels

- **`au-directories.json`** — real, confirmed-live data. Extracted from an
  actual delivered citation report (purchased from a Legiit seller for a
  real business), so every entry was verified published at the time of
  that report.
- **`global-core.json`, `usa-directories.json`, `ca-directories.json`,
  `uk-directories.json`, `global-other.json`** — compiled from published
  citation-site reference lists (BrightLocal-style roundups, SEO blogs),
  cross-checked against multiple sources. These are real, legitimate,
  well-known platforms — but nobody has actually submitted a listing and
  confirmed it went live the way the AU list has been. Treat as a strong
  starting list, not a verified one, until the bot has run against them.

## Structure

`global-core.json` is submitted for every client regardless of country
(Google Business Profile, Bing Places, Facebook, etc.). Each country file
adds market-specific directories on top of that core set.

## Gap to close

The competitor package this was modeled against advertises 350 (USA) /
150 (AU/CA/UK each) / 100 (everywhere else, ~15 local + 85 global)
directories. What's compiled so far is a vetted starter set per market —
real numbers are noted per file below. Expanding these toward the
competitor's counts is future work, not assumed done.
