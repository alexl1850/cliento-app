export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { intake, auditData } = req.body;
    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;

    // ── 1. Generate AI content from all 15 answers ─────────────────
    const contentRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: `You are a world-class website copywriter specialising in Australian local businesses. 
Write copy that is warm, genuine, locally specific, and conversion-focused. 
Use the owner's name and make it feel like a real person wrote it.
Return ONLY valid JSON — no markdown, no code fences, nothing else.`,
        messages: [{
          role: 'user',
          content: `Write stunning website copy for this Australian local business. Use ALL the information provided.

BUSINESS DETAILS:
Business name: ${intake.biz_name}
Owner: ${intake.owner_name}
Location: ${intake.base_suburb}
Service area: ${intake.service_area}
Phone: ${intake.phone}
Email: ${intake.email}
Years in business: ${intake.years}
Services: ${intake.services}
What makes them different: ${intake.difference}
Ideal customer: ${intake.customer}
Awards/certifications: ${intake.awards || 'None listed'}
${auditData ? `Existing website audit: ${auditData}` : ''}

Return this exact JSON structure — be specific, warm, and locally relevant throughout:
{
  "tagline": "Powerful 6-8 word tagline — specific to what they do and where",
  "hero_headline": "Compelling headline that mentions their suburb/location naturally. Under 10 words. Not a question.",
  "hero_sub": "2 sentences expanding on the headline. Mentions their service area. Makes the reader feel understood.",
  "about_intro": "Opening sentence — hook that draws people in",
  "about_body": "3 paragraphs about the business. Paragraph 1: the story and how they started. Paragraph 2: what they stand for and how they work. Paragraph 3: personal touch from the owner, mention their name, mention their suburb, invite people to get in touch. Each paragraph 3-4 sentences. Warm, genuine, human.",
  "services": [
    {"name": "exact service name from intake", "desc": "2 sentences — what the service involves and the specific benefit to the customer. Specific, not generic.", "icon": "relevant emoji"},
    {"name": "...", "desc": "...", "icon": "..."},
    {"name": "...", "desc": "...", "icon": "..."}
  ],
  "why_us": [
    {"point": "Specific differentiator — not generic. Use the info from 'what makes them different'", "detail": "One sentence expanding on this point"},
    {"point": "...", "detail": "..."},
    {"point": "...", "detail": "..."},
    {"point": "...", "detail": "..."}
  ],
  "years_badge": "Est. [year they started] or '[X] years serving [suburb]'",
  "cta_headline": "Strong call to action headline — creates urgency or desire",
  "cta_sub": "One sentence — removes hesitation, mentions free quote / fast response / no obligation",
  "trust_signals": ["signal 1", "signal 2", "signal 3", "signal 4"],
  "meta_title": "SEO title — under 60 chars, includes business name and suburb",
  "meta_desc": "SEO description — under 155 chars, includes location and main service, has a call to action"
}`
        }]
      })
    });

    const contentData = await contentRes.json();
    if (contentData.error) throw new Error(contentData.error.message);
    
    const raw = contentData.content[0].text.replace(/```json|```/g, '').trim();
    const content = JSON.parse(raw);

    // ── 2. Get palette ─────────────────────────────────────────────
    const palettes = {
      ocean:    { primary:"#1E40AF", accent:"#06B6D4", bg:"#F0F9FF", dark:"#0C1A3D", text:"#1E3A5F" },
      forest:   { primary:"#166534", accent:"#65A30D", bg:"#F0FDF4", dark:"#052E16", text:"#14532D" },
      sunset:   { primary:"#C2410C", accent:"#F59E0B", bg:"#FFF7ED", dark:"#431407", text:"#9A3412" },
      rose:     { primary:"#9D174D", accent:"#F43F5E", bg:"#FFF1F2", dark:"#4C0519", text:"#881337" },
      slate:    { primary:"#1E293B", accent:"#38BDF8", bg:"#F8FAFC", dark:"#020617", text:"#0F172A" },
      violet:   { primary:"#5B21B6", accent:"#A78BFA", bg:"#F5F3FF", dark:"#1E0A47", text:"#4C1D95" },
      teal:     { primary:"#0F766E", accent:"#14B8A6", bg:"#F0FDFA", dark:"#042F2E", text:"#134E4A" },
      copper:   { primary:"#92400E", accent:"#D97706", bg:"#FFFBEB", dark:"#1C0A00", text:"#78350F" },
      charcoal: { primary:"#111827", accent:"#EF4444", bg:"#F9FAFB", dark:"#030712", text:"#030712" },
      sage:     { primary:"#4D7C0F", accent:"#A16207", bg:"#F7FEE7", dark:"#1A2E05", text:"#365314" },
      navy:     { primary:"#1E3A5F", accent:"#D4AF37", bg:"#F8F9FA", dark:"#0A1628", text:"#1E3A5F" },
      blush:    { primary:"#9D174D", accent:"#EC4899", bg:"#FDF2F8", dark:"#500724", text:"#831843" },
    };
    const p = palettes[intake.palette] || palettes.slate;

    // ── 3. Build testimonials array ────────────────────────────────
    const testimonials = [intake.testimonial_1, intake.testimonial_2, intake.testimonial_3]
      .filter(t => t && t.trim());

    // ── 4. Build photo gallery HTML ────────────────────────────────
    const photos = intake.photo_urls || [];

    // ── 5. Build the full HTML website ────────────────────────────
    const slug = intake.biz_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'my-business';
    const html = buildHTML({ content, intake, p, photos, testimonials, slug });

    // ── 6. Deploy to Vercel ────────────────────────────────────────
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `cliento-${slug}`,
        files: [{ file: 'index.html', data: Buffer.from(html).toString('base64'), encoding: 'base64' }],
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);

    const liveUrl = `https://${deployData.alias?.[0] || deployData.url}`;

    return res.status(200).json({ success: true, url: liveUrl, deployId: deployData.id, slug });

  } catch (err) {
    console.error('Build website error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════════════
// THE WEBSITE TEMPLATE
// ════════════════════════════════════════════════════════════════════════
function buildHTML({ content:c, intake:i, p, photos, testimonials, slug }) {
  const hasPhotos = photos.length > 0;
  const hasLogo = !!i.logo_url;
  const hasTestimonials = testimonials.length > 0;
  const hasSocials = i.fb || i.ig || i.tiktok;

  const photoGrid = hasPhotos ? `
<section style="padding:0;background:${p.bg}">
  <div style="display:grid;grid-template-columns:${photos.length===1?'1fr':photos.length===2?'1fr 1fr':photos.length<=4?'repeat(2,1fr)':'repeat(3,1fr)'};gap:4px;max-height:560px;overflow:hidden">
    ${photos.slice(0,6).map((url,idx) => `
    <div style="overflow:hidden;aspect-ratio:${idx===0&&photos.length>=3?'auto':'1'};${idx===0&&photos.length>=3?'grid-row:span 2':''};background:#f0f0f0">
      <img src="${url}" alt="${i.biz_name} photo ${idx+1}" loading="lazy"
        style="width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.4s"
        onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'"/>
    </div>`).join('')}
  </div>
</section>` : '';

  const testimonialsHTML = hasTestimonials ? `
<section style="padding:80px 24px;background:${p.dark}">
  <div style="max-width:1100px;margin:0 auto">
    <div style="text-align:center;margin-bottom:48px">
      <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${p.accent};margin-bottom:10px">What Customers Say</div>
      <h2 style="font-size:clamp(1.6rem,3vw,2.2rem);font-weight:900;color:#fff;letter-spacing:-0.03em">Real people. Real results.</h2>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px">
      ${testimonials.map(t => `
      <div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:28px">
        <div style="font-size:1.4em;margin-bottom:12px;color:${p.accent}">★★★★★</div>
        <p style="font-size:0.92rem;color:rgba(255,255,255,0.85);line-height:1.75;font-style:italic">"${t.replace(/^["']|["']$/g,'').trim()}"</p>
      </div>`).join('')}
    </div>
  </div>
</section>` : '';

  const awardsHTML = i.awards ? `
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:24px">
      ${i.awards.split('\n').filter(a=>a.trim()).map(a=>`
      <div style="display:inline-flex;align-items:center;gap:7px;background:${p.bg};border:1px solid ${p.primary}30;border-radius:99px;padding:8px 14px;font-size:0.78rem;font-weight:700;color:${p.text}">
        🏆 ${a.trim()}
      </div>`).join('')}
    </div>` : '';

  const socialsHTML = hasSocials ? `
    <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap">
      ${i.fb?`<a href="${i.fb}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-size:0.8rem;font-weight:600;text-decoration:none;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)';this.style.color='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)';this.style.color='rgba(255,255,255,0.7)'">📘 Facebook</a>`:''}
      ${i.ig?`<a href="${i.ig}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-size:0.8rem;font-weight:600;text-decoration:none;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)';this.style.color='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)';this.style.color='rgba(255,255,255,0.7)'">📸 Instagram</a>`:''}
      ${i.tiktok?`<a href="${i.tiktok}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:8px;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.7);font-size:0.8rem;font-weight:600;text-decoration:none;transition:all 0.2s" onmouseover="this.style.borderColor='rgba(255,255,255,0.4)';this.style.color='#fff'" onmouseout="this.style.borderColor='rgba(255,255,255,0.15)';this.style.color='rgba(255,255,255,0.7)'">🎵 TikTok</a>`:''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${c.meta_title}</title>
<meta name="description" content="${c.meta_desc}">
<meta property="og:title" content="${c.meta_title}">
<meta property="og:description" content="${c.meta_desc}">
<meta property="og:type" content="website">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:${p.bg};color:${p.text};line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:${p.primary};text-decoration:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-family:'Inter',system-ui,sans-serif;font-weight:800;transition:all 0.2s;text-decoration:none}
.btn-primary{background:${p.accent};color:#fff;padding:16px 32px;border-radius:12px;font-size:1rem;box-shadow:0 4px 20px ${p.accent}44}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 8px 32px ${p.accent}55;color:#fff}
.btn-secondary{background:rgba(255,255,255,0.12);color:#fff;padding:15px 28px;border-radius:12px;font-size:0.95rem;border:2px solid rgba(255,255,255,0.25)}
.btn-secondary:hover{background:rgba(255,255,255,0.22);color:#fff}
.btn-outline{background:transparent;color:${p.primary};padding:14px 28px;border-radius:12px;font-size:0.95rem;border:2px solid ${p.primary}}
.btn-outline:hover{background:${p.primary};color:#fff}

/* NAV */
nav{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.96);backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,0.06);padding:0 24px}
.nav-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:68px}
.nav-logo{display:flex;align-items:center;gap:10px}
.nav-logo img{height:36px;width:auto;object-fit:contain}
.nav-logo-text{font-size:1.2rem;font-weight:900;color:${p.primary};letter-spacing:-0.03em}
.nav-phone{display:flex;align-items:center;gap:6px;font-size:0.88rem;font-weight:700;color:${p.text}}
.nav-phone span:first-child{font-size:1em}
.nav-cta{background:${p.primary};color:#fff;padding:10px 22px;border-radius:9px;font-size:0.875rem;font-weight:800;border:none;cursor:pointer;transition:all 0.2s}
.nav-cta:hover{opacity:0.9;transform:translateY(-1px)}

/* HERO */
.hero{background:linear-gradient(135deg,${p.dark} 0%,${p.primary} 60%,color-mix(in srgb,${p.primary} 60%,${p.accent}) 100%);color:#fff;padding:100px 24px 80px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;inset:0;background:url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat}
.hero-inner{max-width:800px;margin:0 auto;text-align:center;position:relative;z-index:1}
.hero-tag{display:inline-flex;align-items:center;gap:7px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.22);border-radius:99px;padding:7px 16px;font-size:0.78rem;font-weight:700;letter-spacing:0.05em;margin-bottom:28px;backdrop-filter:blur(8px)}
.hero h1{font-size:clamp(2.2rem,5.5vw,4rem);font-weight:900;letter-spacing:-0.04em;line-height:1.08;margin-bottom:22px}
.hero h1 em{font-style:normal;color:${p.accent}}
.hero p{font-size:clamp(1rem,2vw,1.2rem);color:rgba(255,255,255,0.82);max-width:600px;margin:0 auto 40px;line-height:1.75}
.hero-btns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.hero-years{display:inline-flex;align-items:center;gap:8px;margin-top:32px;font-size:0.8rem;color:rgba(255,255,255,0.55);font-weight:600}
.hero-years strong{color:rgba(255,255,255,0.9)}

/* TRUST BAR */
.trust{background:#fff;border-bottom:1px solid rgba(0,0,0,0.06);padding:18px 24px}
.trust-inner{max-width:1120px;margin:0 auto;display:flex;justify-content:center;gap:32px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:8px;font-size:0.83rem;font-weight:600;color:#6B7280}
.trust-item .icon{font-size:1.1em}

/* SERVICES */
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px;margin-top:48px}
.service-card{background:#fff;border:1px solid rgba(0,0,0,0.06);border-radius:16px;padding:30px;transition:all 0.25s;box-shadow:0 2px 8px rgba(0,0,0,0.04)}
.service-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(0,0,0,0.1);border-color:${p.primary}30}
.service-icon{font-size:2rem;margin-bottom:14px;display:block}
.service-card h3{font-size:1.05rem;font-weight:800;color:${p.text};margin-bottom:10px;letter-spacing:-0.01em}
.service-card p{font-size:0.88rem;color:#6B7280;line-height:1.7}
.service-tag{display:inline-block;margin-top:14px;font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:${p.primary};background:${p.bg};border:1px solid ${p.primary}30;border-radius:99px;padding:4px 10px}

/* WHY US */
.why-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:48px}
.why-card{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:24px;display:flex;gap:16px;align-items:flex-start}
.why-icon{width:36px;height:36px;border-radius:9px;background:${p.accent};display:flex;align-items:center;justify-content:center;font-size:1em;flex-shrink:0;font-weight:900;color:#fff}
.why-card h4{font-size:0.95rem;font-weight:800;color:#fff;margin-bottom:5px;letter-spacing:-0.01em}
.why-card p{font-size:0.82rem;color:rgba(255,255,255,0.65);line-height:1.6}

/* ABOUT */
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
.about-text h2{font-size:clamp(1.6rem,3vw,2.4rem);font-weight:900;letter-spacing:-0.03em;margin-bottom:8px;color:${p.text}}
.about-text .intro{font-size:1.1rem;font-weight:600;color:${p.primary};margin-bottom:20px;line-height:1.5}
.about-text p{font-size:0.9rem;color:#6B7280;line-height:1.85;margin-bottom:14px}
.about-visual{background:linear-gradient(135deg,${p.primary},${p.dark});border-radius:24px;padding:40px;color:#fff;position:relative;overflow:hidden}
.about-visual::after{content:'';position:absolute;bottom:-20px;right:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.06)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:24px}
.stat-box{background:rgba(255,255,255,0.1);border-radius:12px;padding:16px;text-align:center}
.stat-num{font-size:2rem;font-weight:900;color:#fff;line-height:1;letter-spacing:-0.03em}
.stat-label{font-size:0.7rem;color:rgba(255,255,255,0.6);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em}

/* CTA */
.cta{background:linear-gradient(135deg,${p.accent},color-mix(in srgb,${p.accent} 65%,${p.dark}));padding:90px 24px;text-align:center;color:#fff}
.cta h2{font-size:clamp(1.8rem,4vw,3.2rem);font-weight:900;letter-spacing:-0.04em;margin-bottom:14px;line-height:1.15}
.cta p{font-size:1rem;color:rgba(255,255,255,0.82);margin-bottom:36px;max-width:520px;margin-left:auto;margin-right:auto}
.cta-pills{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:22px}
.cta-pill{font-size:0.78rem;color:rgba(255,255,255,0.75);display:flex;align-items:center;gap:5px;font-weight:600}
.cta-pill::before{content:'✓';font-weight:900;color:rgba(255,255,255,0.95)}

/* CONTACT */
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;margin-top:48px}
.contact-card{background:#fff;border:1px solid rgba(0,0,0,0.07);border-radius:16px;padding:24px;display:flex;align-items:center;gap:16px;transition:all 0.2s}
.contact-card:hover{border-color:${p.primary}40;box-shadow:0 4px 16px rgba(0,0,0,0.07)}
.contact-icon{width:44px;height:44px;border-radius:11px;background:${p.bg};border:1px solid ${p.primary}20;display:flex;align-items:center;justify-content:center;font-size:1.2em;flex-shrink:0}
.contact-label{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9CA3AF;margin-bottom:3px}
.contact-value{font-size:1rem;font-weight:700;color:${p.text}}
.contact-map{background:linear-gradient(135deg,${p.bg},#fff);border:1px solid rgba(0,0,0,0.07);border-radius:16px;padding:48px 32px;text-align:center}
.contact-map .pin{font-size:3em;margin-bottom:16px;display:block}
.contact-map h3{font-size:1.3rem;font-weight:900;color:${p.primary};margin-bottom:6px}
.contact-map p{font-size:0.88rem;color:#6B7280;line-height:1.6}

/* FOOTER */
footer{background:${p.dark};color:rgba(255,255,255,0.5);padding:40px 24px 28px}
.footer-inner{max-width:1120px;margin:0 auto}
.footer-logo-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.footer-logo-row img{height:28px;filter:brightness(0) invert(1);opacity:0.7}
.footer-biz{font-size:1.05rem;font-weight:900;color:#fff}
.footer-tagline{font-size:0.82rem;color:rgba(255,255,255,0.4);margin-bottom:20px}
.footer-bottom{display:flex;justify-content:space-between;align-items:center;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08);flex-wrap:wrap;gap:10px}
.footer-bottom p{font-size:0.76rem}
.footer-links{display:flex;gap:20px;flex-wrap:wrap}
.footer-links a{font-size:0.76rem;color:rgba(255,255,255,0.35);transition:color 0.2s}
.footer-links a:hover{color:#fff}

/* POWERED BY */
.powered-by{background:${p.dark};border-top:1px solid rgba(255,255,255,0.05);padding:10px 24px;text-align:center}
.powered-by a{font-size:0.68rem;color:rgba(255,255,255,0.2);font-weight:600;letter-spacing:0.04em;text-decoration:none}
.powered-by a:hover{color:rgba(255,255,255,0.45)}

/* RESPONSIVE */
@media(max-width:768px){
  .why-grid{grid-template-columns:1fr}
  .about-grid{grid-template-columns:1fr}
  .about-visual{display:none}
  .contact-grid{grid-template-columns:1fr}
  .hero{padding:80px 16px 60px}
  .section{padding:60px 16px}
  nav{padding:0 14px}
  .trust-inner{gap:16px}
  .footer-bottom{flex-direction:column;align-items:flex-start}
}
@media(max-width:480px){
  .hero-btns{flex-direction:column;align-items:center}
  .btn-primary,.btn-secondary{width:100%;max-width:300px}
  .services-grid{grid-template-columns:1fr}
  .nav-phone{display:none}
}
.section{padding:80px 24px}
.section-dark{background:${p.primary};color:#fff}
.section-white{background:#fff}
.s-inner{max-width:1120px;margin:0 auto}
.section-tag{font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${p.accent};margin-bottom:10px}
.section-dark .section-tag{color:rgba(255,255,255,0.5)}
h2.section-title{font-size:clamp(1.6rem,3vw,2.5rem);font-weight:900;letter-spacing:-0.03em;line-height:1.2;color:${p.text}}
.section-dark h2{color:#fff}
h2.section-title em{font-style:normal;color:${p.primary}}
.section-dark h2 em{color:${p.accent}}
.section-sub{font-size:0.95rem;color:#6B7280;max-width:560px;margin-top:12px;line-height:1.75}
.section-dark .section-sub{color:rgba(255,255,255,0.6)}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-inner">
    <div class="nav-logo">
      ${hasLogo ? `<img src="${i.logo_url}" alt="${i.biz_name} logo">` : `<span class="nav-logo-text">${i.biz_name}</span>`}
    </div>
    <div class="nav-phone">
      <span>📞</span>
      <a href="tel:${i.phone.replace(/\s/g,'')}" style="color:${p.text};font-weight:700;font-size:0.9rem">${i.phone}</a>
    </div>
    <a href="#contact" class="btn nav-cta" style="color:#fff">Get in Touch</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-inner">
    <div class="hero-tag">📍 ${i.base_suburb}</div>
    <h1>${c.hero_headline.includes('<em>') ? c.hero_headline : c.hero_headline}</h1>
    <p>${c.hero_sub}</p>
    <div class="hero-btns">
      <a href="tel:${i.phone.replace(/\s/g,'')}" class="btn btn-primary">📞 Call ${i.phone}</a>
      <a href="#services" class="btn btn-secondary">Our Services ↓</a>
    </div>
    <div class="hero-years">
      <strong>${c.years_badge}</strong>
      &nbsp;·&nbsp; Serving ${i.service_area}
    </div>
  </div>
</section>

<!-- TRUST BAR -->
<div class="trust">
  <div class="trust-inner">
    ${c.trust_signals.map(s => `<div class="trust-item"><span class="icon">✓</span> ${s}</div>`).join('')}
  </div>
</div>

${photoGrid}

<!-- SERVICES -->
<section class="section section-white" id="services">
  <div class="s-inner">
    <div class="section-tag">What We Do</div>
    <h2 class="section-title">How we can help <em>you</em></h2>
    <p class="section-sub">${c.about_intro}</p>
    <div class="services-grid">
      ${c.services.map(s => `
      <div class="service-card">
        <span class="service-icon">${s.icon}</span>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <span class="service-tag">Learn more →</span>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- WHY US -->
<section class="section section-dark">
  <div class="s-inner">
    <div class="section-tag">Why Choose Us</div>
    <h2 class="section-title" style="color:#fff">Why <em>${i.biz_name}</em>?</h2>
    <p class="section-sub">${c.cta_sub}</p>
    <div class="why-grid">
      ${c.why_us.map(w => `
      <div class="why-card">
        <div class="why-icon">✓</div>
        <div>
          <h4>${w.point}</h4>
          <p>${w.detail}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

${testimonialsHTML}

<!-- ABOUT -->
<section class="section section-white" id="about">
  <div class="s-inner">
    <div class="about-grid">
      <div class="about-text">
        <div class="section-tag">About Us</div>
        <h2 class="section-title">Meet <em>${i.owner_name}</em><br>& the team</h2>
        ${c.about_body.split('\n\n').filter(p=>p.trim()).map(para=>`<p>${para.trim()}</p>`).join('')}
        ${awardsHTML}
        <div style="margin-top:28px;display:flex;gap:10px;flex-wrap:wrap">
          <a href="tel:${i.phone.replace(/\s/g,'')}" class="btn btn-primary">📞 Call Now</a>
          <a href="mailto:${i.email}" class="btn btn-outline">✉️ Email Us</a>
        </div>
      </div>
      <div class="about-visual">
        <div style="font-size:0.7rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.5);margin-bottom:16px">Our numbers</div>
        <div class="stat-grid">
          <div class="stat-box"><div class="stat-num">📍</div><div class="stat-label">${i.base_suburb}</div></div>
          <div class="stat-box"><div class="stat-num">⭐</div><div class="stat-label">5 Star Service</div></div>
          <div class="stat-box" style="grid-column:1/-1"><div style="font-size:1.1rem;font-weight:800;color:#fff;margin-bottom:6px">${c.years_badge}</div><div class="stat-label">Locally trusted, locally owned</div></div>
        </div>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1)">
          <div style="font-size:0.8rem;color:rgba(255,255,255,0.6);line-height:1.6">📍 Servicing ${i.service_area}</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta">
  <div class="s-inner">
    <h2>${c.cta_headline}</h2>
    <p>${c.cta_sub}</p>
    <a href="tel:${i.phone.replace(/\s/g,'')}" class="btn" style="background:#fff;color:${p.accent};padding:18px 36px;border-radius:12px;font-size:1.05rem;box-shadow:0 4px 24px rgba(0,0,0,0.2)">
      📞 Call ${i.phone}
    </a>
    <div class="cta-pills">
      <div class="cta-pill">Fast response</div>
      <div class="cta-pill">Local experts</div>
      <div class="cta-pill">Quality guaranteed</div>
      <div class="cta-pill">No obligation</div>
    </div>
  </div>
</section>

<!-- CONTACT -->
<section class="section section-white" id="contact">
  <div class="s-inner">
    <div class="section-tag">Get in Touch</div>
    <h2 class="section-title">Ready to get <em>started?</em></h2>
    <p class="section-sub">We'd love to hear from you. Reach out and we'll get back to you as soon as possible.</p>
    <div class="contact-grid">
      <div style="display:flex;flex-direction:column;gap:12px">
        <a href="tel:${i.phone.replace(/\s/g,'')}" class="contact-card" style="text-decoration:none">
          <div class="contact-icon">📞</div>
          <div><div class="contact-label">Phone</div><div class="contact-value">${i.phone}</div></div>
        </a>
        <a href="mailto:${i.email}" class="contact-card" style="text-decoration:none">
          <div class="contact-icon">✉️</div>
          <div><div class="contact-label">Email</div><div class="contact-value">${i.email}</div></div>
        </a>
        <div class="contact-card">
          <div class="contact-icon">📍</div>
          <div><div class="contact-label">Location</div><div class="contact-value">${i.base_suburb}</div></div>
        </div>
        <div class="contact-card">
          <div class="contact-icon">🗺️</div>
          <div><div class="contact-label">Service Area</div><div class="contact-value" style="font-size:0.88rem">${i.service_area}</div></div>
        </div>
      </div>
      <div class="contact-map">
        <span class="pin">📍</span>
        <h3>${i.biz_name}</h3>
        <p>${i.base_suburb}, NSW, Australia</p>
        <p style="margin-top:8px;font-size:0.82rem;color:#9CA3AF">Servicing ${i.service_area}</p>
        <div style="margin-top:24px">
          <a href="tel:${i.phone.replace(/\s/g,'')}" class="btn btn-primary" style="width:100%;justify-content:center">
            📞 Call Us Now
          </a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div class="footer-logo-row">
      ${hasLogo ? `<img src="${i.logo_url}" alt="${i.biz_name}">` : ''}
      <span class="footer-biz">${i.biz_name}</span>
    </div>
    <p class="footer-tagline">${c.tagline} · ${i.base_suburb}, NSW</p>
    ${socialsHTML}
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${i.biz_name} · ${i.base_suburb}, NSW, Australia</p>
      <div class="footer-links">
        <a href="#services">Services</a>
        <a href="#about">About</a>
        <a href="#contact">Contact</a>
        <a href="tel:${i.phone.replace(/\s/g,'')}">📞 ${i.phone}</a>
      </div>
    </div>
  </div>
</footer>

<div class="powered-by">
  <a href="https://cliento.com.au" target="_blank">Website built with ⚡ Cliento · Australia's marketing platform for local business</a>
</div>

<script>
// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const target=document.querySelector(a.getAttribute('href'));
    if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth',block:'start'});}
  });
});
// Sticky nav shadow
window.addEventListener('scroll',()=>{
  document.querySelector('nav').style.boxShadow=window.scrollY>20?'0 4px 24px rgba(0,0,0,0.1)':'none';
},{passive:true});
</script>
</body>
</html>`;
}
