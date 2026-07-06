import { requireAdmin } from './_lib/checkAccess.js';

// Mints a real, short-lived session for the target customer so the admin can
// open the exact same Dashboard the customer sees (and fix things directly)
// without ever touching their password. Uses Supabase's admin generate_link
// API to create a magic-link token, then verifies it server-side to exchange
// it for an access/refresh token pair — no email is ever sent, since we
// verify the token ourselves instead of the customer clicking a link.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireAdmin(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  try {
    const { targetUserId } = req.body || {};
    if (!targetUserId) return res.status(400).json({ error: 'targetUserId is required' });

    const targetRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${targetUserId}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    if (!targetRes.ok) return res.status(404).json({ error: 'Customer not found' });
    const targetUser = await targetRes.json();
    const targetEmail = targetUser?.email;
    if (!targetEmail) return res.status(404).json({ error: 'Customer not found' });

    const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'magiclink', email: targetEmail }),
    });
    if (!linkRes.ok) return res.status(500).json({ error: 'Could not start impersonation session' });
    const linkData = await linkRes.json();

    // The stable part of the response across Supabase versions is the
    // action_link URL — pull the verification token out of its query string
    // rather than relying on a specific top-level field name.
    const actionLink = linkData?.action_link || linkData?.properties?.action_link;
    const hashedToken = linkData?.hashed_token || linkData?.properties?.hashed_token
      || (actionLink && new URL(actionLink).searchParams.get('token'));
    if (!hashedToken) return res.status(500).json({ error: 'Could not start impersonation session' });

    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'magiclink', token_hash: hashedToken }),
    });
    if (!verifyRes.ok) return res.status(500).json({ error: 'Could not start impersonation session' });
    const session = await verifyRes.json();
    if (!session?.access_token || !session?.refresh_token) {
      return res.status(500).json({ error: 'Could not start impersonation session' });
    }

    // Best-effort audit trail — don't fail the impersonation if logging fails.
    fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        admin_user_id: access.userId,
        admin_email: access.email,
        target_user_id: targetUserId,
        target_email: targetEmail,
        action: 'impersonate',
      }),
    }).catch(() => {});

    return res.status(200).json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      targetEmail,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Unexpected error' });
  }
}
