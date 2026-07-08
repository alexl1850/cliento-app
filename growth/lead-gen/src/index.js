import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { sourceLeads } from './sourceLeads.js';
import { scoreWebsite } from './scoreWebsite.js';
import { buildDemoLink } from './demoLink.js';
import { draftMessage } from './draftMessage.js';
import { mapWithConcurrency } from './mapWithConcurrency.js';
import { toCsv } from './writeCsv.js';

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { location, categories, limit } = args;

  if (!location || !categories) {
    console.error(
      'Usage: npm run leads -- --location="Fremantle, WA, Australia" --categories="plumber,electrician,cafe" [--limit=50]'
    );
    process.exit(1);
  }

  const categoryList = categories.split(',').map((c) => c.trim()).filter(Boolean);
  const draftLimit = parseInt(limit, 10) || 50;

  console.log(`Sourcing leads for [${categoryList.join(', ')}] in ${location} ...`);
  const leads = await sourceLeads({ location, categories: categoryList });
  console.log(`Found ${leads.length} unique businesses.`);

  console.log('Scoring existing websites (free heuristic, no LLM cost) ...');
  const scored = await mapWithConcurrency(leads, 5, async (lead) => {
    const siteScore = await scoreWebsite(lead.website);
    return { ...lead, siteScore };
  });

  // No website, or worst-scoring sites, are the strongest pitch -- prioritize those.
  scored.sort((a, b) => a.siteScore.score - b.siteScore.score);

  const outDir = path.join(process.cwd(), 'output');
  await mkdir(outDir, { recursive: true });
  const slug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const allLeadsPath = path.join(outDir, `${slug}-all-leads.csv`);
  await writeFile(
    allLeadsPath,
    toCsv(
      scored.map((l) => ({ ...l, siteScoreValue: l.siteScore.score, siteReasons: l.siteScore.reasons.join('; ') })),
      ['name', 'suburb', 'phone', 'website', 'rating', 'reviewCount', 'siteScoreValue', 'siteReasons', 'mapsUrl']
    )
  );
  console.log(`Saved full scored lead list: ${allLeadsPath}`);

  const toContact = scored.slice(0, draftLimit);
  console.log(`Drafting personalized openers for the ${toContact.length} highest-priority leads (claude-haiku-4-5) ...`);

  const queue = await mapWithConcurrency(toContact, 3, async (lead) => {
    const demoLink = buildDemoLink({ name: lead.name, suburb: lead.suburb, category: lead.sourceCategory });
    let draftedMessage = null;
    try {
      draftedMessage = await draftMessage({ lead, demoLink, siteScore: lead.siteScore });
    } catch (err) {
      draftedMessage = `[DRAFT FAILED: ${err.message}]`;
    }
    return { ...lead, demoLink, draftedMessage };
  });

  const queuePath = path.join(outDir, `${slug}-outreach-queue.csv`);
  await writeFile(
    queuePath,
    toCsv(
      queue.map((l) => ({ ...l, siteScoreValue: l.siteScore.score })),
      ['name', 'suburb', 'phone', 'website', 'siteScoreValue', 'demoLink', 'draftedMessage', 'mapsUrl']
    )
  );

  console.log(`Saved ready-to-work outreach queue: ${queuePath}`);
  console.log('\nNothing was sent -- this is a queue for you to work through manually (or feed into a rate-limited send step later).');
}

main().catch((err) => {
  console.error('Lead-gen run failed:', err.message);
  process.exit(1);
});
