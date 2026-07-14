// Shared Resend sender — extracted from generate-estimate.js's local
// sendEmail so the onboarding/lifecycle sequence can reuse the exact same
// tolerant-when-unconfigured behaviour: if RESEND_API_KEY isn't set, sends
// are silently skipped rather than breaking the caller's flow.
export async function sendEmail(to, subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY || !to) return { sent: false };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'Akus <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      }),
    });
    return { sent: res.ok };
  } catch (err) {
    console.error('Email send failed (non-fatal):', err.message);
    return { sent: false };
  }
}

// HTML-escapes a value before it goes into an email body built from
// user-supplied data (names, business names, etc.).
export const escapeHtml = (str) => (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
