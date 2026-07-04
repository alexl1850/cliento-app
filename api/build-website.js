export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { intake } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    // ── 1. Detect business type ────────────────────────────────────────────
    const bizStr = `${intake.services || ''} ${intake.biz_name || ''} ${intake.difference || ''}`.toLowerCase();
    const isFood    = /café|cafe|restaurant|food|snack|bar|bakery|pizza|burger|sushi|takeaway|bistro|diner|eatery|coffee/.test(bizStr);
    const isBeauty  = /hair|salon|beauty|spa|nail|massage|wax|skin|facial|barber|lash|brow/.test(bizStr);
    const isTrade   = /plumb|electri|build|carpent|constr|paint|tiler|roofer|landscap|garden|handyman/.test(bizStr);
    const isHealth  = /physio|chiro|dentist|doctor|medical|health|fitness|gym|yoga|pilates|wellness/.test(bizStr);
    const isRetail  = /shop|store|retail|boutique|market|gift|clothe|fashion|jewel/.test(bizStr);
    const isPet     = /pet|dog|cat|groom|vet|animal/.test(bizStr);

    // ── 2. Get Unsplash hero image based on business type ─────────────────
    const unsplashQuery = isFood ? 'cafe restaurant food australia'
      : isBeauty ? 'hair salon beauty australia'
      : isTrade  ? 'tradesperson plumber builder australia'
      : isHealth ? 'physiotherapy wellness health australia'
      : isRetail ? 'retail shop boutique australia'
      : isPet    ? 'pet grooming dog cat australia'
      : `${intake.services || 'local business'} australia`;

    let heroImageUrl = '';
    let galleryImages = [];
    try {
      const unsplashRes = await fetch(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(unsplashQuery)}&count=6&orientation=landscape`,
        { headers: { 'Authorization': 'Client-ID 3aRHNKLFpMI3KCHFn_N9Py1FQqVjdFj1WwUxwDmAEFk' } }
      );
      const imgs = await unsplashRes.json();
      if (Array.isArray(imgs) && imgs.length > 0) {
        heroImageUrl = imgs[0].urls.regular;
        galleryImages = imgs.slice(1, 5).map(img => img.urls.regular);
      }
    } catch(e) {
      // Fallback to Picsum if Unsplash fails
      const seed = Math.abs(intake.biz_name.split('').reduce((a,c) => a + c.charCodeAt(0), 0)) % 1000;
      heroImageUrl = `https://picsum.photos/seed/${seed}/1920/1080`;
      galleryImages = [1,2,3,4].map(n => `https://picsum.photos/seed/${seed+n}/800/600`);
    }

    // ── 3. Generate AI content ─────────────────────────────────────────────
    const bizPersonality = isFood ? 'warm, mouth-watering, inviting — every word should make people hungry and excited to visit'
      : isBeauty ? 'luxurious, confidence-boosting, welcoming — make people feel transformed before they even arrive'
      : isTrade  ? 'trustworthy, expert, reliable — homeowners need to feel completely safe'
      : isHealth ? 'caring, professional, reassuring — patients need to feel in expert hands'
      : isRetail ? 'exciting, discovery-focused, inviting — make people want to browse right now'
      : 'warm, professional, community-focused';

    const contentRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: `You are a world-class website copywriter for Australian local businesses. 
Tone: ${bizPersonality}
Write copy that is VIVID, SPECIFIC, and sounds like a real person wrote it about THIS exact business.
Return ONLY valid JSON — no markdown, no code fences.`,
        messages: [{
          role: 'user',
          content: `Write stunning website copy for this Australian business.

Business: ${intake.biz_name}
Owner: ${intake.owner_name}
Location: ${intake.base_suburb}, Australia
Phone: ${intake.phone}
Email: ${intake.email}
Services/Products: ${intake.services}
Menu/Key items: ${intake.menu || 'See services above'}
What makes them different: ${intake.difference}
Ideal customer: ${intake.customer}
Years in business: ${intake.years}
Awards: ${intake.awards || 'None listed'}
Hours: ${intake.hours || 'Contact for hours'}
Address: ${intake.address || intake.base_suburb}
Special: ${intake.special_notes || 'None'}

${intake.menu ? `CRITICAL: Feature these specific items: ${intake.menu}` : ''}

Return this JSON (be vivid and specific, not generic):
{
  "meta_title": "Under 60 chars — business name + suburb + what they do",
  "meta_desc": "Under 155 chars — compelling description with location",
  "tagline": "6-8 word tagline specific to this business",
  "hero_headline": "Under 10 words. Powerful. Location-specific. ${isFood ? 'Make them hungry.' : isBeauty ? 'Make them feel pampered.' : isTrade ? 'Make them feel safe.' : 'Draw them in.'}",
  "hero_sub": "2 vivid sentences. ${isFood ? 'Atmosphere + signature items.' : isBeauty ? 'The experience + transformation.' : isTrade ? 'Trust + expertise.' : 'The feeling of being their customer.'} Include ${intake.base_suburb}.",
  "about_headline": "Warm headline about the business story",
  "about_story": "4 sentences. Personal story of ${intake.owner_name} and ${intake.biz_name}. Specific to ${intake.base_suburb}. Why they started. What drives them.",
  "services": [
    {"name": "specific service/item name", "desc": "2 vivid sentences. Specific benefit. Sensory details if food.", "icon": "emoji", "highlight": false},
    {"name": "...", "desc": "...", "icon": "emoji", "highlight": true},
    {"name": "...", "desc": "...", "icon": "emoji", "highlight": false}
  ],
  "trust_signals": ["signal with specific detail", "signal 2", "signal 3", "signal 4"],
  "why_us": [
    {"icon": "emoji", "point": "specific differentiator", "detail": "one sentence why this matters"},
    {"icon": "emoji", "point": "...", "detail": "..."},
    {"icon": "emoji", "point": "...", "detail": "..."},
    {"icon": "emoji", "point": "...", "detail": "..."}
  ],
  "cta_headline": "Warm, urgent call to action",
  "cta_sub": "One sentence removing hesitation",
  "years_badge": "Est. year or X years serving suburb",
  "review_count": "realistic number like 47 or 124",
  "testimonial_generated": "A realistic 2-sentence testimonial from a local customer. Specific, warm, mentions something specific about the business.",
  "testimonial_name": "Realistic Australian first name + suburb",
  "nav_cta": "${isFood ? 'Visit Us' : isBeauty ? 'Book Now' : isTrade ? 'Get a Quote' : 'Contact Us'}"
}`
        }]
      })
    });

    const contentData = await contentRes.json();
    if (contentData.error) throw new Error(contentData.error.message);
    const raw = contentData.content[0].text.replace(/```json|```/g, '').trim();
    const c = JSON.parse(raw);

    // ── 4. Get palette ─────────────────────────────────────────────────────
    const palettes = {
      ocean:    { primary:'#1E40AF', accent:'#0EA5E9', bg:'#F0F9FF', dark:'#0C1A3D', text:'#1E3A5F', light:'#E0F2FE' },
      forest:   { primary:'#166534', accent:'#65A30D', bg:'#F0FDF4', dark:'#052E16', text:'#14532D', light:'#DCFCE7' },
      sunset:   { primary:'#C2410C', accent:'#F59E0B', bg:'#FFF7ED', dark:'#431407', text:'#9A3412', light:'#FEF3C7' },
      rose:     { primary:'#9D174D', accent:'#F43F5E', bg:'#FFF1F2', dark:'#4C0519', text:'#881337', light:'#FFE4E6' },
      slate:    { primary:'#1E293B', accent:'#38BDF8', bg:'#F8FAFC', dark:'#020617', text:'#0F172A', light:'#E2E8F0' },
      violet:   { primary:'#5B21B6', accent:'#A78BFA', bg:'#F5F3FF', dark:'#1E0A47', text:'#4C1D95', light:'#EDE9FE' },
      teal:     { primary:'#0F766E', accent:'#14B8A6', bg:'#F0FDFA', dark:'#042F2E', text:'#134E4A', light:'#CCFBF1' },
      copper:   { primary:'#92400E', accent:'#D97706', bg:'#FFFBEB', dark:'#1C0A00', text:'#78350F', light:'#FEF3C7' },
      charcoal: { primary:'#111827', accent:'#EF4444', bg:'#F9FAFB', dark:'#030712', text:'#030712', light:'#F3F4F6' },
      sage:     { primary:'#4D7C0F', accent:'#A16207', bg:'#F7FEE7', dark:'#1A2E05', text:'#365314', light:'#ECFCCB' },
      navy:     { primary:'#1E3A5F', accent:'#D4AF37', bg:'#F8F9FA', dark:'#0A1628', text:'#1E3A5F', light:'#E8F0FE' },
      blush:    { primary:'#9D174D', accent:'#EC4899', bg:'#FDF2F8', dark:'#500724', text:'#831843', light:'#FCE7F3' },
    };
    const p = palettes[intake.palette] || palettes.slate;

    // ── 5. Build user photos ───────────────────────────────────────────────
    const userPhotos = intake.photo_urls || [];
    const allPhotos  = userPhotos.length > 0 ? userPhotos : galleryImages;

    // ── 6. Build the HTML ──────────────────────────────────────────────────
    const slug = (intake.biz_name || 'my-business').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.meta_title || intake.biz_name + ' — ' + intake.base_suburb}</title>
<meta name="description" content="${c.meta_desc || ''}">
<meta property="og:title" content="${c.meta_title || intake.biz_name}">
<meta property="og:description" content="${c.meta_desc || ''}">
<meta property="og:image" content="${heroImageUrl}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(p.primary)}'/><text y='72' x='50' text-anchor='middle' font-size='60' font-family='system-ui' font-weight='900' fill='white'>${(intake.biz_name||'B')[0].toUpperCase()}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#111827;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{text-decoration:none;color:inherit}
img{max-width:100%;height:auto;display:block}

/* ── ANIMATIONS ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes countUp{from{opacity:0}to{opacity:1}}
.reveal{opacity:0;transform:translateY(30px);transition:opacity 0.7s ease,transform 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-delay-1{transition-delay:0.1s}
.reveal-delay-2{transition-delay:0.2s}
.reveal-delay-3{transition-delay:0.3s}
.reveal-delay-4{transition-delay:0.4s}

/* ── NAV ── */
nav{position:fixed;top:0;left:0;right:0;z-index:1000;transition:all 0.3s}
nav.scrolled{background:rgba(255,255,255,0.97);backdrop-filter:blur(20px);box-shadow:0 1px 0 rgba(0,0,0,0.08)}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 24px;height:72px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:#fff;letter-spacing:-0.02em;transition:color 0.3s}
nav.scrolled .nav-logo{color:${p.primary}}
.nav-links{display:flex;align-items:center;gap:32px}
.nav-links a{font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.85);transition:color 0.2s}
nav.scrolled .nav-links a{color:#374151}
.nav-links a:hover{color:#fff}
nav.scrolled .nav-links a:hover{color:${p.primary}}
.nav-cta{background:${p.accent};color:#fff !important;padding:10px 24px;border-radius:99px;font-weight:700;font-size:0.85rem;transition:all 0.2s !important;box-shadow:0 4px 12px ${p.accent}44}
nav.scrolled .nav-cta{background:${p.primary};color:#fff !important}
.nav-cta:hover{transform:translateY(-1px);box-shadow:0 6px 20px ${p.accent}55 !important}
.nav-mobile-btn{display:none;background:none;border:none;cursor:pointer;padding:4px}
.nav-mobile-btn span{display:block;width:24px;height:2px;background:#fff;margin:5px 0;transition:all 0.3s}
nav.scrolled .nav-mobile-btn span{background:#111}

/* ── HERO ── */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
.hero-bg{position:absolute;inset:0;background-image:url('${heroImageUrl}');background-size:cover;background-position:center;transform:scale(1.05);animation:heroZoom 12s ease-in-out infinite alternate}
@keyframes heroZoom{from{transform:scale(1.05)}to{transform:scale(1.0)}}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.35) 60%,rgba(0,0,0,0.15) 100%)}
.hero-content{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:120px 24px 80px;width:100%}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:8px 18px;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.9);margin-bottom:24px;backdrop-filter:blur(12px);animation:fadeIn 0.8s ease}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:${p.accent};animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 ${p.accent}88}50%{box-shadow:0 0 0 8px transparent}}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(2.8rem,6vw,5.5rem);font-weight:900;line-height:1.05;color:#fff;letter-spacing:-0.02em;margin-bottom:24px;animation:fadeUp 0.9s ease 0.1s both;max-width:700px}
.hero h1 span{color:${p.accent};font-style:italic}
.hero-sub{font-size:clamp(1rem,2vw,1.2rem);color:rgba(255,255,255,0.82);max-width:540px;line-height:1.8;margin-bottom:40px;animation:fadeUp 0.9s ease 0.2s both}
.hero-btns{display:flex;gap:16px;flex-wrap:wrap;animation:fadeUp 0.9s ease 0.3s both}
.btn-hero-primary{display:inline-flex;align-items:center;gap:10px;background:${p.accent};color:#fff;padding:18px 36px;border-radius:99px;font-weight:800;font-size:1rem;transition:all 0.25s;box-shadow:0 8px 32px ${p.accent}55;letter-spacing:-0.01em}
.btn-hero-primary:hover{transform:translateY(-3px);box-shadow:0 16px 40px ${p.accent}66;color:#fff}
.btn-hero-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);color:#fff;padding:17px 32px;border-radius:99px;font-weight:700;font-size:0.95rem;border:2px solid rgba(255,255,255,0.3);backdrop-filter:blur(8px);transition:all 0.2s}
.btn-hero-secondary:hover{background:rgba(255,255,255,0.22);color:#fff}
.hero-stats{display:flex;gap:40px;margin-top:60px;flex-wrap:wrap;animation:fadeUp 0.9s ease 0.4s both}
.hero-stat-num{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;color:#fff;line-height:1;letter-spacing:-0.03em}
.hero-stat-label{font-size:0.75rem;color:rgba(255,255,255,0.55);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em}
.hero-scroll{position:absolute;bottom:32px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(255,255,255,0.5);font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;animation:fadeIn 1.5s ease 1s both}
.hero-scroll-line{width:1px;height:48px;background:linear-gradient(to bottom,transparent,rgba(255,255,255,0.4));animation:scrollLine 2s ease-in-out infinite}
@keyframes scrollLine{0%,100%{opacity:0;transform:scaleY(0);transform-origin:top}50%{opacity:1;transform:scaleY(1);transform-origin:top}}

/* ── TRUST BAR ── */
.trust{background:#fff;border-bottom:1px solid #F3F4F6;padding:20px 24px}
.trust-inner{max-width:1200px;margin:0 auto;display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:10px;font-size:0.85rem;font-weight:600;color:#374151}
.trust-icon{width:32px;height:32px;border-radius:50%;background:${p.light};display:flex;align-items:center;justify-content:center;font-size:1em;flex-shrink:0}

/* ── SECTIONS ── */
section{padding:96px 24px}
.s-inner{max-width:1200px;margin:0 auto}
.eyebrow{font-size:0.72rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${p.accent};margin-bottom:12px}
.section-h2{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3.2rem);font-weight:900;letter-spacing:-0.03em;line-height:1.15;color:#111827;margin-bottom:16px}
.section-h2 em{color:${p.primary};font-style:italic}
.section-sub{font-size:1rem;color:#6B7280;max-width:580px;line-height:1.8}

/* ── SERVICES / MENU ── */
.services{background:#fff}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:56px}
.service-card{border-radius:20px;padding:32px;transition:all 0.3s;cursor:default;position:relative;overflow:hidden}
.service-card.normal{background:#F9FAFB;border:1px solid #F3F4F6}
.service-card.featured{background:linear-gradient(135deg,${p.primary},${p.dark});color:#fff}
.service-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,0.12)}
.service-card.normal:hover{border-color:${p.primary}30}
.service-icon-wrap{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;margin-bottom:20px}
.service-card.normal .service-icon-wrap{background:${p.light}}
.service-card.featured .service-icon-wrap{background:rgba(255,255,255,0.15)}
.service-card h3{font-family:'Playfair Display',serif;font-size:1.15rem;font-weight:700;margin-bottom:10px;letter-spacing:-0.01em}
.service-card.normal h3{color:#111827}
.service-card.featured h3{color:#fff}
.service-card p{font-size:0.88rem;line-height:1.75}
.service-card.normal p{color:#6B7280}
.service-card.featured p{color:rgba(255,255,255,0.75)}
.service-tag{display:inline-flex;align-items:center;gap:6px;margin-top:20px;font-size:0.78rem;font-weight:700}
.service-card.normal .service-tag{color:${p.primary}}
.service-card.featured .service-tag{color:rgba(255,255,255,0.8)}

/* ── GALLERY ── */
.gallery{background:#111827;padding:0}
.gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:auto;gap:3px}
.gallery-grid img{width:100%;height:280px;object-fit:cover;display:block;transition:transform 0.4s,filter 0.4s;filter:brightness(0.9)}
.gallery-grid img:hover{transform:scale(1.04);filter:brightness(1.1);z-index:1;position:relative}
.gallery-grid img:first-child{grid-column:span 2;height:400px}

/* ── ABOUT ── */
.about{background:${p.bg}}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.about-image-wrap{position:relative}
.about-image{border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.18)}
.about-image img{width:100%;height:500px;object-fit:cover;display:block}
.about-badge{position:absolute;bottom:-24px;right:-24px;background:#fff;border-radius:20px;padding:24px;box-shadow:0 16px 48px rgba(0,0,0,0.12);text-align:center;min-width:140px}
.about-badge-num{font-family:'Playfair Display',serif;font-size:2.8rem;font-weight:900;color:${p.primary};line-height:1;letter-spacing:-0.04em}
.about-badge-label{font-size:0.72rem;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;margin-top:4px}
.about-text .eyebrow{margin-bottom:14px}
.about-story{font-size:1rem;color:#374151;line-height:1.9;margin-top:20px}
.about-story p{margin-bottom:16px}

/* ── WHY US ── */
.whyus{background:#fff}
.why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:56px}
.why-card{background:#F9FAFB;border:1px solid #F3F4F6;border-radius:20px;padding:32px;transition:all 0.3s}
.why-card:hover{background:${p.light};border-color:${p.primary}25;transform:translateY(-4px);box-shadow:0 12px 32px ${p.primary}15}
.why-icon{font-size:2rem;margin-bottom:16px}
.why-card h4{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:#111827;margin-bottom:8px}
.why-card p{font-size:0.88rem;color:#6B7280;line-height:1.7}

/* ── REVIEWS ── */
.reviews{background:${p.dark};padding:96px 24px}
.reviews-inner{max-width:1200px;margin:0 auto;text-align:center}
.stars-row{display:flex;justify-content:center;gap:4px;margin-bottom:8px}
.star{font-size:1.4rem;color:#FBBF24}
.reviews-num{font-family:'Playfair Display',serif;font-size:1rem;color:rgba(255,255,255,0.5);margin-bottom:64px}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;text-align:left}
.review-card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px;transition:all 0.3s}
.review-card:hover{background:rgba(255,255,255,0.09);transform:translateY(-4px)}
.review-stars{display:flex;gap:3px;margin-bottom:16px}
.review-star{font-size:0.9rem;color:#FBBF24}
.review-text{font-size:0.9rem;color:rgba(255,255,255,0.75);line-height:1.8;font-style:italic;margin-bottom:20px}
.review-author{display:flex;align-items:center;gap:12px}
.review-avatar{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,${p.accent},${p.primary});display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:0.9rem;flex-shrink:0}
.review-name{font-size:0.85rem;font-weight:700;color:#fff}
.review-location{font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:1px}

/* ── CTA ── */
.cta-section{background:linear-gradient(135deg,${p.primary} 0%,${p.dark} 100%);padding:120px 24px;text-align:center;position:relative;overflow:hidden}
.cta-bg-pattern{position:absolute;inset:0;background-image:radial-gradient(circle at 20% 50%,rgba(255,255,255,0.04) 1px,transparent 1px),radial-gradient(circle at 80% 50%,rgba(255,255,255,0.04) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
.cta-inner-wrap{position:relative;z-index:1;max-width:700px;margin:0 auto}
.cta-section h2{font-family:'Playfair Display',serif;font-size:clamp(2.2rem,5vw,4rem);font-weight:900;color:#fff;letter-spacing:-0.04em;line-height:1.1;margin-bottom:20px}
.cta-section p{font-size:1.05rem;color:rgba(255,255,255,0.72);margin-bottom:40px;line-height:1.75}
.cta-btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.btn-cta-primary{display:inline-flex;align-items:center;gap:10px;background:#fff;color:${p.primary};padding:18px 40px;border-radius:99px;font-weight:900;font-size:1rem;transition:all 0.25s;letter-spacing:-0.01em}
.btn-cta-primary:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.25);color:${p.primary}}
.btn-cta-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.1);color:#fff;padding:17px 32px;border-radius:99px;font-weight:700;border:2px solid rgba(255,255,255,0.25);transition:all 0.2s}
.btn-cta-secondary:hover{background:rgba(255,255,255,0.2);color:#fff}
.cta-pills{display:flex;gap:24px;justify-content:center;flex-wrap:wrap;margin-top:28px}
.cta-pill{font-size:0.8rem;color:rgba(255,255,255,0.6);display:flex;align-items:center;gap:6px;font-weight:600}
.cta-pill::before{content:'✓';font-weight:900;color:rgba(255,255,255,0.9)}

/* ── CONTACT ── */
.contact{background:#fff;padding:96px 24px}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
.contact-info{display:flex;flex-direction:column;gap:24px}
.contact-item{display:flex;gap:16px;align-items:flex-start}
.contact-item-icon{width:48px;height:48px;border-radius:14px;background:${p.light};display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
.contact-item-label{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;margin-bottom:4px}
.contact-item-value{font-size:1rem;font-weight:700;color:#111827}
.contact-map{border-radius:20px;overflow:hidden;height:340px;background:#F3F4F6;position:relative}
.contact-map iframe{width:100%;height:100%;border:none;display:block}
.contact-map-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:linear-gradient(135deg,${p.light},${p.bg})}
.contact-map-placeholder .map-icon{font-size:3rem}
.contact-map-placeholder p{font-size:0.88rem;color:#6B7280;font-weight:600}

/* ── FOOTER ── */
footer{background:#111827;padding:56px 24px 32px}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:32px;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,0.08)}
.footer-brand h3{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:#fff;margin-bottom:8px}
.footer-brand p{font-size:0.85rem;color:rgba(255,255,255,0.4);max-width:280px;line-height:1.7}
.footer-links-group h4{font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.4);margin-bottom:14px}
.footer-links-group a{display:block;font-size:0.88rem;color:rgba(255,255,255,0.6);margin-bottom:8px;transition:color 0.2s}
.footer-links-group a:hover{color:#fff}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:28px;flex-wrap:wrap;gap:12px}
.footer-bottom p{font-size:0.78rem;color:rgba(255,255,255,0.25)}
.powered{font-size:0.72rem;color:rgba(255,255,255,0.2)}
.powered a{color:rgba(255,255,255,0.35);font-weight:600}

/* ── RESPONSIVE ── */
@media(max-width:768px){
  nav .nav-links{display:none}
  .nav-mobile-btn{display:block}
  .hero h1{font-size:2.4rem}
  .about-grid,.contact-grid{grid-template-columns:1fr}
  .why-grid{grid-template-columns:1fr}
  .gallery-grid{grid-template-columns:1fr 1fr}
  .gallery-grid img:first-child{grid-column:span 2}
  .hero-stats{gap:24px}
  .about-badge{display:none}
  .footer-top{flex-direction:column}
}
@media(max-width:480px){
  section{padding:64px 16px}
  .services-grid{grid-template-columns:1fr}
  .gallery-grid{grid-template-columns:1fr}
  .gallery-grid img:first-child{grid-column:span 1}
  .cta-btns{flex-direction:column;align-items:center}
}
</style>
</head>
<body>

<!-- NAV -->
<nav id="mainNav">
  <div class="nav-inner">
    <div class="nav-logo">${intake.biz_name}</div>
    <div class="nav-links">
      <a href="#services">${isFood ? 'Menu' : 'Services'}</a>
      <a href="#about">About</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact">Contact</a>
      <a href="${intake.phone ? `tel:${intake.phone.replace(/\s/g,'')}` : '#contact'}" class="nav-cta">${c.nav_cta || 'Get in Touch'}</a>
    </div>
    <button class="nav-mobile-btn" onclick="document.querySelector('.nav-links').style.display=document.querySelector('.nav-links').style.display==='flex'?'none':'flex'">
      <span></span><span></span><span></span>
    </button>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-badge">
      <span class="hero-badge-dot"></span>
      📍 ${intake.base_suburb}, Australia
    </div>
    <h1>${c.hero_headline.replace(/([^.!?]+)/g, (m, g) => g.includes(intake.biz_name.split(' ')[0]) ? `<span>${g}</span>` : g)}</h1>
    <p class="hero-sub">${c.hero_sub}</p>
    <div class="hero-btns">
      ${intake.phone ? `<a href="tel:${intake.phone.replace(/\s/g,'')}" class="btn-hero-primary">📞 Call ${intake.phone}</a>` : ''}
      <a href="#services" class="btn-hero-secondary">${isFood ? '🍽️ View Menu' : isBeauty ? '✨ Our Services' : '📋 What We Do'} ↓</a>
    </div>
    <div class="hero-stats">
      <div>
        <div class="hero-stat-num">⭐ ${c.review_count || '50'}+</div>
        <div class="hero-stat-label">Happy customers</div>
      </div>
      <div>
        <div class="hero-stat-num">${c.years_badge?.match(/\d+/)?.[0] || '5'}+</div>
        <div class="hero-stat-label">Years serving ${intake.base_suburb}</div>
      </div>
      <div>
        <div class="hero-stat-num">100%</div>
        <div class="hero-stat-label">Local & independent</div>
      </div>
    </div>
  </div>
  <div class="hero-scroll">
    <span>Scroll</span>
    <div class="hero-scroll-line"></div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust">
  <div class="trust-inner">
    ${(c.trust_signals || []).map(s => `
    <div class="trust-item reveal">
      <div class="trust-icon">✓</div>
      <span>${s}</span>
    </div>`).join('')}
  </div>
</div>

<!-- SERVICES / MENU -->
<section class="services" id="services">
  <div class="s-inner">
    <div class="reveal">
      <div class="eyebrow">${isFood ? 'Our Menu' : isBeauty ? 'Our Services' : isTrade ? 'What We Do' : 'What We Offer'}</div>
      <h2 class="section-h2">${isFood ? `Taste what makes <em>${intake.biz_name}</em> special` : `How we help <em>you</em>`}</h2>
      <p class="section-sub">${c.about_intro || ''}</p>
    </div>
    <div class="services-grid">
      ${(c.services || []).map((s, i) => `
      <div class="service-card ${s.highlight ? 'featured' : 'normal'} reveal reveal-delay-${(i%4)+1}">
        <div class="service-icon-wrap">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <div class="service-tag">${isFood ? '🍴 Order now' : isBeauty ? '📅 Book this' : isTrade ? '💬 Get a quote' : '→ Learn more'}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- GALLERY -->
${allPhotos.length > 0 ? `
<section class="gallery">
  <div class="gallery-grid">
    ${allPhotos.slice(0,5).map(url => `<img src="${url}" alt="${intake.biz_name}" loading="lazy">`).join('')}
  </div>
</section>` : ''}

<!-- ABOUT -->
<section class="about" id="about">
  <div class="s-inner">
    <div class="about-grid">
      <div class="about-image-wrap reveal">
        <div class="about-image">
          <img src="${allPhotos[1] || heroImageUrl}" alt="${intake.biz_name} — ${intake.base_suburb}" loading="lazy">
        </div>
        <div class="about-badge">
          <div class="about-badge-num">${c.years_badge?.match(/\d+/)?.[0] || '5'}+</div>
          <div class="about-badge-label">Years in ${intake.base_suburb}</div>
        </div>
      </div>
      <div class="about-text reveal reveal-delay-2">
        <div class="eyebrow">Our Story</div>
        <h2 class="section-h2">${c.about_headline || `Meet <em>${intake.biz_name}</em>`}</h2>
        <div class="about-story">
          <p>${c.about_story || ''}</p>
        </div>
        ${intake.phone ? `<div style="margin-top:32px"><a href="tel:${intake.phone.replace(/\s/g,'')}" style="display:inline-flex;align-items:center;gap:10px;background:${p.primary};color:#fff;padding:16px 32px;border-radius:12px;font-weight:800;font-size:0.95rem;transition:all 0.2s">📞 Call ${intake.phone}</a></div>` : ''}
      </div>
    </div>
  </div>
</section>

<!-- WHY US -->
<section class="whyus">
  <div class="s-inner">
    <div style="text-align:center;margin-bottom:0" class="reveal">
      <div class="eyebrow">Why Choose Us</div>
      <h2 class="section-h2" style="margin:0 auto">Why locals choose <em>${intake.biz_name}</em></h2>
    </div>
    <div class="why-grid">
      ${(c.why_us || []).map((w, i) => `
      <div class="why-card reveal reveal-delay-${(i%4)+1}">
        <div class="why-icon">${w.icon}</div>
        <h4>${w.point}</h4>
        <p>${w.detail}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- REVIEWS -->
<section class="reviews" id="reviews">
  <div class="reviews-inner">
    <div class="reveal">
      <div class="stars-row">${'⭐'.repeat(5)}</div>
      <p class="reviews-num">Rated 5 stars by ${c.review_count || '50'}+ customers in ${intake.base_suburb}</p>
      <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,3vw,2.8rem);font-weight:900;color:#fff;letter-spacing:-0.03em;margin-bottom:48px">What our customers say</h2>
    </div>
    <div class="reviews-grid">
      ${[
        { text: c.testimonial_generated || `Absolutely love ${intake.biz_name}. ${intake.owner_name} and the team are fantastic.`, name: c.testimonial_name || 'Sarah M.', location: intake.base_suburb },
        { text: `Best in ${intake.base_suburb} by far. I've been coming here for years and wouldn't go anywhere else. Highly recommend!`, name: 'James T.', location: intake.base_suburb },
        { text: `${intake.biz_name} is everything you want in a local ${isFood ? 'café' : isBeauty ? 'salon' : 'business'}. Professional, friendly and always delivers.`, name: 'Michelle K.', location: intake.base_suburb },
      ].map(r => `
      <div class="review-card reveal">
        <div class="review-stars">${'⭐'.repeat(5)}</div>
        <p class="review-text">"${r.text}"</p>
        <div class="review-author">
          <div class="review-avatar">${r.name[0]}</div>
          <div>
            <div class="review-name">${r.name}</div>
            <div class="review-location">📍 ${r.location}</div>
          </div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-section">
  <div class="cta-bg-pattern"></div>
  <div class="cta-inner-wrap reveal">
    <div class="eyebrow" style="color:rgba(255,255,255,0.6);margin-bottom:16px">${intake.base_suburb}, Australia</div>
    <h2>${c.cta_headline || `Ready to experience ${intake.biz_name}?`}</h2>
    <p>${c.cta_sub || `We'd love to hear from you. Get in touch today.`}</p>
    <div class="cta-btns">
      ${intake.phone ? `<a href="tel:${intake.phone.replace(/\s/g,'')}" class="btn-cta-primary">📞 Call ${intake.phone}</a>` : ''}
      <a href="#contact" class="btn-cta-secondary">Send a message →</a>
    </div>
    <div class="cta-pills">
      <div class="cta-pill">No lock-in contracts</div>
      <div class="cta-pill">Fast response</div>
      <div class="cta-pill">Locally owned</div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section class="contact" id="contact">
  <div class="s-inner">
    <div class="contact-grid">
      <div class="reveal">
        <div class="eyebrow">Get in Touch</div>
        <h2 class="section-h2">We'd love to <em>hear from you</em></h2>
        <p class="section-sub" style="margin-bottom:40px">${c.contact_intro || `Come visit us in ${intake.base_suburb} or get in touch below.`}</p>
        <div class="contact-info">
          ${intake.phone ? `<div class="contact-item"><div class="contact-item-icon">📞</div><div><div class="contact-item-label">Phone</div><a href="tel:${intake.phone.replace(/\s/g,'')}" class="contact-item-value" style="color:${p.primary}">${intake.phone}</a></div></div>` : ''}
          ${intake.email ? `<div class="contact-item"><div class="contact-item-icon">✉️</div><div><div class="contact-item-label">Email</div><a href="mailto:${intake.email}" class="contact-item-value" style="color:${p.primary}">${intake.email}</a></div></div>` : ''}
          ${intake.address ? `<div class="contact-item"><div class="contact-item-icon">📍</div><div><div class="contact-item-label">Address</div><div class="contact-item-value">${intake.address}, ${intake.base_suburb}</div></div></div>` : `<div class="contact-item"><div class="contact-item-icon">📍</div><div><div class="contact-item-label">Location</div><div class="contact-item-value">${intake.base_suburb}, Australia</div></div></div>`}
          ${intake.hours ? `<div class="contact-item"><div class="contact-item-icon">🕐</div><div><div class="contact-item-label">Hours</div><div class="contact-item-value">${intake.hours}</div></div></div>` : ''}
        </div>
      </div>
      <div class="contact-map reveal reveal-delay-2">
        ${intake.address ? `
        <iframe
          src="https://maps.google.com/maps?q=${encodeURIComponent((intake.address || '') + ' ' + intake.base_suburb + ' Australia')}&output=embed&z=15"
          loading="lazy"
          title="${intake.biz_name} location"
          allowfullscreen>
        </iframe>` : `
        <div class="contact-map-placeholder">
          <div class="map-icon">📍</div>
          <p>Located in ${intake.base_suburb}, Australia</p>
          <a href="https://maps.google.com/?q=${encodeURIComponent(intake.biz_name + ' ' + intake.base_suburb)}" target="_blank" style="color:${p.primary};font-weight:700;font-size:0.88rem">Open in Google Maps →</a>
        </div>`}
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <h3>${intake.biz_name}</h3>
        <p>${c.footer_tagline || `Proudly serving ${intake.base_suburb} and surrounds.`}</p>
        ${intake.phone ? `<p style="margin-top:12px"><a href="tel:${intake.phone.replace(/\s/g,'')}" style="color:rgba(255,255,255,0.6);font-weight:600">📞 ${intake.phone}</a></p>` : ''}
      </div>
      <div class="footer-links-group">
        <h4>Navigate</h4>
        <a href="#services">${isFood ? 'Menu' : 'Services'}</a>
        <a href="#about">About Us</a>
        <a href="#reviews">Reviews</a>
        <a href="#contact">Contact</a>
      </div>
      ${intake.fb || intake.ig ? `<div class="footer-links-group">
        <h4>Follow Us</h4>
        ${intake.fb ? `<a href="${intake.fb}" target="_blank" rel="noopener">Facebook</a>` : ''}
        ${intake.ig ? `<a href="${intake.ig}" target="_blank" rel="noopener">Instagram</a>` : ''}
      </div>` : ''}
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${intake.biz_name} · ${intake.base_suburb}, Australia</p>
      <div class="powered"><a href="https://akus.com.au" target="_blank">Website by ⚡ Akus</a></div>
    </div>
  </div>
</footer>

<script>
// Sticky nav
const nav = document.getElementById('mainNav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObs.observe(el));

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});
</script>
</body>
</html>`;

    // ── 7. Deploy to Vercel ────────────────────────────────────────────────
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `akus-${slug}`,
        files: [{ file: 'index.html', data: Buffer.from(html).toString('base64'), encoding: 'base64' }],
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);
    const liveUrl = `https://${deployData.alias?.[0] || deployData.url}`;

    return res.status(200).json({ success: true, url: liveUrl, deployId: deployData.id, slug, html });

  } catch (err) {
    console.error('Build website error:', err);
    return res.status(500).json({ error: err.message });
  }
}
