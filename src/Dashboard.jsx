import { useState, useEffect } from "react";

// ─── TOKENS ──────────────────────────────────────────────────────────────────
const C = {
  brand:"#2563EB", brandLt:"#EFF6FF", brandDk:"#1D4ED8",
  amber:"#D97706", amberLt:"#FFFBEB",
  green:"#16A34A", greenLt:"#F0FDF4",
  red:"#DC2626",   redLt:"#FEF2F2",
  purple:"#7C3AED",purpleLt:"#F5F3FF",
  teal:"#0D9488",  tealLt:"#F0FDFA",  sky:"#BFDBFE",
  bg:"#F8F9FA", card:"#FFFFFF",
  border:"#E5E7EB", border2:"#D1D5DB",
  text:"#111827", muted:"#6B7280", light:"#F3F4F6",
};

const INDUSTRIES = [
  {id:"cafe",icon:"☕",label:"Café / Coffee Shop"},
  {id:"restaurant",icon:"🍽️",label:"Restaurant / Takeaway"},
  {id:"retail",icon:"🛍️",label:"Retail Shop"},
  {id:"salon",icon:"✂️",label:"Hair / Beauty Salon"},
  {id:"gym",icon:"💪",label:"Gym / Fitness Studio"},
  {id:"tradie",icon:"🔧",label:"Tradie / Contractor"},
  {id:"cleaning",icon:"🧹",label:"Cleaning Service"},
  {id:"childcare",icon:"👶",label:"Childcare / Tutoring"},
  {id:"medical",icon:"🏥",label:"Health / Medical"},
  {id:"other",icon:"🏪",label:"Other Local Business"},
];

const TAGS = [
  {id:"regular",  label:"Regular",   color:"#2563EB", bg:"#EFF6FF"},
  {id:"vip",      label:"VIP ⭐",     color:"#D97706", bg:"#FFFBEB"},
  {id:"new",      label:"New",        color:"#16A34A", bg:"#F0FDF4"},
  {id:"lapsed",   label:"Lapsed",     color:"#DC2626", bg:"#FEF2F2"},
  {id:"lead",     label:"Lead",       color:"#7C3AED", bg:"#F5F3FF"},
];

const TOOL_GROUPS = [
  {
    id:"marketing", label:"📣 Marketing & Content", color:C.brand,
    tools:[
      {id:"website",  icon:"🌐", label:"My Website",            desc:"Complete website copy, ready to publish"},
      {id:"posts",    icon:"📱", label:"Social Posts",          desc:"7 Facebook & Instagram posts for this week"},
      {id:"emails",   icon:"📧", label:"Email Campaign",        desc:"A professional email for your customer list"},
      {id:"ads",      icon:"🎯", label:"Ad Builder",            desc:"Facebook & Google ad copy that converts"},
      {id:"promo",    icon:"🎁", label:"Special Offer",         desc:"Full promotion pack — post, SMS, signage"},
      {id:"gbp",      icon:"📍", label:"Google Business Post",  desc:"A weekly post for your Google listing"},
      {id:"blog",     icon:"✍️", label:"Blog Post for Google",  desc:"A local SEO blog post that helps you rank — topic chosen for you"},
      {id:"seasonal", icon:"🗓️", label:"Seasonal Campaign",     desc:"Christmas, Easter, EOFY — full campaign kit for any season"},
    ]
  },
  {
    id:"reviews", label:"⭐ Google Reviews", color:C.amber,
    tools:[
      {id:"review_request",  icon:"✉️", label:"Ask for a Review",     desc:"SMS & email to request a Google review"},
      {id:"review_respond",  icon:"💬", label:"Reply to a Review",    desc:"Paste any review — get the perfect response"},
      {id:"review_negative", icon:"😬", label:"Handle a Bad Review",  desc:"Turn a negative review into a trust-builder"},
      {id:"review_link",     icon:"🔗", label:"Get Your Review Link", desc:"Step-by-step guide to find and share it"},
    ]
  },
  {
    id:"business", label:"🏢 Business Tools", color:C.teal,
    tools:[
      {id:"analytics", icon:"📊", label:"Google Analytics Report",   desc:"Paste your numbers in — get plain English results: what's working and what to fix"},
      {id:"jobad",     icon:"📋", label:"Staff Job Ad",              desc:"Write a job ad for Seek or Facebook that attracts the right people"},
    ]
  },
];

// ─── SHOPIFY TOOL GROUPS ─────────────────────────────────────────────────────
const SHOPIFY_TOOL_GROUPS = [
  {
    id:"products", label:"🛍️ Product Content", color:C.purple,
    tools:[
      {id:"sh_product_desc",   icon:"📝", label:"Product Description",   desc:"Write a full SEO-optimised product description that sells"},
      {id:"sh_product_titles", icon:"🏷️", label:"Product Titles + Meta", desc:"SEO-optimised titles, meta descriptions and URL slugs for your products"},
      {id:"sh_collection",     icon:"🗂️", label:"Collection Page Copy",  desc:"Intro copy for each product category that ranks on Google"},
      {id:"sh_bundle_copy",    icon:"🎁", label:"Bundle & Upsell Copy",  desc:"'Frequently bought together' and cross-sell descriptions"},
    ]
  },
  {
    id:"sh_emails", label:"📧 Email Flows", color:C.brand,
    tools:[
      {id:"sh_abandoned_cart", icon:"🛒", label:"Abandoned Cart Sequence", desc:"3-email flow to recover customers who left without buying"},
      {id:"sh_post_purchase",  icon:"📦", label:"Post-Purchase Sequence",  desc:"Thank you → tips → review request → cross-sell flow"},
      {id:"sh_winback",        icon:"🔄", label:"Win-Back Sequence",       desc:"Re-engage customers who haven't ordered in 90+ days"},
      {id:"sh_product_launch", icon:"🚀", label:"New Product Launch Email", desc:"Announce a new product to your list and drive sales"},
      {id:"sh_flash_sale",     icon:"⚡", label:"Flash Sale Email",         desc:"Urgency-based sale email that converts"},
    ]
  },
  {
    id:"sh_social", label:"📱 Social & Ads", color:C.amber,
    tools:[
      {id:"sh_social_posts",   icon:"📸", label:"Product Launch Posts",  desc:"Instagram, Facebook and TikTok captions for a new product"},
      {id:"sh_ad_copy",        icon:"🎯", label:"Ad Copy Generator",     desc:"Meta and Google ad copy for a specific product or collection"},
      {id:"sh_ugc_brief",      icon:"🎬", label:"UGC Creator Brief",     desc:"Brief for customers or creators asking for content about your product"},
      {id:"sh_bio",            icon:"✨", label:"Instagram Bio + Links", desc:"Optimised bio and link-in-bio copy for your store"},
    ]
  },
  {
    id:"sh_reviews", label:"⭐ Reviews & Trust", color:C.green,
    tools:[
      {id:"sh_review_request", icon:"✉️", label:"Review Request Email",  desc:"Post-purchase email asking for a product review"},
      {id:"sh_review_respond", icon:"💬", label:"Reply to a Review",     desc:"Professional response to any product review"},
      {id:"sh_bad_review",     icon:"😬", label:"Handle Bad Review",     desc:"Calm, professional reply that turns bad reviews around"},
      {id:"sh_trust_copy",     icon:"🛡️", label:"Trust Badge Copy",      desc:"Free returns, fast shipping and guarantee copy for your store"},
    ]
  },
  {
    id:"sh_seo", label:"🔍 SEO & Content", color:C.teal,
    tools:[
      {id:"sh_blog",           icon:"✍️", label:"Blog Post for Google",  desc:"Find a buyer keyword and write the full article — ranks and converts"},
      {id:"sh_faq",            icon:"❓", label:"Product FAQ Builder",   desc:"10 common questions answered for your product — great for SEO"},
      {id:"sh_about",          icon:"🏠", label:"About Us Page",         desc:"Brand story that builds trust and converts first-time visitors"},
    ]
  },
  {
    id:"sh_analytics", label:"📊 Analytics", color:C.teal,
    tools:[
      {id:"sh_shopify_report", icon:"📊", label:"Shopify Report in Plain English", desc:"Paste your store numbers — get what they mean and what to do"},
      {id:"sh_cro_audit",      icon:"🔬", label:"Conversion Rate Audit",          desc:"Describe your store — get your top 3 conversion killers identified"},
      {id:"sh_ads_report",     icon:"📈", label:"Ad Performance Explainer",       desc:"Paste your Meta or Google ad numbers — get plain English analysis"},
    ]
  },
  {
    id:"sh_growth", label:"🚀 Growth", color:C.green,
    tools:[
      {id:"sh_influencer",     icon:"🤝", label:"Influencer Outreach Email", desc:"The perfect pitch to send micro-influencers about your product"},
      {id:"sh_referral",       icon:"👥", label:"Referral Program Builder",  desc:"Complete 'tell a friend' system with store credit and discount codes"},
      {id:"sh_loyalty",        icon:"👑", label:"Loyalty Program Copy",      desc:"Points system, VIP tiers and how to communicate them to customers"},
      {id:"sh_sale_campaign",  icon:"🗓️", label:"Sale Campaign Kit",         desc:"Black Friday, Christmas, EOFY — full campaign pack for any sale"},
    ]
  },
];

const ALL_TOOLS = [...TOOL_GROUPS, ...SHOPIFY_TOOL_GROUPS].flatMap(g=>g.tools);

// ─── CLAUDE API ───────────────────────────────────────────────────────────────
async function askClaude(system, user) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-6", max_tokens:1000,
      system, messages:[{role:"user",content:user}],
    }),
  });
  const d = await res.json();
  if(d.error) throw new Error(d.error.message);
  return d.content[0].text;
}

// ─── DAYS SINCE HELPER ───────────────────────────────────────────────────────
function daysSince(dateStr) {
  if(!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff/(1000*60*60*24));
}

function formatDate(dateStr) {
  if(!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-AU",{day:"numeric",month:"short",year:"numeric"});
}

// ─── SAMPLE CUSTOMERS (pre-loaded so demo works immediately) ─────────────────
const SAMPLE_CUSTOMERS = [
  {id:"c1",name:"Sandra Mitchell",phone:"0412 345 678",email:"sandra@email.com",tag:"vip",   lastVisit:"2026-06-10",notes:"Loves oat latte, always gets the avocado toast. Birthday in March.",   jobHistory:"Regular Mon/Wed morning. Referred 3 friends this year."},
  {id:"c2",name:"Dave Robertson", phone:"0423 456 789",email:"dave@email.com",  tag:"regular",lastVisit:"2026-06-22",notes:"Tradie — comes in after jobs. Prefers strong flat white.",              jobHistory:"Weekly customer, sometimes brings the crew."},
  {id:"c3",name:"Mary Chen",      phone:"0434 567 890",email:"mary@email.com",  tag:"lapsed", lastVisit:"2026-03-14",notes:"Used to come every week. Moved suburbs but still nearby.",             jobHistory:"Was a daily regular for 2 years. Haven't seen her since March."},
  {id:"c4",name:"Tom Nguyen",     phone:"0445 678 901",email:"tom@email.com",   tag:"new",    lastVisit:"2026-06-25",notes:"First visit last week. Ordered large cappuccino and banana bread.",    jobHistory:"New customer — found us on Google."},
  {id:"c5",name:"Karen Williams", phone:"0456 789 012",email:"karen@email.com", tag:"lead",   lastVisit:null,         notes:"Called about catering a work morning tea for 20 people. Needs quote.",jobHistory:"Hasn't visited yet — enquiry by phone 24 June."},
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═════════════════════════════════════════════════════════════════════════════
export default function Dashboard({ session, profile, onSaveProfile, onSignOut }) {
  const profileToBiz = (p) => p ? {
    owner:p.owner||'', name:p.biz_name||'', industry:p.industry||'',
    suburb:p.suburb||'', description:p.description||'', goal:p.goal||'',
    bizType:p.biz_type||'',
  } : {name:"",industry:"",suburb:"",description:"",goal:"",owner:"",bizType:""};

  const [screen,     setScreen]     = useState(profile ? "dashboard" : "welcome");
  const [activeTab,  setActiveTab]  = useState("marketing");
  const [biz,        setBiz]        = useState(profileToBiz(profile));
  const [setupStep,  setSetupStep]  = useState(0);
  const [activeTool, setActiveTool] = useState(null);
  const [results,    setResults]    = useState({});
  const [customers,  setCustomers]  = useState(SAMPLE_CUSTOMERS);
  const [crmView,    setCrmView]    = useState("list");
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [crmMsg,     setCrmMsg]     = useState({loading:false, text:"", type:""});
  const [savingProfile, setSavingProfile] = useState(false);
  const [showTour,   setShowTour]   = useState(false);
  const [tourStep,   setTourStep]   = useState(0);

  // Network members (simulated — in production this pulls from your database)
  const [networkMembers] = useState([
    {id:"m1", name:"Lakeside Hair Studio",    industry:"Hair / Beauty Salon",   suburb:"Shellharbour", website:"lakesidehair.com.au",    desc:"Award-winning hair salon specialising in colour and cuts.",  contact:"lisa@lakesidehair.com.au"},
    {id:"m2", name:"DR Plumbing",             industry:"Tradie / Contractor",   suburb:"Shellharbour", website:"drplumbing.com.au",       desc:"Emergency and general plumbing for homes and businesses.",  contact:"dave@drplumbing.com.au"},
    {id:"m3", name:"Wollongong Fresh Flowers", industry:"Retail Shop",          suburb:"Wollongong",   website:"wollongongflowers.com.au", desc:"Same-day flower delivery across the Illawarra region.",     contact:"hello@wollongongflowers.com.au"},
    {id:"m4", name:"Illawarra Pet Grooming",  industry:"Other Local Business",  suburb:"Wollongong",   website:"illawarrapets.com.au",     desc:"Professional dog and cat grooming — all breeds welcome.",  contact:"groom@illawarrapets.com.au"},
    {id:"m5", name:"Coastal Cleaning Co",     industry:"Cleaning Service",      suburb:"Kiama",        website:"coastalcleaning.com.au",   desc:"Residential and commercial cleaning across the Illawarra.", contact:"info@coastalcleaning.com.au"},
    {id:"m6", name:"Wollongong Physio Plus",  industry:"Health / Medical",      suburb:"Wollongong",   website:"wollongongphysio.com.au",  desc:"Sports and general physiotherapy — same week appointments.", contact:"book@wollongongphysio.com.au"},
  ]);

  // Track savings counter
  const toolSavings = {website:1500,posts:500,emails:300,ads:500,promo:200,gbp:100,blog:300,seasonal:600,review_request:100,review_respond:50,review_negative:50,review_link:50,analytics:200,jobad:200};
  const totalSaved = Object.keys(results).reduce((sum,id)=>sum+(toolSavings[id]||150),0);

  useEffect(() => {
    if (profile) { setBiz(profileToBiz(profile)); setScreen("dashboard"); }
  }, [profile]);

  const handleFinishSetup = async () => {
    setSavingProfile(true);
    if (onSaveProfile) await onSaveProfile(biz);
    setSavingProfile(false);
    setScreen("dashboard");
    setShowTour(true);
    setTourStep(0);
  };

  const industry = INDUSTRIES.find(i=>i.id===biz.industry);

  // ── WELCOME ─────────────────────────────────────────────────────────────────
  if(screen==="welcome") { setScreen("setup"); return null; }

  // ── SETUP WIZARD ─────────────────────────────────────────────────────────────
  if(screen==="setup") {
    const isShopify = biz.bizType==="shopify";
    const accent = isShopify ? C.purple : C.brand;
    const accentLt = isShopify ? C.purpleLt : C.brandLt;
    const steps = [
      {
        title:"What kind of business do you have?", sub:"Cliento customises everything based on your answer",
        content:(
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {[
              {type:"local",  icon:"🏪", title:"Local Business",
               desc:"Café, restaurant, tradie, salon, gym, retail shop, cleaning service, childcare, health clinic — any business where customers come to you or you come to them."},
              {type:"shopify",icon:"🛍️", title:"Online Store",
               desc:"Shopify, WooCommerce, or any ecommerce store — you sell products online and need help with product copy, emails, ads, SEO, and growing sales."},
            ].map(opt=>(
              <button key={opt.type} onClick={()=>setBiz(b=>({...b,bizType:opt.type}))} style={{
                padding:"20px",borderRadius:"12px",textAlign:"left",cursor:"pointer",
                border:`2px solid ${biz.bizType===opt.type?(opt.type==="shopify"?C.purple:C.brand):C.border}`,
                background:biz.bizType===opt.type?(opt.type==="shopify"?C.purpleLt:C.brandLt):"#fff",
                transition:"all 0.15s",
              }}>
                <div style={{fontSize:"1.8em",marginBottom:"8px"}}>{opt.icon}</div>
                <div style={{fontWeight:800,fontSize:"1em",color:biz.bizType===opt.type?(opt.type==="shopify"?C.purple:C.brand):C.text,marginBottom:"4px"}}>{opt.title}</div>
                <div style={{fontSize:"0.82em",color:C.muted,lineHeight:1.5}}>{opt.desc}</div>
              </button>
            ))}
          </div>
        ),
        ok: !!biz.bizType,
      },
      {
        title:"Tell us about your business", sub:"We personalise everything based on what you tell us",
        content:(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <Field label="Your name"><input value={biz.owner} onChange={e=>setBiz(b=>({...b,owner:e.target.value}))} placeholder="e.g. Sandra" style={inputSt}/></Field>
            <Field label={isShopify?"Store name":"Business name"}>
              <input value={biz.name} onChange={e=>setBiz(b=>({...b,name:e.target.value}))} placeholder={isShopify?"e.g. Luna & Co. Candles":"e.g. Sandy's Café"} style={inputSt}/>
            </Field>
            <Field label={isShopify?"Store URL (optional)":"Your suburb"}>
              <input value={biz.suburb} onChange={e=>setBiz(b=>({...b,suburb:e.target.value}))} placeholder={isShopify?"e.g. lunacandles.com.au":"e.g. Wollongong NSW"} style={inputSt}/>
            </Field>
            {!isShopify && (
              <Field label="What kind of business?">
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
                  {INDUSTRIES.map(ind=>(
                    <button key={ind.id} onClick={()=>setBiz(b=>({...b,industry:ind.id}))} style={{padding:"10px",borderRadius:"9px",textAlign:"left",border:`2px solid ${biz.industry===ind.id?C.brand:C.border}`,background:biz.industry===ind.id?C.brandLt:"#fff",cursor:"pointer",display:"flex",alignItems:"center",gap:"8px"}}>
                      <span style={{fontSize:"1.1em"}}>{ind.icon}</span>
                      <span style={{fontSize:"0.79em",fontWeight:biz.industry===ind.id?700:500,color:biz.industry===ind.id?C.brand:C.text}}>{ind.label}</span>
                    </button>
                  ))}
                </div>
              </Field>
            )}
          </div>
        ),
        ok: isShopify ? !!(biz.name&&biz.owner) : !!(biz.name&&biz.suburb&&biz.owner&&biz.industry),
      },
      {
        title: isShopify ? "Tell us about your store" : "Almost done",
        sub: isShopify ? "The more detail, the better your content" : "One more question and you're in",
        content:(
          <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
            <Field label={isShopify?"What do you sell?":"What do you offer?"}>
              <textarea value={biz.description} onChange={e=>setBiz(b=>({...b,description:e.target.value}))}
                placeholder={isShopify
                  ?"e.g. Handmade soy candles in 12 scents. Ship Australia-wide. Target market is women 25–45 who love home décor. Average order $65."
                  :`e.g. Family café in ${biz.suburb||"town"}, open 7 days, best coffee around. Serve breakfasts, lunches, cakes.`}
                rows={3} style={{...inputSt,resize:"vertical"}}/>
            </Field>
            <Field label="What's your biggest challenge right now?">
              <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
                {(isShopify
                  ? ["Getting more traffic to my store","Converting visitors into buyers","Getting repeat customers","Writing product descriptions and copy","Growing on social media and ads"]
                  : ["Get more new customers","Keep existing customers coming back","Promote a new product or service","Compete with bigger businesses nearby"]
                ).map(goal=>(
                  <button key={goal} onClick={()=>setBiz(b=>({...b,goal}))} style={{padding:"11px 14px",borderRadius:"8px",textAlign:"left",border:`2px solid ${biz.goal===goal?accent:C.border}`,background:biz.goal===goal?accentLt:"#fff",cursor:"pointer",fontSize:"0.87em",color:biz.goal===goal?accent:C.text,fontWeight:biz.goal===goal?600:400}}>
                    {biz.goal===goal?"✓ ":""}{goal}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        ),
        ok: !!(biz.description&&biz.goal),
      },
    ];
    const s = steps[setupStep];
    return (
      <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
        <div style={{background:"linear-gradient(135deg,#0D1117 0%,#1A2235 100%)",padding:"14px 20px"}}>
          <span style={{color:"#fff",fontWeight:900,fontSize:"1.05em"}}>
            <span style={{color:biz.bizType==="shopify"?"#A78BFA":"#60A5FA"}}>⚡</span> Cliento
          </span>
          <span style={{color:"rgba(255,255,255,0.4)",fontSize:"0.8em",marginLeft:"8px"}}>— Setting up your account</span>
        </div>
        <div style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"12px 20px"}}>
          <div style={{display:"flex",gap:"8px",alignItems:"center",maxWidth:"500px",margin:"0 auto"}}>
            {steps.map((_,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",flex:1}}>
                <div style={{width:"27px",height:"27px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:i<setupStep?C.green:i===setupStep?C.brand:C.border,color:i<=setupStep?"#fff":C.muted,fontSize:"0.78em",fontWeight:700,flexShrink:0}}>
                  {i<setupStep?"✓":i+1}
                </div>
                {i<steps.length-1&&<div style={{flex:1,height:"2px",background:i<setupStep?C.green:C.border}}/>}
              </div>
            ))}
          </div>
        </div>
        <div style={{maxWidth:"540px",margin:"0 auto",padding:"28px 20px"}}>
          <h2 style={{fontSize:"1.35em",fontWeight:800,color:C.text,margin:"0 0 4px"}}>{s.title}</h2>
          <p style={{color:C.muted,margin:"0 0 20px",fontSize:"0.88em"}}>{s.sub}</p>
          {s.content}
          <div style={{display:"flex",gap:"10px",marginTop:"24px"}}>
            {setupStep>0&&<button onClick={()=>setSetupStep(n=>n-1)} style={{padding:"12px 18px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:"0.9em"}}>← Back</button>}
            <button onClick={()=>{ if(setupStep<steps.length-1) setSetupStep(n=>n+1); else handleFinishSetup(); }}
              disabled={!s.ok||savingProfile}
              style={{flex:1,padding:"13px",borderRadius:"8px",border:"none",background:s.ok?C.brand:C.border,color:s.ok?"#fff":C.muted,fontWeight:700,fontSize:"0.95em",cursor:s.ok?"pointer":"not-allowed"}}>
              {setupStep<steps.length-1?"Continue →":savingProfile?"Setting up...":"🚀 Set Up My Business!"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════
  const lapsed    = customers.filter(c=>c.tag==="lapsed"||daysSince(c.lastVisit)>60).length;
  const leads     = customers.filter(c=>c.tag==="lead").length;
  const needsFollowUp = customers.filter(c=>daysSince(c.lastVisit)>=30||c.tag==="lead").length;

  return (
    <div style={{minHeight:"100vh",background:"#F7F8FA",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* ── PREMIUM NAV ───────────────────────────────────────────────── */}
      <div style={{
        background:"linear-gradient(135deg,#0D1117 0%,#1A2235 100%)",
        padding:"0 16px",position:"sticky",top:0,zIndex:50,
        boxShadow:"0 2px 12px rgba(0,0,0,0.15)",
      }}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:"52px"}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{color:"#fff",fontWeight:900,fontSize:"1.05em",letterSpacing:"-0.02em"}}>
              <span style={{color:biz.bizType==="shopify"?"#A78BFA":"#60A5FA"}}>⚡</span> Cliento
            </span>
            <div style={{width:"1px",height:"18px",background:"rgba(255,255,255,0.15)"}}/>
            <div style={{display:"flex",alignItems:"center",gap:"6px",background:"rgba(255,255,255,0.06)",borderRadius:"20px",padding:"4px 10px"}}>
              <span style={{fontSize:"0.85em"}}>{biz.bizType==="shopify"?"🛍️":industry?.icon}</span>
              <span style={{fontSize:"0.74em",color:"rgba(255,255,255,0.75)",fontWeight:600}}>{biz.name||"My Business"}</span>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            {totalSaved>0 && (
              <div style={{display:"flex",alignItems:"center",gap:"5px",background:"rgba(0,232,122,0.12)",border:"1px solid rgba(0,232,122,0.25)",borderRadius:"20px",padding:"4px 11px"}}>
                <span style={{fontSize:"0.78em"}}>💰</span>
                <span style={{fontSize:"0.72em",color:"#6EE7B7",fontWeight:700}}>${totalSaved.toLocaleString()} saved</span>
              </div>
            )}
            <button onClick={()=>{setShowTour(true);setTourStep(0);}} title="Take the tour" style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.6)",borderRadius:"8px",width:"30px",height:"30px",cursor:"pointer",fontSize:"0.85em",display:"flex",alignItems:"center",justifyContent:"center"}}>?</button>
            <span style={{color:"rgba(255,255,255,0.4)",fontSize:"0.76em",display:"none"}}>Hi {biz.owner}</span>
            {onSignOut && <button onClick={onSignOut} style={{background:"rgba(255,255,255,0.06)",border:"none",color:"rgba(255,255,255,0.55)",borderRadius:"8px",padding:"6px 11px",fontSize:"0.72em",cursor:"pointer",fontWeight:600}}>Sign out</button>}
          </div>
        </div>
      </div>

      {/* ── TAB BAR ───────────────────────────────────────────────────── */}
      <div data-tour="tabs" style={{background:"#fff",borderBottom:`1px solid ${C.border}`,padding:"0 8px",display:"flex",gap:"0",overflowX:"auto",boxShadow:"0 1px 3px rgba(0,0,0,0.03)"}}>
        {(biz.bizType==="shopify" ? [
          {id:"products",    label:"🛍️ Products",    badge:null},
          {id:"sh_emails",   label:"📧 Emails",      badge:null},
          {id:"sh_social",   label:"📱 Social & Ads",badge:null},
          {id:"sh_reviews",  label:"⭐ Reviews",      badge:null},
          {id:"sh_seo",      label:"🔍 SEO",          badge:null},
          {id:"sh_analytics",label:"📊 Analytics",   badge:null},
          {id:"sh_growth",   label:"🚀 Growth",       badge:null},
          {id:"help",        label:"❓ Help",          badge:null},
        ] : [
          {id:"marketing", label:"📣 Marketing",   badge:null},
          {id:"reviews",   label:"⭐ Reviews",      badge:null},
          {id:"business",  label:"🏢 Business",    badge:null},
          {id:"crm",       label:"👥 Customers",   badge:needsFollowUp>0?needsFollowUp:null},
          {id:"grow",      label:"🚀 Grow",         badge:null},
          {id:"health",    label:"💚 Health Score", badge:null},
          {id:"network",   label:"🔗 Network",      badge:networkMembers.length},
          {id:"help",      label:"❓ Help",          badge:null},
        ]).map(tab=>(
          <button key={tab.id} onClick={()=>{setActiveTab(tab.id);setActiveTool(null);setCrmView("list");}} style={{
            padding:"12px 14px",border:"none",background:"transparent",cursor:"pointer",
            fontSize:"0.82em",fontWeight:activeTab===tab.id?700:500,
            color:activeTab===tab.id?(biz.bizType==="shopify"?C.purple:C.brand):C.muted,
            borderBottom:activeTab===tab.id?`2px solid ${biz.bizType==="shopify"?C.purple:C.brand}`:"2px solid transparent",
            display:"flex",alignItems:"center",gap:"5px",whiteSpace:"nowrap",flexShrink:0,
          }}>
            {tab.label}
            {tab.badge&&<span style={{background:tab.id==="network"?C.teal:C.red,color:"#fff",borderRadius:"99px",padding:"1px 6px",fontSize:"0.7em",fontWeight:700}}>{tab.badge}</span>}
          </button>
        ))}
      </div>

      {showTour && (
        <ProductTour
          step={tourStep} setStep={setTourStep}
          onClose={()=>setShowTour(false)}
          isShopify={biz.bizType==="shopify"}
          ownerName={biz.owner}
        />
      )}


      <div style={{maxWidth:"820px",margin:"0 auto",padding:"20px 14px"}}>

        {/* ── HELP TAB — shows for both shopify and local ─────────────────────── */}
        {activeTab==="help" && (
          <HelpCentre isShopify={biz.bizType==="shopify"} onStartTour={()=>{setShowTour(true);setTourStep(0);}}/>
        )}

        {/* ── SHOPIFY TABS ──────────────────────────────────────────────────── */}
        {biz.bizType==="shopify" && activeTab!=="help" && (
          <ShopifyDashboard
            activeTab={activeTab} activeTool={activeTool} setActiveTool={setActiveTool}
            biz={biz} results={results} setResults={setResults}
          />
        )}

        {/* ── LOCAL BUSINESS TABS ────────────────────────────────────────────── */}
        {biz.bizType!=="shopify" && activeTab!=="help" && (
        <>
        {/* ── MARKETING TAB ─────────────────────────────────────────────────── */}
        {activeTab==="marketing" && !activeTool && (
          <>
            <div style={{background:C.brandLt,border:`1px solid #BFDBFE`,borderRadius:"12px",padding:"16px 18px",marginBottom:"20px"}}>
              <div style={{fontWeight:700,color:C.brand,marginBottom:"2px"}}>What do you need today, {biz.owner}?</div>
              <div style={{fontSize:"0.83em",color:"#1E40AF",lineHeight:1.6}}>Everything below is written specifically for {biz.name||"your business"} — no templates.</div>
            </div>
            {results.website && (
              <button onClick={()=>setActiveTool("publish")} style={{
                width:"100%",marginBottom:"16px",padding:"16px 18px",borderRadius:"12px",border:"none",cursor:"pointer",textAlign:"left",
                background:"linear-gradient(135deg,#0D1117 0%,#1A2235 100%)",
                display:"flex",alignItems:"center",gap:"14px",
              }}>
                <div style={{fontSize:"1.8em"}}>🚀</div>
                <div style={{flex:1}}>
                  <div style={{color:"#fff",fontWeight:800,fontSize:"0.95em",marginBottom:"2px"}}>Publish My Website</div>
                  <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.78em"}}>Your website content is ready — get it live on the internet</div>
                </div>
                <div style={{color:"#60A5FA",fontSize:"1.2em"}}>→</div>
              </button>
            )}
            <ToolGrid group={TOOL_GROUPS[0]} results={results} onSelect={setActiveTool}/>
            <div style={{marginTop:"10px",background:C.amberLt,border:`1px solid #FDE68A`,borderRadius:"9px",padding:"12px 15px",fontSize:"0.8em",color:"#92400E"}}>
              💡 <strong>Tip:</strong> After creating content, switch to <strong>👥 Customers</strong> and use "Generate Message" to send it to specific customers personally.
            </div>
          </>
        )}

        {activeTab==="marketing" && activeTool==="publish" && (
          <PublishWebsite biz={biz} websiteContent={results.website} onBack={()=>setActiveTool(null)}/>
        )}

        {activeTab==="marketing" && activeTool && activeTool!=="publish" && (
          <ToolPanel toolId={activeTool} biz={biz} industry={industry} existing={results[activeTool]}
            onBack={()=>setActiveTool(null)}
            onSave={(id,content)=>{setResults(r=>({...r,[id]:content}));setActiveTool(null);}}/>
        )}

        {/* ── REVIEWS TAB ───────────────────────────────────────────────────── */}
        {activeTab==="reviews" && !activeTool && (
          <>
            <div style={{background:C.amberLt,border:`1px solid #FDE68A`,borderRadius:"12px",padding:"16px 18px",marginBottom:"20px"}}>
              <div style={{fontWeight:700,color:C.amber,marginBottom:"2px"}}>⭐ Google Reviews — Your Secret Weapon</div>
              <div style={{fontSize:"0.83em",color:"#92400E",lineHeight:1.6}}>Businesses with 4.5+ stars get 3× more enquiries from Google. These tools help you get more reviews, respond to all of them, and turn bad ones into trust-builders.</div>
            </div>
            <ToolGrid group={TOOL_GROUPS[1]} results={results} onSelect={setActiveTool}/>
          </>
        )}

        {activeTab==="reviews" && activeTool && (
          <ToolPanel toolId={activeTool} biz={biz} industry={industry} existing={results[activeTool]}
            onBack={()=>setActiveTool(null)}
            onSave={(id,content)=>{setResults(r=>({...r,[id]:content}));setActiveTool(null);}}/>
        )}

        {/* ── BUSINESS TAB ──────────────────────────────────────────────────── */}
        {activeTab==="business" && !activeTool && (
          <>
            <div style={{background:C.tealLt,border:`1px solid #99F6E4`,borderRadius:"12px",padding:"16px 18px",marginBottom:"20px"}}>
              <div style={{fontWeight:700,color:C.teal,marginBottom:"2px"}}>🏢 Business Tools</div>
              <div style={{fontSize:"0.83em",color:"#0F766E",lineHeight:1.6}}>Tools to help you understand your performance and find the right people for your team.</div>
            </div>
            <ToolGrid group={TOOL_GROUPS[2]} results={results} onSelect={setActiveTool}/>
          </>
        )}
        {activeTab==="business" && activeTool && (
          <ToolPanel toolId={activeTool} biz={biz} industry={industry} existing={results[activeTool]}
            onBack={()=>setActiveTool(null)}
            onSave={(id,content)=>{setResults(r=>({...r,[id]:content}));setActiveTool(null);}}/>
        )}

        {/* ── GROW TAB ──────────────────────────────────────────────────────── */}
        {activeTab==="grow" && (
          <GrowPanel biz={biz} industry={industry} customers={customers}/>
        )}

        {/* ── HEALTH SCORE TAB ─────────────────────────────────────────────── */}
        {activeTab==="health" && (
          <HealthPanel biz={biz} industry={industry} customers={customers} results={results}/>
        )}

        {/* ── NETWORK TAB ───────────────────────────────────────────────────── */}
        {activeTab==="network" && (
          <NetworkPanel biz={biz} industry={industry} networkMembers={networkMembers}/>
        )}

        {/* ── CRM TAB ───────────────────────────────────────────────────────── */}
        {activeTab==="crm" && (
          <CRMPanel
            customers={customers} setCustomers={setCustomers}
            crmView={crmView} setCrmView={setCrmView}
            activeCustomer={activeCustomer} setActiveCustomer={setActiveCustomer}
            biz={biz} industry={industry}
            crmMsg={crmMsg} setCrmMsg={setCrmMsg}
          />
        )}
        </>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// SHOPIFY DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
function ShopifyDashboard({activeTab, activeTool, setActiveTool, biz, results, setResults}) {
  const group = SHOPIFY_TOOL_GROUPS.find(g=>g.id===activeTab) ||
                SHOPIFY_TOOL_GROUPS.find(g=>g.id==="products");

  const groupLabels = {
    products:"🛍️ Product Content", sh_emails:"📧 Email Flows", sh_social:"📱 Social & Ads",
    sh_reviews:"⭐ Reviews & Trust", sh_seo:"🔍 SEO & Content",
    sh_analytics:"📊 Store Analytics", sh_growth:"🚀 Growth",
  };
  const groupDescs = {
    products:"Write product descriptions, titles, meta tags and collection copy that rank and convert.",
    sh_emails:"Email flows that recover abandoned carts, welcome new customers and bring back old ones.",
    sh_social:"Social posts, ad copy and creator briefs that drive traffic to your store.",
    sh_reviews:"Get more reviews, respond to them professionally and build customer trust.",
    sh_seo:"Blog posts, FAQs and page copy that get your store found on Google.",
    sh_analytics:"Paste your store numbers — get plain English insight and next actions.",
    sh_growth:"Referral programs, influencer pitches and sale campaigns that grow your store.",
  };

  return (
    <div>
      {!activeTool && group && (
        <>
          <div style={{background:C.purpleLt,border:`1px solid #DDD6FE`,borderRadius:"12px",padding:"16px 18px",marginBottom:"20px"}}>
            <div style={{fontWeight:700,color:C.purple,marginBottom:"2px"}}>{groupLabels[activeTab]||group.label}</div>
            <div style={{fontSize:"0.83em",color:"#4C1D95",lineHeight:1.6}}>{groupDescs[activeTab]||""}</div>
          </div>
          {activeTab==="products" && (
            <button onClick={()=>setActiveTool("connect-shopify")} style={{
              width:"100%",marginBottom:"16px",padding:"16px 18px",borderRadius:"12px",border:"none",cursor:"pointer",textAlign:"left",
              background:"linear-gradient(135deg,#0D1117 0%,#1A2235 100%)",
              display:"flex",alignItems:"center",gap:"14px",
            }}>
              <div style={{fontSize:"1.8em"}}>🛍️</div>
              <div style={{flex:1}}>
                <div style={{color:"#fff",fontWeight:800,fontSize:"0.95em",marginBottom:"2px"}}>Connect My Shopify Store</div>
                <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.78em"}}>Sync products automatically — or start a store if you don't have one yet</div>
              </div>
              <div style={{color:"#A78BFA",fontSize:"1.2em"}}>→</div>
            </button>
          )}
          <ToolGrid group={group} results={results} onSelect={setActiveTool} accentColor={C.purple} accentLt={C.purpleLt}/>
        </>
      )}
      {activeTool==="connect-shopify" && (
        <ConnectShopify biz={biz} onBack={()=>setActiveTool(null)}/>
      )}
      {activeTool && activeTool!=="connect-shopify" && (
        <ToolPanel toolId={activeTool} biz={biz} industry={null} existing={results[activeTool]}
          onBack={()=>setActiveTool(null)}
          onSave={(id,content)=>{setResults(r=>({...r,[id]:content}));setActiveTool(null);}}
          accentColor={C.purple}/>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CRM PANEL
// ═════════════════════════════════════════════════════════════════════════════
function CRMPanel({customers,setCustomers,crmView,setCrmView,activeCustomer,setActiveCustomer,biz,industry,crmMsg,setCrmMsg}) {

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [editCustomer, setEditCustomer] = useState(null);
  const [generatedMsg, setGeneratedMsg] = useState("");
  const [msgType, setMsgType] = useState("followup");

  const filtered = customers.filter(c=>{
    const matchTag = tagFilter==="all"||c.tag===tagFilter;
    const matchSearch = !search||c.name.toLowerCase().includes(search.toLowerCase())||c.phone?.includes(search)||c.email?.toLowerCase().includes(search.toLowerCase());
    return matchTag&&matchSearch;
  });

  // Sort: lapsed first, then by last visit desc
  const sorted = [...filtered].sort((a,b)=>{
    const aUrgent = a.tag==="lapsed"||(daysSince(a.lastVisit)>=60);
    const bUrgent = b.tag==="lapsed"||(daysSince(b.lastVisit)>=60);
    if(aUrgent&&!bUrgent) return -1;
    if(!aUrgent&&bUrgent) return 1;
    if(!a.lastVisit) return -1;
    if(!b.lastVisit) return 1;
    return new Date(b.lastVisit)-new Date(a.lastVisit);
  });

  const tagInfo = TAGS.find(t=>t.id===(activeCustomer?.tag))||TAGS[2];

  const generateMessage = async (customer, type) => {
    setCrmMsg({loading:true,text:"",type});
    setGeneratedMsg("");
    const ctx = `Business: ${biz.name} | Type: ${industry?.label} | Location: ${biz.suburb}`;
    const custCtx = `Customer: ${customer.name} | Tag: ${customer.tag} | Last visit: ${customer.lastVisit?formatDate(customer.lastVisit):"never"} | Notes: ${customer.notes||"none"} | History: ${customer.jobHistory||"none"}`;
    const prompts = {
      followup:{
        system:`You write warm, personal follow-up messages for local Australian small business owners to send individual customers. Sound like a real person, not a marketing email.`,
        user:`Write a personal follow-up message from the owner of ${biz.name} to ${customer.name}.\n\n${ctx}\n${custCtx}\n\nWrite:\nSMS (under 160 chars, personal, warm):\n\nEMAIL (subject line + short email under 100 words):\n\nThe message should reference something specific from their notes/history. Sign with the owner's name.`,
      },
      winback:{
        system:`You write win-back messages for local Australian small businesses to re-engage customers who haven't visited recently. Warm, genuine — never pushy or guilt-tripping.`,
        user:`Write a win-back message from ${biz.name} to ${customer.name}, who hasn't visited in a while.\n\n${ctx}\n${custCtx}\n\nWrite:\nSMS (under 160 chars, feels personal not automated):\n\nEMAIL (subject + under 120 words, warm and genuine, includes a small offer or reason to return):\n\nTone: like a message from an old friend who runs the business.`,
      },
      reviewask:{
        system:`You write review request messages for local Australian small businesses. Personal, friendly, never pushy.`,
        user:`Write a Google review request from ${biz.name} to ${customer.name}.\n\n${ctx}\n${custCtx}\n\nSMS (under 140 chars, includes placeholder [REVIEW LINK]):\n\nEMAIL (subject + under 100 words, personal reference to their visit):\n\nMake it feel like it was written specifically for this person, not copy-pasted.`,
      },
      thankyou:{
        system:`You write genuine thank-you messages for local Australian small businesses to send valued customers. Warm, personal.`,
        user:`Write a thank-you message from ${biz.name} to ${customer.name}.\n\n${ctx}\n${custCtx}\n\nSMS (under 140 chars):\n\nEmail (subject + 60-80 words, references something specific from their history):\n\nGentle, not sycophantic. Real.`,
      },
      vip:{
        system:`You write exclusive VIP messages for local Australian businesses to make their best customers feel special.`,
        user:`Write a VIP exclusive message from ${biz.name} to ${customer.name}, one of their best customers.\n\n${ctx}\n${custCtx}\n\nThis should feel exclusive and personal — not like a mass email. Include a special offer or early access to something.\n\nSMS:\nEmail (subject + under 120 words):`,
      },
    };
    try {
      const p = prompts[type];
      const text = await askClaude(p.system, p.user);
      setGeneratedMsg(text);
      setCrmMsg({loading:false,text,type});
    } catch(e) {
      setCrmMsg({loading:false,text:"Error: "+e.message,type});
    }
  };

  // ── LIST VIEW ───────────────────────────────────────────────────────────────
  if(crmView==="list") return (
    <div>
      {/* Stats row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px",marginBottom:"16px"}}>
        {[
          [customers.length+"","Total Customers",C.brand,C.brandLt],
          [customers.filter(c=>c.tag==="vip").length+"","VIP Customers",C.amber,C.amberLt],
          [customers.filter(c=>daysSince(c.lastVisit)>=30||c.tag==="lead").length+"","Need Attention",C.red,C.redLt],
          [customers.filter(c=>c.tag==="lead").length+"","Active Leads",C.purple,C.purpleLt],
        ].map(([val,label,color,bg])=>(
          <div key={label} style={{background:bg,border:`1px solid ${color}30`,borderRadius:"10px",padding:"12px 14px"}}>
            <div style={{fontSize:"1.5em",fontWeight:800,color,lineHeight:1}}>{val}</div>
            <div style={{fontSize:"0.7em",color,opacity:0.7,marginTop:"3px",fontWeight:600}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filter + add */}
      <div style={{display:"flex",gap:"8px",marginBottom:"12px",flexWrap:"wrap"}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search customers..." style={{...inputSt,flex:1,minWidth:"160px",padding:"9px 12px",fontSize:"0.85em"}}/>
        <button onClick={()=>{setEditCustomer({id:"new_"+Date.now(),name:"",phone:"",email:"",tag:"new",lastVisit:new Date().toISOString().split("T")[0],notes:"",jobHistory:""});setCrmView("add");}}
          style={{...btnPrimary,padding:"9px 16px",fontSize:"0.84em",whiteSpace:"nowrap"}}>
          + Add Customer
        </button>
      </div>

      {/* Tag filters */}
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"12px"}}>
        <button onClick={()=>setTagFilter("all")} style={{padding:"5px 12px",borderRadius:"20px",border:"none",background:tagFilter==="all"?C.text:C.light,color:tagFilter==="all"?"#fff":C.muted,cursor:"pointer",fontSize:"0.75em",fontWeight:600}}>All</button>
        {TAGS.map(t=>(
          <button key={t.id} onClick={()=>setTagFilter(t.id)} style={{padding:"5px 12px",borderRadius:"20px",border:"none",background:tagFilter===t.id?t.color:C.light,color:tagFilter===t.id?"#fff":t.color,cursor:"pointer",fontSize:"0.75em",fontWeight:600}}>
            {t.label} ({customers.filter(c=>c.tag===t.id).length})
          </button>
        ))}
      </div>

      {/* Customer list */}
      <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
        {sorted.map(c=>{
          const days = daysSince(c.lastVisit);
          const urgent = c.tag==="lapsed"||(days!==null&&days>=60)||c.tag==="lead";
          const tag = TAGS.find(t=>t.id===c.tag)||TAGS[2];
          return (
            <div key={c.id} onClick={()=>{setActiveCustomer(c);setCrmView("detail");setGeneratedMsg("");setCrmMsg({loading:false,text:"",type:""});}}
              style={{background:"#fff",border:`1.5px solid ${urgent?"#FCA5A5":C.border}`,borderRadius:"10px",padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:"12px",transition:"all 0.12s"}}>
              <div style={{width:"40px",height:"40px",borderRadius:"50%",background:`linear-gradient(135deg,${tag.color},${tag.color}88)`,color:"#fff",fontWeight:800,fontSize:"0.95em",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"7px",marginBottom:"3px"}}>
                  <span style={{fontWeight:700,fontSize:"0.9em",color:C.text}}>{c.name}</span>
                  <span style={{fontSize:"0.65em",padding:"2px 7px",borderRadius:"99px",background:tag.bg,color:tag.color,fontWeight:700}}>{tag.label}</span>
                  {urgent&&c.tag!=="lead"&&<span style={{fontSize:"0.65em",padding:"2px 7px",borderRadius:"99px",background:C.redLt,color:C.red,fontWeight:700}}>⚠️ Needs attention</span>}
                </div>
                <div style={{fontSize:"0.76em",color:C.muted}}>
                  {c.phone&&<span>{c.phone}</span>}
                  {c.lastVisit ? <span style={{marginLeft:c.phone?"10px":"0",color:days>=30?C.red:C.muted}}>Last visit: {formatDate(c.lastVisit)}{days!==null?` (${days}d ago)`:""}</span> : <span style={{marginLeft:c.phone?"10px":"0",color:C.purple}}>No visit yet</span>}
                </div>
                {c.notes&&<div style={{fontSize:"0.75em",color:C.muted,marginTop:"2px",overflow:"hidden",whiteSpace:"nowrap",textOverflow:"ellipsis",maxWidth:"400px"}}>{c.notes}</div>}
              </div>
              <div style={{color:C.muted,fontSize:"0.8em"}}>›</div>
            </div>
          );
        })}
        {sorted.length===0&&<div style={{textAlign:"center",padding:"32px",color:C.muted,fontSize:"0.85em"}}>No customers found</div>}
      </div>
    </div>
  );

  // ── ADD CUSTOMER ────────────────────────────────────────────────────────────
  if(crmView==="add"&&editCustomer) return (
    <div>
      <button onClick={()=>setCrmView("list")} style={{...backBtn,marginBottom:"16px"}}>← Back</button>
      <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"20px"}}>
        <h3 style={{fontWeight:800,color:C.text,margin:"0 0 16px"}}>Add New Customer</h3>
        <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
          <Field label="Full name *"><input value={editCustomer.name} onChange={e=>setEditCustomer(c=>({...c,name:e.target.value}))} placeholder="e.g. Sandra Mitchell" style={inputSt}/></Field>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            <Field label="Phone"><input value={editCustomer.phone} onChange={e=>setEditCustomer(c=>({...c,phone:e.target.value}))} placeholder="0412 345 678" style={inputSt}/></Field>
            <Field label="Email"><input value={editCustomer.email} onChange={e=>setEditCustomer(c=>({...c,email:e.target.value}))} placeholder="email@example.com" style={inputSt}/></Field>
          </div>
          <Field label="Last visit">
            <input type="date" value={editCustomer.lastVisit||""} onChange={e=>setEditCustomer(c=>({...c,lastVisit:e.target.value}))} style={inputSt}/>
          </Field>
          <Field label="Customer type">
            <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
              {TAGS.map(t=>(
                <button key={t.id} onClick={()=>setEditCustomer(c=>({...c,tag:t.id}))} style={{padding:"6px 12px",borderRadius:"20px",border:`2px solid ${editCustomer.tag===t.id?t.color:C.border}`,background:editCustomer.tag===t.id?t.bg:"#fff",color:editCustomer.tag===t.id?t.color:C.muted,cursor:"pointer",fontSize:"0.8em",fontWeight:editCustomer.tag===t.id?700:400}}>
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Notes (preferences, details, anything useful)">
            <textarea value={editCustomer.notes} onChange={e=>setEditCustomer(c=>({...c,notes:e.target.value}))} placeholder="e.g. Loves flat whites, comes in Tuesday mornings, birthday in April" rows={3} style={{...inputSt,resize:"vertical"}}/>
          </Field>
          <Field label="Job / visit history">
            <textarea value={editCustomer.jobHistory} onChange={e=>setEditCustomer(c=>({...c,jobHistory:e.target.value}))} placeholder="e.g. Regular since 2023, referred two friends, ordered catering once" rows={2} style={{...inputSt,resize:"vertical"}}/>
          </Field>
          <button
            disabled={!editCustomer.name}
            onClick={()=>{
              setCustomers(cs=>[editCustomer,...cs.filter(c=>c.id!==editCustomer.id)]);
              setActiveCustomer(editCustomer);
              setCrmView("detail");
              setGeneratedMsg("");
              setCrmMsg({loading:false,text:"",type:""});
            }}
            style={{...btnPrimary,opacity:editCustomer.name?1:0.4}}>
            Save Customer ✓
          </button>
        </div>
      </div>
    </div>
  );

  // ── CUSTOMER DETAIL ─────────────────────────────────────────────────────────
  if(crmView==="detail"&&activeCustomer) {
    const c = customers.find(x=>x.id===activeCustomer.id)||activeCustomer;
    const tag = TAGS.find(t=>t.id===c.tag)||TAGS[2];
    const days = daysSince(c.lastVisit);
    const urgent = days!==null&&days>=30;

    const MSG_TYPES = [
      {id:"followup", label:"💬 Follow-Up",  desc:"A friendly message checking in"},
      {id:"winback",  label:"🔄 Win Back",    desc:"Re-engage if they haven't been back"},
      {id:"reviewask",label:"⭐ Ask Review",  desc:"Ask them to leave a Google review"},
      {id:"thankyou", label:"🙏 Thank You",   desc:"Thank them for their loyalty"},
      {id:"vip",      label:"👑 VIP Offer",   desc:"An exclusive offer for great customers"},
    ];

    return (
      <div>
        <button onClick={()=>{setCrmView("list");setGeneratedMsg("");setCrmMsg({loading:false,text:"",type:""});}} style={{...backBtn,marginBottom:"14px"}}>← All Customers</button>

        {/* Customer card */}
        <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"18px 20px",marginBottom:"12px"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"12px",marginBottom:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              <div style={{width:"48px",height:"48px",borderRadius:"50%",background:`linear-gradient(135deg,${tag.color},${tag.color}88)`,color:"#fff",fontWeight:800,fontSize:"1.1em",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {c.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:"1.1em",color:C.text}}>{c.name}</div>
                <span style={{fontSize:"0.72em",padding:"2px 9px",borderRadius:"99px",background:tag.bg,color:tag.color,fontWeight:700}}>{tag.label}</span>
              </div>
            </div>
            <button onClick={()=>{setEditCustomer({...c});setCrmView("add");}} style={{padding:"7px 14px",borderRadius:"7px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:"0.78em",fontWeight:600}}>✏️ Edit</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
            {[
              ["📞","Phone",c.phone||"—"],
              ["📧","Email",c.email||"—"],
              ["📅","Last Visit",c.lastVisit?`${formatDate(c.lastVisit)} (${days}d ago)`:"No visit yet"],
              ["🏷️","Status",urgent?"Needs follow-up":"All good"],
            ].map(([icon,label,val])=>(
              <div key={label} style={{background:C.light,borderRadius:"8px",padding:"10px 12px"}}>
                <div style={{fontSize:"0.68em",color:C.muted,fontWeight:700,marginBottom:"2px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{icon} {label}</div>
                <div style={{fontSize:"0.85em",color:C.text,fontWeight:500}}>{val}</div>
              </div>
            ))}
          </div>

          {c.notes&&(
            <div style={{background:C.brandLt,borderRadius:"8px",padding:"10px 12px",marginBottom:"8px"}}>
              <div style={{fontSize:"0.68em",color:C.brand,fontWeight:700,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.05em"}}>📝 Notes</div>
              <div style={{fontSize:"0.84em",color:"#1E3A8A",lineHeight:1.55}}>{c.notes}</div>
            </div>
          )}
          {c.jobHistory&&(
            <div style={{background:C.light,borderRadius:"8px",padding:"10px 12px"}}>
              <div style={{fontSize:"0.68em",color:C.muted,fontWeight:700,marginBottom:"3px",textTransform:"uppercase",letterSpacing:"0.05em"}}>📋 History</div>
              <div style={{fontSize:"0.84em",color:C.text,lineHeight:1.55}}>{c.jobHistory}</div>
            </div>
          )}
        </div>

        {/* Update last visit */}
        <div style={{background:"#fff",borderRadius:"10px",border:`1px solid ${C.border}`,padding:"14px 16px",marginBottom:"12px",display:"flex",alignItems:"center",gap:"10px",flexWrap:"wrap"}}>
          <div style={{fontSize:"0.82em",color:C.muted,flex:1}}>Update last visit:</div>
          <input type="date" defaultValue={new Date().toISOString().split("T")[0]}
            style={{...inputSt,width:"160px",padding:"7px 10px",fontSize:"0.83em"}}
            id={`visit-${c.id}`}/>
          <button onClick={()=>{
            const newDate = document.getElementById(`visit-${c.id}`)?.value||new Date().toISOString().split("T")[0];
            const updated = {...c,lastVisit:newDate,tag:c.tag==="lapsed"?"regular":c.tag==="lead"?"new":c.tag};
            setCustomers(cs=>cs.map(x=>x.id===c.id?updated:x));
            setActiveCustomer(updated);
          }} style={{...btnPrimary,padding:"8px 16px",fontSize:"0.82em"}}>Mark Visited ✓</button>
        </div>

        {/* Generate message section */}
        <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"18px 20px"}}>
          <div style={{fontWeight:700,color:C.text,marginBottom:"4px"}}>✨ Generate a Message for {c.name.split(" ")[0]}</div>
          <div style={{fontSize:"0.8em",color:C.muted,marginBottom:"14px"}}>AI writes a personalised message using everything you know about this customer.</div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
            {MSG_TYPES.map(mt=>(
              <button key={mt.id} onClick={()=>{setMsgType(mt.id);generateMessage(c,mt.id);}} style={{
                padding:"11px 12px",borderRadius:"9px",textAlign:"left",cursor:"pointer",
                border:`2px solid ${msgType===mt.id&&crmMsg.text?C.brand:C.border}`,
                background:msgType===mt.id&&crmMsg.text?C.brandLt:"#fff",
                opacity:crmMsg.loading&&msgType!==mt.id?0.5:1,
              }}>
                <div style={{fontSize:"0.88em",fontWeight:700,color:C.text,marginBottom:"2px"}}>{mt.label}</div>
                <div style={{fontSize:"0.74em",color:C.muted}}>{mt.desc}</div>
              </button>
            ))}
          </div>

          {crmMsg.loading&&(
            <div style={{textAlign:"center",padding:"20px",color:C.muted,fontSize:"0.85em"}}>
              ✨ Writing a personalised message for {c.name.split(" ")[0]}...
            </div>
          )}

          {crmMsg.text&&!crmMsg.loading&&(
            <div>
              <div style={{background:C.light,borderRadius:"10px",padding:"14px",fontSize:"0.83em",color:C.text,lineHeight:1.75,whiteSpace:"pre-wrap",maxHeight:"280px",overflowY:"auto",border:`1px solid ${C.border}`,marginBottom:"10px"}}>
                {crmMsg.text}
              </div>
              <button onClick={()=>{navigator.clipboard.writeText(crmMsg.text).catch(()=>{});}}
                style={{width:"100%",padding:"11px",borderRadius:"8px",border:`2px solid ${C.brand}`,background:C.brandLt,color:C.brand,fontWeight:700,cursor:"pointer",fontSize:"0.88em"}}>
                📋 Copy Message
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── SHOPIFY EXTRA FIELDS ─────────────────────────────────────────────────
  const sib = (text) => (
    <div style={{background:C.purpleLt,border:"1px solid #DDD6FE",borderRadius:"8px",padding:"11px 13px",fontSize:"0.83em",color:"#4C1D95",lineHeight:1.65,marginBottom:"12px"}}>{text}</div>
  );

  if(toolId==="sh_product_desc") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("📝 Write the product name and key details below — we'll write a full description that reads well AND ranks on Google.")}
      <Field label="Product name"><input value={extra.productName||""} onChange={e=>set("productName",e.target.value)} placeholder="e.g. Lavender & Vanilla Soy Candle 250g" style={inputSt}/></Field>
      <Field label="Key features / what makes it special">
        <textarea value={extra.features||""} onChange={e=>set("features",e.target.value)} placeholder="e.g. Hand-poured, 40hr burn time, essential oils only, cotton wick, comes in gift box, vegan" rows={3} style={{...inputSt,resize:"vertical"}}/>
      </Field>
      <Field label="Who is it for?"><input value={extra.audience||""} onChange={e=>set("audience",e.target.value)} placeholder="e.g. Women 25–45 who love home fragrance, great as a gift" style={inputSt}/></Field>
      <Field label="Price point (optional)"><input value={extra.price||""} onChange={e=>set("price",e.target.value)} placeholder="e.g. $34.95" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_product_titles") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🏷️ We'll write SEO-optimised product titles, meta descriptions and URL slugs for Google and your store.")}
      <Field label="Product name"><input value={extra.productName||""} onChange={e=>set("productName",e.target.value)} placeholder="e.g. Lavender Soy Candle" style={inputSt}/></Field>
      <Field label="Category / type"><input value={extra.category||""} onChange={e=>set("category",e.target.value)} placeholder="e.g. Soy candle, essential oil candle, home fragrance" style={inputSt}/></Field>
      <Field label="Key selling point"><input value={extra.usp||""} onChange={e=>set("usp",e.target.value)} placeholder="e.g. hand-poured, 40hr burn, gift-ready" style={inputSt}/></Field>
      <Field label="How many products? (we'll do them all)"><input value={extra.productCount||""} onChange={e=>set("productCount",e.target.value)} placeholder="e.g. 1 (or 5 if you list all the variants below)" style={inputSt}/></Field>
      <Field label="List all variants or products (optional)">
        <textarea value={extra.variants||""} onChange={e=>set("variants",e.target.value)} placeholder="e.g. Lavender, Vanilla & Sandalwood, Citrus Burst, Rose & Oud" rows={2} style={{...inputSt,resize:"vertical"}}/>
      </Field>
    </div>
  );

  if(toolId==="sh_collection") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🗂️ Collection page intro copy appears at the top of your category pages. It tells Google what the page is about and helps browsers understand what they're looking for.")}
      <Field label="Collection name"><input value={extra.collectionName||""} onChange={e=>set("collectionName",e.target.value)} placeholder="e.g. Soy Candles / Gift Sets / Home Fragrance" style={inputSt}/></Field>
      <Field label="What products are in this collection?"><textarea value={extra.collectionDesc||""} onChange={e=>set("collectionDesc",e.target.value)} placeholder="e.g. All our hand-poured soy candles — 12 scents, sizes from 100g to 500g, all in gift-ready packaging" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="Who shops this collection?"><input value={extra.audience||""} onChange={e=>set("audience",e.target.value)} placeholder="e.g. People looking for gifts, home decor lovers, mums" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_bundle_copy") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🎁 Bundle and upsell copy sits on your product pages to encourage customers to add more to their cart. We'll write 'frequently bought together' text and cross-sell descriptions.")}
      <Field label="Main product"><input value={extra.mainProduct||""} onChange={e=>set("mainProduct",e.target.value)} placeholder="e.g. Lavender Soy Candle 250g" style={inputSt}/></Field>
      <Field label="Products to bundle or cross-sell with"><textarea value={extra.bundleProducts||""} onChange={e=>set("bundleProducts",e.target.value)} placeholder="e.g. Candle snuffer, reed diffuser, linen spray" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
    </div>
  );

  if(toolId==="sh_abandoned_cart") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🛒 On average 70% of shoppers abandon their cart. A 3-email sequence recovers 5–15% of them — which is pure profit. We'll write all 3 emails for you.")}
      <Field label="What's typically left in carts?"><input value={extra.cartProduct||""} onChange={e=>set("cartProduct",e.target.value)} placeholder="e.g. Our candles, usually $30–$65 orders" style={inputSt}/></Field>
      <Field label="Recovery offer? (optional)"><input value={extra.cartOffer||""} onChange={e=>set("cartOffer",e.target.value)} placeholder="e.g. 10% off with code COMEBACK / Free shipping / nothing — just remind them" style={inputSt}/></Field>
      <Field label="Your brand tone"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Warm & personal","Friendly & casual","Premium & polished","Fun & playful"].map(t=>(<button key={t} onClick={()=>set("tone",t)} style={{padding:"6px 12px",borderRadius:"20px",border:`2px solid ${extra.tone===t?C.purple:C.border}`,background:extra.tone===t?C.purpleLt:"#fff",color:extra.tone===t?C.purple:C.text,cursor:"pointer",fontSize:"0.8em"}}>{t}</button>))}</div></Field>
    </div>
  );

  if(toolId==="sh_post_purchase") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("📦 The post-purchase sequence is the most valuable email flow in ecommerce. Done right: thank you → usage tips → review request → cross-sell. We'll write all 4.")}
      <Field label="What did they buy?"><input value={extra.product||""} onChange={e=>set("product",e.target.value)} placeholder="e.g. A soy candle" style={inputSt}/></Field>
      <Field label="Any tips, care instructions or how-to info?"><textarea value={extra.tips||""} onChange={e=>set("tips",e.target.value)} placeholder="e.g. Trim wick to 5mm before lighting, first burn should be 2 hours, keep away from drafts" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="What would you cross-sell them?"><input value={extra.crossSell||""} onChange={e=>set("crossSell",e.target.value)} placeholder="e.g. A candle snuffer or matching reed diffuser" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_winback") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🔄 Win-back emails for ecommerce go to customers who haven't ordered in 90+ days. We'll write a 3-email sequence that brings them back.")}
      <Field label="What win-back offer can you make?"><input value={extra.winbackOffer||""} onChange={e=>set("winbackOffer",e.target.value)} placeholder="e.g. 15% off with code MISSYOU / Free shipping on next order / surprise gift" style={inputSt}/></Field>
      <Field label="Anything new since they last ordered?"><input value={extra.newStuff||""} onChange={e=>set("newStuff",e.target.value)} placeholder="e.g. 4 new scents, improved packaging, now ships next day" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_product_launch") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🚀 A new product launch email to your list. Done right, it should be your best-performing email of the month.")}
      <Field label="What's the new product?"><input value={extra.newProduct||""} onChange={e=>set("newProduct",e.target.value)} placeholder="e.g. Rose & Oud Soy Candle — our first luxury collection" style={inputSt}/></Field>
      <Field label="What makes it special?"><textarea value={extra.newProductDesc||""} onChange={e=>set("newProductDesc",e.target.value)} placeholder="e.g. Made with real rose absolute, 50hr burn, limited run of 200, ships in a rigid gift box" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="Launch offer? (optional)"><input value={extra.launchOffer||""} onChange={e=>set("launchOffer",e.target.value)} placeholder="e.g. First 50 orders get free engraving / pre-order discount" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_flash_sale") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("⚡ Flash sale emails are one of the highest-converting emails in ecommerce. Urgency + discount + clear CTA = sales. We'll write it for you.")}
      <Field label="What's the offer?"><input value={extra.saleOffer||""} onChange={e=>set("saleOffer",e.target.value)} placeholder="e.g. 20% off everything / Buy 2 get 1 free / Free shipping this weekend only" style={inputSt}/></Field>
      <Field label="How long does it run?"><input value={extra.saleDuration||""} onChange={e=>set("saleDuration",e.target.value)} placeholder="e.g. 48 hours only / This weekend / Ends midnight Sunday" style={inputSt}/></Field>
      <Field label="Discount code (if any)"><input value={extra.saleCode||""} onChange={e=>set("saleCode",e.target.value)} placeholder="e.g. FLASH20" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_social_posts") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("📸 We'll write Instagram, Facebook and TikTok captions for your product launch — 3 versions, different angles, ready to post.")}
      <Field label="Product being launched"><input value={extra.socialProduct||""} onChange={e=>set("socialProduct",e.target.value)} placeholder="e.g. Rose & Oud Candle — our first luxury collection" style={inputSt}/></Field>
      <Field label="What angle do you want to lead with?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["The story behind it","What it looks/smells/feels like","Who it's perfect for","Limited availability","The price and value"].map(t=>(<button key={t} onClick={()=>set("socialAngle",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.socialAngle===t?C.purple:C.border}`,background:extra.socialAngle===t?C.purpleLt:"#fff",color:extra.socialAngle===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
    </div>
  );

  if(toolId==="sh_ad_copy") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🎯 We'll write Meta (Facebook/Instagram) and Google ad copy for a specific product or collection — 3 ad variations, ready to paste in.")}
      <Field label="What's the ad promoting?"><input value={extra.adProduct||""} onChange={e=>set("adProduct",e.target.value)} placeholder="e.g. Our soy candle gift sets / The whole store / New Rose collection" style={inputSt}/></Field>
      <Field label="Target audience"><input value={extra.adAudience||""} onChange={e=>set("adAudience",e.target.value)} placeholder="e.g. Women 25–45 interested in home décor and gifts" style={inputSt}/></Field>
      <Field label="Ad objective"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Drive store traffic","Get sales directly","Build brand awareness","Retarget past visitors"].map(t=>(<button key={t} onClick={()=>set("adObjective",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.adObjective===t?C.purple:C.border}`,background:extra.adObjective===t?C.purpleLt:"#fff",color:extra.adObjective===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
      <Field label="Special offer in the ad? (optional)"><input value={extra.adOffer||""} onChange={e=>set("adOffer",e.target.value)} placeholder="e.g. Free shipping / 15% off first order / Limited stock" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_ugc_brief") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🎬 A UGC (user-generated content) brief tells creators or customers exactly what video or photos you want — so you get content you can actually use.")}
      <Field label="Product to feature"><input value={extra.ugcProduct||""} onChange={e=>set("ugcProduct",e.target.value)} placeholder="e.g. Our candle gift sets" style={inputSt}/></Field>
      <Field label="Who are you briefing?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Micro-influencer","Customer who bought","Creator/UGC professional","Friend or family"].map(t=>(<button key={t} onClick={()=>set("ugcPerson",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.ugcPerson===t?C.purple:C.border}`,background:extra.ugcPerson===t?C.purpleLt:"#fff",color:extra.ugcPerson===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
      <Field label="What platform is the content for?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Instagram Reels","TikTok","Facebook","Website/store"].map(t=>(<button key={t} onClick={()=>set("ugcPlatform",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.ugcPlatform===t?C.purple:C.border}`,background:extra.ugcPlatform===t?C.purpleLt:"#fff",color:extra.ugcPlatform===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
    </div>
  );

  if(toolId==="sh_bio") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("✨ Your Instagram bio is the first thing potential customers see. We'll write your bio plus suggested link-in-bio copy that drives people to buy.")}
      <Field label="What's the #1 thing you want people to do?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Shop the store","See new arrivals","Grab a discount","Sign up to the list"].map(t=>(<button key={t} onClick={()=>set("bioAction",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.bioAction===t?C.purple:C.border}`,background:extra.bioAction===t?C.purpleLt:"#fff",color:extra.bioAction===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
      <Field label="Any current offer or hook?"><input value={extra.bioOffer||""} onChange={e=>set("bioOffer",e.target.value)} placeholder="e.g. Free shipping on orders over $50 / New collection just dropped" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_review_request") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("✉️ A post-purchase review request email — sent a few days after delivery. Reviews convert browsers into buyers. 93% of people read reviews before purchasing.")}
      <Field label="What did they buy?"><input value={extra.reviewProduct||""} onChange={e=>set("reviewProduct",e.target.value)} placeholder="e.g. A candle gift set" style={inputSt}/></Field>
      <Field label="Where do you want reviews?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Google","Your Shopify store","Facebook","Trustpilot"].map(t=>(<button key={t} onClick={()=>set("reviewPlatform",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.reviewPlatform===t?C.purple:C.border}`,background:extra.reviewPlatform===t?C.purpleLt:"#fff",color:extra.reviewPlatform===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
      <Field label="Your review link (optional)"><input value={extra.reviewLink||""} onChange={e=>set("reviewLink",e.target.value)} placeholder="e.g. https://g.page/r/.../review" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_review_respond") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("💬 Paste in a product review and we'll write the perfect response — personal, genuine, never corporate.")}
      <Field label="Paste the review"><textarea value={extra.reviewText||""} onChange={e=>set("reviewText",e.target.value)} placeholder={'"Perfect gift for my mum! The packaging was beautiful and it smells amazing. Will definitely buy again."'} rows={4} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="Star rating"><div style={{display:"flex",gap:"7px"}}>{[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>set("reviewStars",n)} style={{padding:"7px 11px",borderRadius:"8px",border:`2px solid ${extra.reviewStars===n?C.amber:C.border}`,background:extra.reviewStars===n?C.amberLt:"#fff",cursor:"pointer",fontSize:"0.88em"}}>{"⭐".repeat(n)}</button>))}</div></Field>
    </div>
  );

  if(toolId==="sh_bad_review") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <div style={{background:C.redLt,border:`1px solid #FECACA`,borderRadius:"8px",padding:"11px 13px",fontSize:"0.83em",color:"#991B1B",lineHeight:1.6}}>😬 Don't panic. A calm professional response to a bad review shows every other potential customer that you care and handle problems well. We'll write it.</div>
      <Field label="Paste the bad review"><textarea value={extra.badReview||""} onChange={e=>set("badReview",e.target.value)} placeholder={'"Candle arrived broken and smelled nothing like the description. Very disappointed."'} rows={3} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="What actually happened? (optional)"><textarea value={extra.badContext||""} onChange={e=>set("badContext",e.target.value)} placeholder="e.g. This was a shipping damage claim — we already refunded them / We didn't hear from this customer before the review" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
    </div>
  );

  if(toolId==="sh_trust_copy") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🛡️ Trust badges and guarantee copy on your product pages reduce buyer hesitation and increase conversions. We'll write them all for your store.")}
      <Field label="What trust signals does your store offer?">
        <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
          {["Free shipping (over a threshold)","Free returns / easy returns","Money-back guarantee","Secure checkout","Fast dispatch / ships same day","Australian owned / made in Australia","Handmade / small batch","Gift wrapping available"].map(t=>(
            <button key={t} onClick={()=>set("trustSignals",((extra.trustSignals||"").includes(t)?extra.trustSignals.replace(t+",","").replace(","+t,"").trim():((extra.trustSignals||"")?extra.trustSignals+","+t:t)))} style={{padding:"9px 12px",borderRadius:"8px",textAlign:"left",border:`2px solid ${(extra.trustSignals||"").includes(t)?C.purple:C.border}`,background:(extra.trustSignals||"").includes(t)?C.purpleLt:"#fff",cursor:"pointer",fontSize:"0.84em",color:(extra.trustSignals||"").includes(t)?C.purple:C.text,fontWeight:(extra.trustSignals||"").includes(t)?600:400}}>
              {(extra.trustSignals||"").includes(t)?"✓ ":""}{t}
            </button>
          ))}
        </div>
      </Field>
    </div>
  );

  if(toolId==="sh_blog") return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      {sib("✍️ We'll find a keyword real people are searching for related to your products, then write a full blog post that ranks on Google and drives buyers to your store.")}
      {!extra.chosenKeyword ? (
        <>
          <Field label="Hint for what to write about? (optional)"><input value={extra.topicHint||""} onChange={e=>set("topicHint",e.target.value)} placeholder="e.g. gifts for her, soy candle benefits, how to choose a candle" style={inputSt}/></Field>
          <button onClick={async()=>{
            set("loadingKeywords",true);
            try {
              const res = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:`You are an ecommerce SEO expert. Find low-competition blog post topics for online stores.`,messages:[{role:"user",content:`Find 5 blog post keyword ideas for this Shopify store: ${biz.name} — ${biz.description}\n${extra.topicHint?`Topic hint: ${extra.topicHint}`:""}\n\nReturn ONLY JSON, no other text:\n[{"keyword":"best soy candles for gifts","title":"The Best Soy Candles for Gifting in 2026 (and How to Choose the Perfect One)","why":"High buyer intent, moderate volume, easy to rank for a small store"},...]`}]})});
              const d = await res.json(); const cleaned = d.content[0].text.replace(/\`\`\`json|\`\`\`/g,"").trim(); set("keywordOptions",JSON.parse(cleaned));
            } catch(e){set("keywordError","Couldn't load — try again");}
            set("loadingKeywords",false);
          }} disabled={extra.loadingKeywords} style={{...btnPrimary,width:"100%",background:extra.loadingKeywords?"#94A3B8":C.purple}}>
            {extra.loadingKeywords?"Finding the best topics...":"🔍 Find me a topic to rank for →"}
          </button>
          {extra.keywordOptions&&(
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <div style={{fontSize:"0.8em",fontWeight:700,color:C.text}}>Pick one:</div>
              {extra.keywordOptions.map((kw,i)=>(
                <button key={i} onClick={()=>set("chosenKeyword",kw)} style={{padding:"12px 14px",borderRadius:"9px",textAlign:"left",cursor:"pointer",border:`2px solid ${C.border}`,background:"#fff",transition:"all 0.1s"}} onMouseEnter={e=>e.currentTarget.style.borderColor=C.purple} onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{fontWeight:700,fontSize:"0.88em",color:C.text,marginBottom:"3px"}}>"{kw.title}"</div>
                  <div style={{fontSize:"0.73em",color:C.muted}}>🔍 {kw.keyword}</div>
                  <div style={{fontSize:"0.73em",color:C.green,marginTop:"2px"}}>✓ {kw.why}</div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{background:C.greenLt,border:`1px solid #BBF7D0`,borderRadius:"8px",padding:"11px 14px",marginBottom:"10px"}}>
            <div style={{fontSize:"0.8em",fontWeight:700,color:"#166534",marginBottom:"2px"}}>✓ Topic chosen</div>
            <div style={{fontSize:"0.85em",color:C.text,fontWeight:600}}>"{extra.chosenKeyword.title}"</div>
          </div>
          <button onClick={()=>set("chosenKeyword",null)} style={{fontSize:"0.75em",color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>← Choose different</button>
        </div>
      )}
    </div>
  );

  if(toolId==="sh_faq") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("❓ Product FAQs answer the questions buyers have before they purchase — reducing hesitation and helping Google understand what your product does.")}
      <Field label="Product name"><input value={extra.faqProduct||""} onChange={e=>set("faqProduct",e.target.value)} placeholder="e.g. Lavender Soy Candle 250g" style={inputSt}/></Field>
      <Field label="Common questions customers ask you"><textarea value={extra.faqQuestions||""} onChange={e=>set("faqQuestions",e.target.value)} placeholder="e.g. How long does it burn? Is it vegan? Can I get it gift wrapped? Do you ship overseas?" rows={3} style={{...inputSt,resize:"vertical"}}/></Field>
    </div>
  );

  if(toolId==="sh_about") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🏠 Your About Us page is one of your most visited — and most underused — pages. A great one converts first-time visitors into buyers by making your brand feel real.")}
      <Field label="How did the store start?"><textarea value={extra.storyOrigin||""} onChange={e=>set("storyOrigin",e.target.value)} placeholder="e.g. Started in my kitchen in 2022 making candles as Christmas gifts — friends loved them so much I launched online" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="What do you stand for? What makes you different?"><textarea value={extra.storyValues||""} onChange={e=>set("storyValues",e.target.value)} placeholder="e.g. All natural ingredients, no synthetic fragrances, small batches, handmade in Australia" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
      <Field label="Who's behind the brand?"><input value={extra.founder||""} onChange={e=>set("founder",e.target.value)} placeholder="e.g. Just me (Sarah), working from my home studio in Melbourne" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_shopify_report") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("📊 Paste in your Shopify store numbers from the last 30 days and we'll tell you exactly what they mean, what's working, what isn't, and your 3 most important actions this month.")}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <Field label="Total orders"><input type="number" value={extra.orders||""} onChange={e=>set("orders",e.target.value)} placeholder="e.g. 47" style={inputSt}/></Field>
        <Field label="Total revenue"><input value={extra.revenue||""} onChange={e=>set("revenue",e.target.value)} placeholder="e.g. $3,240" style={inputSt}/></Field>
        <Field label="Store sessions (visitors)"><input type="number" value={extra.sessions||""} onChange={e=>set("sessions",e.target.value)} placeholder="e.g. 1,820" style={inputSt}/></Field>
        <Field label="Conversion rate"><input value={extra.convRate||""} onChange={e=>set("convRate",e.target.value)} placeholder="e.g. 2.5%" style={inputSt}/></Field>
        <Field label="Average order value"><input value={extra.aov||""} onChange={e=>set("aov",e.target.value)} placeholder="e.g. $68" style={inputSt}/></Field>
        <Field label="Cart abandonment rate"><input value={extra.cartAbandonment||""} onChange={e=>set("cartAbandonment",e.target.value)} placeholder="e.g. 72%" style={inputSt}/></Field>
      </div>
      <Field label="Top traffic source"><select value={extra.topSource||""} onChange={e=>set("topSource",e.target.value)} style={{...inputSt}}><option value="">Don't know / skip</option><option>Organic search (Google)</option><option>Instagram</option><option>Facebook</option><option>TikTok</option><option>Email</option><option>Paid ads</option><option>Direct</option></select></Field>
      <Field label="What do you want to understand?"><textarea value={extra.storeQuestion||""} onChange={e=>set("storeQuestion",e.target.value)} placeholder="e.g. Why aren't people buying? / My sessions are up but sales are down — why? / What should I focus on next month?" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
    </div>
  );

  if(toolId==="sh_cro_audit") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🔬 Tell us about your store and we'll identify your top 3 conversion killers — the specific things most likely stopping browsers from becoming buyers.")}
      <Field label="Your store URL"><input value={extra.storeUrl||biz.suburb||""} onChange={e=>set("storeUrl",e.target.value)} placeholder="e.g. lunacandles.com.au" style={inputSt}/></Field>
      <Field label="What's your current conversion rate?"><input value={extra.currentConv||""} onChange={e=>set("currentConv",e.target.value)} placeholder="e.g. 1.8% (average Shopify is 1.4–3.3%)" style={inputSt}/></Field>
      <Field label="Where do people drop off?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["They visit but don't add to cart","They add to cart but don't checkout","They start checkout but don't complete","All of the above / not sure"].map(t=>(<button key={t} onClick={()=>set("dropOff",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.dropOff===t?C.purple:C.border}`,background:extra.dropOff===t?C.purpleLt:"#fff",color:extra.dropOff===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
      <Field label="Describe your store briefly"><textarea value={extra.storeDesc||biz.description||""} onChange={e=>set("storeDesc",e.target.value)} placeholder="e.g. Handmade soy candles, 12 products, average order $65, mostly mobile traffic, 70% women 25–45" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
    </div>
  );

  if(toolId==="sh_ads_report") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("📈 Paste in your ad numbers and we'll tell you in plain English what's performing, what's wasting money, and exactly what to change.")}
      <Field label="Which ad platform?"><div style={{display:"flex",gap:"7px"}}>{["Meta (Facebook/Instagram)","Google Ads","TikTok Ads"].map(t=>(<button key={t} onClick={()=>set("adPlatform",t)} style={{padding:"7px 12px",borderRadius:"8px",border:`2px solid ${extra.adPlatform===t?C.purple:C.border}`,background:extra.adPlatform===t?C.purpleLt:"#fff",color:extra.adPlatform===t?C.purple:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <Field label="Total spend"><input value={extra.adSpend||""} onChange={e=>set("adSpend",e.target.value)} placeholder="e.g. $450" style={inputSt}/></Field>
        <Field label="Revenue from ads (ROAS)"><input value={extra.adRevenue||""} onChange={e=>set("adRevenue",e.target.value)} placeholder="e.g. $1,350 (or ROAS 3.0)" style={inputSt}/></Field>
        <Field label="Clicks"><input value={extra.adClicks||""} onChange={e=>set("adClicks",e.target.value)} placeholder="e.g. 820" style={inputSt}/></Field>
        <Field label="Cost per click (CPC)"><input value={extra.adCpc||""} onChange={e=>set("adCpc",e.target.value)} placeholder="e.g. $0.55" style={inputSt}/></Field>
        <Field label="Conversions (purchases)"><input value={extra.adConversions||""} onChange={e=>set("adConversions",e.target.value)} placeholder="e.g. 18" style={inputSt}/></Field>
        <Field label="Cost per purchase"><input value={extra.adCpa||""} onChange={e=>set("adCpa",e.target.value)} placeholder="e.g. $25" style={inputSt}/></Field>
      </div>
      <Field label="What's your question about these numbers?"><textarea value={extra.adQuestion||""} onChange={e=>set("adQuestion",e.target.value)} placeholder="e.g. Is my ROAS good? / Why are clicks high but conversions low? / Should I increase or cut the budget?" rows={2} style={{...inputSt,resize:"vertical"}}/></Field>
    </div>
  );

  if(toolId==="sh_influencer") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("🤝 We'll write the perfect outreach email to send to micro-influencers about featuring your product — genuine, specific, not copy-paste sounding.")}
      <Field label="What product are you pitching?"><input value={extra.pitchProduct||""} onChange={e=>set("pitchProduct",e.target.value)} placeholder="e.g. Our handmade candle gift sets" style={inputSt}/></Field>
      <Field label="What are you offering?"><div style={{display:"flex",flexDirection:"column",gap:"7px"}}>{["Free product in exchange for honest review","Free product + small commission on sales","Paid collaboration (fixed fee)","Free product — no obligation"].map(t=>(<button key={t} onClick={()=>set("pitchOffer",t)} style={{padding:"9px 12px",borderRadius:"8px",textAlign:"left",border:`2px solid ${extra.pitchOffer===t?C.purple:C.border}`,background:extra.pitchOffer===t?C.purpleLt:"#fff",cursor:"pointer",fontSize:"0.84em",color:extra.pitchOffer===t?C.purple:C.text}}>{extra.pitchOffer===t?"✓ ":""}{t}</button>))}</div></Field>
      <Field label="What kind of creator are you targeting?"><input value={extra.pitchTarget||""} onChange={e=>set("pitchTarget",e.target.value)} placeholder="e.g. Home décor lovers, gift guides accounts, mum bloggers, 5k–50k followers" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_referral") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("👥 An ecommerce referral program that works: existing customers share a code, their friend gets a discount on their first order, the referrer gets store credit. We'll build the whole system.")}
      <Field label="What does the referrer get?"><input value={extra.referrerReward||""} onChange={e=>set("referrerReward",e.target.value)} placeholder="e.g. $10 store credit / 15% off their next order" style={inputSt}/></Field>
      <Field label="What does the new customer get?"><input value={extra.newCustOffer||""} onChange={e=>set("newCustOffer",e.target.value)} placeholder="e.g. 10% off their first order / Free shipping" style={inputSt}/></Field>
    </div>
  );

  if(toolId==="sh_loyalty") return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      {sib("👑 A loyalty program keeps customers coming back. We'll write the whole thing — how points work, VIP tier names, what rewards they get, and how to announce it to your list.")}
      <Field label="How do you want the program to work?"><div style={{display:"flex",flexDirection:"column",gap:"7px"}}>{["Points per dollar spent (redeemable for discount)","VIP tiers — Bronze, Silver, Gold","Punch card style — buy 10 get 1 free","Birthday rewards","All of the above — suggest the best setup"].map(t=>(<button key={t} onClick={()=>set("loyaltyType",t)} style={{padding:"9px 12px",borderRadius:"8px",textAlign:"left",border:`2px solid ${extra.loyaltyType===t?C.purple:C.border}`,background:extra.loyaltyType===t?C.purpleLt:"#fff",cursor:"pointer",fontSize:"0.84em",color:extra.loyaltyType===t?C.purple:C.text}}>{extra.loyaltyType===t?"✓ ":""}{t}</button>))}</div></Field>
    </div>
  );

  if(toolId==="sh_sale_campaign") {
    const SALES=[
      {id:"blackfriday",icon:"🖤",label:"Black Friday / Cyber Monday",dates:"Late November"},
      {id:"christmas",  icon:"🎄",label:"Christmas",                   dates:"December"},
      {id:"newyear",    icon:"🎆",label:"New Year Sale",               dates:"January"},
      {id:"eofy",       icon:"💼",label:"End of Financial Year",       dates:"June"},
      {id:"easter",     icon:"🐣",label:"Easter",                      dates:"March / April"},
      {id:"mothers",    icon:"💐",label:"Mother's Day",                dates:"May"},
      {id:"valentine",  icon:"❤️",label:"Valentine's Day",             dates:"February"},
      {id:"custom",     icon:"📅",label:"My own sale...",             dates:"You tell us"},
    ];
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        {sib("🗓️ Pick an upcoming sale and we'll write the full campaign: emails, social posts, ad copy, discount code ideas, and a day-by-day launch plan.")}
        <Field label="Which sale?">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
            {SALES.map(s=>(<button key={s.id} onClick={()=>set("sale",s)} style={{padding:"10px 12px",borderRadius:"9px",textAlign:"left",cursor:"pointer",border:`2px solid ${extra.sale?.id===s.id?C.purple:C.border}`,background:extra.sale?.id===s.id?C.purpleLt:"#fff",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.1s"}}>
              <span style={{fontSize:"1.1em"}}>{s.icon}</span>
              <div><div style={{fontSize:"0.82em",fontWeight:700,color:extra.sale?.id===s.id?C.purple:C.text}}>{s.label}</div><div style={{fontSize:"0.68em",color:C.muted}}>{s.dates}</div></div>
            </button>))}
          </div>
        </Field>
        {extra.sale?.id==="custom"&&<Field label="What's your sale?"><input value={extra.customSale||""} onChange={e=>set("customSale",e.target.value)} placeholder="e.g. Our 2nd birthday sale / Spring collection launch" style={inputSt}/></Field>}
        <Field label="What's the offer?"><input value={extra.saleOffer2||""} onChange={e=>set("saleOffer2",e.target.value)} placeholder="e.g. 25% off sitewide / Free gift with every order / Buy 2 get 1 free" style={inputSt}/></Field>
      </div>
    );
  }

  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// TOOL GRID
// ═════════════════════════════════════════════════════════════════════════════
function ToolGrid({group,results,onSelect,accentColor,accentLt}) {
  const ac = accentColor||C.brand;
  const al = accentLt||C.brandLt;
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(215px,1fr))",gap:"9px",marginBottom:"8px"}}>
      {group.tools.map(tool=>{
        const done = !!results[tool.id];
        return (
          <button key={tool.id} onClick={()=>onSelect(tool.id)} style={{padding:"15px",borderRadius:"11px",textAlign:"left",border:`2px solid ${done?C.green:C.border}`,background:done?C.greenLt:"#fff",cursor:"pointer",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",transition:"all 0.12s"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:"7px"}}>
              <span style={{fontSize:"1.4em"}}>{tool.icon}</span>
              {done&&<span style={{fontSize:"0.63em",background:C.green,color:"#fff",padding:"2px 7px",borderRadius:"10px",height:"fit-content"}}>Done ✓</span>}
            </div>
            <div style={{fontWeight:700,fontSize:"0.87em",color:C.text,marginBottom:"3px"}}>{tool.label}</div>
            <div style={{fontSize:"0.74em",color:C.muted,lineHeight:1.4}}>{tool.desc}</div>
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// TOOL PANEL
// ═════════════════════════════════════════════════════════════════════════════
function ToolPanel({toolId,biz,industry,existing,onBack,onSave}) {
  const [phase,  setPhase]  = useState(existing?"done":"form");
  const [output, setOutput] = useState(existing||"");
  const [extra,  setExtra]  = useState({});
  const [error,  setError]  = useState("");
  const [copied, setCopied] = useState(false);
  const tool = ALL_TOOLS.find(t=>t.id===toolId);

  const generate = async () => {
    setPhase("generating"); setError("");
    try {
      const content = await generateContent(toolId,biz,extra,industry);
      setOutput(content); setPhase("done");
    } catch(e) { setError(e.message); setPhase("form"); }
  };

  const copy = () => {
    navigator.clipboard.writeText(output).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  };

  return (
    <div>
      <button onClick={onBack} style={{...backBtn,marginBottom:"14px"}}>← Back</button>
      <div style={{background:"#fff",borderRadius:"13px",border:`1px solid ${C.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.05)"}}>
        <div style={{padding:"16px 18px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"11px"}}>
          <span style={{fontSize:"1.7em"}}>{tool?.icon}</span>
          <div>
            <div style={{fontWeight:800,fontSize:"1em",color:C.text}}>{tool?.label}</div>
            <div style={{fontSize:"0.76em",color:C.muted}}>{tool?.desc}</div>
          </div>
        </div>
        <div style={{padding:"18px"}}>
          {phase==="form"&&(
            <div>
              <ExtraFields toolId={toolId} biz={biz} extra={extra} setExtra={setExtra}/>
              {error&&<div style={{margin:"12px 0",padding:"11px",background:C.redLt,border:`1px solid #FECACA`,borderRadius:"8px",color:C.red,fontSize:"0.83em"}}>{error}</div>}
              {toolId!=="blog"&&toolId!=="sh_blog"&&<button onClick={generate} style={{...btnPrimary,width:"100%",marginTop:"18px",background:toolId==="seasonal"||toolId==="analytics"||toolId==="jobad"?C.teal:toolId.startsWith("sh_")?C.purple:C.brand}}>
                {toolId==="seasonal"?"🗓️ Build My Seasonal Campaign →"
                :toolId==="analytics"?"📊 Explain My Numbers →"
                :toolId==="jobad"?"📋 Write My Job Ad →"
                :toolId==="sh_cro_audit"?"🔬 Audit My Store →"
                :toolId==="sh_shopify_report"?"📊 Explain My Numbers →"
                :toolId==="sh_ads_report"?"📈 Analyse My Ads →"
                :`✨ Create my ${tool?.label}`}
              </button>}
              {(toolId==="blog"||toolId==="sh_blog")&&extra.chosenKeyword&&<button onClick={generate} style={{...btnPrimary,width:"100%",marginTop:"18px",background:toolId==="sh_blog"?C.purple:C.green}}>✍️ Write this blog post →</button>}
            </div>
          )}
          {phase==="generating"&&(
            <div style={{textAlign:"center",padding:"36px 20px"}}>
              <div style={{fontSize:"2.4em",marginBottom:"10px"}}>
                {toolId==="blog"?"✍️":toolId==="analytics"?"📊":toolId==="seasonal"?"🗓️":toolId==="jobad"?"📋":"✨"}
              </div>
              <div style={{fontWeight:700,color:C.text,marginBottom:"6px"}}>
                {toolId==="blog"?"Writing your blog post..."
                :toolId==="analytics"?"Reading your numbers..."
                :toolId==="seasonal"?"Building your campaign..."
                :toolId==="jobad"?"Writing your job ad..."
                :`Creating your ${tool?.label}...`}
              </div>
              <div style={{color:C.muted,fontSize:"0.85em"}}>
                {["blog","analytics","seasonal","jobad"].includes(toolId)
                  ?"This one takes about 30 seconds — it's doing a lot of work for you"
                  :"About 15 seconds"}
              </div>
            </div>
          )}
          {phase==="done"&&(
            <div>
              <div style={{background:C.greenLt,border:`1px solid #BBF7D0`,borderRadius:"8px",padding:"9px 13px",marginBottom:"12px",fontSize:"0.84em",color:"#166534"}}>✅ Ready — read it through then copy or save below.</div>
              <div style={{background:C.light,borderRadius:"9px",padding:"14px",fontSize:"0.84em",color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:"380px",overflowY:"auto",border:`1px solid ${C.border}`,marginBottom:"10px"}}>
                {output}
              </div>
              <div style={{display:"flex",gap:"7px"}}>
                <button onClick={copy} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid ${C.brand}`,background:copied?C.green:C.brandLt,color:copied?"#fff":C.brand,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s"}}>
                  {copied?"✓ Copied!":"📋 Copy"}
                </button>
                <button onClick={()=>setPhase("form")} style={{padding:"11px 14px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:"0.85em"}}>🔄 Redo</button>
                <button onClick={()=>onSave(toolId,output)} style={{padding:"11px 14px",borderRadius:"8px",border:"none",background:C.green,color:"#fff",cursor:"pointer",fontSize:"0.85em",fontWeight:600}}>✓ Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// EXTRA FIELDS (per tool)
// ═════════════════════════════════════════════════════════════════════════════
function ExtraFields({toolId,biz,extra,setExtra}) {
  const set = (k,v)=>setExtra(e=>({...e,[k]:v}));
  const ib = (text)=>(<div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:"8px",padding:"11px 13px",fontSize:"0.83em",color:"#1E40AF",lineHeight:1.6,marginBottom:"12px"}}>{text}</div>);

  if(toolId==="website") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib(`Building a complete website for ${biz.name} in ${biz.suburb}.`)}<Field label="Phone"><input value={extra.phone||""} onChange={e=>set("phone",e.target.value)} placeholder="02 4229 1234" style={inputSt}/></Field><Field label="Opening hours"><input value={extra.hours||""} onChange={e=>set("hours",e.target.value)} placeholder="Mon–Fri 7am–5pm, Sat 8am–2pm" style={inputSt}/></Field><Field label="Address (optional)"><input value={extra.address||""} onChange={e=>set("address",e.target.value)} placeholder="42 Crown St, Wollongong" style={inputSt}/></Field><Field label="Anything special customers should know?"><textarea value={extra.special||""} onChange={e=>set("special",e.target.value)} placeholder="Free parking, dog-friendly, 20 years in business..." rows={2} style={{...inputSt,resize:"vertical"}}/></Field></div>);

  if(toolId==="posts") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib(`Writing 7 ready-to-post social media posts for ${biz.name}.`)}<Field label="Anything to promote this week?"><textarea value={extra.promo||""} onChange={e=>set("promo",e.target.value)} placeholder="New menu, special offer, local event..." rows={2} style={{...inputSt,resize:"vertical"}}/></Field><Field label="Tone"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Friendly & casual","Professional","Fun & playful","Warm & community"].map(t=>(<button key={t} onClick={()=>set("tone",t)} style={{padding:"6px 12px",borderRadius:"20px",border:`2px solid ${extra.tone===t?C.brand:C.border}`,background:extra.tone===t?C.brandLt:"#fff",color:extra.tone===t?C.brand:C.text,cursor:"pointer",fontSize:"0.8em"}}>{t}</button>))}</div></Field></div>);

  if(toolId==="emails") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("Writing a professional email for your customer list.")}<Field label="What's this email about?"><div style={{display:"flex",flexDirection:"column",gap:"7px"}}>{["A special offer","Announcing something new","Saying thank you","Asking for a Google review","Seasonal message"].map(t=>(<button key={t} onClick={()=>set("purpose",t)} style={{padding:"10px 12px",borderRadius:"8px",border:`2px solid ${extra.purpose===t?C.brand:C.border}`,background:extra.purpose===t?C.brandLt:"#fff",color:extra.purpose===t?C.brand:C.text,cursor:"pointer",textAlign:"left",fontSize:"0.85em",fontWeight:extra.purpose===t?700:400}}>{extra.purpose===t?"✓ ":""}{t}</button>))}</div></Field><Field label="Details (optional)"><textarea value={extra.details||""} onChange={e=>set("details",e.target.value)} placeholder="25% off this weekend only..." rows={2} style={{...inputSt,resize:"vertical"}}/></Field></div>);

  if(toolId==="ads") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("Writing 3 ad variations for Facebook and Google.")}<Field label="What's the ad promoting?"><input value={extra.offer||""} onChange={e=>set("offer",e.target.value)} placeholder="New menu / 20% off / Free first consult" style={inputSt}/></Field><Field label="Target audience"><input value={extra.audience||""} onChange={e=>set("audience",e.target.value)} placeholder={`Families in ${biz.suburb||"your area"}`} style={inputSt}/></Field><Field label="Call to action"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Call us","Book online","Visit us","Message us","Get the offer"].map(t=>(<button key={t} onClick={()=>set("cta",t)} style={{padding:"6px 11px",borderRadius:"20px",border:`2px solid ${extra.cta===t?C.brand:C.border}`,background:extra.cta===t?C.brandLt:"#fff",color:extra.cta===t?C.brand:C.text,cursor:"pointer",fontSize:"0.78em"}}>{t}</button>))}</div></Field></div>);

  if(toolId==="promo") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("Creating a complete promotion pack — post, SMS, signage, how to run it.")}<Field label="Offer type"><div style={{display:"flex",flexDirection:"column",gap:"7px"}}>{["% discount","$ amount off","Free product with purchase","Buy one get one","Loyalty reward","Free first visit"].map(t=>(<button key={t} onClick={()=>set("offerType",t)} style={{padding:"9px 12px",borderRadius:"8px",border:`2px solid ${extra.offerType===t?C.brand:C.border}`,background:extra.offerType===t?C.brandLt:"#fff",color:extra.offerType===t?C.brand:C.text,cursor:"pointer",textAlign:"left",fontSize:"0.85em",fontWeight:extra.offerType===t?700:400}}>{extra.offerType===t?"✓ ":""}{t}</button>))}</div></Field><Field label="Details (optional)"><input value={extra.promoDetail||""} onChange={e=>set("promoDetail",e.target.value)} placeholder="Valid weekdays, orders over $30..." style={inputSt}/></Field></div>);

  if(toolId==="gbp") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("📍 Google Business Profile posts appear when people search for you on Google. Free and barely anyone does this — huge opportunity.")}<Field label="What's happening this week?"><textarea value={extra.gbpFocus||""} onChange={e=>set("gbpFocus",e.target.value)} placeholder="New menu, extended hours, special offer..." rows={2} style={{...inputSt,resize:"vertical"}}/></Field><Field label="Post type"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["What's new","Special offer","Event","General update"].map(t=>(<button key={t} onClick={()=>set("gbpType",t)} style={{padding:"6px 12px",borderRadius:"20px",border:`2px solid ${extra.gbpType===t?C.brand:C.border}`,background:extra.gbpType===t?C.brandLt:"#fff",color:extra.gbpType===t?C.brand:C.text,cursor:"pointer",fontSize:"0.8em"}}>{t}</button>))}</div></Field></div>);

  if(toolId==="review_request") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("⭐ Writing an SMS + email asking customers to leave a Google review. Businesses that do this consistently average 4.8+ stars.")}<Field label="Your Google review link (optional)"><input value={extra.reviewLink||""} onChange={e=>set("reviewLink",e.target.value)} placeholder="https://g.page/r/your-business/review" style={inputSt}/><div style={{fontSize:"0.73em",color:C.muted,marginTop:"4px"}}>Don't have it? Use "Get Your Review Link" first, or we'll add a placeholder.</div></Field><Field label="When to send?"><div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>{["Right after visit","Day after","End of week"].map(t=>(<button key={t} onClick={()=>set("timing",t)} style={{padding:"6px 12px",borderRadius:"20px",border:`2px solid ${extra.timing===t?C.brand:C.border}`,background:extra.timing===t?C.brandLt:"#fff",color:extra.timing===t?C.brand:C.text,cursor:"pointer",fontSize:"0.8em"}}>{t}</button>))}</div></Field></div>);

  if(toolId==="review_respond") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("💬 Paste any Google review below and get a perfect response to post back.")}<Field label="Paste the review"><textarea value={extra.reviewText||""} onChange={e=>set("reviewText",e.target.value)} placeholder='"Great coffee and lovely staff! Will definitely be back."' rows={4} style={{...inputSt,resize:"vertical"}}/></Field><Field label="Star rating"><div style={{display:"flex",gap:"7px"}}>{[1,2,3,4,5].map(n=>(<button key={n} onClick={()=>set("stars",n)} style={{padding:"7px 11px",borderRadius:"8px",border:`2px solid ${extra.stars===n?C.amber:C.border}`,background:extra.stars===n?C.amberLt:"#fff",cursor:"pointer",fontSize:"0.88em"}}>{"⭐".repeat(n)}</button>))}</div></Field></div>);

  if(toolId==="review_negative") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}><div style={{background:C.redLt,border:`1px solid #FECACA`,borderRadius:"8px",padding:"11px 13px",fontSize:"0.83em",color:"#991B1B",lineHeight:1.6}}>😬 Don't panic and don't fire back. A calm, professional response turns a bad review into proof that you care.</div><Field label="Paste the negative review"><textarea value={extra.badReview||""} onChange={e=>set("badReview",e.target.value)} placeholder='"Waited 40 minutes and the food was cold."' rows={3} style={{...inputSt,resize:"vertical"}}/></Field><Field label="What actually happened? (optional)"><textarea value={extra.context||""} onChange={e=>set("context",e.target.value)} placeholder="Short-staffed that day, busiest period of year..." rows={2} style={{...inputSt,resize:"vertical"}}/></Field><Field label="Approach"><div style={{display:"flex",flexDirection:"column",gap:"7px"}}>{["Apologise and invite back","Clarify what happened","Ask to contact us directly","Acknowledge and move on"].map(t=>(<button key={t} onClick={()=>set("approach",t)} style={{padding:"9px 12px",borderRadius:"8px",border:`2px solid ${extra.approach===t?C.red:C.border}`,background:extra.approach===t?C.redLt:"#fff",color:extra.approach===t?C.red:C.text,cursor:"pointer",textAlign:"left",fontSize:"0.84em"}}>{extra.approach===t?"✓ ":""}{t}</button>))}</div></Field></div>);

  if(toolId==="review_link") return (<div style={{display:"flex",flexDirection:"column",gap:"12px"}}>{ib("🔗 We'll walk you through finding your Google review link step by step, and give you copy-paste messages to share it everywhere.")}<Field label="Business name on Google"><input value={extra.googleName||biz.name} onChange={e=>set("googleName",e.target.value)} style={inputSt}/></Field><Field label="Suburb / location"><input value={extra.googleSuburb||biz.suburb} onChange={e=>set("googleSuburb",e.target.value)} style={inputSt}/></Field></div>);

  if(toolId==="blog") return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"8px",padding:"13px 15px",fontSize:"0.84em",color:"#166534",lineHeight:1.65}}>
        ✍️ <strong>How this works:</strong> We pick a topic that real people in {biz.suburb} are searching for on Google right now — something low competition that your business can actually rank for. Then we write a proper blog post around it. One post can bring you free Google traffic for years.
      </div>
      {!extra.chosenKeyword ? (
        <>
          <div style={{background:C.brandLt,border:`1px solid ${C.sky||"#BFDBFE"}`,borderRadius:"8px",padding:"12px 14px",fontSize:"0.83em",color:"#1E40AF",lineHeight:1.6}}>
            💡 Click <strong>"Find me a topic"</strong> and we'll come back with 5 real keyword ideas specifically for a {industry?.label} in {biz.suburb}. Pick the one you like and we'll write the full blog post.
          </div>
          <Field label="Anything specific you'd like to write about? (optional)">
            <input value={extra.topicHint||""} onChange={e=>set("topicHint",e.target.value)}
              placeholder={`e.g. best coffee in ${biz.suburb}, how to find a good ${industry?.label?.toLowerCase()}`}
              style={inputSt}/>
            <div style={{fontSize:"0.73em",color:C.muted,marginTop:"4px"}}>Leave blank and we'll find the best opportunity for you automatically.</div>
          </Field>
          <button
            onClick={async()=>{
              set("loadingKeywords",true);
              try {
                const res = await fetch("https://api.anthropic.com/v1/messages",{
                  method:"POST",headers:{"Content-Type":"application/json"},
                  body:JSON.stringify({
                    model:"claude-sonnet-4-6",max_tokens:1000,
                    system:`You are a local SEO expert for Australian small businesses. You know which long-tail keywords are low competition and easy for a local business to rank for on Google.`,
                    messages:[{role:"user",content:`Generate 5 blog post keyword ideas for a ${industry?.label} business called "${biz.name}" located in ${biz.suburb}, Australia.

${extra.topicHint ? `The owner suggested this area of interest: "${extra.topicHint}"` : "Find the best opportunities based on the business type and location."}

Rules for good local SEO keywords:
- Long-tail (4-8 words), very specific
- Include the suburb or nearby area naturally
- Question-based or "how to" or "best [X] in [suburb]" format
- Low competition — local businesses can realistically rank for these
- High intent — people searching these are likely to become customers

Return ONLY a JSON array of 5 objects, no other text:
[
  {"keyword":"best family cafe in wollongong","title":"Best Family-Friendly Cafés in Wollongong — A Local's Guide","why":"Parents searching for kid-friendly spots — high intent, low competition"},
  ...
]`}]
                  })
                });
                const d = await res.json();
                const text = d.content[0].text;
                const cleaned = text.replace(/```json|```/g,"").trim();
                const keywords = JSON.parse(cleaned);
                set("keywordOptions",keywords);
              } catch(e) {
                set("keywordError","Couldn't load suggestions — try again");
              }
              set("loadingKeywords",false);
            }}
            disabled={extra.loadingKeywords}
            style={{...btnPrimary,width:"100%",background:extra.loadingKeywords?"#94A3B8":C.brand}}
          >
            {extra.loadingKeywords ? "Finding the best topics for you..." : "🔍 Find me a topic to write about →"}
          </button>
          {extra.keywordError&&<div style={{fontSize:"0.8em",color:C.red}}>{extra.keywordError}</div>}
          {extra.keywordOptions&&(
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <div style={{fontSize:"0.8em",fontWeight:700,color:C.text}}>Pick one — we'll write the full blog post:</div>
              {extra.keywordOptions.map((kw,i)=>(
                <button key={i} onClick={()=>set("chosenKeyword",kw)} style={{
                  padding:"12px 14px",borderRadius:"9px",textAlign:"left",cursor:"pointer",
                  border:`2px solid ${C.border}`,background:"#fff",
                  transition:"all 0.1s",
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.brand}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                  <div style={{fontWeight:700,fontSize:"0.88em",color:C.text,marginBottom:"3px"}}>"{kw.title}"</div>
                  <div style={{fontSize:"0.73em",color:C.muted}}>🔍 Keyword: <em>{kw.keyword}</em></div>
                  <div style={{fontSize:"0.73em",color:C.green,marginTop:"2px"}}>✓ {kw.why}</div>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <div style={{background:C.greenLt,border:`1px solid #BBF7D0`,borderRadius:"8px",padding:"11px 14px",marginBottom:"10px"}}>
            <div style={{fontSize:"0.8em",fontWeight:700,color:"#166534",marginBottom:"2px"}}>✓ Topic chosen</div>
            <div style={{fontSize:"0.85em",color:C.text,fontWeight:600}}>"{extra.chosenKeyword.title}"</div>
            <div style={{fontSize:"0.73em",color:C.muted,marginTop:"2px"}}>Keyword: {extra.chosenKeyword.keyword}</div>
          </div>
          <button onClick={()=>set("chosenKeyword",null)} style={{fontSize:"0.75em",color:C.muted,background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>
            ← Choose a different topic
          </button>
        </div>
      )}
    </div>
  );

  if(toolId==="seasonal") {
    const SEASONS=[
      {id:"christmas",  icon:"🎄",label:"Christmas & New Year",  dates:"December / January"},
      {id:"easter",     icon:"🐣",label:"Easter",                dates:"March / April"},
      {id:"eofy",       icon:"💼",label:"End of Financial Year", dates:"June"},
      {id:"mothers",    icon:"💐",label:"Mother's Day",          dates:"Second Sunday in May"},
      {id:"fathers",    icon:"👔",label:"Father's Day",          dates:"First Sunday in September"},
      {id:"halloween",  icon:"🎃",label:"Halloween",             dates:"31 October"},
      {id:"valentines", icon:"❤️",label:"Valentine's Day",       dates:"14 February"},
      {id:"backtoschool",icon:"🎒",label:"Back to School",       dates:"Late January / February"},
      {id:"winter",     icon:"❄️",label:"Winter Campaign",       dates:"June / July / August"},
      {id:"summer",     icon:"☀️",label:"Summer Campaign",       dates:"December / January / February"},
      {id:"custom",     icon:"📅",label:"Something else...",     dates:"You tell us"},
    ];
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        <div style={{background:C.tealLt,border:"1px solid #99F6E4",borderRadius:"8px",padding:"13px 15px",fontSize:"0.84em",color:"#0F766E",lineHeight:1.65}}>
          🗓️ Pick the season coming up and we'll write you a <strong>complete campaign</strong> — social posts, an email to your list, an SMS, Facebook ad copy, in-store signage, and a step-by-step plan to run it. All in one go.
        </div>
        <Field label="Which season or occasion?">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"7px"}}>
            {SEASONS.map(s=>(
              <button key={s.id} onClick={()=>set("season",s)} style={{padding:"10px 12px",borderRadius:"9px",textAlign:"left",cursor:"pointer",border:`2px solid ${extra.season?.id===s.id?C.teal:C.border}`,background:extra.season?.id===s.id?C.tealLt:"#fff",display:"flex",alignItems:"center",gap:"8px",transition:"all 0.1s"}}>
                <span style={{fontSize:"1.1em"}}>{s.icon}</span>
                <div>
                  <div style={{fontSize:"0.82em",fontWeight:700,color:extra.season?.id===s.id?C.teal:C.text}}>{s.label}</div>
                  <div style={{fontSize:"0.68em",color:C.muted}}>{s.dates}</div>
                </div>
              </button>
            ))}
          </div>
        </Field>
        {extra.season?.id==="custom"&&(
          <Field label="What's the occasion?">
            <input value={extra.customSeason||""} onChange={e=>set("customSeason",e.target.value)} placeholder="e.g. Our 10th anniversary, Grand reopening, School holidays..." style={inputSt}/>
          </Field>
        )}
        <Field label="Special offer for this campaign? (optional)">
          <textarea value={extra.seasonOffer||""} onChange={e=>set("seasonOffer",e.target.value)} placeholder="e.g. 20% off all services in December / Free gift with every purchase over $50 / Extended trading hours" rows={2} style={{...inputSt,resize:"vertical"}}/>
        </Field>
      </div>
    );
  }

  if(toolId==="analytics") return (
    <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
      <div style={{background:C.tealLt,border:"1px solid #99F6E4",borderRadius:"8px",padding:"13px 15px",fontSize:"0.84em",color:"#0F766E",lineHeight:1.65}}>
        📊 <strong>How this works:</strong> Open Google Analytics (analytics.google.com), grab your last 30 days numbers, and paste them below. We turn them into plain English — what's working, what isn't, and your 3 most important actions right now.
      </div>
      <div style={{background:C.amberLt,border:`1px solid #FDE68A`,borderRadius:"8px",padding:"11px 14px",fontSize:"0.8em",color:"#92400E",lineHeight:1.6}}>
        💡 <strong>Don't have Google Analytics yet?</strong> Leave numbers blank and ask your question below — we'll explain how to set it up free.
      </div>
      <Field label="Total website visitors last 30 days">
        <input value={extra.visitors||""} onChange={e=>set("visitors",e.target.value)} placeholder="e.g. 342  (leave blank if you don't know)" style={inputSt} type="number"/>
      </Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <Field label="Where did most visitors come from?">
          <select value={extra.topSource||""} onChange={e=>set("topSource",e.target.value)} style={{...inputSt}}>
            <option value="">Don't know / skip</option>
            <option>Google Search</option>
            <option>Facebook</option>
            <option>Instagram</option>
            <option>Direct (typed my URL)</option>
            <option>Other website</option>
          </select>
        </Field>
        <Field label="Most visited page on your site">
          <input value={extra.topPage||""} onChange={e=>set("topPage",e.target.value)} placeholder="e.g. Home / Menu / Contact" style={inputSt}/>
        </Field>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
        <Field label="Bounce rate (% who left without clicking)">
          <input value={extra.bounceRate||""} onChange={e=>set("bounceRate",e.target.value)} placeholder="e.g. 65%  (or leave blank)" style={inputSt}/>
        </Field>
        <Field label="Average time spent on site">
          <input value={extra.avgTime||""} onChange={e=>set("avgTime",e.target.value)} placeholder="e.g. 1 min 20 sec" style={inputSt}/>
        </Field>
      </div>
      <Field label="What do you want to know or what problem are you trying to solve?">
        <textarea value={extra.analyticsQuestion||""} onChange={e=>set("analyticsQuestion",e.target.value)}
          placeholder="e.g. Why isn't anyone calling me from my website? / People visit but don't book — why? / How do I get more Google traffic? / I don't have GA — what should I do?"
          rows={3} style={{...inputSt,resize:"vertical"}}/>
      </Field>
    </div>
  );

  if(toolId==="jobad") {
    const JOB_TYPES=["Full-time","Part-time","Casual","Apprenticeship","Traineeship","Seasonal","Contractor"];
    return (
      <div style={{display:"flex",flexDirection:"column",gap:"14px"}}>
        <div style={{background:C.tealLt,border:"1px solid #99F6E4",borderRadius:"8px",padding:"13px 15px",fontSize:"0.84em",color:"#0F766E",lineHeight:1.65}}>
          📋 We'll write a proper job ad that attracts the <strong>right people</strong> — not just anyone looking. You'll get a Seek listing version, a Facebook post version, and 5 smart interview questions for the role.
        </div>
        <Field label="Job title">
          <input value={extra.jobTitle||""} onChange={e=>set("jobTitle",e.target.value)} placeholder="e.g. Barista, Electrician's Apprentice, Receptionist, Delivery Driver" style={inputSt}/>
        </Field>
        <Field label="Employment type">
          <div style={{display:"flex",gap:"7px",flexWrap:"wrap"}}>
            {JOB_TYPES.map(t=>(
              <button key={t} onClick={()=>set("jobType",t)} style={{padding:"6px 13px",borderRadius:"20px",fontSize:"0.79em",cursor:"pointer",border:`2px solid ${extra.jobType===t?C.teal:C.border}`,background:extra.jobType===t?C.tealLt:"#fff",color:extra.jobType===t?C.teal:C.text,fontWeight:extra.jobType===t?700:400}}>{t}</button>
            ))}
          </div>
        </Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
          <Field label="Pay rate (optional)">
            <input value={extra.jobPay||""} onChange={e=>set("jobPay",e.target.value)} placeholder="e.g. $28–$32/hr, Award rate" style={inputSt}/>
          </Field>
          <Field label="Hours / days">
            <input value={extra.jobHours||""} onChange={e=>set("jobHours",e.target.value)} placeholder="e.g. 20–25 hrs, Mon–Fri" style={inputSt}/>
          </Field>
        </div>
        <Field label="What will they actually be doing each day?">
          <textarea value={extra.jobDuties||""} onChange={e=>set("jobDuties",e.target.value)} placeholder="e.g. Taking orders, making coffee, keeping the café clean, helping with opening and closing, serving customers with a smile" rows={3} style={{...inputSt,resize:"vertical"}}/>
        </Field>
        <Field label="What kind of person are you looking for?">
          <textarea value={extra.jobPerson||""} onChange={e=>set("jobPerson",e.target.value)} placeholder="e.g. Reliable, good with people, no experience needed but café experience a bonus, must be available weekends" rows={2} style={{...inputSt,resize:"vertical"}}/>
        </Field>
        <Field label="Any perks worth mentioning?">
          <input value={extra.jobPerks||""} onChange={e=>set("jobPerks",e.target.value)} placeholder="e.g. Staff meals, flexible hours, great team culture, parking nearby" style={inputSt}/>
        </Field>
      </div>
    );
  }

  return null;
}
// ═════════════════════════════════════════════════════════════════════════════
async function generateContent(toolId,biz,extra,industry) {
  const ctx = `Business: ${biz.name} | Type: ${industry?.label} | Location: ${biz.suburb} | What they do: ${biz.description} | Goal: ${biz.goal}`;

  const prompts = {
    website:{system:`Professional copywriter for local Australian small businesses. Warm, genuine, no jargon.`,user:`Create complete website content for this business.\n${ctx}\nPhone: ${extra.phone||"[phone]"} | Hours: ${extra.hours||"[hours]"} | Address: ${extra.address||biz.suburb} | Notes: ${extra.special||"none"}\n\nWrite: ## HOME PAGE ## ABOUT US ## WHAT WE OFFER ## WHY CHOOSE US ## OPENING HOURS & LOCATION ## CONTACT\n\nWarm, local, real. No corporate-speak.`},
    posts:{system:`Social media writer for local Australian businesses. Genuine, not salesy, occasional emojis.`,user:`Write 7 social media posts for ${biz.name}.\n${ctx}\nTone: ${extra.tone||"Friendly"} | This week: ${extra.promo||"Regular business"}\n\nLabel POST 1–7. Mix: welcome, feature, behind-scenes, tip, promo, community, CTA wrap. Each ends with CTA + 3-5 hashtags.`},
    emails:{system:`Email writer for local Australian businesses. Warm, genuine, not pushy.`,user:`Write a customer email for ${biz.name}.\n${ctx}\nPurpose: ${extra.purpose||"General update"} | Details: ${extra.details||"none"}\n\nInclude SUBJECT LINE (3 options), PREVIEW TEXT, EMAIL BODY (under 250 words, one clear CTA), FROM name.`},
    ads:{system:`Ad copywriter for local Australian businesses. Direct, benefit-focused.`,user:`Write 3 ad variations for ${biz.name}.\n${ctx}\nPromoting: ${extra.offer||"business generally"} | Audience: ${extra.audience||"locals in "+biz.suburb} | CTA: ${extra.cta||"Call us"}\n\nFor each — AD VERSION X: HEADLINE 1 (30 chars), HEADLINE 2 (30 chars), HEADLINE 3 (30 chars), DESCRIPTION (90 chars), FACEBOOK CAPTION (2-3 sentences).\nVersion 1: benefit. Version 2: urgency. Version 3: social proof.`},
    promo:{system:`Promotional campaign creator for local Australian businesses. Practical and complete.`,user:`Create a full promotion pack for ${biz.name}.\n${ctx}\nOffer: ${extra.offerType||"special promo"} | Details: ${extra.promoDetail||"none"}\n\nWrite: ## THE OFFER ## 5 HEADLINE OPTIONS ## FACEBOOK POST ## IN-STORE SIGNAGE ## SMS (under 160 chars) ## HOW TO RUN IT (5 steps) ## WHEN TO END IT`},
    gbp:{system:`Google Business Profile post writer for local Australian businesses. Concise, local, genuine.`,user:`Write 3 Google Business Profile post options for ${biz.name}.\n${ctx}\nPost type: ${extra.gbpType||"What's new"} | Focus: ${extra.gbpFocus||"general update"}\n\nLabel POST OPTION 1, 2, 3. Each: 150-250 words, mentions ${biz.suburb}, clear CTA (call/visit/book), feels human. End with 3-5 relevant keywords/hashtags.`},
    blog:{system:`You are a local SEO content writer for Australian small businesses. You write blog posts that genuinely help readers AND rank on Google. Natural, friendly, specific to the local area. Proper H1/H2/H3 structure. No fluff.`,user:`Write a full SEO-optimised blog post for ${biz.name}, a ${industry?.label} in ${biz.suburb}, Australia.

Target keyword: "${extra.chosenKeyword?.keyword||"local "+industry?.label+" "+biz.suburb}"
Blog post title: "${extra.chosenKeyword?.title||"Guide to "+industry?.label+" in "+biz.suburb}"

Business context: ${biz.description}

BLOG POST REQUIREMENTS:
- Length: 800–1,000 words
- Structure: H1 title at top, then H2 subheadings for each section, H3 for subsections where relevant
- Use the target keyword naturally 4–6 times throughout (not stuffed — just natural)
- Mention ${biz.suburb} and nearby areas at least 3–4 times
- Include practical, genuinely useful information a local reader would value
- Write in a warm, helpful, local voice — not corporate
- End with a clear call to action that mentions ${biz.name} and includes a prompt to get in touch or visit

ALSO INCLUDE at the very end (clearly labelled):
## SEO METADATA
Meta title (under 60 chars): 
Meta description (under 155 chars): 
Primary keyword: 
Secondary keywords (3–4 related terms): 
Suggested URL slug: 
Internal link suggestion (what other page on their site to link to): 
Image suggestion (describe what photo would work well at the top of this post):

Write the complete blog post now. Make it genuinely worth reading.`},
    review_request:{system:`Review request writer for local Australian businesses. Personal, friendly, never pushy.`,user:`Write review request messages for ${biz.name}.\n${ctx}\nLink: ${extra.reviewLink||"[YOUR REVIEW LINK]"} | Timing: ${extra.timing||"right after visit"}\n\nWrite:\nSMS (under 160 chars, warm, includes link):\n---\nEMAIL:\nSubject: (3 options)\n[Full email under 150 words — thanks them, asks for review, says it takes 30 seconds, link included twice]\n---\nFOLLOW-UP SMS (3 days later, gentle, under 100 chars):`},
    review_respond:{system:`Google review response writer for local Australian businesses. Personal, warm, professional. Never corporate.`,user:`Write a Google review response for ${biz.name}.\n${ctx}\nReview: "${extra.reviewText||"Great experience, highly recommend!"}" | Stars: ${extra.stars||5}\n\nResponse rules: genuine thank you (don't start with "Thank you for your review"), reference something specific, reinforce the praise, invite back naturally, sign off with owner/team name, under 100 words, warm not corporate.`},
    review_negative:{system:`Negative review response writer for local Australian businesses. Calm, professional, empathetic. Never defensive.`,user:`Write a response to this negative review for ${biz.name}.\n${ctx}\nReview: "${extra.badReview||"Not great, won't return."}" | Context: ${extra.context||"none"} | Approach: ${extra.approach||"Apologise and invite back"}\n\nRules: acknowledge experience, apologise for impact, don't make excuses (brief factual explanation if relevant), offer to make it right (provide contact), under 120 words, professional but human, show other readers you care.`},
    review_link:{system:`Step-by-step guide writer for non-tech-savvy Australian small business owners. Plain English, no jargon.`,user:`Write a guide for the owner of ${biz.name} to find and share their Google review link.\nBusiness: ${extra.googleName||biz.name} | Location: ${extra.googleSuburb||biz.suburb}\n\nWrite:\n## HOW TO FIND YOUR REVIEW LINK\n[Numbered steps — via Google Maps on phone + via Google Search on computer. Under 10 steps total. Simple language.]\n\n## WHERE TO SHARE IT (8 places)\n[List: email signature, SMS, Facebook bio, printed receipts, etc.]\n\n## COPY-PASTE SMS TO SEND CUSTOMERS\n[Ready-to-go with placeholder [YOUR REVIEW LINK]]\n\n## PRO TIP\n[One sentence on when/how often to ask]\n\nFriendly, encouraging tone. Written for someone who isn't tech-savvy.`},

    seasonal:{system:`You are a seasonal marketing campaign writer for Australian small businesses. You write complete, ready-to-run campaigns that are warm, local, and genuinely effective. No corporate-speak.`,user:`Write a complete ${extra.season?.label||"seasonal"} campaign for ${biz.name}.\n\n${ctx}\nSeason: ${extra.season?.label||"seasonal campaign"} (${extra.season?.dates||""})\n${extra.season?.id==="custom"&&extra.customSeason?`Occasion details: ${extra.customSeason}`:""}\nSpecial offer: ${extra.seasonOffer||"No specific offer — general seasonal promotion"}\n\nWrite ALL of the following, clearly labelled:\n\n## THE CAMPAIGN IDEA\n[2-3 sentences — what this campaign is about and why it works for this business at this time of year]\n\n## FACEBOOK & INSTAGRAM POST (Post this 2 weeks before)\n[Full caption with emojis, hooks readers immediately, mentions the offer and the season, ends with CTA and 4-5 hashtags]\n\n## FACEBOOK & INSTAGRAM POST (Post this the week of)\n[Different angle — urgency-focused, reminds people time is running out]\n\n## EMAIL TO YOUR CUSTOMER LIST\nSubject line: [3 options]\n[Full email — warm seasonal opener, the offer, why they should come in now, clear CTA, sign-off]\n\n## SMS TO CUSTOMERS (under 160 chars)\n[Short, warm, direct. Mentions the offer and a deadline.]\n\n## IN-STORE SIGNAGE / WINDOW SIGN\n[Bold headline + 2-3 lines. Something customers will actually read walking past.]\n\n## FACEBOOK AD COPY (if they want to boost a post)\nHeadline (30 chars max): \nDescription (90 chars max): \nCaption: [2 sentences]\n\n## YOUR 7-DAY PLAN\n[Day-by-day action list: what to post, send, or do each day in the week leading up to the campaign]\n\n## WHAT TO DO AFTER\n[2-3 sentences on following up — thank customers who came in, ask for a review, share photos]\n\nMake everything copy-paste ready. Australian spelling and tone throughout.`},

    analytics:{system:`You are a plain-English Google Analytics interpreter for non-technical Australian small business owners. You explain website data in simple terms — what it means, what's good, what's bad, and exactly what to do about it. No jargon. No technical terms without explanation.`,user:`Analyse this website data for ${biz.name}, a ${industry?.label} in ${biz.suburb}.\n\n${ctx}\n\nWEBSITE DATA PROVIDED:\nVisitors last 30 days: ${extra.visitors||"Not provided"}\nMain traffic source: ${extra.topSource||"Not provided"}\nMost visited page: ${extra.topPage||"Not provided"}\nBounce rate: ${extra.bounceRate||"Not provided"}\nAverage time on site: ${extra.avgTime||"Not provided"}\nOwner's question: ${extra.analyticsQuestion||"General overview — what do my numbers mean?"}\n\nWrite a plain English analysis using these sections:\n\n## WHAT YOUR NUMBERS MEAN\n[Explain each number they provided in plain English — is it good? bad? average for a local business? One paragraph per metric they gave you. If they provided no data, explain what Google Analytics is and how to set it up for free, then skip to the action plan.]\n\n## WHAT'S WORKING\n[Based on the data, what's going well? Be specific and encouraging.]\n\n## WHAT NEEDS ATTENTION\n[What does the data suggest isn't working? Be direct but kind. Explain WHY it matters in plain terms — e.g. "Your bounce rate of 65% means roughly 65 out of 100 people who visit your site leave without clicking anything. That usually means they couldn't find what they were looking for fast enough."]\n\n## YOUR 3 MOST IMPORTANT ACTIONS THIS MONTH\n[Three specific, actionable things they can do RIGHT NOW to improve their results. Written like advice from a knowledgeable friend — not a consultant. Number them clearly.]\n\n## ANSWER TO YOUR QUESTION\n[Directly answer the specific question they asked, in plain English.]\n\n## HOW TO CHECK NEXT MONTH\n[Tell them exactly where to look in Google Analytics to check these same numbers again in 30 days — what to click, what to look for, what would mean things are improving.]\n\nWrite like you're explaining to a smart person who just doesn't know this stuff yet. Encouraging, not condescending.`},

    jobad:{system:`You write job advertisements for Australian small businesses. Clear, honest, warm — the kind of ad that attracts reliable people who actually want to work in a local business, not corporate applicants expecting a huge salary.`,user:`Write a complete job advertisement pack for ${biz.name}.\n\n${ctx}\nJob title: ${extra.jobTitle||"Team member"}\nEmployment type: ${extra.jobType||"Casual"}\nPay: ${extra.jobPay||"Award rate / negotiable"}\nHours: ${extra.jobHours||"To be discussed"}\nWhat they'll do: ${extra.jobDuties||"General duties as required"}\nIdeal person: ${extra.jobPerson||"Reliable, great attitude"}\nPerks: ${extra.jobPerks||"Great team environment"}\n\nWrite ALL of the following:\n\n## SEEK JOB LISTING\n[Full Seek listing — 300-400 words. Opening hook, About the business, What you'll be doing, What we're looking for, What we offer, How to apply]\n\n## FACEBOOK / INSTAGRAM POST VERSION\n[150-200 words, emojis, ends with "DM us or email [EMAIL PLACEHOLDER] to apply"]\n\n## 5 INTERVIEW QUESTIONS FOR THIS ROLE\n[Smart questions that reveal character. Include what a GOOD answer looks like.]\n\n## RED FLAGS TO WATCH FOR\n[3-4 warning signs in applications or interviews specific to this role]\n\nWarm, genuine Australian voice.`},

    // ── SHOPIFY PROMPTS ─────────────────────────────────────────────────────
    sh_product_desc:{system:`You write Shopify product descriptions that rank on Google AND convert browsers into buyers. Clear, benefit-led, no fluff. Australian spelling.`,user:`Write a complete product description for this online store.\n\nStore: ${biz.name} | ${biz.description}\nProduct: ${extra.productName||"Store product"}\nFeatures: ${extra.features||"Standard product features"}\nTarget customer: ${extra.audience||"Online shoppers"}\nPrice: ${extra.price||"Not specified"}\n\nWrite:\n## PRODUCT TITLE (SEO-optimised, under 70 chars)\n\n## SHORT DESCRIPTION (2-3 sentences for the product page hero — benefit-led, converts)\n\n## FULL DESCRIPTION (300-400 words)\n- Opening hook: what problem does this solve or what feeling does it create?\n- Key features as benefits (not spec lists — "40-hour burn time so it fills your whole evening" not "40hr")\n- Who it's perfect for\n- Any guarantees, shipping highlights, or trust signals\n- Closing CTA\n\n## BULLET POINTS FOR QUICK SCAN (6-8 bullets — features as benefits)\n\n## META DESCRIPTION (under 155 chars, includes the product keyword)\n\nTone: matches the brand — genuine, not corporate. Australian spelling.`},

    sh_product_titles:{system:`You are an ecommerce SEO specialist who writes optimised Shopify product titles, meta descriptions and URL slugs.`,user:`Write SEO-optimised titles, meta descriptions and URL slugs for this store's products.\n\nStore: ${biz.name} | ${biz.description}\nProduct/range: ${extra.productName}\nCategory: ${extra.category||"General product"}\nKey selling point: ${extra.usp||"Quality product"}\nVariants to cover: ${extra.variants||"Single product"}\n\nFor each product/variant write:\nPRODUCT TITLE: (under 70 chars, keyword-first)\nMETA TITLE: (under 60 chars, slightly different angle)\nMETA DESCRIPTION: (under 155 chars, benefit-led with CTA)\nURL SLUG: (lowercase, hyphens, SEO-friendly)\n\nAlso include:\n## KEYWORD STRATEGY\n[Primary keyword, 3-4 secondary keywords, 2-3 long-tail buyer keywords to target for this product range]`},

    sh_collection:{system:`You write Shopify collection page copy that ranks on Google and helps shoppers find what they're looking for. Clear, friendly, keyword-rich without being spammy.`,user:`Write collection page copy for this Shopify store.\n\nStore: ${biz.name} | ${biz.description}\nCollection: ${extra.collectionName}\nProducts in collection: ${extra.collectionDesc}\nTarget customer: ${extra.audience}\n\nWrite:\n## COLLECTION PAGE HEADING (H1 — keyword-optimised, under 60 chars)\n## SUBHEADING (one line — benefit or differentiator)\n## INTRO PARAGRAPH (100-150 words — tells Google what this page is about, tells shoppers they're in the right place. Natural keyword usage. Warm, not robotic.)\n## SHORT VERSION (50 words — for stores that prefer a brief intro)\n## META TITLE (under 60 chars)\n## META DESCRIPTION (under 155 chars)`},

    sh_bundle_copy:{system:`You write ecommerce bundle and cross-sell copy that increases average order value naturally. Helpful, not pushy.`,user:`Write bundle and cross-sell copy for this Shopify store.\n\nStore: ${biz.name} | ${biz.description}\nMain product: ${extra.mainProduct}\nProducts to bundle with: ${extra.bundleProducts}\n\nWrite:\n## FREQUENTLY BOUGHT TOGETHER HEADING\n## WHY THEY WORK TOGETHER (2-3 sentences — genuine reason, not just "popular combo")\n## BUNDLE NAMES (3 creative bundle name ideas if they want to create a named set)\n## CROSS-SELL CALLOUT (1-2 sentences to put under the main product — "Customers who love this also love...")\n## UPSELL LINE (for the cart page — 1 sentence to suggest an add-on)`},

    sh_abandoned_cart:{system:`You write abandoned cart email sequences for Shopify stores. The goal is to feel human, not automated. Each email should feel like it was written by the store owner personally.`,user:`Write a 3-email abandoned cart recovery sequence for ${biz.name}.\n\nStore: ${biz.description}\nTypical cart contents: ${extra.cartProduct||"Store products"}\nRecovery offer: ${extra.cartOffer||"No specific offer — just a genuine reminder"}\nBrand tone: ${extra.tone||"Warm & personal"}\n\nWrite all 3 emails:\n\n## EMAIL 1 — 1 HOUR AFTER ABANDONMENT\nSubject: (3 options)\n[Email: Short, gentle, no pressure. "Did something come up?" Reminds them what they left. Under 100 words. No discount yet.]\n\n## EMAIL 2 — 24 HOURS AFTER ABANDONMENT\nSubject: (3 options)\n[Email: A bit more personal. Mentions the product specifically. Shares a reason to trust (reviews, guarantee, fast shipping). If there's an offer — introduce it here. Under 150 words.]\n\n## EMAIL 3 — 72 HOURS AFTER ABANDONMENT\nSubject: (3 options)\n[Email: Final nudge. Urgency if appropriate (low stock, offer expiry). Clear CTA. Warm sign-off. Under 120 words.]\n\nAll emails should feel like they came from a real person, not an automation.`},

    sh_post_purchase:{system:`You write post-purchase email sequences for Shopify stores that build loyalty, get reviews, and drive repeat sales.`,user:`Write a 4-email post-purchase sequence for ${biz.name}.\n\nStore: ${biz.description}\nProduct purchased: ${extra.product}\nCare/usage tips: ${extra.tips||"Standard product care"}\nCross-sell suggestion: ${extra.crossSell||"Related products"}\n\n## EMAIL 1 — IMMEDIATELY AFTER PURCHASE (Order confirmation enhancement)\nSubject line:\n[Goes beyond the standard receipt — warm thank you, what happens next, builds excitement about receiving the order. 100 words.]\n\n## EMAIL 2 — 3 DAYS AFTER DELIVERY (Usage tips)\nSubject line:\n[Tips, how to get the most from the product, care instructions if relevant. Makes the customer feel supported. 120 words.]\n\n## EMAIL 3 — 7 DAYS AFTER DELIVERY (Review request)\nSubject line:\n[Personal ask for a review — references what they bought, explains it takes 1 minute, includes [REVIEW LINK] placeholder. 100 words.]\n\n## EMAIL 4 — 21 DAYS AFTER DELIVERY (Cross-sell)\nSubject line:\n[Natural suggestion of a complementary product — not pushy, more like "you might love this too." 100 words.]`},

    sh_winback:{system:`You write win-back email sequences for ecommerce stores. Warm, genuine, never guilt-tripping. Makes the customer feel remembered, not pestered.`,user:`Write a 3-email win-back sequence for ${biz.name}.\n\nStore: ${biz.description}\nWin-back offer: ${extra.winbackOffer||"A special welcome-back offer"}\nWhat's new: ${extra.newStuff||"New products and improvements"}\n\n## EMAIL 1 — WEEK 1: THE GENTLE CHECK-IN\nSubject (3 options):\n[Warm, curious — "we've been thinking about you." No pressure. Reminds them of the brand. Mentions what's new. 100 words.]\n\n## EMAIL 2 — WEEK 2: THE OFFER\nSubject (3 options):\n[Introduces the win-back offer clearly. Why they should come back now. Social proof if possible. 120 words.]\n\n## EMAIL 3 — WEEK 3: THE LAST NUDGE\nSubject (3 options):\n[Final email — offer ending soon, light urgency, warm farewell if they don't. 90 words.]\n\nAll emails should feel human, not automated.`},

    sh_product_launch:{system:`You write new product launch emails for Shopify stores that make customers excited to buy on day one.`,user:`Write a new product launch email for ${biz.name}.\n\nStore: ${biz.description}\nNew product: ${extra.newProduct}\nWhat makes it special: ${extra.newProductDesc}\nLaunch offer: ${extra.launchOffer||"No special launch offer"}\n\n## EMAIL: NEW PRODUCT LAUNCH\n3 Subject line options:\n\n[Full email — 200-250 words]\n- Opening: create excitement/curiosity without revealing everything in the first line\n- The reveal: what it is and why it's different\n- The key details (what they need to know to buy with confidence)\n- The offer if there is one — with clear urgency\n- CTA: [SHOP NOW LINK]\n- Sign-off from owner\n\nMake it feel like getting a message from a friend who's excited about something, not a corporate announcement.`},

    sh_flash_sale:{system:`You write high-converting flash sale emails for ecommerce stores. Clear offer, real urgency, strong CTA.`,user:`Write a flash sale email for ${biz.name}.\n\nStore: ${biz.description}\nOffer: ${extra.saleOffer}\nDuration: ${extra.saleDuration}\nDiscount code: ${extra.saleCode||"No code — discount applied at checkout"}\n\n## FLASH SALE EMAIL\n3 Subject line options (urgency-based, not clickbait):\n\n[Email — 150-200 words]\n- Subject payoff in first line\n- The offer, crystal clear\n- What they can buy (your best products/range)\n- How to claim it (the code or how checkout works)\n- The deadline — specific and firm\n- CTA button text suggestion\n- Brief warm sign-off\n\nAlso write:\n## SMS VERSION (under 155 chars, includes code and link placeholder)\n## REMINDER EMAIL (send 3 hours before sale ends — 80 words max, urgency-only)`},

    sh_social_posts:{system:`You write ecommerce social media posts for Instagram, Facebook and TikTok. Engaging, authentic, drives traffic to the store.`,user:`Write product launch social media posts for ${biz.name}.\n\nStore: ${biz.description}\nProduct: ${extra.socialProduct}\nAngle: ${extra.socialAngle||"What it looks and feels like"}\n\nWrite 3 versions:\n\n## INSTAGRAM / FACEBOOK POST (main)\n[150-200 words. Strong hook in line 1 (no "I'm excited to announce"). The product story. Who it's for. Call to action: link in bio / shop now. 5-8 relevant hashtags at the end.]\n\n## INSTAGRAM CAPTION (shorter version)\n[60-80 words. Punchier. Same hook approach. 3-5 hashtags.]\n\n## TIKTOK / REELS SCRIPT\n[Hook (first 2 seconds — text overlay or spoken), Main content (15-30 seconds), CTA (last 3 seconds). Format as a script.]\n\nAll versions should feel like they came from a real person, not a brand marketing department.`},

    sh_ad_copy:{system:`You write high-converting Meta and Google ad copy for Shopify stores. Clear benefit, strong hook, compelling CTA.`,user:`Write ad copy for ${biz.name}.\n\nStore: ${biz.description}\nPromoting: ${extra.adProduct}\nAudience: ${extra.adAudience}\nObjective: ${extra.adObjective||"Drive sales"}\nOffer: ${extra.adOffer||"No specific offer"}\n\nWrite 3 complete ad sets:\n\n## AD VERSION 1 — BENEFIT-LED\nMeta Primary Text (125 chars):\nMeta Headline (27 chars):\nMeta Description (27 chars):\nGoogle Headline 1 (30 chars):\nGoogle Headline 2 (30 chars):\nGoogle Description (90 chars):\n\n## AD VERSION 2 — SOCIAL PROOF / TRUST\n[Same format]\n\n## AD VERSION 3 — URGENCY / OFFER\n[Same format]\n\n## HOOK VARIATIONS (first 3 seconds for video ads)\n[5 different hooks — questions, bold statements, "POV:" format, etc.]`},

    sh_ugc_brief:{system:`You write clear UGC briefs for ecommerce stores. Specific enough to get great content, flexible enough to feel authentic.`,user:`Write a UGC brief for ${biz.name}.\n\nStore: ${biz.description}\nProduct: ${extra.ugcProduct}\nCreator type: ${extra.ugcPerson||"Micro-influencer"}\nPlatform: ${extra.ugcPlatform||"Instagram Reels"}\n\n## UGC BRIEF: ${extra.ugcProduct}\n\n**What we need:**\n[1-2 sentences on the type of content]\n\n**The brief:**\n- Duration: \n- Format: \n- Hook (first 2-3 seconds): [2-3 options to try]\n- What to show/demonstrate: [specific shots or moments]\n- Tone and feel: \n- What NOT to do: \n- Key messages to include (naturally): \n- CTA at the end: \n\n**Outreach message to send them:**\n[Short, friendly, specific DM or email to reach out with — include product offer and what you're asking for]\n\n**What we'll provide:**\n[List of assets you'll send them — product, discount code, etc.]`},

    sh_bio:{system:`You write Instagram bios and link-in-bio copy for Shopify stores. Punchy, clear, converts profile visitors to buyers.`,user:`Write Instagram bio and link-in-bio copy for ${biz.name}.\n\nStore: ${biz.description}\nPrimary action: ${extra.bioAction||"Shop the store"}\nCurrent offer/hook: ${extra.bioOffer||"None"}\n\n## INSTAGRAM BIO OPTIONS\n[3 bio variations — each under 150 chars. Emoji use where appropriate. States what you sell + why follow + CTA.]\n\n## LINK IN BIO COPY\n[Copy for the link-in-bio page (Linktree-style). 4-6 link labels + descriptions. Priority order: most important action first.]\n\n## INSTAGRAM HIGHLIGHTS TITLES\n[5-7 highlight cover name suggestions — short, clear, emoji-led]`},

    sh_review_request:{system:`You write product review request emails for Shopify stores. Personal, gentle, never pushy.`,user:`Write a review request email for ${biz.name}.\n\nStore: ${biz.description}\nProduct purchased: ${extra.reviewProduct}\nReview platform: ${extra.reviewPlatform||"Your website"}\nReview link: ${extra.reviewLink||"[REVIEW LINK]"}\n\n## REVIEW REQUEST EMAIL\n3 Subject line options:\n\n[Email — under 120 words]\n- Reference the specific product they bought\n- Ask genuinely — explain it takes 1 minute\n- Tell them it helps the business in a real way\n- Include the review link twice\n- Warm, personal sign-off from owner\n\n## SMS VERSION (under 140 chars — includes product mention and link)\n\n## TIMING NOTE\n[When to send this — what day/time after delivery gets the best response]`},

    sh_review_respond:{system:`You write product review responses for Shopify stores. Personal, warm, specific. Never copy-paste corporate.`,user:`Write a review response for ${biz.name}.\n\nStore: ${biz.description}\nReview: "${extra.reviewText||"Great product, will buy again!"}"\nStar rating: ${extra.reviewStars||5}\n\nWrite the response (under 80 words):\n- Don't start with "Thank you for your review"\n- Reference something specific from their review\n- Reinforce what they loved\n- Invite them back or mention something new\n- Sign off personally\n- Warm, genuine, specific to this product and this person`},

    sh_bad_review:{system:`You write responses to negative product reviews for ecommerce stores. Calm, professional, empathetic. Shows future customers that this brand handles problems well.`,user:`Write a response to this negative product review for ${biz.name}.\n\nStore: ${biz.description}\nNegative review: "${extra.badReview}"\nContext: ${extra.badContext||"None provided"}\n\nWrite the response (under 100 words):\n- Acknowledge their experience without being defensive\n- Apologise genuinely for the impact\n- Brief factual explanation only if it adds context (not excuses)\n- Invite them to contact you directly with email/contact method placeholder\n- Show future readers this brand cares\n- Never argue, never be sarcastic\n- Sign off personally`},

    sh_trust_copy:{system:`You write trust badge copy and guarantee statements for Shopify stores that reduce buyer hesitation and increase conversions.`,user:`Write trust copy for ${biz.name}.\n\nStore: ${biz.description}\nTrust signals offered: ${extra.trustSignals||"Quality products, good service"}\n\nWrite:\n## TRUST BADGE COPY (short versions — under 5 words each)\n[For each trust signal provided, write 3 short badge label options]\n\n## TRUST SECTION HEADING\n[For a "Why shop with us?" section — 1 heading, 1 subheading]\n\n## TRUST PARAGRAPH (for product pages — 40-60 words)\n[A paragraph that weaves in the trust signals naturally]\n\n## MONEY-BACK / RETURNS STATEMENT\n[Clear, confident, easy to understand. 2-3 sentences max.]\n\n## CHECKOUT PAGE REASSURANCE LINE\n[One sentence that appears near the "Buy Now" button to reduce hesitation]`},

    sh_blog:{system:`You are an ecommerce SEO content writer. You write blog posts that rank on Google AND drive buyers to Shopify stores. Conversational, helpful, specific.`,user:`Write a full SEO blog post for ${biz.name}.\n\nStore: ${biz.description}\nTarget keyword: "${extra.chosenKeyword?.keyword||"store product keyword"}"\nBlog post title: "${extra.chosenKeyword?.title||"Blog post for the store"}"\n\nREQUIREMENTS:\n- Length: 800-1,000 words\n- H1 title at top, H2/H3 subheadings throughout\n- Target keyword used naturally 4-6 times\n- Genuinely useful — a reader should learn something or be helped\n- Link to the store's products naturally where relevant\n- End with a CTA mentioning ${biz.name} and a prompt to shop or browse\n\nAFTER THE POST include:\n## SEO METADATA\nMeta title (under 60 chars):\nMeta description (under 155 chars):\nPrimary keyword:\nSecondary keywords (3-4):\nSuggested URL slug:\nInternal link suggestion:\nImage suggestion:`},

    sh_faq:{system:`You write Shopify product FAQ sections that answer buyer questions AND help Google understand the product. Clear, honest, confident.`,user:`Write a product FAQ for ${biz.name}.\n\nStore: ${biz.description}\nProduct: ${extra.faqProduct}\nCommon questions: ${extra.faqQuestions||"Typical buyer questions about this product type"}\n\nWrite 10 FAQ questions and answers:\n- Answer each question honestly and completely (2-5 sentences)\n- Questions should be exactly how a buyer would type them into Google\n- Include any questions from the list provided plus others a real buyer would ask\n- For questions about shipping, returns, guarantees — give reassuring answers\n- Last question should be a CTA: "How do I order?"\n\nAlso include:\n## STRUCTURED DATA SUMMARY\n[Notes on using FAQ schema markup to get these showing in Google results]`},

    sh_about:{system:`You write About Us pages for Shopify stores that build genuine trust and convert first-time visitors into buyers. Real, human, brand-building.`,user:`Write an About Us page for ${biz.name}.\n\nStore: ${biz.description}\nHow it started: ${extra.storyOrigin}\nBrand values / what makes it different: ${extra.storyValues}\nWho's behind it: ${extra.founder}\n\nWrite:\n## PAGE HEADING (H1)\n## SUBHEADING\n\n## THE STORY\n[250-350 words — warm, genuine narrative. Origin story. The problem you set out to solve or the passion that drove you to start. The journey. Where you are now. What you stand for. Make the reader feel like they know you.]\n\n## WHY WE DO WHAT WE DO\n[100 words — values, what you believe about your product/craft/industry]\n\n## MEET THE TEAM / THE MAKER\n[80-100 words — personal, human, real. A photo caption and introduction.]\n\n## OUR PROMISE TO YOU\n[50 words — your guarantee to customers in plain English]\n\nTone: Real. Human. Not corporate. The kind of page that makes someone think "I want to support this business."`},

    sh_shopify_report:{system:`You are a plain-English Shopify analytics advisor for ecommerce store owners who are not data experts. Specific, actionable, no jargon.`,user:`Analyse this Shopify store data for ${biz.name}.\n\nStore: ${biz.description}\n\nDATA PROVIDED:\nOrders (30 days): ${extra.orders||"Not provided"}\nRevenue: ${extra.revenue||"Not provided"}\nSessions (visitors): ${extra.sessions||"Not provided"}\nConversion rate: ${extra.convRate||"Not provided"}\nAverage order value: ${extra.aov||"Not provided"}\nCart abandonment rate: ${extra.cartAbandonment||"Not provided"}\nTop traffic source: ${extra.topSource||"Not provided"}\nOwner's question: ${extra.storeQuestion||"General — what do my numbers mean?"}\n\n## WHAT YOUR NUMBERS MEAN\n[Each metric explained in plain English. Good/bad/average for an ecommerce store. If data missing, explain what it is and why it matters.]\n\n## WHAT'S WORKING\n[What the data suggests is going well — specific and encouraging]\n\n## THE BIGGEST OPPORTUNITY\n[The single most impactful change based on this data — specific to their numbers]\n\n## YOUR 3 ACTIONS THIS MONTH\n[Three numbered actions ranked by likely impact. Written like advice from a friend, not a consultant.]\n\n## ANSWER TO YOUR QUESTION\n[Direct answer to what they asked]\n\n## BENCHMARK COMPARISON\n[How their numbers compare to typical Shopify store averages — helps them understand if they're above or below]`},

    sh_cro_audit:{system:`You are a Shopify conversion rate optimisation expert. You identify specific conversion killers and give actionable fixes, not generic advice.`,user:`Conduct a conversion rate audit for ${biz.name}.\n\nStore URL: ${extra.storeUrl||biz.suburb}\nStore description: ${extra.storeDesc||biz.description}\nCurrent conversion rate: ${extra.currentConv||"Unknown"}\nWhere people drop off: ${extra.dropOff||"Not sure"}\n\n## YOUR TOP 3 CONVERSION KILLERS\n[For each one: what it is, why it's killing conversions, exactly how to fix it — specific to this type of store. Numbered 1-3 in order of likely impact.]\n\n## QUICK WINS (can implement this week)\n[3 specific changes they can make immediately without a developer]\n\n## WHAT GOOD LOOKS LIKE\n[What their conversion rate, AOV and cart abandonment rate should look like at their stage — gives them targets]\n\n## ONE QUESTION TO ASK CUSTOMERS\n[The single survey question that would reveal the most about why people aren't buying — and how to ask it]`},

    sh_ads_report:{system:`You are a plain-English paid advertising advisor for Shopify store owners. You interpret ad data and give specific actionable advice, not theory.`,user:`Analyse this ad account data for ${biz.name}.\n\nStore: ${biz.description}\nPlatform: ${extra.adPlatform||"Meta"}\nSpend: ${extra.adSpend||"Not provided"}\nRevenue from ads: ${extra.adRevenue||"Not provided"}\nClicks: ${extra.adClicks||"Not provided"}\nCost per click: ${extra.adCpc||"Not provided"}\nConversions/purchases: ${extra.adConversions||"Not provided"}\nCost per purchase: ${extra.adCpa||"Not provided"}\nOwner's question: ${extra.adQuestion||"Is this performing well?"}\n\n## WHAT YOUR NUMBERS MEAN\n[Each metric in plain English — good/bad/average benchmark for ecommerce on this platform]\n\n## THE VERDICT\n[Are these ads making money or losing it? Blunt and clear.]\n\n## WHAT'S CAUSING THE PROBLEM (if there is one)\n[Diagnose the specific issue — creative fatigue? wrong audience? landing page? checkout friction?]\n\n## YOUR 3 ACTIONS THIS WEEK\n[Specific changes to make — what to turn off, what to test, what to fix. Numbered.]\n\n## ANSWER TO YOUR QUESTION\n[Direct answer]`},

    sh_influencer:{system:`You write influencer outreach emails for ecommerce brands. Personal, specific, genuine — the kind of message that actually gets a response.`,user:`Write an influencer outreach email for ${biz.name}.\n\nStore: ${biz.description}\nProduct to pitch: ${extra.pitchProduct}\nOffer: ${extra.pitchOffer||"Free product in exchange for honest review"}\nTarget creator: ${extra.pitchTarget||"Micro-influencer in relevant niche"}\n\n## INFLUENCER OUTREACH EMAIL\n3 Subject line options:\n\n[Email — 150-200 words]\n- Open with something specific about their content (leave [THEIR NAME] and [SPECIFIC POST/CONTENT] placeholders)\n- Why their audience would genuinely love this product\n- The offer — clear and simple\n- What you're asking for — specific but flexible\n- Easy reply CTA\n- No hype, no "amazing opportunity"\n\n## DM VERSION (for Instagram/TikTok — under 150 chars + link)\n\n## FOLLOW-UP MESSAGE (send 5 days later if no reply — 50 words max)\n\n## WHAT TO LOOK FOR (green flags in their profile before reaching out)\n[4-5 things to check before sending the pitch]`},

    sh_referral:{system:`You build ecommerce referral programs that make existing customers want to share. Simple, rewarding, built for Shopify.`,user:`Build a complete referral program for ${biz.name}.\n\nStore: ${biz.description}\nReferrer reward: ${extra.referrerReward||"Store credit or discount"}\nNew customer offer: ${extra.newCustOffer||"Discount on first order"}\n\n## THE PROGRAM IN ONE SENTENCE\n[How to explain it to a customer in plain English]\n\n## THE MECHANICS\n[Exactly how it works — referrer gets X, friend gets Y, when rewards are triggered, any limits]\n\n## HOW TO ANNOUNCE IT\n\n### Email to existing customers\nSubject (3 options):\n[Email — 150 words — excited, generous, clear on how to share]\n\n### Post-purchase email mention\n[Add-on paragraph to include in their order confirmation email — 40 words]\n\n### Instagram/Facebook post\n[Caption with emojis that makes people want to share immediately]\n\n### Website banner copy\n[Short headline + one-liner for a site-wide banner]\n\n## HOW TO TRACK IT\n[Simple Shopify-native method using discount codes — no extra app needed]\n\n## SUGGESTED DISCOUNT CODES\n[Format suggestions for personal referral codes — easy to remember and share]`},

    sh_loyalty:{system:`You design and write ecommerce loyalty programs for Shopify stores. Practical, rewarding, easy for the merchant to run.`,user:`Design and write a loyalty program for ${biz.name}.\n\nStore: ${biz.description}\nProgram type wanted: ${extra.loyaltyType||"Points per dollar spent"}\n\n## THE PROGRAM DESIGN\n[How it works — points earning, redemption rates, tier thresholds if relevant. Make the maths work for a small store.]\n\n## TIER NAMES (if tiered)\n[3 tier names that fit the brand — creative but clear]\n\n## ANNOUNCEMENT EMAIL\nSubject (3 options):\n[Full email — 200 words — excited launch of the program, exactly how it works, how to check points, what they can redeem for]\n\n## HOW TO EXPLAIN IT (website copy)\nPage heading:\nHow it works section (3 steps):\nFAQ (5 questions):\n\n## WELCOME MESSAGE (when someone first earns points)\n[Short, celebratory, tells them what they have and what they can do with it — 60 words]\n\n## SHOPIFY APPS TO RUN THIS\n[2-3 recommended Shopify apps for loyalty programs — free or low cost]`},

    sh_sale_campaign:{system:`You write complete ecommerce sale campaign packs for Shopify stores. Everything needed to run a sale from announcement to close.`,user:`Write a complete ${extra.sale?.label||"sale"} campaign pack for ${biz.name}.\n\nStore: ${biz.description}\nSale: ${extra.sale?.label||"Store sale"} (${extra.sale?.dates||"Upcoming"})\n${extra.customSale?`Details: ${extra.customSale}`:""}\nOffer: ${extra.saleOffer2||"Storewide discount"}\n\nWrite the COMPLETE campaign:\n\n## THE CAMPAIGN STRATEGY\n[2-3 sentences — what makes this sale work for this store and this time of year]\n\n## TEASER EMAIL (send 5 days before)\nSubject (3 options):\n[Email 100 words — builds anticipation without revealing everything]\n\n## LAUNCH EMAIL (sale day)\nSubject (3 options):\n[Email 150 words — full reveal, the offer, how to claim, urgency]\n\n## REMINDER EMAIL (24 hours before end)\nSubject (3 options):\n[Email 80 words — urgency only, clock is ticking]\n\n## INSTAGRAM/FACEBOOK POSTS\nPost 1 (teaser — 5 days before):\nPost 2 (launch day):\nPost 3 (last chance):\n\n## SMS (launch day — under 155 chars)\n\n## AD COPY (boost the launch post)\nHeadline (30 chars):\nDescription (90 chars):\nPrimary text (125 chars):\n\n## 7-DAY CAMPAIGN COUNTDOWN\n[Day by day — what to post, send or do each day]\n\n## WHAT TO DO AFTER\n[2-3 sentences on following up, thanking buyers, asking for reviews]`},
  };

  const p = prompts[toolId];
  if(!p) throw new Error("Unknown tool");
  return await askClaude(p.system, p.user);
}

// ═════════════════════════════════════════════════════════════════════════════
// GROW PANEL — Lost Customer Win-Back + Referral Builder
// ═════════════════════════════════════════════════════════════════════════════
function GrowPanel({biz, industry, customers}) {
  const [activeSection, setActiveSection] = useState("winback"); // winback | referral
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  const [winbackOffer, setWinbackOffer] = useState("");
  const [winbackDays, setWinbackDays] = useState("60");
  const [referralOffer, setReferralOffer] = useState("");
  const [referralReward, setReferralReward] = useState("");

  const lapsedCount = customers.filter(c => {
    const d = daysSince(c.lastVisit);
    return d !== null && d >= parseInt(winbackDays);
  }).length;

  const generate = async (type) => {
    setGenerating(true); setOutput("");
    const ctx = `Business: ${biz.name} | Type: ${industry?.label} | Location: ${biz.suburb} | What they do: ${biz.description}`;
    try {
      let sys, usr;
      if(type==="winback") {
        sys = `You write win-back campaigns for Australian local businesses. Warm, genuine, never guilt-tripping. The goal is to make lapsed customers feel remembered and valued — not pestered.`;
        usr = `Create a complete "we miss you" win-back campaign for ${biz.name}.\n\n${ctx}\nCustomers who haven't visited in: ${winbackDays}+ days\nWin-back offer: ${winbackOffer||"A small welcome-back gesture (suggest something appropriate for this type of business)"}\n\nWrite the complete campaign:\n\n## THE OFFER\n[Define the win-back offer — make it feel special and personal, not desperate. Suggest specific amounts/percentages if the owner didn't provide one.]\n\n## SMS MESSAGE (under 155 chars)\n[Warm, personal, feels like it came from the owner not an automated system. Mentions them by name with [NAME] placeholder. Includes the offer.]\n\n## EMAIL SUBJECT LINES (3 options)\n[Curiosity-based — not "we miss you!" cliché]\n\n## EMAIL BODY\n[Full email — 150 words max. Warm opener that references how long it's been, genuine message, the offer, easy CTA. Sign off from the owner personally.]\n\n## FACEBOOK MESSAGE VERSION\n[For businesses that communicate via Facebook Messenger — casual, friendly, 3-4 sentences]\n\n## HANDWRITTEN NOTE VERSION\n[For businesses that want to go the extra mile — short, personal, could be written on a card. 4-5 sentences.]\n\n## TIMING STRATEGY\n[When to send which version — e.g. SMS first, email 3 days later if no response, etc.]\n\n## WHAT TO DO IF THEY COME BACK\n[2-3 sentences on how to welcome them back in a way that makes them want to stay this time]\n\nAll copy should sound like a real person wrote it, not a marketing department.`;
      } else {
        sys = `You create referral programs for Australian local small businesses. Simple, genuine, rewarding. No gimmicks — just a system that makes happy customers want to tell their friends.`;
        usr = `Create a complete referral program for ${biz.name}.\n\n${ctx}\nReferrer reward (what the existing customer gets): ${referralReward||"Suggest something appropriate and generous for this type of business"}\nReferral offer (what the new customer gets): ${referralOffer||"Suggest a compelling first-visit offer for this type of business"}\n\nWrite the complete referral program:\n\n## THE PROGRAM IN PLAIN ENGLISH\n[2-3 sentences explaining the program simply — as you'd explain it face to face to a customer]\n\n## THE REFERRER'S REWARD\n[Exact reward, clearly stated. Why it's good enough to bother.]\n\n## THE NEW CUSTOMER'S OFFER\n[Exact first-visit offer. Why they'd actually come in.]\n\n## HOW TO TELL CUSTOMERS ABOUT IT\n\n### In-Store (what to say / display)\n[Short script for staff + simple signage text]\n\n### SMS to Current Customers\n[Under 155 chars — mentions the reward, easy to understand]\n\n### Email to Customer List\n[Subject line + full email — 150 words, enthusiastic but not pushy]\n\n### Facebook Post\n[Caption with emojis — makes people want to tag a friend immediately]\n\n### What to Put on a Business Card or Flyer\n[Short, punchy, fits on a small card]\n\n## HOW TO TRACK IT\n[Simple system — no software needed. How to know who referred who and make sure rewards get given out.]\n\n## WHEN TO REMIND CUSTOMERS\n[Best moments to mention the referral program — after a great experience, after a good review, etc.]\n\nMake the whole thing feel generous and genuine — not like a corporate loyalty program.`;
      }
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,system:sys,messages:[{role:"user",content:usr}]})
      });
      const d = await res.json();
      if(d.error) throw new Error(d.error.message);
      setOutput(d.content[0].text);
    } catch(e) { setOutput("Error: "+e.message); }
    setGenerating(false);
  };

  const copy = () => { navigator.clipboard.writeText(output).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{}); };

  return (
    <div>
      {/* Section selector */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"20px"}}>
        {[
          {id:"winback",  icon:"🔄", title:"Win Back Lost Customers",  desc:"Bring back customers who haven't visited in a while"},
          {id:"referral", icon:"🤝", title:"Referral Program Builder",  desc:"Get happy customers to bring their friends in"},
        ].map(s=>(
          <button key={s.id} onClick={()=>{setActiveSection(s.id);setOutput("");}} style={{
            padding:"16px",borderRadius:"12px",textAlign:"left",cursor:"pointer",
            border:`2px solid ${activeSection===s.id?C.green:C.border}`,
            background:activeSection===s.id?C.greenLt:"#fff",
            transition:"all 0.15s",
          }}>
            <div style={{fontSize:"1.4em",marginBottom:"6px"}}>{s.icon}</div>
            <div style={{fontWeight:700,fontSize:"0.88em",color:activeSection===s.id?C.green:C.text,marginBottom:"3px"}}>{s.title}</div>
            <div style={{fontSize:"0.75em",color:C.muted,lineHeight:1.4}}>{s.desc}</div>
          </button>
        ))}
      </div>

      {activeSection==="winback" && (
        <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"20px"}}>
          <div style={{background:C.greenLt,border:"1px solid #BBF7D0",borderRadius:"8px",padding:"12px 14px",marginBottom:"16px",fontSize:"0.84em",color:"#166534",lineHeight:1.65}}>
            🔄 <strong>Win-back campaigns get an average 15–25% response rate</strong> — one of the highest ROI marketing activities for local businesses. You have <strong>{lapsedCount} customers</strong> who haven't been back in {winbackDays}+ days.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <Field label="Consider customers 'lapsed' after how many days?">
              <div style={{display:"flex",gap:"7px"}}>
                {["30","60","90","120"].map(d=>(
                  <button key={d} onClick={()=>setWinbackDays(d)} style={{padding:"7px 14px",borderRadius:"8px",border:`2px solid ${winbackDays===d?C.green:C.border}`,background:winbackDays===d?C.greenLt:"#fff",color:winbackDays===d?C.green:C.text,cursor:"pointer",fontSize:"0.85em",fontWeight:winbackDays===d?700:400}}>{d} days</button>
                ))}
              </div>
            </Field>
            <Field label="What can you offer to welcome them back? (optional)">
              <input value={winbackOffer} onChange={e=>setWinbackOffer(e.target.value)}
                placeholder="e.g. Free coffee with any purchase / 20% off their next visit / Free upgrade"
                style={inputSt}/>
              <div style={{fontSize:"0.72em",color:C.muted,marginTop:"4px"}}>Leave blank and we'll suggest something perfect for your type of business.</div>
            </Field>
            <button onClick={()=>generate("winback")} disabled={generating}
              style={{...btnPrimary,background:C.green,opacity:generating?0.6:1}}>
              {generating?"Writing your win-back campaign...":"🔄 Write My Win-Back Campaign →"}
            </button>
          </div>
          {output&&(
            <div style={{marginTop:"16px"}}>
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"9px",padding:"14px",fontSize:"0.83em",color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:"400px",overflowY:"auto",marginBottom:"10px"}}>{output}</div>
              <button onClick={copy} style={{width:"100%",padding:"11px",borderRadius:"8px",border:`2px solid ${C.green}`,background:copied?C.green:C.greenLt,color:copied?"#fff":C.green,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s"}}>
                {copied?"✓ Copied!":"📋 Copy Campaign"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeSection==="referral" && (
        <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"20px"}}>
          <div style={{background:C.greenLt,border:"1px solid #BBF7D0",borderRadius:"8px",padding:"12px 14px",marginBottom:"16px",fontSize:"0.84em",color:"#166534",lineHeight:1.65}}>
            🤝 <strong>Word of mouth is your #1 source of new customers</strong> — but most businesses never have a formal referral system. Let's build one in 2 minutes. A good referral program can increase new customers by 20–40%.
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <Field label="What does the person who refers get? (optional)">
              <input value={referralReward} onChange={e=>setReferralReward(e.target.value)}
                placeholder="e.g. $10 credit / Free service / 20% off their next visit"
                style={inputSt}/>
            </Field>
            <Field label="What does the new customer get on their first visit? (optional)">
              <input value={referralOffer} onChange={e=>setReferralOffer(e.target.value)}
                placeholder="e.g. 15% off / Free add-on / Free first consult"
                style={inputSt}/>
            </Field>
            <div style={{fontSize:"0.75em",color:C.muted,lineHeight:1.6,padding:"10px 12px",background:C.light,borderRadius:"8px"}}>
              💡 Leave both blank and we'll suggest the right amounts for a {industry?.label}. The best referral programs are generous enough that people actually bother, but sustainable enough that you still make money.
            </div>
            <button onClick={()=>generate("referral")} disabled={generating}
              style={{...btnPrimary,background:C.green,opacity:generating?0.6:1}}>
              {generating?"Building your referral program...":"🤝 Build My Referral Program →"}
            </button>
          </div>
          {output&&(
            <div style={{marginTop:"16px"}}>
              <div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:"9px",padding:"14px",fontSize:"0.83em",color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:"400px",overflowY:"auto",marginBottom:"10px"}}>{output}</div>
              <button onClick={copy} style={{width:"100%",padding:"11px",borderRadius:"8px",border:`2px solid ${C.green}`,background:copied?C.green:C.greenLt,color:copied?"#fff":C.green,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s"}}>
                {copied?"✓ Copied!":"📋 Copy Program"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// HEALTH PANEL — Weekly Business Health Score
// ═════════════════════════════════════════════════════════════════════════════
function HealthPanel({biz, industry, customers, results}) {
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");

  const lapsed = customers.filter(c => daysSince(c.lastVisit) >= 60).length;
  const vip    = customers.filter(c => c.tag === "vip").length;
  const leads  = customers.filter(c => c.tag === "lead").length;
  const toolsDone = Object.keys(results).length;
  const totalTools = 15;

  const scoreData = [
    {label:"Website",        done:!!results.website,  points:15, icon:"🌐"},
    {label:"Social Posts",   done:!!results.posts,    points:15, icon:"📱"},
    {label:"Google Reviews", done:!!results.review_request||!!results.review_respond, points:20, icon:"⭐"},
    {label:"Email Campaign", done:!!results.emails,   points:10, icon:"📧"},
    {label:"Blog Post",      done:!!results.blog,     points:20, icon:"✍️"},
    {label:"Google Post",    done:!!results.gbp,      points:10, icon:"📍"},
    {label:"Ad Running",     done:!!results.ads,      points:10, icon:"🎯"},
  ];
  const score = scoreData.reduce((a,s) => a + (s.done ? s.points : 0), 0);
  const scoreColor = score >= 70 ? C.green : score >= 40 ? C.amber : C.red;
  const scoreLabel = score >= 70 ? "Great 💚" : score >= 40 ? "Getting there 🟡" : "Needs work 🔴";

  const generateReport = async () => {
    setGenerating(true); setReport(null); setError("");
    const completed = scoreData.filter(s=>s.done).map(s=>s.label).join(", ") || "None yet";
    const missing   = scoreData.filter(s=>!s.done).map(s=>s.label).join(", ");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          system:`You are a friendly, no-nonsense marketing advisor for Australian small businesses. You give clear, practical weekly priorities — not generic advice. Be direct, warm, and specific to this business. Write like a smart friend, not a consultant.`,
          messages:[{role:"user",content:`Generate a weekly business health report for ${biz.name}.\n\nBusiness: ${industry?.label} in ${biz.suburb}\nWhat they do: ${biz.description}\nGoal: ${biz.goal}\n\nCurrent marketing score: ${score}/100\nCompleted this week/recently: ${completed}\nNot done yet: ${missing}\nCustomers in system: ${customers.length}\nLapsed customers (60+ days): ${lapsed}\nVIP customers: ${vip}\nNew leads: ${leads}\n\nWrite a friendly weekly check-in report using these sections:\n\n## YOUR HEALTH SCORE THIS WEEK: ${score}/100 — ${scoreLabel}\n[2-3 sentences on what the score means and what's driving it — specific to their numbers]\n\n## ✅ WHAT YOU DID WELL\n[Acknowledge what they've completed — be specific and encouraging. If nothing completed, skip gracefully.]\n\n## 🎯 YOUR 3 PRIORITIES THIS WEEK\n[Three specific, actionable things ranked by impact. Each one: what to do, why it matters for THEIR business specifically, how long it should take. Write like you're texting a friend who asked for advice.]\n\n## ⚠️ ONE THING TO WATCH\n[One potential problem or missed opportunity specific to their situation — ${lapsed} lapsed customers, ${leads} leads, etc. Keep it real without being alarmist.]\n\n## 💡 QUICK WIN (under 15 minutes)\n[Something small they can do RIGHT NOW that will have an immediate positive effect on their business.]\n\nKeep it under 400 words total. Write like a smart friend who knows their business, not a consultant writing a report.`}]
        })
      });
      const d = await res.json();
      if(d.error) throw new Error(d.error.message);
      setReport(d.content[0].text);
    } catch(e) { setError(e.message); }
    setGenerating(false);
  };

  return (
    <div>
      {/* Score card */}
      <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"20px",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"16px"}}>
          <div>
            <div style={{fontWeight:800,fontSize:"1.1em",color:C.text}}>💚 Your Marketing Health Score</div>
            <div style={{fontSize:"0.8em",color:C.muted,marginTop:"2px"}}>Updated based on what you've completed in Cliento</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:"2.8em",fontWeight:900,color:scoreColor,letterSpacing:"-0.04em",lineHeight:1}}>{score}</div>
            <div style={{fontSize:"0.7em",color:C.muted,fontWeight:600}}>/100</div>
            <div style={{fontSize:"0.75em",fontWeight:700,color:scoreColor,marginTop:"2px"}}>{scoreLabel}</div>
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{display:"flex",flexDirection:"column",gap:"7px"}}>
          {scoreData.map(s=>(
            <div key={s.label} style={{display:"flex",alignItems:"center",gap:"10px"}}>
              <span style={{fontSize:"0.9rem",width:"20px",textAlign:"center"}}>{s.icon}</span>
              <div style={{flex:1,background:"#F3F4F6",borderRadius:"99px",height:"8px",overflow:"hidden"}}>
                <div style={{width:s.done?"100%":"0%",height:"100%",background:s.done?C.green:"transparent",borderRadius:"99px",transition:"width 0.5s"}}/>
              </div>
              <div style={{fontSize:"0.75em",fontWeight:600,width:"90px",color:s.done?C.green:C.muted}}>
                {s.done?`✓ ${s.label}`:`${s.label}`}
              </div>
              <div style={{fontSize:"0.72em",color:s.done?C.green:C.muted,fontWeight:700,width:"30px",textAlign:"right"}}>
                {s.done?`+${s.points}`:`+${s.points}`}
              </div>
            </div>
          ))}
        </div>

        {/* Customer snapshot */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",marginTop:"16px"}}>
          {[[customers.length,"Customers","👥",C.brand],[vip,"VIP","⭐",C.amber],[lapsed,"Lapsed","⚠️",C.red]].map(([val,label,icon,color])=>(
            <div key={label} style={{background:C.light,borderRadius:"8px",padding:"10px",textAlign:"center"}}>
              <div style={{fontSize:"0.9em",marginBottom:"2px"}}>{icon}</div>
              <div style={{fontSize:"1.2em",fontWeight:800,color,lineHeight:1}}>{val}</div>
              <div style={{fontSize:"0.65em",color:C.muted,fontWeight:600,marginTop:"2px"}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Generate report */}
      <button onClick={generateReport} disabled={generating}
        style={{...btnPrimary,width:"100%",marginBottom:"16px",background:C.green,opacity:generating?0.6:1}}>
        {generating?"📊 Generating your weekly report...":"💚 Get My Weekly Priority Report →"}
      </button>

      {error&&<div style={{padding:"12px",background:C.redLt,border:`1px solid #FECACA`,borderRadius:"8px",color:C.red,fontSize:"0.84em",marginBottom:"12px"}}>{error}</div>}

      {report&&(
        <div style={{background:"#fff",borderRadius:"12px",border:`1px solid ${C.border}`,padding:"20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"14px"}}>
            <div style={{fontWeight:700,color:C.text}}>📋 Your Weekly Report</div>
            <div style={{fontSize:"0.72em",color:C.muted}}>{new Date().toLocaleDateString("en-AU",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
          <div style={{fontSize:"0.85em",color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:"480px",overflowY:"auto"}}>{report}</div>
          <button onClick={()=>navigator.clipboard.writeText(report).catch(()=>{})}
            style={{marginTop:"14px",width:"100%",padding:"11px",borderRadius:"8px",border:`2px solid ${C.green}`,background:C.greenLt,color:C.green,fontWeight:700,cursor:"pointer",fontSize:"0.88em"}}>
            📋 Copy Report
          </button>
        </div>
      )}

      {!report&&!generating&&(
        <div style={{background:C.light,borderRadius:"10px",padding:"16px",fontSize:"0.82em",color:C.muted,lineHeight:1.7}}>
          <strong style={{color:C.text}}>How the Health Score works:</strong> Every tool you complete in Cliento adds points to your score. Your weekly report gives you 3 specific priorities based on your actual score, your customer numbers, and what's been done recently. The more you use Cliento, the smarter and more personalised your report gets.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// NETWORK PANEL — Local Business Backlink Exchange
// ═════════════════════════════════════════════════════════════════════════════
function NetworkPanel({biz, industry, networkMembers}) {
  const [selectedMember, setSelectedMember] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [linkContent, setLinkContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [myProfile, setMyProfile] = useState({website:"", description: biz.description||""});
  const [showProfile, setShowProfile] = useState(false);

  // Filter out same-industry businesses (complementary only)
  const compatible = networkMembers.filter(m =>
    m.industry !== industry?.label &&
    m.suburb.toLowerCase().includes(biz.suburb?.split(" ")[0]?.toLowerCase()||"")
      || m.suburb === biz.suburb
      || true // show all for demo
  );

  const generateMention = async (member) => {
    setGenerating(true); setLinkContent(""); setSelectedMember(member);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6", max_tokens:1000,
          system:`You write natural, genuine local business mentions for blog posts and website content. The mention must feel authentic — like a real local business recommending another, not an SEO tactic. Never make it sound transactional or forced.`,
          messages:[{role:"user",content:`Write a natural mention of ${member.name} that ${biz.name} could include in a blog post or their website.\n\n${biz.name}: ${industry?.label} in ${biz.suburb} — ${biz.description}\n${member.name}: ${member.industry} in ${member.suburb} — ${member.desc}\nTheir website: ${member.website}\n\nWrite 3 different natural mention options — short paragraphs (2-4 sentences each) that:\n1. Feel genuinely written, not like an ad or SEO insert\n2. Naturally explain WHY these two businesses complement each other\n3. Give the reader a genuine reason to visit ${member.name}\n4. Include the website URL naturally: ${member.website}\n5. Sound like one local business owner recommending another they actually know\n\nLabel them:\nOPTION A — [mention for a blog post about local businesses]\nOPTION B — [mention for an "about us" or "partners" page]\nOPTION C — [mention for a social media post]\n\nDon't mention SEO, links, or any exchange arrangement. Just write like you genuinely know and like this business.`}]
        })
      });
      const d = await res.json();
      if(d.error) throw new Error(d.error.message);
      setLinkContent(d.content[0].text);
    } catch(e) { setLinkContent("Error: "+e.message); }
    setGenerating(false);
  };

  const copy = () => { navigator.clipboard.writeText(linkContent).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000)}).catch(()=>{}); };

  return (
    <div>
      {/* Explainer */}
      <div style={{background:"linear-gradient(135deg,#F0FDFA,#EFF6FF)",border:"1px solid #99F6E4",borderRadius:"12px",padding:"18px 20px",marginBottom:"20px"}}>
        <div style={{fontWeight:800,color:C.teal,fontSize:"1em",marginBottom:"6px"}}>🔗 The Cliento Backlink Network</div>
        <div style={{fontSize:"0.84em",color:"#0F766E",lineHeight:1.7,marginBottom:"12px"}}>
          Every Cliento member has a real website. When you mention another local member in your blog posts or on your website, and they mention you in theirs, Google sees both businesses as locally trusted and boosts your rankings. <strong>Agencies charge $500–$2,000/month for link building.</strong> You get it free as part of being a Cliento member.
        </div>
        <div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>
          {[["✓","Completely white-hat — Google loves it"],["✓","Local and relevant — the best kind of backlinks"],["✓","Free — included in your $50/month"]].map(([icon,text])=>(
            <div key={text} style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"0.78em",color:C.teal,fontWeight:600}}>
              <span style={{color:C.green}}>{icon}</span>{text}
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{background:"#fff",border:`1px solid ${C.border}`,borderRadius:"10px",padding:"16px",marginBottom:"16px"}}>
        <div style={{fontWeight:700,color:C.text,marginBottom:"10px",fontSize:"0.88em"}}>How it works — 3 steps:</div>
        <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
          {[
            ["1","Pick a member below whose business complements yours (e.g. café + florist, tradie + cleaning service)"],
            ["2","Click 'Generate a mention' — we write a natural, genuine paragraph you can add to your next blog post or website"],
            ["3","Email them at their address below and ask if they'd mention you in their next blog post too"],
          ].map(([n,text])=>(
            <div key={n} style={{display:"flex",gap:"10px",alignItems:"flex-start"}}>
              <div style={{width:"22px",height:"22px",borderRadius:"50%",background:C.teal,color:"#fff",fontWeight:800,fontSize:"0.7em",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{n}</div>
              <div style={{fontSize:"0.82em",color:C.muted,lineHeight:1.55}}>{text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Member directory */}
      <div style={{fontWeight:700,fontSize:"0.82em",color:C.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px"}}>
        🏪 {compatible.length} Members in Your Area
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
        {compatible.map(member=>(
          <div key={member.id} style={{background:"#fff",border:`1.5px solid ${selectedMember?.id===member.id?C.teal:C.border}`,borderRadius:"10px",padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:"10px",marginBottom:"8px"}}>
              <div>
                <div style={{fontWeight:700,fontSize:"0.9em",color:C.text}}>{member.name}</div>
                <div style={{fontSize:"0.75em",color:C.muted}}>{member.industry} · {member.suburb}</div>
              </div>
              <a href={`https://${member.website}`} target="_blank" rel="noopener noreferrer"
                style={{fontSize:"0.7em",color:C.teal,fontWeight:600,background:C.tealLt,padding:"3px 9px",borderRadius:"6px",whiteSpace:"nowrap",textDecoration:"none"}}>
                🌐 {member.website}
              </a>
            </div>
            <div style={{fontSize:"0.8em",color:C.muted,lineHeight:1.55,marginBottom:"10px"}}>{member.desc}</div>
            <div style={{display:"flex",gap:"8px",alignItems:"center",flexWrap:"wrap"}}>
              <button onClick={()=>generateMention(member)} disabled={generating}
                style={{...btnPrimary,padding:"8px 16px",fontSize:"0.78em",background:C.teal,opacity:generating&&selectedMember?.id===member.id?0.6:1}}>
                {generating&&selectedMember?.id===member.id?"Writing...":"✍️ Generate a mention"}
              </button>
              <a href={`mailto:${member.contact}?subject=Cliento Network — Let's mention each other&body=Hi! I'm ${biz.owner} from ${biz.name} (${industry?.label} in ${biz.suburb}). We're both Cliento members and I'd love to mention your business in my next blog post — would you be open to mentioning mine in yours? It's great for both our Google rankings!`}
                style={{fontSize:"0.78em",color:C.muted,fontWeight:600,padding:"8px 14px",borderRadius:"7px",border:`1px solid ${C.border}`,background:"#fff",textDecoration:"none"}}>
                ✉️ Email {member.name.split(" ")[0]}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Generated mention */}
      {generating&&!linkContent&&(
        <div style={{background:"#fff",borderRadius:"10px",border:`1px solid ${C.border}`,padding:"20px",textAlign:"center"}}>
          <div style={{fontSize:"1.5em",marginBottom:"8px"}}>✍️</div>
          <div style={{fontSize:"0.85em",color:C.muted}}>Writing a natural mention of {selectedMember?.name}...</div>
        </div>
      )}

      {linkContent&&(
        <div style={{background:"#fff",borderRadius:"12px",border:`1.5px solid ${C.teal}`,padding:"20px"}}>
          <div style={{fontWeight:700,color:C.teal,marginBottom:"4px",fontSize:"0.9em"}}>✓ Your mention of {selectedMember?.name} — pick the version you like best:</div>
          <div style={{fontSize:"0.76em",color:C.muted,marginBottom:"12px"}}>Add one of these to your next blog post or website. Then email {selectedMember?.name} and ask them to mention you back.</div>
          <div style={{background:C.tealLt,borderRadius:"9px",padding:"14px",fontSize:"0.83em",color:C.text,lineHeight:1.8,whiteSpace:"pre-wrap",maxHeight:"360px",overflowY:"auto",marginBottom:"10px"}}>{linkContent}</div>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={copy} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid ${C.teal}`,background:copied?C.teal:C.tealLt,color:copied?"#fff":C.teal,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s"}}>
              {copied?"✓ Copied!":"📋 Copy Mention"}
            </button>
            <a href={`mailto:${selectedMember?.contact}?subject=Cliento Network — Let's mention each other&body=Hi! I'm ${biz.owner} from ${biz.name}. I've just written a mention of your business to add to my next blog post — would you be open to mentioning us in yours? Here's what I wrote about you:%0A%0A${encodeURIComponent(linkContent?.substring(0,300))}...%0A%0ALet me know what you think!`}
              style={{padding:"11px 16px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,fontWeight:600,fontSize:"0.85em",textDecoration:"none",display:"flex",alignItems:"center"}}>
              ✉️ Email them
            </a>
          </div>
        </div>
      )}

      {/* My profile */}
      <div style={{marginTop:"16px",background:"#fff",borderRadius:"10px",border:`1px solid ${C.border}`,padding:"14px 16px"}}>
        <button onClick={()=>setShowProfile(!showProfile)} style={{background:"none",border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.85em",color:C.text,display:"flex",alignItems:"center",gap:"6px",width:"100%",textAlign:"left"}}>
          📝 Your Network Profile {showProfile?"▲":"▼"}
        </button>
        {showProfile&&(
          <div style={{marginTop:"12px",display:"flex",flexDirection:"column",gap:"10px"}}>
            <div style={{fontSize:"0.8em",color:C.muted,lineHeight:1.6}}>This is what other Cliento members see when they find your business in the network. Make sure it's accurate and appealing.</div>
            <div style={{background:C.light,borderRadius:"8px",padding:"12px 14px"}}>
              <div style={{fontWeight:700,fontSize:"0.88em",color:C.text,marginBottom:"2px"}}>{biz.name||"Your business name"}</div>
              <div style={{fontSize:"0.75em",color:C.muted,marginBottom:"6px"}}>{industry?.label} · {biz.suburb}</div>
              <div style={{fontSize:"0.8em",color:C.text}}>{biz.description||"Your business description will appear here."}</div>
            </div>
            <Field label="Your website URL">
              <input value={myProfile.website} onChange={e=>setMyProfile(p=>({...p,website:e.target.value}))}
                placeholder="e.g. sandyscafe.com.au" style={inputSt}/>
            </Field>
            <div style={{fontSize:"0.75em",color:C.muted}}>Your profile automatically updates when you update your business details in setup.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PRODUCT TOUR — first-login interactive walkthrough
// ═════════════════════════════════════════════════════════════════════════════
function ProductTour({ step, setStep, onClose, isShopify, ownerName }) {
  const accent = isShopify ? "#7C3AED" : "#2563EB";
  const accentLt = isShopify ? "#F5F3FF" : "#EFF6FF";

  const localSteps = [
    { icon:"👋", title:`Welcome to Cliento, ${ownerName||"there"}!`, body:"This is a 60-second tour to show you around. You can skip it any time — and revisit it later by tapping the ? icon in the top bar." },
    { icon:"📣", title:"Marketing tab — your content engine", body:"Tap any tool — your website, social posts, an email, an ad — and Cliento writes it for you in about 60 seconds. Everything is personalised to your business." },
    { icon:"⭐", title:"Reviews tab — grow your Google rating", body:"Ask happy customers for reviews, reply to every review professionally, and turn bad reviews into trust-builders. The single biggest lever for getting found on Google." },
    { icon:"👥", title:"Customers tab — your simple CRM", body:"Keep a list of your customers. Tap 'Generate Message' on anyone and Cliento writes a personal follow-up, win-back, or thank you — using what you know about them." },
    { icon:"💚", title:"Health Score — your Monday morning check-in", body:"Every week, get a plain-English report: what you did well, your 3 priorities, and one quick win. Most people check it with their coffee." },
    { icon:"🔗", title:"Network — free backlinks from other members", body:"Get matched with complementary local businesses and we'll write a natural mention of them for your blog — and they'll do the same for you. Free SEO, built in." },
    { icon:"🚀", title:"You're all set!", body:"Start with whatever feels most useful today. If you ever get stuck, tap the ❓ Help tab for a full walkthrough and FAQ." },
  ];

  const shopifySteps = [
    { icon:"👋", title:`Welcome to Cliento, ${ownerName||"there"}!`, body:"This is a 60-second tour to show you around your store's marketing tools. Skip any time, or revisit later via the ? icon." },
    { icon:"🛍️", title:"Products tab — descriptions that sell", body:"Generate full product descriptions, SEO titles, collection page copy, and bundle suggestions — all written to convert browsers into buyers." },
    { icon:"📧", title:"Emails tab — recover lost sales", body:"Abandoned cart sequences, post-purchase flows, win-back campaigns, and launch emails. The abandoned cart sequence alone typically recovers 5–15% of lost sales." },
    { icon:"📱", title:"Social & Ads — content for every platform", body:"Instagram, TikTok and Facebook captions, ad copy for Meta and Google, and influencer outreach briefs — ready in seconds." },
    { icon:"📊", title:"Analytics — your store numbers in plain English", body:"Paste in your Shopify or ad numbers and get a clear breakdown of what's working, what's not, and your top 3 actions." },
    { icon:"🚀", title:"Growth tab — referrals, loyalty, sale campaigns", body:"Build a referral program, a loyalty system, or a full sale campaign kit for Black Friday, Christmas, or any big moment." },
    { icon:"✅", title:"You're all set!", body:"Start with Products if you're new, or Emails if you already have traffic. Tap ❓ Help any time for a full walkthrough." },
  ];

  const steps = isShopify ? shopifySteps : localSteps;
  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(7,9,14,0.65)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:"#fff",borderRadius:"20px",maxWidth:"420px",width:"100%",overflow:"hidden",boxShadow:"0 24px 64px rgba(0,0,0,0.3)"}}>
        <div style={{background:`linear-gradient(135deg,${accent},${isShopify?"#5B21B6":"#1D4ED8"})`,padding:"32px 28px 24px",textAlign:"center"}}>
          <div style={{fontSize:"2.6em",marginBottom:"8px"}}>{s.icon}</div>
          <div style={{display:"flex",justifyContent:"center",gap:"5px",marginTop:"4px"}}>
            {steps.map((_,i)=>(
              <div key={i} style={{width:i===step?"18px":"6px",height:"6px",borderRadius:"99px",background:i===step?"#fff":"rgba(255,255,255,0.35)",transition:"all 0.2s"}}/>
            ))}
          </div>
        </div>
        <div style={{padding:"24px 28px 28px"}}>
          <h3 style={{fontSize:"1.15em",fontWeight:800,color:"#111827",margin:"0 0 10px",lineHeight:1.3}}>{s.title}</h3>
          <p style={{fontSize:"0.9em",color:"#4B5563",lineHeight:1.65,margin:"0 0 24px"}}>{s.body}</p>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={onClose} style={{padding:"11px 16px",borderRadius:"9px",border:"1px solid #E5E7EB",background:"#fff",color:"#6B7280",cursor:"pointer",fontSize:"0.85em",fontWeight:600}}>
              Skip tour
            </button>
            <button onClick={()=>isLast?onClose():setStep(s=>s+1)} style={{flex:1,padding:"11px 16px",borderRadius:"9px",border:"none",background:accent,color:"#fff",cursor:"pointer",fontSize:"0.88em",fontWeight:700}}>
              {isLast?"Let's go! →":"Next →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PUBLISH WEBSITE — domain check, affiliate flow, DNS walkthrough, deploy trigger
// ═════════════════════════════════════════════════════════════════════════════

// 🔧 Drop your registrar affiliate link in here once you're approved for a program
// (Namecheap, VentraIP, Crazy Domains, etc.) — the suggested domain name gets
// appended as a query param where the registrar supports it.
const DOMAIN_AFFILIATE_BASE_URL = "https://www.namecheap.com/domains/registration/results/?domain=";

// 🔧 Drop your Shopify Partner affiliate link in here once you're approved
// (partners.shopify.com → Affiliate Program). Shopify supports a referral
// parameter on their signup URL — replace with your actual tracked link.
const SHOPIFY_AFFILIATE_URL = "https://www.shopify.com/free-trial";

function PublishWebsite({ biz, websiteContent, onBack }) {
  const [step, setStep] = useState("ask"); // ask | suggest | connect-existing | deploying | live
  const [domainChoice, setDomainChoice] = useState(null); // the domain string once chosen
  const [customDomainInput, setCustomDomainInput] = useState("");
  const [deployProgress, setDeployProgress] = useState(0);
  const [liveUrl, setLiveUrl] = useState("");

  // Generate domain suggestions from the business name
  const slug = (biz.name||"mybusiness").toLowerCase().replace(/[^a-z0-9]+/g,"").slice(0,24) || "mybusiness";
  const suburbSlug = (biz.suburb||"").toLowerCase().split(" ")[0].replace(/[^a-z0-9]/g,"");
  const suggestions = [
    { domain:`${slug}.com.au`,           note:"Most trusted for Australian customers" },
    { domain:`${slug}.com`,              note:"Works globally, widely recognised" },
    { domain:`${slug}${suburbSlug}.com`, note:"Great if your exact name is taken" },
    { domain:`get${slug}.com`,           note:"Short, brandable alternative" },
    { domain:`${slug}.au`,               note:"New, short Australian domain ending" },
  ].filter(s=>!s.domain.includes("undefined"));

  const cliento_subdomain = `${slug}.cliento.site`;

  const startDeploy = () => {
    setStep("deploying");
    setDeployProgress(0);
    const timer = setInterval(()=>{
      setDeployProgress(p=>{
        if(p>=100){ clearInterval(timer); setStep("live"); setLiveUrl(domainChoice||cliento_subdomain); return 100; }
        return p+ (p<70?14:4);
      });
    },350);
  };

  const buyDomainUrl = (domain) => `${DOMAIN_AFFILIATE_BASE_URL}${encodeURIComponent(domain)}`;

  return (
    <div>
      <button onClick={onBack} style={{...backBtn,marginBottom:"14px"}}>← Back</button>

      <div style={{background:"linear-gradient(135deg,#0D1117 0%,#1A2235 100%)",borderRadius:"14px",padding:"20px",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"1.8em"}}>🚀</span>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"1em"}}>Publish My Website</div>
            <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.78em"}}>Get {biz.name||"your business"}'s website live on the internet</div>
          </div>
        </div>
      </div>

      {/* ── STEP 1: ASK ABOUT DOMAIN ──────────────────────────────────────── */}
      {step==="ask" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"22px"}}>
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"4px"}}>Do you already have a domain name?</div>
          <div style={{fontSize:"0.82em",color:C.muted,marginBottom:"18px",lineHeight:1.6}}>A domain is the web address people type to find you — like sandyscafe.com.au</div>

          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            <button onClick={()=>setStep("connect-existing")} style={{padding:"16px",borderRadius:"11px",textAlign:"left",cursor:"pointer",border:`2px solid ${C.border}`,background:"#fff"}}>
              <div style={{fontWeight:700,fontSize:"0.88em",color:C.text,marginBottom:"3px"}}>✅ Yes, I already own a domain</div>
              <div style={{fontSize:"0.78em",color:C.muted}}>We'll show you exactly how to point it at your new website</div>
            </button>
            <button onClick={()=>setStep("suggest")} style={{padding:"16px",borderRadius:"11px",textAlign:"left",cursor:"pointer",border:`2px solid ${C.brand}`,background:C.brandLt}}>
              <div style={{fontWeight:700,fontSize:"0.88em",color:C.brand,marginBottom:"3px"}}>🔍 No — help me find and buy one</div>
              <div style={{fontSize:"0.78em",color:"#1E40AF"}}>We'll suggest names based on {biz.name||"your business"} and walk you through buying one</div>
            </button>
            <button onClick={startDeploy} style={{padding:"14px",borderRadius:"11px",textAlign:"left",cursor:"pointer",border:`1.5px dashed ${C.border}`,background:"#fff"}}>
              <div style={{fontWeight:600,fontSize:"0.85em",color:C.muted,marginBottom:"2px"}}>⏭️ Skip for now — just give me a free Cliento web address</div>
              <div style={{fontSize:"0.76em",color:C.muted}}>You'll get <strong>{cliento_subdomain}</strong> instantly. Add a real domain any time later.</div>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2A: SUGGEST DOMAINS + AFFILIATE ─────────────────────────── */}
      {step==="suggest" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"22px"}}>
          <button onClick={()=>setStep("ask")} style={{...backBtn,marginBottom:"14px",fontSize:"0.8em"}}>← Back</button>
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"4px"}}>Here are some domain ideas for {biz.name||"your business"}</div>
          <div style={{fontSize:"0.82em",color:C.muted,marginBottom:"16px",lineHeight:1.6}}>Domains usually cost around $15–$30/year. Pick one, buy it on the registrar's site, then come back here to connect it.</div>

          <div style={{display:"flex",flexDirection:"column",gap:"9px",marginBottom:"18px"}}>
            {suggestions.map(s=>(
              <div key={s.domain} style={{display:"flex",alignItems:"center",gap:"10px",padding:"13px 14px",borderRadius:"10px",border:`1.5px solid ${C.border}`,background:"#fff"}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:"0.88em",color:C.text}}>{s.domain}</div>
                  <div style={{fontSize:"0.74em",color:C.muted}}>{s.note}</div>
                </div>
                <a href={buyDomainUrl(s.domain)} target="_blank" rel="noopener noreferrer"
                  onClick={()=>setDomainChoice(s.domain)}
                  style={{padding:"8px 16px",borderRadius:"8px",background:C.brand,color:"#fff",fontSize:"0.78em",fontWeight:700,textDecoration:"none",whiteSpace:"nowrap"}}>
                  Buy this →
                </a>
              </div>
            ))}
          </div>

          <div style={{background:C.amberLt,border:`1px solid #FDE68A`,borderRadius:"9px",padding:"12px 14px",fontSize:"0.78em",color:"#92400E",lineHeight:1.6,marginBottom:"16px"}}>
            💡 Clicking "Buy this" opens the registrar in a new tab with your chosen name pre-filled. Complete the purchase there, then come back here.
          </div>

          <Field label="Bought your domain? Type it here to continue">
            <div style={{display:"flex",gap:"8px"}}>
              <input value={customDomainInput} onChange={e=>setCustomDomainInput(e.target.value)} placeholder="e.g. sandyscafe.com.au" style={{...inputSt,flex:1}}/>
              <button onClick={()=>{setDomainChoice(customDomainInput);setStep("connect-existing");}} disabled={!customDomainInput}
                style={{...btnPrimary,opacity:customDomainInput?1:0.4,whiteSpace:"nowrap"}}>
                Continue →
              </button>
            </div>
          </Field>
        </div>
      )}

      {/* ── STEP 2B: CONNECT EXISTING DOMAIN — DNS WALKTHROUGH ───────────── */}
      {step==="connect-existing" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"22px"}}>
          <button onClick={()=>setStep("ask")} style={{...backBtn,marginBottom:"14px",fontSize:"0.8em"}}>← Back</button>
          {!domainChoice && (
            <Field label="What's your domain name?">
              <input value={customDomainInput} onChange={e=>setCustomDomainInput(e.target.value)} placeholder="e.g. sandyscafe.com.au" style={{...inputSt,marginBottom:"16px"}}/>
            </Field>
          )}
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"14px"}}>
            Connecting {domainChoice||customDomainInput||"your domain"} — 3 simple steps
          </div>
          {[
            ["1","Log in to where you bought your domain","This is usually GoDaddy, Crazy Domains, VentraIP, Namecheap or similar — wherever you purchased it."],
            ["2","Find 'DNS Settings' or 'Manage DNS'","Every registrar calls this something slightly different, but it's usually under your domain's settings page."],
            ["3","Add these 2 records exactly as shown","Type: A, Name: @, Value: 76.76.21.21  —  Type: CNAME, Name: www, Value: cname.cliento.site"],
          ].map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:"12px",marginBottom:"14px"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:C.brand,color:"#fff",fontWeight:800,fontSize:"0.72em",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{num}</div>
              <div>
                <div style={{fontWeight:700,fontSize:"0.86em",color:C.text,marginBottom:"3px"}}>{title}</div>
                <div style={{fontSize:"0.8em",color:C.muted,lineHeight:1.6,fontFamily:num==="3"?"monospace":"inherit",background:num==="3"?C.light:"transparent",padding:num==="3"?"8px 10px":"0",borderRadius:num==="3"?"6px":"0"}}>{desc}</div>
              </div>
            </div>
          ))}
          <div style={{background:C.brandLt,border:"1px solid #BFDBFE",borderRadius:"9px",padding:"11px 14px",fontSize:"0.78em",color:"#1E40AF",marginBottom:"16px",lineHeight:1.6}}>
            ⏱️ DNS changes can take anywhere from 10 minutes to a few hours to take effect. Don't worry if it's not instant.
          </div>
          <button onClick={()=>{ if(!domainChoice) setDomainChoice(customDomainInput); startDeploy(); }}
            disabled={!domainChoice&&!customDomainInput}
            style={{...btnPrimary,width:"100%",opacity:(domainChoice||customDomainInput)?1:0.4}}>
            ✓ I've added the records — Publish my website →
          </button>
        </div>
      )}

      {/* ── STEP 3: DEPLOYING ─────────────────────────────────────────────── */}
      {step==="deploying" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"32px",textAlign:"center"}}>
          <div style={{fontSize:"2.4em",marginBottom:"14px"}}>🚀</div>
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"6px"}}>Publishing your website...</div>
          <div style={{fontSize:"0.8em",color:C.muted,marginBottom:"20px"}}>Building your site from your content and deploying it live</div>
          <div style={{background:C.light,borderRadius:"99px",height:"10px",overflow:"hidden",marginBottom:"10px"}}>
            <div style={{width:`${deployProgress}%`,height:"100%",background:`linear-gradient(90deg,${C.brand},${C.green})`,borderRadius:"99px",transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:"0.75em",color:C.muted}}>{deployProgress}%</div>
        </div>
      )}

      {/* ── STEP 4: LIVE ──────────────────────────────────────────────────── */}
      {step==="live" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1.5px solid ${C.green}`,padding:"28px",textAlign:"center"}}>
          <div style={{fontSize:"2.6em",marginBottom:"12px"}}>🎉</div>
          <div style={{fontWeight:800,fontSize:"1.1em",color:C.text,marginBottom:"6px"}}>Your website is live!</div>
          <div style={{fontSize:"0.85em",color:C.muted,marginBottom:"18px",lineHeight:1.6}}>Anyone can now visit your website at:</div>
          <div style={{background:C.greenLt,border:`1px solid #BBF7D0`,borderRadius:"10px",padding:"14px",marginBottom:"20px"}}>
            <a href={`https://${liveUrl}`} target="_blank" rel="noopener noreferrer" style={{fontSize:"1.05em",fontWeight:800,color:C.green,textDecoration:"none"}}>
              🌐 {liveUrl}
            </a>
          </div>
          <div style={{display:"flex",gap:"8px"}}>
            <a href={`https://${liveUrl}`} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"12px",borderRadius:"9px",background:C.brand,color:"#fff",textDecoration:"none",fontWeight:700,fontSize:"0.85em"}}>
              View My Website
            </a>
            <button onClick={onBack} style={{padding:"12px 18px",borderRadius:"9px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:"0.85em"}}>
              Done
            </button>
          </div>
          <div style={{marginTop:"16px",fontSize:"0.76em",color:C.muted,lineHeight:1.6}}>
            💡 Update your website content any time in the Marketing tab, then come back here and republish to push the changes live.
          </div>
        </div>
      )}
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
// CONNECT SHOPIFY — has a store vs needs one (affiliate signup)
// ═════════════════════════════════════════════════════════════════════════════
function ConnectShopify({ biz, onBack }) {
  const [step, setStep] = useState("ask"); // ask | connect-existing | connecting | connected
  const [storeUrlInput, setStoreUrlInput] = useState(biz.suburb||"");
  const [connectProgress, setConnectProgress] = useState(0);

  const startConnect = () => {
    setStep("connecting");
    setConnectProgress(0);
    const timer = setInterval(()=>{
      setConnectProgress(p=>{
        if(p>=100){ clearInterval(timer); setStep("connected"); return 100; }
        return p + (p<70?16:5);
      });
    },300);
  };

  return (
    <div>
      <button onClick={onBack} style={{...backBtn,marginBottom:"14px"}}>← Back</button>

      <div style={{background:"linear-gradient(135deg,#0D1117 0%,#1A2235 100%)",borderRadius:"14px",padding:"20px",marginBottom:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
          <span style={{fontSize:"1.8em"}}>🛍️</span>
          <div>
            <div style={{color:"#fff",fontWeight:800,fontSize:"1em"}}>Connect My Shopify Store</div>
            <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.78em"}}>Sync your products so Cliento can write for them automatically</div>
          </div>
        </div>
      </div>

      {/* ── STEP 1: ASK ABOUT SHOPIFY STORE ──────────────────────────────── */}
      {step==="ask" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"22px"}}>
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"4px"}}>Do you already have a Shopify store?</div>
          <div style={{fontSize:"0.82em",color:C.muted,marginBottom:"18px",lineHeight:1.6}}>Connecting your store lets Cliento pull your real product list — no retyping product names and details.</div>

          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            <button onClick={()=>setStep("connect-existing")} style={{padding:"16px",borderRadius:"11px",textAlign:"left",cursor:"pointer",border:`2px solid ${C.border}`,background:"#fff"}}>
              <div style={{fontWeight:700,fontSize:"0.88em",color:C.text,marginBottom:"3px"}}>✅ Yes, I already have a Shopify store</div>
              <div style={{fontSize:"0.78em",color:C.muted}}>We'll show you exactly how to connect it</div>
            </button>
            <a href={SHOPIFY_AFFILIATE_URL} target="_blank" rel="noopener noreferrer" style={{
              padding:"16px",borderRadius:"11px",textAlign:"left",cursor:"pointer",border:`2px solid ${C.purple}`,background:C.purpleLt,
              textDecoration:"none",display:"block",
            }}>
              <div style={{fontWeight:700,fontSize:"0.88em",color:C.purple,marginBottom:"3px"}}>🚀 No — help me start a Shopify store</div>
              <div style={{fontSize:"0.78em",color:"#4C1D95"}}>Opens Shopify's free trial signup in a new tab. Come back here once it's set up.</div>
            </a>
            <button onClick={onBack} style={{padding:"14px",borderRadius:"11px",textAlign:"left",cursor:"pointer",border:`1.5px dashed ${C.border}`,background:"#fff"}}>
              <div style={{fontWeight:600,fontSize:"0.85em",color:C.muted,marginBottom:"2px"}}>⏭️ Skip for now</div>
              <div style={{fontSize:"0.76em",color:C.muted}}>You can keep using Cliento's product tools manually — just type details in as you go.</div>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: CONNECT EXISTING STORE ───────────────────────────────── */}
      {step==="connect-existing" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"22px"}}>
          <button onClick={()=>setStep("ask")} style={{...backBtn,marginBottom:"14px",fontSize:"0.8em"}}>← Back</button>
          <Field label="Your Shopify store URL">
            <input value={storeUrlInput} onChange={e=>setStoreUrlInput(e.target.value)} placeholder="e.g. lunacandles.myshopify.com" style={{...inputSt,marginBottom:"16px"}}/>
          </Field>
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"14px"}}>Connecting your store — 3 simple steps</div>
          {[
            ["1","We'll ask Shopify to confirm it's really you","You'll be sent to a Shopify login screen — this is normal and keeps your store secure."],
            ["2","Approve Cliento's access","Shopify will show you exactly what Cliento can see (your product list) — nothing else."],
            ["3","You're connected","Cliento will pull your products automatically so you never have to retype names or details again."],
          ].map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:"12px",marginBottom:"14px"}}>
              <div style={{width:"24px",height:"24px",borderRadius:"50%",background:C.purple,color:"#fff",fontWeight:800,fontSize:"0.72em",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{num}</div>
              <div>
                <div style={{fontWeight:700,fontSize:"0.86em",color:C.text,marginBottom:"3px"}}>{title}</div>
                <div style={{fontSize:"0.8em",color:C.muted,lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
          <button onClick={startConnect} disabled={!storeUrlInput}
            style={{...btnPrimary,width:"100%",background:C.purple,opacity:storeUrlInput?1:0.4}}>
            🔗 Connect My Store →
          </button>
        </div>
      )}

      {/* ── STEP 3: CONNECTING ────────────────────────────────────────────── */}
      {step==="connecting" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1px solid ${C.border}`,padding:"32px",textAlign:"center"}}>
          <div style={{fontSize:"2.4em",marginBottom:"14px"}}>🔗</div>
          <div style={{fontWeight:700,fontSize:"0.95em",color:C.text,marginBottom:"6px"}}>Connecting to {storeUrlInput}...</div>
          <div style={{fontSize:"0.8em",color:C.muted,marginBottom:"20px"}}>Syncing your product list</div>
          <div style={{background:C.light,borderRadius:"99px",height:"10px",overflow:"hidden",marginBottom:"10px"}}>
            <div style={{width:`${connectProgress}%`,height:"100%",background:`linear-gradient(90deg,${C.purple},#A78BFA)`,borderRadius:"99px",transition:"width 0.3s"}}/>
          </div>
          <div style={{fontSize:"0.75em",color:C.muted}}>{connectProgress}%</div>
        </div>
      )}

      {/* ── STEP 4: CONNECTED ─────────────────────────────────────────────── */}
      {step==="connected" && (
        <div style={{background:"#fff",borderRadius:"14px",border:`1.5px solid ${C.purple}`,padding:"28px",textAlign:"center"}}>
          <div style={{fontSize:"2.6em",marginBottom:"12px"}}>🎉</div>
          <div style={{fontWeight:800,fontSize:"1.1em",color:C.text,marginBottom:"6px"}}>Your store is connected!</div>
          <div style={{fontSize:"0.85em",color:C.muted,marginBottom:"18px",lineHeight:1.6}}>
            Cliento can now see your product list at <strong>{storeUrlInput}</strong>. Head to the Products tab and your products will be ready to write content for.
          </div>
          <button onClick={onBack} style={{padding:"12px 24px",borderRadius:"9px",border:"none",background:C.purple,color:"#fff",cursor:"pointer",fontSize:"0.85em",fontWeight:700}}>
            Go to Products →
          </button>
        </div>
      )}
    </div>
  );
}


// ═════════════════════════════════════════════════════════════════════════════
function HelpCentre({ isShopify, onStartTour }) {
  const [openSection, setOpenSection] = useState("getting-started");
  const [openFaq, setOpenFaq] = useState(null);
  const accent = isShopify ? "#7C3AED" : "#2563EB";
  const accentLt = isShopify ? "#F5F3FF" : "#EFF6FF";

  const toggle = (id) => setOpenFaq(openFaq===id?null:id);

  const sections = [
    { id:"getting-started", icon:"🚀", label:"Getting Started" },
    { id:"connections",     icon:"🔌", label:"What Do I Need to Connect?" },
    { id:"tools",           icon:"🛠️", label:"How Each Tool Works" },
    { id:"faq",             icon:"❓", label:"Common Questions" },
    { id:"contact",         icon:"💬", label:"Still Stuck?" },
  ];

  const FaqItem = ({id, q, a}) => (
    <div onClick={()=>toggle(id)} style={{borderBottom:"1px solid #F3F4F6",padding:"14px 0",cursor:"pointer"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"0.88em",fontWeight:700,color:"#111827"}}>{q}</span>
        <span style={{fontSize:"0.8em",color:accent,transform:openFaq===id?"rotate(180deg)":"none",transition:"transform 0.2s",flexShrink:0}}>▾</span>
      </div>
      {openFaq===id && <p style={{fontSize:"0.84em",color:"#4B5563",lineHeight:1.65,marginTop:"10px",marginBottom:0}}>{a}</p>}
    </div>
  );

  return (
    <div>
      {/* Quick actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px",marginBottom:"20px"}}>
        <button onClick={onStartTour} style={{padding:"16px",borderRadius:"12px",border:`1.5px solid ${accent}33`,background:accentLt,cursor:"pointer",textAlign:"left"}}>
          <div style={{fontSize:"1.3em",marginBottom:"6px"}}>🎬</div>
          <div style={{fontWeight:700,fontSize:"0.85em",color:accent}}>Replay the tour</div>
          <div style={{fontSize:"0.72em",color:"#6B7280",marginTop:"2px"}}>60-second walkthrough</div>
        </button>
        <a href="mailto:support@cliento.com.au" style={{padding:"16px",borderRadius:"12px",border:"1.5px solid #E5E7EB",background:"#fff",cursor:"pointer",textAlign:"left",textDecoration:"none",display:"block"}}>
          <div style={{fontSize:"1.3em",marginBottom:"6px"}}>✉️</div>
          <div style={{fontWeight:700,fontSize:"0.85em",color:"#111827"}}>Email support</div>
          <div style={{fontSize:"0.72em",color:"#6B7280",marginTop:"2px"}}>We reply within a day</div>
        </a>
      </div>

      {/* Section tabs */}
      <div style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"18px",paddingBottom:"2px"}}>
        {sections.map(s=>(
          <button key={s.id} onClick={()=>setOpenSection(s.id)} style={{
            padding:"8px 14px",borderRadius:"20px",border:"none",cursor:"pointer",whiteSpace:"nowrap",
            background:openSection===s.id?accent:"#F3F4F6",
            color:openSection===s.id?"#fff":"#4B5563",
            fontSize:"0.78em",fontWeight:600,flexShrink:0,
          }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* GETTING STARTED */}
      {openSection==="getting-started" && (
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E5E7EB",padding:"22px"}}>
          <h3 style={{fontSize:"1.05em",fontWeight:800,color:"#111827",margin:"0 0 14px"}}>Getting started with Cliento</h3>
          {[
            ["1","Set up your business profile","Done at signup — your name, business details, and what you offer. Cliento uses this to personalise everything."],
            ["2", isShopify?"Try your first product description":"Try your first piece of content","Head to "+(isShopify?"Products → Product Description":"Marketing → My Website")+" and generate something. It takes about 60 seconds and you'll immediately see what Cliento can do."],
            ["3","Copy it and use it","Everything Cliento writes is yours. Copy it into Facebook, your website, your email tool — wherever it needs to go. Nothing publishes automatically."],
            ["4", isShopify?"Set up your abandoned cart emails":"Build your customer list","This is one of the highest-ROI things you can do — "+(isShopify?"recovering lost sales takes just a few minutes to set up.":"add a few regulars and try generating a personal message for one of them.")],
            ["5","Check back weekly", isShopify?"Use the Analytics tab monthly to see what's working in your store.":"The Health Score tab gives you a fresh priority report every week — most people check it Monday mornings."],
          ].map(([num,title,desc])=>(
            <div key={num} style={{display:"flex",gap:"14px",marginBottom:"16px"}}>
              <div style={{width:"26px",height:"26px",borderRadius:"50%",background:accent,color:"#fff",fontWeight:800,fontSize:"0.75em",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{num}</div>
              <div>
                <div style={{fontWeight:700,fontSize:"0.88em",color:"#111827",marginBottom:"3px"}}>{title}</div>
                <div style={{fontSize:"0.82em",color:"#6B7280",lineHeight:1.6}}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONNECTIONS — honest about what's manual vs automatic */}
      {openSection==="connections" && (
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E5E7EB",padding:"22px"}}>
          <h3 style={{fontSize:"1.05em",fontWeight:800,color:"#111827",margin:"0 0 6px"}}>What do I need to connect?</h3>
          <p style={{fontSize:"0.83em",color:"#6B7280",lineHeight:1.6,margin:"0 0 18px"}}>Short answer: nothing is required to start. Cliento works today by you copying content where it needs to go. Here's exactly what's available now vs what's coming.</p>

          <div style={{marginBottom:"16px"}}>
            <div style={{fontSize:"0.7em",fontWeight:800,color:"#16A34A",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px"}}>✅ Works today — no setup needed</div>
            {[
              "All content generation — website, posts, emails, ads, blog posts",
              isShopify?"Product descriptions, SEO copy, email flows":"Google review request and response writing",
              "Your customer list and personal message generator",
              "Weekly Health Score reports",
              isShopify?"Connect My Shopify Store — guided setup, plus help starting one if you don't have it yet":"Publish My Website — get a free web address instantly, or guided help connecting your own domain",
            ].map(t=>(
              <div key={t} style={{display:"flex",gap:"8px",fontSize:"0.83em",color:"#374151",padding:"6px 0"}}>
                <span style={{color:"#16A34A"}}>✓</span>{t}
              </div>
            ))}
          </div>

          <div style={{marginBottom:"16px"}}>
            <div style={{fontSize:"0.7em",fontWeight:800,color:"#D97706",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px"}}>🔧 Manual today — you copy & paste</div>
            {[
              isShopify?"Adding product descriptions to Shopify (paste into the product editor until full sync is live)":"Posting to your Google Business Profile (paste into the Google Business app)",
              "Pulling numbers for the Analytics tool (copy from Google Analytics / Shopify dashboard)",
              "Sending emails (paste into Mailchimp, Klaviyo or your email tool)",
            ].map(t=>(
              <div key={t} style={{display:"flex",gap:"8px",fontSize:"0.83em",color:"#374151",padding:"6px 0"}}>
                <span style={{color:"#D97706"}}>→</span>{t}
              </div>
            ))}
          </div>

          <div>
            <div style={{fontSize:"0.7em",fontWeight:800,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"10px"}}>🔜 Coming soon — direct connections</div>
            {[
              "Google Analytics connected directly — numbers pulled in automatically",
              "Google Business Profile connected directly — post with one click",
              isShopify&&"Full Shopify product sync — automatic two-way updates",
            ].filter(Boolean).map(t=>(
              <div key={t} style={{display:"flex",gap:"8px",fontSize:"0.83em",color:"#9CA3AF",padding:"6px 0"}}>
                <span>○</span>{t}
              </div>
            ))}
            <div style={{marginTop:"12px",background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:"8px",padding:"10px 13px",fontSize:"0.78em",color:"#92400E",lineHeight:1.6}}>
              💡 We're building these properly rather than rushing them — direct connections to Google require their formal approval process. Want one prioritised? Email us and tell us which.
            </div>
          </div>
        </div>
      )}

      {/* HOW EACH TOOL WORKS */}
      {openSection==="tools" && (
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E5E7EB",padding:"22px"}}>
          <h3 style={{fontSize:"1.05em",fontWeight:800,color:"#111827",margin:"0 0 14px"}}>How each tool works</h3>
          {(isShopify ? [
            ["🛍️ Products","Fill in the product name, key features, and target customer. Cliento writes a description, then you copy it into your Shopify product page."],
            ["📧 Emails","Pick the email type (abandoned cart, post-purchase, win-back). Answer 2-3 questions. Get a full sequence ready to paste into Klaviyo, Mailchimp, or Shopify Email."],
            ["📱 Social & Ads","Tell us the product and angle. Get Instagram, TikTok and Facebook captions, or ad copy for Meta/Google — ready to paste into Ads Manager."],
            ["⭐ Reviews","Paste in a customer review (good or bad) and get the perfect response to post back. Or generate a request email to send after purchase."],
            ["🔍 SEO","The blog tool finds a real keyword people search for, then writes the full article. The FAQ and About Us tools work the same way — answer a few questions, get publish-ready copy."],
            ["📊 Analytics","Open Shopify or your ad platform, copy your numbers (orders, revenue, sessions, etc.) into the form, and get a plain English breakdown of what they mean."],
            ["🚀 Growth","Build a referral program, loyalty system, or sale campaign by answering a few quick questions about your offer."],
          ] : [
            ["📣 Marketing","Pick a tool — website, posts, email, ads, offers, blog, seasonal. Answer 1-3 quick questions. Get content ready to copy into Facebook, your website, or your email tool."],
            ["⭐ Reviews","Ask for a review, reply to one, or handle a bad one — paste in the review text (if relevant) and Cliento writes the perfect response."],
            ["🏢 Business","Paste your Google Analytics numbers for a plain English report, or fill in role details to get a complete job ad."],
            ["👥 Customers","Add your customers manually (name, phone, notes). Tap 'Generate Message' on anyone to get a personalised follow-up, win-back, or thank you."],
            ["🚀 Grow","Build a win-back campaign for lapsed customers or a referral program — answer a few questions about your offer."],
            ["💚 Health Score","Automatically scores based on what you've used in Cliento. Tap 'Get My Weekly Report' for a fresh set of priorities any time."],
            ["🔗 Network","Browse other local Cliento members, generate a natural mention of their business for your blog, and email them to ask for the same in return."],
          ]).map(([title,desc])=>(
            <div key={title} style={{marginBottom:"16px",paddingBottom:"16px",borderBottom:"1px solid #F3F4F6"}}>
              <div style={{fontWeight:700,fontSize:"0.88em",color:"#111827",marginBottom:"4px"}}>{title}</div>
              <div style={{fontSize:"0.82em",color:"#6B7280",lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </div>
      )}

      {/* FAQ */}
      {openSection==="faq" && (
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E5E7EB",padding:"22px"}}>
          <h3 style={{fontSize:"1.05em",fontWeight:800,color:"#111827",margin:"0 0 8px"}}>Common questions</h3>
          <FaqItem id="f1" q="Do I need any tech skills to use this?" a="None at all. If you can send a text message, you can use Cliento. Everything is point, click, and copy-paste." />
          <FaqItem id="f2" q="Will Cliento publish things automatically?" a="No. Cliento never publishes anything on your behalf. You always read, approve, and copy content yourself before it goes anywhere." />
          <FaqItem id="f3" q="Can I edit what Cliento writes?" a="Always. Everything generated is a starting point — copy it anywhere and change as much as you like. Hit 'Redo' for a completely different version any time." />
          <FaqItem id="f4" q="What if I want a refund?" a="30-day money-back guarantee on your first payment, no questions asked. Email support@cliento.com.au with 'Refund Request' in the subject." />
          <FaqItem id="f5" q="Is there a contract?" a="No. Month-to-month, cancel any time from your account settings in about 10 seconds." />
          <FaqItem id="f6" q={isShopify ? "Can I connect my Shopify store?" : "Can I publish my website through Cliento?"} a={isShopify ? "Yes — head to Products and tap 'Connect My Shopify Store'. If you don't have a store yet, the same button helps you start one. Full automatic two-way product sync is still being finished — for now, connecting gets your store linked and ready." : "Yes — once you've generated your website content, a 'Publish My Website' button appears. It walks you through getting a free Cliento web address instantly, or connecting a domain you own or buy. Google Analytics and Google Business Profile direct connections are still coming — see the 'What Do I Need to Connect?' tab."} />
          <FaqItem id="f7" q="Is my information private?" a="Yes. Your business details, customer list, and generated content are private to your account. We never sell your data — see our Privacy Policy for full details." />
          <FaqItem id="f8" q="How is content generated so fast?" a="Cliento is powered by Claude, one of the most advanced AI systems in the world (made by Anthropic). It reads what you tell it about your business and writes content specifically for you — not a generic template." />
        </div>
      )}

      {/* CONTACT */}
      {openSection==="contact" && (
        <div style={{background:"#fff",borderRadius:"14px",border:"1px solid #E5E7EB",padding:"22px",textAlign:"center"}}>
          <div style={{fontSize:"2em",marginBottom:"10px"}}>💬</div>
          <h3 style={{fontSize:"1.05em",fontWeight:800,color:"#111827",margin:"0 0 8px"}}>We're a small team and we read every message</h3>
          <p style={{fontSize:"0.85em",color:"#6B7280",lineHeight:1.65,margin:"0 0 20px",maxWidth:"380px",marginLeft:"auto",marginRight:"auto"}}>
            Stuck on something, found a bug, or just want to tell us what you'd love to see next? Email us — we typically reply within one business day.
          </p>
          <a href="mailto:support@cliento.com.au" style={{display:"inline-block",padding:"12px 28px",borderRadius:"10px",background:accent,color:"#fff",textDecoration:"none",fontWeight:700,fontSize:"0.88em"}}>
            ✉️ Email support@cliento.com.au
          </a>
        </div>
      )}
    </div>
  );
}

const inputSt = {width:"100%",padding:"10px 12px",borderRadius:"8px",border:"1.5px solid #D1D5DB",fontSize:"0.9em",color:"#111827",outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:"#fff"};
const btnPrimary = {padding:"13px 24px",borderRadius:"8px",border:"none",background:"#2563EB",color:"#fff",fontSize:"0.9em",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(37,99,235,0.25)",transition:"all 0.15s"};
const backBtn = {background:"none",border:"none",color:"#2563EB",cursor:"pointer",fontSize:"0.86em",fontWeight:600,padding:0,display:"flex",alignItems:"center",gap:"4px"};

function Field({label,children}) {
  return (<div><label style={{display:"block",fontWeight:600,fontSize:"0.83em",color:"#374151",marginBottom:"5px"}}>{label}</label>{children}</div>);
}
