// Deploys a single static HTML file as the production deployment for a
// named Vercel project — used both for normal website builds and for
// swapping a customer's live site to/from the "subscription lapsed" splash.
export async function deployStaticHtml(token, projectName, html) {
  const res = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      files: [{ file: 'index.html', data: Buffer.from(html).toString('base64'), encoding: 'base64' }],
      projectSettings: { framework: null },
      target: 'production',
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { url: `https://${data.alias?.[0] || data.url}`, deployId: data.id };
}
