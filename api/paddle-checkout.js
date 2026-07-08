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
    const { email, name } = req.body;
    const userId = access.userId;

    // Create a Paddle transaction with a 7-day trial
    const res2 = await fetch('https://api.paddle.com/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          price_id: process.env.PADDLE_PRICE_ID,
          quantity: 1,
        }],
        customer: { email, name },
        custom_data: { user_id: userId },
        checkout: { url: 'https://app.akus.com.au' },
      })
    });

    const data = await res2.json();
    if (data.error) throw new Error(data.error.detail || 'Paddle error');

    // Return the checkout URL
    const checkoutUrl = data.data?.checkout?.url;
    if (!checkoutUrl) throw new Error('No checkout URL returned');

    return res.status(200).json({ url: checkoutUrl });

  } catch(err) {
    console.error('Paddle checkout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
