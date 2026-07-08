// Runs fn(item) over items with at most `limit` in flight at once. Used by
// the outreach batch endpoints (sourcing/drafting), where each item does a
// slow network round-trip (fetching a third-party website, or an AI call) —
// doing them one at a time would make any real batch size time out the
// serverless function; doing them all at once risks overwhelming the
// third-party sites or Anthropic's per-key concurrency limits.
export async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const current = next++;
      results[current] = await fn(items[current], current);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}
