export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { domain, deploymentUrl, action } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    // Clean the domain — remove http://, https://, www., trailing slashes
    const cleanDomain = domain
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '')
      .toLowerCase()
      .trim();

    // ── CHECK: Verify DNS propagation ──────────────────────────────────────
    if (action === 'check') {
      try {
        const checkRes = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=A`);
        const checkData = await checkRes.json();
        const hasVercel = checkData.Answer?.some(r =>
          r.data === '76.76.21.21' || r.data?.includes('vercel')
        );

        // Also check CNAME
        const cnameRes = await fetch(`https://dns.google/resolve?name=${cleanDomain}&type=CNAME`);
        const cnameData = await cnameRes.json();
        const hasCname = cnameData.Answer?.some(r =>
          r.data?.includes('vercel') || r.data?.includes('cname.vercel-dns.com')
        );

        return res.status(200).json({
          propagated: hasVercel || hasCname,
          domain: cleanDomain,
          records: checkData.Answer || [],
        });
      } catch(e) {
        return res.status(200).json({ propagated: false, domain: cleanDomain, error: e.message });
      }
    }

    // ── ADD: Add domain to Vercel project ──────────────────────────────────
    // First, find the project from the deployment URL
    let projectId = null;

    if (deploymentUrl) {
      // Extract project name from URL pattern: https://cliento-[slug]-akus-voice.vercel.app
      const urlMatch = deploymentUrl.match(/https?:\/\/([^.]+)\.vercel\.app/);
      if (urlMatch) {
        const deployName = urlMatch[1];
        // Get deployment to find project
        const deployRes = await fetch(`https://api.vercel.com/v13/deployments?url=${encodeURIComponent(deploymentUrl)}&limit=1`, {
          headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` }
        });
        const deployData = await deployRes.json();
        if (deployData.deployments?.[0]) {
          projectId = deployData.deployments[0].projectId;
        }
      }
    }

    // Add domain to Vercel (to the team account if no specific project)
    const addRes = await fetch(
      projectId
        ? `https://api.vercel.com/v9/projects/${projectId}/domains`
        : `https://api.vercel.com/v5/domains`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: cleanDomain }),
      }
    );

    const addData = await addRes.json();

    // Get the DNS configuration regardless of whether add succeeded
    // (domain might already be added)
    const configRes = await fetch(
      `https://api.vercel.com/v6/domains/${cleanDomain}/config`,
      { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } }
    );
    const configData = await configRes.json();

    // Build the DNS records the customer needs to add
    const dnsRecords = [];

    if (configData.cnames && configData.cnames.length > 0) {
      dnsRecords.push({
        type: 'CNAME',
        name: cleanDomain.startsWith('www.') ? 'www' : '@',
        value: configData.cnames[0],
        ttl: '3600',
        note: 'Points your domain to your Cliento website',
      });
    } else {
      // Default Vercel records
      dnsRecords.push({
        type: 'A',
        name: '@',
        value: '76.76.21.21',
        ttl: '3600',
        note: 'Points your domain to your Cliento website',
      });
    }

    // Always add www CNAME
    if (!cleanDomain.startsWith('www.')) {
      dnsRecords.push({
        type: 'CNAME',
        name: 'www',
        value: 'cname.vercel-dns.com',
        ttl: '3600',
        note: 'Allows www.yourdomain.com to also work',
      });
    }

    return res.status(200).json({
      success: true,
      domain: cleanDomain,
      dnsRecords,
      alreadyExists: addData.error?.code === 'domain_already_in_use',
    });

  } catch(err) {
    console.error('Connect domain error:', err);
    return res.status(500).json({ error: err.message });
  }
}
