const PSI_ENDPOINT = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

async function runStrategy(url, strategy, apiKey) {
  const params = new URLSearchParams({ url, strategy, category: 'performance' });
  if (apiKey) params.set('key', apiKey);

  try {
    const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`);
    if (!res.ok) return { strategy, error: `HTTP ${res.status}` };
    const data = await res.json();
    const audits = data.lighthouseResult?.audits || {};
    return {
      strategy,
      performanceScore: data.lighthouseResult?.categories?.performance?.score ?? null,
      largestContentfulPaint: audits['largest-contentful-paint']?.displayValue || null,
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue || null,
      totalBlockingTime: audits['total-blocking-time']?.displayValue || null,
      speedIndex: audits['speed-index']?.displayValue || null,
      topOpportunities: Object.values(audits)
        .filter((a) => a.score !== null && a.score < 0.9 && a.details?.type === 'opportunity')
        .map((a) => a.title)
        .slice(0, 5),
    };
  } catch (err) {
    return { strategy, error: err.message };
  }
}

// PSI allows a handful of unauthenticated requests before rate-limiting hard --
// set PAGESPEED_API_KEY (free from Google Cloud Console) for real usage volume.
export async function fetchPageSpeed(url, apiKey = process.env.PAGESPEED_API_KEY) {
  const [mobile, desktop] = await Promise.all([
    runStrategy(url, 'mobile', apiKey),
    runStrategy(url, 'desktop', apiKey),
  ]);
  return { mobile, desktop };
}
