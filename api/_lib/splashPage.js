// The placeholder page shown on a customer's live website while their
// Akus subscription is lapsed (cancelled or payment failing).
export function buildSplashHtml(bizName) {
  const name = bizName || 'This website';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta name="robots" content="noindex">
<title>${name} — Temporarily Unavailable</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8FAFC;color:#0F172A;text-align:center;padding:24px}
.card{max-width:440px}
h1{font-size:1.6rem;font-weight:800;margin-bottom:12px;letter-spacing:-0.02em}
p{color:#6B7280;line-height:1.7;font-size:0.95rem}
</style>
</head>
<body>
<div class="card">
<h1>${name} is temporarily unavailable</h1>
<p>The owner needs to renew their subscription to bring this website back online. If you're the owner, log in to your Akus dashboard to reactivate.</p>
</div>
</body>
</html>`;
}
