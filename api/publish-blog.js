import { requireActiveAccount } from './_lib/checkAccess.js';

// ── Icon set — minimal stroke icons, replaces emoji ──
const ICONS = {
  pen: `<path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"/><path d="M14 7l3 3"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
  mappin: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
};
function svgIcon(name, size = 16) {
  const path = ICONS[name] || ICONS.pen;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;flex-shrink:0">${path}</svg>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const access = await requireActiveAccount(req);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  try {
    const { post, biz, palette, existingPosts = [], homepageUrl } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    if (!post?.title || !post?.content) {
      return res.status(400).json({ error: 'Post title and content are required' });
    }

    // ── 1. Generate slug ──────────────────────────────────────────────────────
    const bizSlug = (biz?.name || 'business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 20);
    const postSlug = (post.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
    const fullSlug = `${bizSlug}-${postSlug}`;

    // ── 2. Pick palette colours ───────────────────────────────────────────────
    const palettes = {
      ocean:    { primary:'#1E40AF', accent:'#06B6D4', bg:'#F0F9FF', dark:'#0C1A3D' },
      forest:   { primary:'#166534', accent:'#65A30D', bg:'#F0FDF4', dark:'#052E16' },
      sunset:   { primary:'#C2410C', accent:'#F59E0B', bg:'#FFF7ED', dark:'#431407' },
      rose:     { primary:'#9D174D', accent:'#F43F5E', bg:'#FFF1F2', dark:'#4C0519' },
      slate:    { primary:'#1E293B', accent:'#38BDF8', bg:'#F8FAFC', dark:'#020617' },
      violet:   { primary:'#5B21B6', accent:'#A78BFA', bg:'#F5F3FF', dark:'#1E0A47' },
      teal:     { primary:'#0F766E', accent:'#14B8A6', bg:'#F0FDFA', dark:'#042F2E' },
      copper:   { primary:'#92400E', accent:'#D97706', bg:'#FFFBEB', dark:'#1C0A00' },
      charcoal: { primary:'#111827', accent:'#EF4444', bg:'#F9FAFB', dark:'#030712' },
      sage:     { primary:'#4D7C0F', accent:'#A16207', bg:'#F7FEE7', dark:'#1A2E05' },
      navy:     { primary:'#1E3A5F', accent:'#D4AF37', bg:'#F8F9FA', dark:'#0A1628' },
      blush:    { primary:'#9D174D', accent:'#EC4899', bg:'#FDF2F8', dark:'#500724' },
    };
    const p = palettes[palette] || palettes.slate;

    // ── 3. Parse the blog post content into sections ──────────────────────────
    // Convert markdown-style headings to HTML
    const parseContent = (text) => {
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
    };

    const htmlContent = parseContent(post.content);
    const publishDate = new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' });
    const publishDateISO = new Date().toISOString().split('T')[0];

    // ── 4. Build the blog post page HTML ─────────────────────────────────────
    const postHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${post.meta_title || post.title} | ${biz?.name || 'Blog'}</title>
<meta name="description" content="${post.meta_desc || post.title}">
<meta property="og:title" content="${post.meta_title || post.title}">
<meta property="og:description" content="${post.meta_desc || post.title}">
<meta property="og:type" content="article">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Georgia:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:${p.bg};color:#111827;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:${p.primary};text-decoration:none}

/* NAV */
nav{background:rgba(255,255,255,0.95);backdrop-filter:blur(12px);border-bottom:1px solid #E5E7EB;padding:0 24px;position:sticky;top:0;z-index:100}
.nav-inner{max-width:1100px;margin:0 auto;height:64px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-size:1.1rem;font-weight:900;color:${p.primary};letter-spacing:-0.03em}
.nav-back{display:flex;align-items:center;gap:6px;font-size:0.85rem;font-weight:600;color:#6B7280;transition:color 0.15s}
.nav-back:hover{color:${p.primary}}

/* HERO */
.post-hero{background:linear-gradient(135deg,${p.dark} 0%,${p.primary} 100%);padding:72px 24px 56px;color:#fff}
.post-hero-inner{max-width:800px;margin:0 auto}
.post-category{display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:5px 14px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:20px;color:rgba(255,255,255,0.9)}
.post-hero h1{font-size:clamp(1.8rem,4vw,3rem);font-weight:900;letter-spacing:-0.04em;line-height:1.15;margin-bottom:20px}
.post-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
.post-meta-item{display:flex;align-items:center;gap:6px;font-size:0.8rem;color:rgba(255,255,255,0.7);font-weight:500}
.post-author-avatar{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:0.85rem;font-weight:800;color:#fff}

/* CONTENT */
.post-body{max-width:740px;margin:0 auto;padding:60px 24px 80px}
.post-body p{font-family:'Georgia',serif;font-size:1.08rem;line-height:1.85;color:#1F2937;margin-bottom:22px}
.post-body h2{font-family:'Inter',sans-serif;font-size:1.5rem;font-weight:800;color:${p.primary};letter-spacing:-0.03em;margin:40px 0 16px;line-height:1.25}
.post-body h3{font-family:'Inter',sans-serif;font-size:1.15rem;font-weight:700;color:#111827;margin:28px 0 12px}
.post-body ul,ol{padding-left:24px;margin-bottom:22px}
.post-body li{font-family:'Georgia',serif;font-size:1.05rem;line-height:1.8;color:#1F2937;margin-bottom:8px}
.post-body strong{font-weight:700;color:#111827}
.post-body br{display:block;margin-bottom:8px}

/* CTA box */
.post-cta{background:linear-gradient(135deg,${p.dark},${p.primary});border-radius:16px;padding:40px;text-align:center;margin:48px 0 0;color:#fff}
.post-cta h3{font-size:1.4rem;font-weight:900;letter-spacing:-0.03em;margin-bottom:10px}
.post-cta p{font-size:0.9rem;color:rgba(255,255,255,0.75);margin-bottom:24px;line-height:1.65}
.post-cta-btn{display:inline-block;padding:14px 32px;border-radius:99px;background:#fff;color:${p.primary};font-weight:800;font-size:0.95rem;cursor:pointer;border:none;transition:all 0.2s;text-decoration:none}
.post-cta-btn:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,0,0,0.2)}

/* Related / back */
.post-footer{background:#fff;border-top:1px solid #E5E7EB;padding:40px 24px}
.post-footer-inner{max-width:740px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.back-link{display:inline-flex;align-items:center;gap:6px;font-size:0.88rem;font-weight:700;color:${p.primary}}
.back-link:hover{opacity:0.8}

/* FOOTER */
footer{background:${p.dark};color:rgba(255,255,255,0.4);padding:28px 24px;text-align:center;font-size:0.78rem}
footer a{color:rgba(255,255,255,0.3);margin:0 8px}
footer a:hover{color:rgba(255,255,255,0.6)}
.powered{margin-top:8px;font-size:0.68rem}

@media(max-width:640px){
  .post-hero{padding:48px 16px 36px}
  .post-body{padding:40px 16px 60px}
  .post-cta{padding:28px 20px}
}
</style>
</head>
<body>

<nav>
  <div class="nav-inner">
    <div class="nav-logo">${biz?.name || 'Blog'}</div>
    <a href="/" class="nav-back">← Back to home</a>
  </div>
</nav>

<section class="post-hero">
  <div class="post-hero-inner">
    <div class="post-category">${svgIcon('pen',13)} ${biz?.suburb || 'Local'} Business Blog</div>
    <h1>${post.title}</h1>
    <div class="post-meta">
      <div class="post-meta-item">
        <div class="post-author-avatar">${(biz?.owner || 'A')[0]}</div>
        <span>${biz?.owner || 'The Team'} at ${biz?.name || 'us'}</span>
      </div>
      <div class="post-meta-item">${svgIcon('calendar',14)} ${publishDate}</div>
      <div class="post-meta-item">${svgIcon('mappin',14)} ${biz?.suburb || ''}</div>
    </div>
  </div>
</section>

<article class="post-body">
  ${htmlContent}

  <div class="post-cta">
    <h3>Ready to work with us?</h3>
    <p>${biz?.description || `${biz?.name} is here to help. Get in touch today.`}</p>
    <a href="/#contact" class="post-cta-btn">Get in Touch →</a>
  </div>
</article>

<div class="post-footer">
  <div class="post-footer-inner">
    <a href="/" class="back-link">← Back to ${biz?.name || 'home'}</a>
    <div style="font-size:0.78rem;color:#6B7280">Published ${publishDate} · ${biz?.suburb || ''}</div>
  </div>
</div>

<footer>
  <div>${biz?.name || 'Business'} · ${biz?.suburb || ''}</div>
  <div><a href="/">Home</a><a href="/#services">Services</a><a href="/#contact">Contact</a></div>
  <div class="powered"><a href="https://akus.com.au" target="_blank">Website & blog powered by ⚡ Akus</a></div>
</footer>

</body>
</html>`;

    // ── 5. Deploy the blog post page ──────────────────────────────────────────
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `akus-${fullSlug}`,
        files: [{ file: 'index.html', data: Buffer.from(postHTML).toString('base64'), encoding: 'base64' }],
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);
    const postUrl = `https://${deployData.alias?.[0] || deployData.url}`;

    // ── 6. Update the homepage to include latest posts ────────────────────────
    let updatedHomepageUrl = null;
    if (homepageUrl) {
      try {
        // Fetch current homepage
        const homeFetch = await fetch(homepageUrl);
        let homeHTML = await homeFetch.text();

        // Build the new post card
        const newPost = {
          title: post.title,
          url: postUrl,
          date: publishDate,
          excerpt: post.content.replace(/#{1,3}\s/g,'').replace(/\n/g,' ').slice(0, 120) + '...',
        };

        // Combine with existing posts (max 3)
        const allPosts = [newPost, ...existingPosts].slice(0, 3);

        // Build the blog section HTML
        const blogSectionHTML = `
<!-- BLOG SECTION — auto-generated by Akus -->
<section id="blog" style="padding:72px 24px;background:#fff">
  <div style="max-width:1100px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${p.accent};margin-bottom:10px">From Our Blog</div>
      <h2 style="font-size:clamp(1.6rem,3vw,2.4rem);font-weight:900;letter-spacing:-0.03em;color:#111827;line-height:1.2">Latest from ${biz?.name || 'us'}</h2>
      <p style="font-size:0.92rem;color:#6B7280;margin-top:10px">Tips, news and advice for locals in ${biz?.suburb || 'our area'}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">
      ${allPosts.map((p, i) => `
      <a href="${p.url}" style="display:block;background:${i===0?`linear-gradient(135deg,${palettes[palette||'slate'].dark},${palettes[palette||'slate'].primary})`:'#F8F9FA'};border-radius:16px;padding:28px;text-decoration:none;border:1px solid ${i===0?'transparent':'#E5E7EB'};transition:all 0.2s" onmouseover="this.style.transform='translateY(-3px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.1)'" onmouseout="this.style.transform='none';this.style.boxShadow='none'">
        <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:${i===0?'rgba(255,255,255,0.6)':'#9CA3AF'};margin-bottom:10px">${p.date}</div>
        <h3 style="font-size:1rem;font-weight:800;color:${i===0?'#fff':'#111827'};line-height:1.3;margin-bottom:10px;letter-spacing:-0.01em">${p.title}</h3>
        <p style="font-size:0.82rem;color:${i===0?'rgba(255,255,255,0.65)':'#6B7280'};line-height:1.65;margin-bottom:14px">${p.excerpt}</p>
        <span style="font-size:0.78rem;font-weight:700;color:${i===0?'rgba(255,255,255,0.8)':palettes[palette||'slate'].primary}">Read more →</span>
      </a>`).join('')}
    </div>
  </div>
</section>
<!-- END BLOG SECTION -->`;

        // Replace existing blog section or insert before footer
        if (homeHTML.includes('<!-- BLOG SECTION')) {
          homeHTML = homeHTML.replace(/<!-- BLOG SECTION[\s\S]*?<!-- END BLOG SECTION -->/g, blogSectionHTML);
        } else {
          homeHTML = homeHTML.replace('<footer', blogSectionHTML + '\n<footer');
        }

        // Redeploy homepage
        const homeSlug = (biz?.name || 'my-business').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
        const homeDeployRes = await fetch('https://api.vercel.com/v13/deployments', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `akus-${homeSlug}`,
            files: [{ file: 'index.html', data: Buffer.from(homeHTML).toString('base64'), encoding: 'base64' }],
            projectSettings: { framework: null },
            target: 'production',
          })
        });
        const homeDeployData = await homeDeployRes.json();
        if (!homeDeployData.error) {
          updatedHomepageUrl = `https://${homeDeployData.alias?.[0] || homeDeployData.url}`;
        }
      } catch(e) {
        console.error('Homepage update failed:', e.message);
        // Don't fail the whole request — post still published
      }
    }

    return res.status(200).json({
      success: true,
      postUrl,
      updatedHomepageUrl,
      post: {
        title: post.title,
        url: postUrl,
        date: publishDate,
        excerpt: post.content.replace(/#{1,3}\s/g,'').replace(/\n/g,' ').slice(0, 120) + '...',
      }
    });

  } catch(err) {
    console.error('Publish blog error:', err);
    return res.status(500).json({ error: err.message });
  }
}
