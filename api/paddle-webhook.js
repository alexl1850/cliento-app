import crypto from 'crypto';
import { deployStaticHtml } from './_lib/vercelDeploy.js';
import { buildSplashHtml } from './_lib/splashPage.js';

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function getWebhookSecret() {
  // Fetch the webhook secret from Paddle API using the notification ID
  const res = await fetch(
    `https://api.paddle.com/notification-settings/${process.env.PADDLE_NOTIFICATION_ID}`,
    { headers: { 'Authorization': `Bearer ${process.env.PADDLE_API_KEY}` } }
  );
  const data = await res.json();
  return data.data?.endpoint_secret_key;
}

function verifySignature(rawBody, signature, secret) {
  const match = signature.match(/ts=(\d+);h1=([a-f0-9]+)/);
  if (!match) return false;
  const [, timestamp, hash] = match;
  // Replay attack protection — 5 second window
  if (Math.abs(Date.now() / 1000 - parseInt(timestamp)) > 5) return false;
  const signed = `${timestamp}:${rawBody}`;
  const computed = crypto.createHmac('sha256', secret).update(signed).digest('hex');
  const computedBuf = Buffer.from(computed);
  const hashBuf = Buffer.from(hash);
  // timingSafeEqual throws on mismatched lengths rather than returning false
  // — a malformed/truncated header would otherwise crash this into a 500
  // instead of a clean 401.
  if (computedBuf.length !== hashBuf.length) return false;
  return crypto.timingSafeEqual(computedBuf, hashBuf);
}

async function updateSupabase(userId, plan, subscriptionId) {
  const res = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ plan, paddle_subscription_id: subscriptionId, updated_at: new Date().toISOString() }),
    }
  );
  return res.ok;
}

async function getSiteInfo(userId) {
  const res = await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}&select=biz_name,site_slug,site_html,site_paused`,
    {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows?.[0] || null;
}

async function setSitePaused(userId, paused) {
  await fetch(
    `${process.env.VITE_SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ site_paused: paused }),
    }
  );
}

// Swap a lapsed customer's live website for a "renew to reactivate" splash page.
async function pauseSite(userId) {
  const site = await getSiteInfo(userId);
  if (!site?.site_slug || site.site_paused) return;
  try {
    await deployStaticHtml(process.env.VERCEL_API_TOKEN, `akus-${site.site_slug}`, buildSplashHtml(site.biz_name));
    await setSitePaused(userId, true);
  } catch (e) {
    console.error('Failed to pause site for', userId, e.message);
  }
}

// Restore a customer's real website once their subscription is active again.
async function resumeSite(userId) {
  const site = await getSiteInfo(userId);
  if (!site?.site_slug || !site.site_html || !site.site_paused) return;
  try {
    await deployStaticHtml(process.env.VERCEL_API_TOKEN, `akus-${site.site_slug}`, site.site_html);
    await setSitePaused(userId, false);
  } catch (e) {
    console.error('Failed to resume site for', userId, e.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const signature = req.headers['paddle-signature'];

  if (!signature) return res.status(400).json({ error: 'No signature' });

  // Get webhook secret from Paddle API
  let secret;
  try {
    secret = await getWebhookSecret();
    if (!secret) throw new Error('No secret found');
  } catch(e) {
    console.error('Could not fetch webhook secret:', e.message);
    return res.status(500).json({ error: 'Could not verify webhook' });
  }

  // Verify signature
  if (!verifySignature(rawBody.toString(), signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(rawBody.toString());
  const { event_type, data } = event;

  console.log('Paddle webhook:', event_type, data?.id);

  // Extract the user ID we pass as custom_data when creating checkout
  const userId = data?.custom_data?.user_id;
  const subscriptionId = data?.id;

  if (!userId) {
    console.log('No user_id in custom_data — skipping profile update');
    return res.status(200).json({ received: true });
  }

  switch (event_type) {
    case 'subscription.created':
    case 'subscription.activated':
    case 'subscription.trialing':
      await updateSupabase(userId, 'trial', subscriptionId);
      await resumeSite(userId);
      break;

    case 'subscription.updated':
    case 'transaction.completed':
      await updateSupabase(userId, 'active', subscriptionId);
      await resumeSite(userId);
      break;

    case 'subscription.canceled':
      await updateSupabase(userId, 'cancelled', subscriptionId);
      await pauseSite(userId);
      break;

    case 'subscription.past_due':
    case 'transaction.payment_failed':
      await updateSupabase(userId, 'past_due', subscriptionId);
      await pauseSite(userId);
      break;

    default:
      console.log('Unhandled event:', event_type);
  }

  return res.status(200).json({ received: true });
}
