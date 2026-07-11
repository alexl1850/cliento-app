import { requireActiveAccount } from './_lib/checkAccess.js';
import { regenerateAndDeploy } from './_lib/regenerateAndDeploy.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });

    // Scoped to id AND user_id together — even though the service key
    // bypasses RLS, this filter is what actually stops one account from
    // deleting another account's post.
    const delRes = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?id=eq.${id}&user_id=eq.${access.userId}`,
      {
        method: 'DELETE',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          Prefer: 'return=minimal',
        },
      }
    );
    if (!delRes.ok) return res.status(500).json({ error: 'Could not delete post' });

    // A "deleted" post must stop being live immediately, not linger until
    // the next unrelated publish — so redeploy now with the remaining posts.
    const result = await regenerateAndDeploy(access.userId);

    return res.status(200).json({ success: true, redeployed: !result.skipped });

  } catch (err) {
    console.error('Delete blog post error:', err);
    return res.status(500).json({ error: err.message });
  }
}
