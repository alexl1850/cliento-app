// Per-suburb location pages — reuses blogTemplates.js's nav/footer/style
// helpers (same Plus Jakarta Sans look as the rest of the site) and
// structuredData.js's schema builders (own BreadcrumbList/LocalBusiness
// variant per suburb, plus FAQ schema backed by real visible content).
import { navHtml, footerHtml, sharedHead, sharedStyle } from './blogTemplates.js';
import { buildLocalBusinessJsonLd, buildFaqJsonLd, buildBreadcrumbJsonLd, buildJsonLdGraph } from './structuredData.js';

export function buildLocationPageHtml({ biz, palette: p, location, siteUrl }) {
  const { suburb, slug, content } = location;
  const bizName = biz?.name || 'Business';
  const title = `${bizName} in ${suburb} | ${bizName}`;
  const desc = (content?.intro || `${bizName} proudly serves ${suburb}.`).slice(0, 155);

  const jsonLd = buildJsonLdGraph([
    buildLocalBusinessJsonLd({
      schemaType: 'LocalBusiness',
      name: bizName,
      description: desc,
      url: `${siteUrl}/location/${slug}`,
      areaServed: suburb,
      address: { addressLocality: suburb },
    }),
    buildFaqJsonLd(content?.faq),
    buildBreadcrumbJsonLd([
      { name: 'Home', url: siteUrl },
      { name: suburb, url: `${siteUrl}/location/${slug}` },
    ]),
  ]);

  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead(p, title, desc, siteUrl, `/location/${slug}`)}
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<style>
${sharedStyle(p)}
.loc-hero{background:linear-gradient(135deg,${p.dark} 0%,${p.primary} 100%);padding:72px 24px 56px;color:#fff;text-align:center}
.loc-hero h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-0.03em}
.loc-body{max-width:740px;margin:0 auto;padding:56px 24px}
.loc-body p{font-size:1.02rem;line-height:1.8;color:#1F2937;margin-bottom:20px}
.loc-faq{margin-top:40px}
.loc-faq details{background:#F9FAFB;border:1px solid #F3F4F6;border-radius:16px;padding:20px 24px;margin-bottom:12px}
.loc-faq summary{font-weight:700;color:#111827;cursor:pointer;list-style:none}
.loc-cta{max-width:740px;margin:0 auto 72px;background:${p.light};border-radius:16px;padding:36px;text-align:center}
.loc-cta h3{font-size:1.2rem;font-weight:900;color:#111827;margin-bottom:8px}
.loc-cta a{display:inline-block;padding:13px 30px;border-radius:99px;background:${p.primary};color:#fff !important;font-weight:800;font-size:0.92rem}
</style>
</head>
<body>
${navHtml(bizName, `/location/${slug}`)}
<section class="loc-hero">
  <h1>${content?.headline || `${bizName} in ${suburb}`}</h1>
</section>
<article class="loc-body">
  <p>${content?.intro || ''}</p>
  ${content?.services_blurb ? `<p>${content.services_blurb}</p>` : ''}
  ${Array.isArray(content?.faq) && content.faq.length ? `<div class="loc-faq">
    ${content.faq.map(f => `<details><summary>${f.question}</summary><p style="margin-top:10px;color:#6B7280">${f.answer}</p></details>`).join('')}
  </div>` : ''}
</article>
<div class="loc-cta">
  <h3>Need ${bizName} in ${suburb}?</h3>
  <a href="/#contact">Get in Touch →</a>
</div>
${footerHtml(bizName, biz?.suburb)}
</body>
</html>`;
}
