import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { crawlSite } from './crawl.js';
import { fetchPageSpeed } from './pagespeed.js';
import { generateReport } from './report.js';
import { renderReportHtml } from './renderHtml.js';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { url, business, location, keywords } = args;

  if (!url || !business) {
    console.error('Usage: npm run audit -- --url=https://example.com --business="Example Plumbing" [--location="Perth, WA"] [--keywords="a,b,c"]');
    process.exit(1);
  }

  const businessInfo = {
    name: business,
    url,
    location: location || null,
    targetKeywords: keywords ? keywords.split(',').map((k) => k.trim()) : [],
  };

  console.log(`Crawling ${url} ...`);
  const signals = await crawlSite(url);
  if (signals.fetchError) {
    console.error(`Could not fetch the site: ${signals.fetchError}`);
    process.exit(1);
  }

  console.log('Fetching PageSpeed Insights (mobile + desktop) ...');
  const pagespeed = await fetchPageSpeed(url);

  console.log(`Generating report with Claude (${process.env.AUDIT_MODEL || 'claude-opus-4-8'}) ...`);
  const report = await generateReport({ business: businessInfo, signals, pagespeed });

  const outDir = path.join(process.cwd(), 'output');
  await mkdir(outDir, { recursive: true });
  const slug = slugify(business);

  const jsonPath = path.join(outDir, `${slug}-audit.json`);
  const htmlPath = path.join(outDir, `${slug}-audit.html`);

  await writeFile(jsonPath, JSON.stringify({ business: businessInfo, signals, pagespeed, report }, null, 2));
  await writeFile(htmlPath, renderReportHtml({ business: businessInfo, report }));

  console.log(`\nOverall score: ${report.overallScore}/100`);
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${htmlPath}`);
}

main().catch((err) => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
