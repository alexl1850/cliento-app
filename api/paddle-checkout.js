import { requireAuth } from './_lib/checkAccess.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // This had no auth at all before — it trusted whatever userId the client
  // sent, and that id is visible to anyone who views the source of a
  // customer's public website (it's embedded there for the estimate
  // widget). Left unfixed, that's a path to starting a checkout — and later
  // a cancellation — attributed to a business that never initiated either,
  // which the webhook then acts on (pausing their live site). Always derive
  // the id from the verified session, never the request body.
  const access = await requireAuth(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  try {
    const { email, name, interval } = req.body;
    const userId = access.userId;

    // 'year' selects the $500/year price (PADDLE_PRICE_ID_YEARLY); anything
    // else (including no value, for older clients) falls back to the
    // existing $50/month price — never trust the client for the actual
    // amount, only which of the two configured Paddle prices to use.
    const priceId = interval === 'year'
      ? process.env.PADDLE_PRICE_ID_YEARLY
      : process.env.PADDLE_PRICE_ID;
    if (!priceId) throw new Error(`No Paddle price configured for interval "${interval || 'month'}"`);

    // Create the transaction only — no `checkout.url` needed. That field
    // just builds a redirect link (your default-payment-link domain plus
    // a ?_ptxn= query param) that only does anything if Paddle.js is
    // loaded on the page it points to to catch that param. We don't
    // redirect anywhere; the frontend opens this transaction directly in
    // a Paddle.js overlay via Paddle.Checkout.open({ transactionId }),
    // which needs nothing here beyond the transaction id itself.
    const res2 = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          price_id: priceId,
          quantity: 1,
        }],
        customer: { email, name },
        custom_data: { user_id: userId },
      })
    });

    const data = await res2.json();
    if (data.error) throw new Error(data.error.detail || 'Paddle error');

    const transactionId = data.data?.id;
    if (!transactionId) throw new Error('No transaction id returned');

    return res.status(200).json({ transactionId });

  } catch(err) {
    console.error('Paddle checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
