// Blog page builders for customer sites — shares svgIcon()/palette tokens
// and the Plus Jakarta Sans + `.reveal` conventions from the main
// build-website.js template so blog pages read as part of the site, not a
// bolted-on mini-site (the old architecture deployed posts to a totally
// separate Vercel project with its own Inter/Georgia look).
import { svgIcon } from './siteIcons.js';

// Markdown-lite -> HTML. Kept identical to the pre-existing behaviour in
// the old publish-blog.js so already-written posts keep rendering the same.
export function parseContent(text) {
  return text
    .split('\n')
    .map(line => {
      if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
      if (line.startsWith('# ')) return `<h1 class="post-h1">${line.slice(2)}</h1>`;
      if (line.startsWith('- ')) return `<li>${line.slice(2)}</li>`;
      if (line.trim() === '') return '<br>';
      return `<p>${line}</p>`;
    })
    .join('\n')
    .replace(/(<li>.*<\/li>\n?)+/g, match => `<ul>${match}</ul>`);
}

export function excerptOf(content, len = 120) {
  return content.replace(/#{1,3}\s/g, '').replace(/\n/g, ' ').trim().slice(0, len) + '...';
}

function sharedHead(p, title, desc, siteUrl, path) {
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<link rel="canonical" href="${siteUrl}${path}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap" rel="stylesheet">`;
}

function sharedStyle(p) {
  return `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#fff;color:#111827;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:${p.primary};text-decoration:none}
img{max-width:100%;height:auto;display:block}

nav{background:rgba(255,255,255,0.97);backdrop-filter:blur(12px);border-bottom:1px solid #F3F4F6;padding:0 24px;position:sticky;top:0;z-index:100}
.nav-inner{max-width:1100px;margin:0 auto;height:72px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-size:1.2rem;font-weight:900;color:#111827;letter-spacing:-0.02em}
.nav-links{display:flex;align-items:center;gap:28px}
.nav-links a{font-size:0.85rem;font-weight:600;color:#374151}
.nav-links a:hover{color:${p.primary}}
.nav-cta{background:${p.accent};color:#fff !important;padding:10px 22px;border-radius:99px;font-weight:700;font-size:0.82rem}

.footer-inner{max-width:1100px;margin:0 auto}
footer{background:#111827;padding:56px 24px 32px}
.footer-top{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;padding-bottom:28px;border-bottom:1px solid rgba(255,255,255,0.08)}
.footer-top h3{font-size:1.15rem;font-weight:900;color:#fff}
.footer-links{display:flex;gap:20px;flex-wrap:wrap}
.footer-links a{font-size:0.85rem;color:rgba(255,255,255,0.6)}
.footer-links a:hover{color:#fff}
.footer-bottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding-top:24px}
.footer-bottom p{font-size:0.78rem;color:rgba(255,255,255,0.25)}
.powered{font-size:0.72rem;color:rgba(255,255,255,0.2)}
.powered a{color:rgba(255,255,255,0.35);font-weight:600}

@media(max-width:640px){ nav .nav-links{display:none} }`;
}

function navHtml(bizName, activePath) {
  return `<nav>
  <div class="nav-inner">
    <a href="/" class="nav-logo">${bizName}</a>
    <div class="nav-links">
      <a href="/#services">Services</a>
      <a href="/#about">About</a>
      <a href="/blog"${activePath === '/blog' ? ' style="color:inherit;font-weight:800"' : ''}>Blog</a>
      <a href="/#contact">Contact</a>
      <a href="/#contact" class="nav-cta">Get in Touch</a>
    </div>
  </div>
</nav>`;
}

function footerHtml(bizName, suburb) {
  return `<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <h3>${bizName}</h3>
      <div class="footer-links">
        <a href="/#services">Services</a>
        <a href="/#about">About</a>
        <a href="/blog">Blog</a>
        <a href="/#contact">Contact</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${bizName} · ${suburb || ''}</p>
      <div class="powered"><a href="https://akus.com.au" target="_blank">Website by ⚡ Akus</a></div>
    </div>
  </div>
</footer>`;
}

// posts: [{slug, title, meta_desc, excerpt, published_at}], newest-first.
export function buildBlogIndexHtml({ biz, palette: p, posts, siteUrl }) {
  const bizName = biz?.name || 'Blog';
  const title = `Blog | ${bizName}`;
  const desc = `News, tips and advice from ${bizName}${biz?.suburb ? ` in ${biz.suburb}` : ''}.`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead(p, title, desc, siteUrl, '/blog')}
<style>
${sharedStyle(p)}
.blog-hero{background:linear-gradient(135deg,${p.dark} 0%,${p.primary} 100%);padding:72px 24px 56px;color:#fff;text-align:center}
.blog-hero h1{font-size:clamp(2rem,4vw,3rem);font-weight:900;letter-spacing:-0.03em}
.blog-hero p{margin-top:12px;color:rgba(255,255,255,0.75);font-size:1rem}
.blog-grid{max-width:1100px;margin:0 auto;padding:64px 24px;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.blog-card{display:block;background:#F9FAFB;border:1px solid #F3F4F6;border-radius:16px;padding:28px;transition:all 0.2s}
.blog-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.08);border-color:${p.primary}30}
.blog-card-date{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${p.accent};margin-bottom:10px}
.blog-card h2{font-size:1.1rem;font-weight:800;color:#111827;margin-bottom:10px;letter-spacing:-0.01em}
.blog-card p{font-size:0.88rem;color:#6B7280;line-height:1.7;margin-bottom:14px}
.blog-card span{font-size:0.8rem;font-weight:700;color:${p.primary}}
.blog-empty{max-width:600px;margin:0 auto;padding:96px 24px;text-align:center;color:#6B7280}
</style>
</head>
<body>
${navHtml(bizName, '/blog')}
<section class="blog-hero">
  <h1>From the ${bizName} blog</h1>
  <p>${desc}</p>
</section>
${posts.length ? `<div class="blog-grid">
${posts.map(post => `  <a href="/blog/${post.slug}" class="blog-card">
    <div class="blog-card-date">${new Date(post.published_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}</div>
    <h2>${post.title}</h2>
    <p>${post.excerpt || excerptOf(post.content || '')}</p>
    <span>Read more →</span>
  </a>`).join('\n')}
</div>` : `<div class="blog-empty"><p>No posts yet — check back soon.</p></div>`}
${footerHtml(bizName, biz?.suburb)}
</body>
</html>`;
}

export function buildBlogPostHtml({ biz, palette: p, post, siteUrl }) {
  const bizName = biz?.name || 'Blog';
  const title = post.meta_title || post.title;
  const desc = post.meta_desc || post.excerpt || post.title;
  const publishDate = new Date(post.published_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });
  const htmlContent = parseContent(post.content);
  return `<!DOCTYPE html>
<html lang="en">
<head>
${sharedHead(p, `${title} | ${bizName}`, desc, siteUrl, `/blog/${post.slug}`)}
<style>
${sharedStyle(p)}
.post-hero{background:linear-gradient(135deg,${p.dark} 0%,${p.primary} 100%);padding:64px 24px 48px;color:#fff}
.post-hero-inner{max-width:740px;margin:0 auto}
.post-category{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:5px 14px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px;color:rgba(255,255,255,0.9)}
.post-hero h1{font-size:clamp(1.8rem,4vw,2.8rem);font-weight:900;letter-spacing:-0.03em;line-height:1.15;margin-bottom:18px}
.post-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:0.8rem;color:rgba(255,255,255,0.7)}
.post-meta span{display:inline-flex;align-items:center;gap:6px}

.post-body{max-width:740px;margin:0 auto;padding:56px 24px 72px}
.post-body p{font-size:1.05rem;line-height:1.85;color:#1F2937;margin-bottom:22px}
.post-body h2{font-size:1.4rem;font-weight:800;color:${p.primary};letter-spacing:-0.02em;margin:36px 0 14px;line-height:1.25}
.post-body h3{font-size:1.1rem;font-weight:700;color:#111827;margin:26px 0 12px}
.post-body ul,.post-body ol{padding-left:24px;margin-bottom:22px}
.post-body li{font-size:1.02rem;line-height:1.8;color:#1F2937;margin-bottom:8px}
.post-body br{display:block;margin-bottom:8px}

.post-cta{max-width:740px;margin:0 auto 72px;background:${p.light};border-radius:16px;padding:36px;text-align:center}
.post-cta h3{font-size:1.3rem;font-weight:900;color:#111827;margin-bottom:8px;letter-spacing:-0.02em}
.post-cta p{font-size:0.9rem;color:#374151;margin-bottom:22px;line-height:1.6}
.post-cta a{display:inline-block;padding:13px 30px;border-radius:99px;background:${p.primary};color:#fff !important;font-weight:800;font-size:0.92rem}

.back-row{max-width:740px;margin:0 auto;padding:0 24px 48px}
.back-row a{font-size:0.85rem;font-weight:700;color:${p.primary}}
</style>
</head>
<body>
${navHtml(bizName, '/blog')}
<section class="post-hero">
  <div class="post-hero-inner">
    <div class="post-category">${svgIcon('pen', 13)} ${biz?.suburb || 'Local'} Business Blog</div>
    <h1>${post.title}</h1>
    <div class="post-meta">
      <span>${svgIcon('calendar', 14)} ${publishDate}</span>
      ${biz?.suburb ? `<span>${svgIcon('mappin', 14)} ${biz.suburb}</span>` : ''}
    </div>
  </div>
</section>
<article class="post-body">
${htmlContent}
</article>
<div class="post-cta">
  <h3>Ready to work with us?</h3>
  <p>${biz?.description || `${bizName} is here to help. Get in touch today.`}</p>
  <a href="/#contact">Get in Touch →</a>
</div>
<div class="back-row"><a href="/blog">← Back to all posts</a></div>
${footerHtml(bizName, biz?.suburb)}
</body>
</html>`;
}

// Homepage teaser — replaces <!-- BLOG SECTION -->...<!-- END BLOG SECTION -->
// in profiles.site_html. Links are internal (/blog/{slug}) since posts now
// live on the same site, not a separate per-post Vercel project.
export function buildBlogSectionHtml({ biz, palette: p, posts }) {
  const latest = posts.slice(0, 3);
  return `
<!-- BLOG SECTION — auto-generated by Akus -->
<section id="blog" style="padding:72px 24px;background:#fff">
  <div style="max-width:1100px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${p.accent};margin-bottom:10px">From Our Blog</div>
      <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:900;letter-spacing:-0.03em;color:#111827;line-height:1.2">Latest from ${biz?.name || 'us'}</h2>
      <p style="font-size:0.92rem;color:#6B7280;margin-top:10px">Tips, news and advice for locals in ${biz?.suburb || 'our area'}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">
      ${latest.map((post, i) => `
      <a href="/blog/${post.slug}" style="display:block;background:${i===0?`linear-gradient(135deg,${p.dark},${p.primary})`:'#F8F9FA'};border-radius:16px;padding:28px;text-decoration:none;border:1px solid ${i===0?'transparent':'#E5E7EB'};transition:all 0.2s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
        <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${i===0?'rgba(255,255,255,0.6)':'#9CA3AF'};margin-bottom:10px">${new Date(post.published_at).toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}</div>
        <h3 style="font-size:1rem;font-weight:800;color:${i===0?'#fff':'#111827'};line-height:1.3;margin-bottom:10px;letter-spacing:-0.01em">${post.title}</h3>
        <p style="font-size:0.82rem;color:${i===0?'rgba(255,255,255,0.65)':'#6B7280'};line-height:1.65;margin-bottom:14px">${post.excerpt || excerptOf(post.content || '')}</p>
        <span style="font-size:0.78rem;font-weight:700;color:${i===0?'rgba(255,255,255,0.8)':p.primary}">Read more →</span>
      </a>`).join('')}
    </div>
    <div style="text-align:center;margin-top:36px"><a href="/blog" style="font-size:0.88rem;font-weight:700;color:${p.primary}">View all posts →</a></div>
  </div>
</section>
<!-- END BLOG SECTION -->`;
}
