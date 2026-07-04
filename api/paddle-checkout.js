export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, email, name } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID required' });

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
