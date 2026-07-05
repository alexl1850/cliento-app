export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) return res.status(400).send('<h1>No demo ID provided</h1>');

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const dbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/demo_sites?demo_id=eq.${id}&select=html`,
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    const data = await dbRes.json();
    if (!data || !data[0] || !data[0].html) {
      return res.status(404).send(`<!DOCTYPE html><html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F8FAFC"><div style="text-align:center"><h1 style="font-size:2rem;margin-bottom:12px">Demo expired</h1><p style="color:#6B7280">This demo site has expired. <a href="https://akus.com.au" style="color:#38BDF8">Visit Akus</a> to build a new one.</p></div></body></html>`);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(data[0].html);

  } catch(err) {
    console.error('Demo view error:', err);
    return res.status(500).send('<h1>Error loading demo</h1>');
  }
}
