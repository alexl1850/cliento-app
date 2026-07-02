import { useState, useEffect } from "react";
import { GrowPanel, HealthPanel, NetworkPanel, ProductTour, PublishWebsite, ConnectShopify, HelpCentre, inputSt, btnPrimary, backBtn, Field } from "./DashboardB.jsx";
import WebsiteEditor from "./WebsiteEditor.jsx";

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
  // DASHBOARD — Premium sidebar layout
  // ══════════════════════════════════════════════════════════════════════════
  const lapsed    = customers.filter(c=>c.tag==="lapsed"||daysSince(c.lastVisit)>60).length;
  const leads     = customers.filter(c=>c.tag==="lead").length;
  const needsFollowUp = customers.filter(c=>daysSince(c.lastVisit)>=30||c.tag==="lead").length;
  const isShopify = biz.bizType==="shopify";
  const accent    = isShopify ? "#7C3AED" : "#2563EB";
  const accentGlow= isShopify ? "rgba(124,58,237,0.3)" : "rgba(37,99,235,0.3)";

  // Health score for sidebar
  const healthDone = Object.keys(results).length;
  const healthScore = Math.min(100, healthDone * 12 + (customers.length > 0 ? 15 : 0));
  const healthColor = healthScore >= 70 ? "#16A34A" : healthScore >= 40 ? "#D97706" : "#DC2626";

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const dayName = new Date().toLocaleDateString("en-AU", {weekday:"long"});

  // Nav items
  const localNav = [
    {id:"marketing", icon:"📣", label:"Marketing",    badge:null},
    {id:"reviews",   icon:"⭐", label:"Reviews",       badge:null},
    {id:"business",  icon:"🏢", label:"Business",     badge:null},
    {id:"crm",       icon:"👥", label:"Customers",    badge:needsFollowUp>0?needsFollowUp:null},
    {id:"grow",      icon:"🚀", label:"Grow",          badge:null},
    {id:"health",    icon:"💚", label:"Health Score",  badge:null},
    {id:"network",   icon:"🔗", label:"Network",       badge:networkMembers.length},
    {id:"help",      icon:"❓", label:"Help",           badge:null},
  ];
  const shopifyNav = [
    {id:"products",    icon:"🛍️", label:"Products",    badge:null},
    {id:"sh_emails",   icon:"📧", label:"Emails",      badge:null},
    {id:"sh_social",   icon:"📱", label:"Social & Ads",badge:null},
    {id:"sh_reviews",  icon:"⭐", label:"Reviews",      badge:null},
    {id:"sh_seo",      icon:"🔍", label:"SEO",          badge:null},
    {id:"sh_analytics",icon:"📊", label:"Analytics",   badge:null},
    {id:"sh_growth",   icon:"🚀", label:"Growth",       badge:null},
    {id:"help",        icon:"❓", label:"Help",          badge:null},
  ];
  const navItems = isShopify ? shopifyNav : localNav;

  return (
    <div style={{
      display:"flex", minHeight:"100vh",
      fontFamily:"'Segoe UI',system-ui,sans-serif",
      background:"#0A0D14",
    }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div style={{
        width:"240px", flexShrink:0,
        background:"linear-gradient(180deg,#0D1117 0%,#111827 100%)",
        borderRight:"1px solid rgba(255,255,255,0.06)",
        display:"flex", flexDirection:"column",
        position:"sticky", top:0, height:"100vh", overflowY:"auto",
      }}>

        {/* Logo */}
        <div style={{padding:"24px 20px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontWeight:900,fontSize:"1.3em",letterSpacing:"-0.04em",color:"#fff",marginBottom:"2px"}}>
            <span style={{color:accent}}>⚡</span>Cliento
          </div>
          <div style={{fontSize:"0.7em",color:"rgba(255,255,255,0.3)",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.08em"}}>
            {isShopify ? "Online Store" : "Local Business"}
          </div>
        </div>

        {/* Business card */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{
            background:"rgba(255,255,255,0.05)",
            border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:"12px", padding:"14px 16px",
          }}>
            <div style={{
              width:"36px",height:"36px",borderRadius:"10px",
              background:`linear-gradient(135deg,${accent},${accent}88)`,
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"1.1em",marginBottom:"10px",
            }}>
              {isShopify ? "🛍️" : industry?.icon || "🏪"}
            </div>
            <div style={{fontWeight:800,fontSize:"0.9em",color:"#fff",marginBottom:"2px",lineHeight:1.2}}>
              {biz.name || "My Business"}
            </div>
            <div style={{fontSize:"0.72em",color:"rgba(255,255,255,0.4)",lineHeight:1.4}}>
              {biz.suburb || ""}
            </div>
          </div>
        </div>

        {/* Health score in sidebar */}
        <div style={{padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{fontSize:"0.64em",fontWeight:700,color:"rgba(255,255,255,0.3)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:"8px"}}>
            Health Score
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{fontSize:"1.8em",fontWeight:900,color:healthColor,letterSpacing:"-0.04em",lineHeight:1}}>
              {healthScore}
            </div>
            <div style={{flex:1}}>
              <div style={{background:"rgba(255,255,255,0.08)",borderRadius:"99px",height:"4px",overflow:"hidden"}}>
                <div style={{width:`${healthScore}%`,height:"100%",background:healthColor,borderRadius:"99px",transition:"width 0.8s ease"}}/>
              </div>
              <div style={{fontSize:"0.65em",color:"rgba(255,255,255,0.3)",marginTop:"4px",fontWeight:600}}>
                {healthScore >= 70 ? "Great work 💚" : healthScore >= 40 ? "Getting there 🟡" : "Let's get started 🔴"}
              </div>
            </div>
          </div>
        </div>

        {/* Savings in sidebar */}
        {totalSaved > 0 && (
          <div style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{
              background:"rgba(0,232,122,0.08)",
              border:"1px solid rgba(0,232,122,0.15)",
              borderRadius:"10px",padding:"10px 12px",
              display:"flex",alignItems:"center",gap:"8px",
            }}>
              <span style={{fontSize:"1em"}}>💰</span>
              <div>
                <div style={{fontSize:"0.72em",color:"rgba(255,255,255,0.3)",fontWeight:600}}>Saved vs agency</div>
                <div style={{fontSize:"0.9em",fontWeight:800,color:"#6EE7B7"}}>${totalSaved.toLocaleString()}</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav style={{flex:1,padding:"12px 12px",display:"flex",flexDirection:"column",gap:"2px"}}>
          {navItems.map(item=>{
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={()=>{setActiveTab(item.id);setActiveTool(null);setCrmView("list");}}
                style={{
                  display:"flex",alignItems:"center",gap:"10px",
                  padding:"10px 12px",borderRadius:"10px",border:"none",
                  background:active?`rgba(${isShopify?"124,58,237":"37,99,235"},0.15)`:"transparent",
                  color:active?"#fff":"rgba(255,255,255,0.45)",
                  cursor:"pointer",textAlign:"left",width:"100%",
                  transition:"all 0.12s",fontFamily:"inherit",
                  borderLeft:active?`3px solid ${accent}`:"3px solid transparent",
                }}
                onMouseEnter={e=>{if(!active)e.currentTarget.style.background="rgba(255,255,255,0.05)";}}
                onMouseLeave={e=>{if(!active)e.currentTarget.style.background="transparent";}}
              >
                <span style={{fontSize:"1em",width:"20px",textAlign:"center",flexShrink:0}}>{item.icon}</span>
                <span style={{fontSize:"0.85em",fontWeight:active?700:500,flex:1}}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    background:item.id==="network"?"#0D9488":C.red,
                    color:"#fff",borderRadius:"99px",
                    padding:"1px 7px",fontSize:"0.65em",fontWeight:800,
                    flexShrink:0,
                  }}>{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign out at bottom */}
        <div style={{padding:"16px 20px",borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {onSignOut && (
            <button onClick={onSignOut} style={{
              width:"100%",padding:"9px",borderRadius:"8px",
              background:"rgba(255,255,255,0.04)",
              border:"1px solid rgba(255,255,255,0.08)",
              color:"rgba(255,255,255,0.35)",fontSize:"0.78em",
              cursor:"pointer",fontFamily:"inherit",fontWeight:600,
            }}>
              Sign out
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,background:"#F7F8FA",overflowY:"auto"}}>

        {/* Top bar */}
        <div style={{
          background:"#fff",
          borderBottom:"1px solid #E5E7EB",
          padding:"0 28px",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          height:"60px",flexShrink:0,
          position:"sticky",top:0,zIndex:40,
        }}>
          <div>
            <div style={{fontWeight:800,fontSize:"1em",color:"#111827",letterSpacing:"-0.01em"}}>
              {greeting}, {biz.owner||"there"} 👋
            </div>
            <div style={{fontSize:"0.74em",color:"#9CA3AF",fontWeight:500}}>
              {dayName} · {navItems.find(n=>n.id===activeTab)?.label}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <button onClick={()=>{setShowTour(true);setTourStep(0);}} style={{
              background:"#F3F4F6",border:"1px solid #E5E7EB",
              color:"#6B7280",borderRadius:"8px",
              padding:"7px 12px",fontSize:"0.78em",cursor:"pointer",
              fontFamily:"inherit",fontWeight:600,
            }}>
              🎬 Tour
            </button>
          </div>
        </div>

        {/* Content area */}
        <div style={{flex:1,padding:"28px",maxWidth:"900px",width:"100%",margin:"0 auto",boxSizing:"border-box"}}>

          {showTour && (
            <ProductTour
              step={tourStep} setStep={setTourStep}
              onClose={()=>setShowTour(false)}
              isShopify={biz.bizType==="shopify"}
              ownerName={biz.owner}
            />
          )}


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
                width:"100%",marginBottom:"10px",padding:"16px 18px",borderRadius:"12px",border:"none",cursor:"pointer",textAlign:"left",
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
            {profile?.live_url && (
              <button onClick={()=>setActiveTool("edit-website")} style={{
                width:"100%",marginBottom:"16px",padding:"16px 18px",borderRadius:"12px",border:"none",cursor:"pointer",textAlign:"left",
                background:"linear-gradient(135deg,#1A2E05 0%,#166534 100%)",
                display:"flex",alignItems:"center",gap:"14px",
              }}>
                <div style={{fontSize:"1.8em"}}>✏️</div>
                <div style={{flex:1}}>
                  <div style={{color:"#fff",fontWeight:800,fontSize:"0.95em",marginBottom:"2px"}}>Edit My Website</div>
                  <div style={{color:"rgba(255,255,255,0.55)",fontSize:"0.78em"}}>Describe what you want changed — AI updates and redeploys in ~30 seconds</div>
                </div>
                <div style={{color:"#6EE7B7",fontSize:"1.2em"}}>→</div>
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

        {activeTab==="marketing" && activeTool==="edit-website" && (
          <WebsiteEditor biz={biz} liveUrl={profile?.live_url} onBack={()=>setActiveTool(null)}/>
        )}

        {activeTab==="marketing" && activeTool && activeTool!=="publish" && activeTool!=="edit-website" && (
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
          {activeTab==="products" && biz.bizType==="shopify" && (
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
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={()=>{setEditCustomer({...c});setCrmView("add");}} style={{padding:"7px 14px",borderRadius:"7px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:"0.78em",fontWeight:600}}>✏️ Edit</button>
              <button onClick={()=>{
                if(window.confirm(`Remove ${c.name} from your customer list?`)){
                  setCustomers(cs=>cs.filter(x=>x.id!==c.id));
                  setCrmView("list");
                  setActiveCustomer(null);
                }
              }} style={{padding:"7px 14px",borderRadius:"7px",border:`1px solid #FECACA`,background:"#FEF2F2",color:"#DC2626",cursor:"pointer",fontSize:"0.78em",fontWeight:600}}>
                🗑️ Delete
              </button>
            </div>
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
              const res = await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
                system:`You are an ecommerce SEO expert. Find low-competition blog post topics for online stores. Return ONLY valid JSON arrays — no other text, no markdown, no code fences.`,
                user:`Find 5 blog post keyword ideas for this Shopify store: ${biz.name||"this online store"} — ${biz.description||"sells products online"}\n${extra.topicHint?`Topic hint: ${extra.topicHint}`:""}\n\nReturn ONLY JSON, no other text:\n[{"keyword":"best soy candles for gifts","title":"The Best Soy Candles for Gifting in 2026 (and How to Choose the Perfect One)","why":"High buyer intent, moderate volume, easy to rank for a small store"},...]`,
                max_tokens:800,
              })});
              const d = await res.json();
              if(d.error) throw new Error(d.error);
              const cleaned = d.text.replace(/```json|```/g,"").trim();
              set("keywordOptions",JSON.parse(cleaned));
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:"12px",marginBottom:"12px"}}>
      {group.tools.map(tool=>{
        const done = !!results[tool.id];
        return (
          <button
            key={tool.id}
            onClick={()=>onSelect(tool.id)}
            style={{
              padding:"22px 20px",borderRadius:"14px",textAlign:"left",
              border:`1.5px solid ${done?"#BBF7D0":C.border}`,
              background:done?"#F0FDF4":"#fff",
              cursor:"pointer",
              boxShadow:done?"0 2px 12px rgba(22,163,74,0.08)":"0 2px 8px rgba(0,0,0,0.04)",
              transition:"all 0.15s",
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow=done?"0 6px 20px rgba(22,163,74,0.12)":"0 6px 20px rgba(0,0,0,0.09)";
              e.currentTarget.style.borderColor=done?"#86EFAC":ac;
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow=done?"0 2px 12px rgba(22,163,74,0.08)":"0 2px 8px rgba(0,0,0,0.04)";
              e.currentTarget.style.borderColor=done?"#BBF7D0":C.border;
            }}
          >
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"12px"}}>
              <div style={{
                width:"44px",height:"44px",borderRadius:"12px",
                background:done?"rgba(22,163,74,0.1)":`${ac}12`,
                border:`1px solid ${done?"#BBF7D0":`${ac}25`}`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:"1.4em",flexShrink:0,
              }}>
                {tool.icon}
              </div>
              {done
                ? <span style={{fontSize:"0.65em",background:"#16A34A",color:"#fff",padding:"3px 8px",borderRadius:"99px",fontWeight:800}}>✓ Done</span>
                : <span style={{fontSize:"0.65em",background:`${ac}15`,color:ac,padding:"3px 8px",borderRadius:"99px",fontWeight:700,border:`1px solid ${ac}25`}}>Generate →</span>
              }
            </div>
            <div style={{fontWeight:800,fontSize:"0.92em",color:C.text,marginBottom:"5px",letterSpacing:"-0.01em"}}>{tool.label}</div>
            <div style={{fontSize:"0.78em",color:C.muted,lineHeight:1.55}}>{tool.desc}</div>
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
              <div style={{display:"flex",gap:"7px",flexWrap:"wrap",marginBottom:"8px"}}>
                <button onClick={copy} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid ${C.brand}`,background:copied?C.green:C.brandLt,color:copied?"#fff":C.brand,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s",minWidth:"90px"}}>
                  {copied?"✓ Copied!":"📋 Copy"}
                </button>
                {["emails","sh_abandoned_cart","sh_post_purchase","sh_winback","sh_product_launch","sh_flash_sale","sh_review_request"].includes(toolId) && (
                  <>
                    <button onClick={()=>{
                      const subjectMatch = output.match(/(?:Subject(?:\s*Line)?(?:\s*Options?)?:?\s*(?:\n|$)|1\.\s*)([^\n]+)/i);
                      const subject = subjectMatch ? subjectMatch[1].trim().replace(/^["']|["']$/g,"") : "Message from "+biz.name;
                      const body = output.replace(/^#+\s*/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").trim().substring(0,1800);
                      window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,"_blank");
                    }} style={{flex:1,padding:"11px",borderRadius:"8px",border:"2px solid #FECACA",background:"#FFF5F5",color:"#EA4335",fontWeight:700,cursor:"pointer",fontSize:"0.85em",minWidth:"90px",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
                      ✉️ Gmail
                    </button>
                    <button onClick={()=>{
                      const subjectMatch = output.match(/(?:Subject(?:\s*Line)?(?:\s*Options?)?:?\s*(?:\n|$)|1\.\s*)([^\n]+)/i);
                      const subject = subjectMatch ? subjectMatch[1].trim().replace(/^["']|["']$/g,"") : "Message from "+biz.name;
                      const body = output.replace(/^#+\s*/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").replace(/\*([^*]+)\*/g,"$1").trim().substring(0,1800);
                      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid #BFDBFE`,background:C.brandLt,color:C.brand,fontWeight:700,cursor:"pointer",fontSize:"0.85em",minWidth:"90px",display:"flex",alignItems:"center",justifyContent:"center",gap:"5px"}}>
                      📨 Mail app
                    </button>
                  </>
                )}
                <button onClick={()=>setPhase("form")} style={{padding:"11px 14px",borderRadius:"8px",border:`1px solid ${C.border}`,background:"#fff",color:C.muted,cursor:"pointer",fontSize:"0.85em"}}>🔄 Redo</button>
                <button onClick={()=>onSave(toolId,output)} style={{padding:"11px 14px",borderRadius:"8px",border:"none",background:C.green,color:"#fff",cursor:"pointer",fontSize:"0.85em",fontWeight:600}}>✓ Save</button>
              </div>

              {/* Blog-specific: Publish to Website button */}
              {(toolId==="blog"||toolId==="sh_blog") && <BlogPublishButton output={output} biz={biz} extra={extra}/>}

              {["emails","sh_abandoned_cart","sh_post_purchase","sh_winback","sh_product_launch","sh_flash_sale","sh_review_request"].includes(toolId) && (
                <div style={{fontSize:"0.75em",color:C.muted,lineHeight:1.5}}>
                  💡 Gmail and Mail app open with the email pre-filled — just add your customer list and hit send.
                </div>
              )}
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
              const bizName = biz.name || "My Business";
              const bizSuburb = biz.suburb || "Australia";
              const bizType = industry?.label || biz.industry || "local business";
              try {
                const res = await fetch("/api/generate", {
                  method:"POST", headers:{"Content-Type":"application/json"},
                  body: JSON.stringify({
                    system:`You are a local SEO expert for Australian small businesses. You know which long-tail keywords are low competition and easy for a local business to rank for on Google. Return ONLY valid JSON arrays — no other text, no markdown, no code fences.`,
                    user:`Generate 5 blog post keyword ideas for a ${bizType} business called "${bizName}" located in ${bizSuburb}, Australia.

${extra.topicHint ? `The owner suggested this area of interest: "${extra.topicHint}"` : "Find the best opportunities based on the business type and location."}

Rules for good local SEO keywords:
- Long-tail (4-8 words), very specific
- Include ${bizSuburb} or a nearby suburb naturally
- Question-based or "how to" or "best [X] in [suburb]" format
- Low competition — a local business can realistically rank for these in 30-90 days
- High intent — people searching these are likely to become customers

Return ONLY a JSON array of 5 objects, no other text:
[{"keyword":"best family cafe in ${bizSuburb.toLowerCase()}","title":"Best Family-Friendly Cafés in ${bizSuburb} — A Local's Guide","why":"Parents searching for kid-friendly spots — high intent, low competition"},...]`,
                    max_tokens: 800,
                  })
                });
                const d = await res.json();
                if (d.error) throw new Error(d.error);
                const cleaned = d.text.replace(/```json|```/g,"").trim();
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
// BLOG PUBLISH BUTTON — publishes blog post to customer's live website
// ═════════════════════════════════════════════════════════════════════════════
function BlogPublishButton({ output, biz, extra }) {
  const [phase, setPhase] = useState("idle"); // idle | publishing | done | error
  const [liveUrl, setLiveUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);

  // Extract title from the blog post output
  const extractTitle = (text) => {
    const h1Match = text.match(/^#\s+(.+)$/m);
    if (h1Match) return h1Match[1].trim();
    const firstLine = text.split('\n').find(l => l.trim().length > 10);
    return firstLine?.replace(/^#+\s*/, '').trim() || "New Blog Post";
  };

  // Extract meta from the SEO METADATA section if present
  const extractMeta = (text) => {
    const metaTitle = text.match(/Meta title[:\s]+(.+)/i)?.[1]?.trim() || "";
    const metaDesc  = text.match(/Meta description[:\s]+(.+)/i)?.[1]?.trim() || "";
    return { metaTitle, metaDesc };
  };

  const publish = async () => {
    setPhase("publishing");
    setErrorMsg("");

    const storedProfile = biz;
    const homepageUrl = storedProfile?.live_url || null;

    // Get existing posts from localStorage
    const existingPosts = JSON.parse(localStorage.getItem(`blog_posts_${biz?.name}`) || "[]");

    const { metaTitle, metaDesc } = extractMeta(output);
    const title = extractTitle(output);

    try {
      const res = await fetch("/api/publish-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post: {
            title,
            content: output,
            meta_title: metaTitle || title,
            meta_desc: metaDesc,
          },
          biz,
          palette: storedProfile?.palette || "slate",
          existingPosts,
          homepageUrl,
        }),
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);

      setLiveUrl(d.postUrl);
      setPhase("done");

      // Save to localStorage for next publish
      const updated = [d.post, ...existingPosts].slice(0, 10);
      localStorage.setItem(`blog_posts_${biz?.name}`, JSON.stringify(updated));

    } catch(e) {
      setErrorMsg(e.message || "Something went wrong — please try again.");
      setPhase("error");
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(liveUrl).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  };

  if (phase === "idle" || phase === "error") return (
    <div style={{marginTop:"10px"}}>
      {phase === "error" && (
        <div style={{background:C.redLt,border:`1px solid #FECACA`,borderRadius:"8px",padding:"10px 12px",fontSize:"0.82em",color:"#991B1B",marginBottom:"8px"}}>
          ⚠️ {errorMsg}
        </div>
      )}
      <button onClick={publish} style={{
        width:"100%",padding:"13px",borderRadius:"10px",border:"none",
        background:"linear-gradient(135deg,#0D1117,#1E3A5F)",
        color:"#fff",fontWeight:800,fontSize:"0.9em",cursor:"pointer",
        display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
        fontFamily:"inherit",transition:"all 0.2s",
      }}>
        🌐 Publish to My Website →
      </button>
      <div style={{fontSize:"0.72em",color:C.muted,textAlign:"center",marginTop:"6px"}}>
        Creates a live blog post page and adds it to your website's homepage
      </div>
    </div>
  );

  if (phase === "publishing") return (
    <div style={{marginTop:"10px",background:"linear-gradient(135deg,#0D1117,#1E3A5F)",borderRadius:"10px",padding:"16px",textAlign:"center"}}>
      <div style={{fontSize:"1.4em",marginBottom:"8px"}}>🔨</div>
      <div style={{fontWeight:700,fontSize:"0.9em",color:"#fff",marginBottom:"4px"}}>Publishing your blog post...</div>
      <div style={{fontSize:"0.76em",color:"rgba(255,255,255,0.5)"}}>Creating the page · Adding to your homepage · About 30 seconds</div>
    </div>
  );

  if (phase === "done") return (
    <div style={{marginTop:"10px",background:C.greenLt,border:`1.5px solid #BBF7D0`,borderRadius:"10px",padding:"14px"}}>
      <div style={{fontWeight:800,color:C.green,marginBottom:"6px",fontSize:"0.9em"}}>✅ Blog post is live!</div>
      <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:"0.82em",color:C.green,fontWeight:700,wordBreak:"break-all",display:"block",marginBottom:"10px"}}>
        🌐 {liveUrl}
      </a>
      <div style={{display:"flex",gap:"8px"}}>
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"10px",borderRadius:"8px",background:C.green,color:"#fff",fontWeight:700,fontSize:"0.84em",textAlign:"center",textDecoration:"none",display:"block"}}>
          Open Post
        </a>
        <button onClick={copyUrl} style={{flex:1,padding:"10px",borderRadius:"8px",border:`1.5px solid ${C.border}`,background:"#fff",color:copied?C.green:C.muted,fontWeight:600,fontSize:"0.84em",cursor:"pointer",fontFamily:"inherit"}}>
          {copied ? "✓ Copied!" : "📋 Copy Link"}
        </button>
      </div>
      <div style={{fontSize:"0.72em",color:C.muted,marginTop:"8px",lineHeight:1.5}}>
        💡 Your homepage has been updated with this post in the "Latest from our blog" section.
      </div>
    </div>
  );

  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
async function generateContent(toolId,biz,extra,industry) {
  // Full business context — used in every prompt so AI never needs to ask for details
  const ctx = [
    `Business name: ${biz.name}`,
    `Owner: ${biz.owner || "the owner"}`,
    `Type: ${industry?.label || biz.industry || "local business"}`,
    `Location: ${biz.suburb}`,
    `Phone: ${biz.phone || extra.phone || "[phone number]"}`,
    `Email: ${biz.email || extra.email || "[email address]"}`,
    `Website: ${biz.website || extra.website || ""}`,
    `What they do: ${biz.description}`,
    biz.menu ? `Menu / key products / services: ${biz.menu}` : "",
    biz.goal ? `Goal: ${biz.goal}` : "",
  ].filter(Boolean).join(" | ");

  const prompts = {
    website:{system:`Professional copywriter for local Australian small businesses. Warm, genuine, no jargon.`,user:`Create complete website content for this business.\n${ctx}\nPhone: ${extra.phone||"[phone]"} | Hours: ${extra.hours||"[hours]"} | Address: ${extra.address||biz.suburb} | Notes: ${extra.special||"none"}\n\nWrite: ## HOME PAGE ## ABOUT US ## WHAT WE OFFER ## WHY CHOOSE US ## OPENING HOURS & LOCATION ## CONTACT\n\nWarm, local, real. No corporate-speak.`},
    posts:{system:`Social media writer for local Australian businesses. Genuine, not salesy, occasional emojis. Always sounds like the actual business owner wrote it.`,user:`Write 7 social media posts for ${biz.name}.\n\n${ctx}\n\nTone: ${extra.tone||"Friendly and warm"}\nThis week's focus: ${extra.promo||"Regular business — showcase what makes us great"}\n\nWrite POST 1 through POST 7. Mix of: welcome/intro, feature a specific product or dish, behind-the-scenes, helpful tip, promotion or offer, community/local connection, CTA wrap-up.\n\n${biz.menu ? `Reference specific items from our menu/products where relevant: ${biz.menu}` : ""}\n\nEach post: hook line that stops scrolling, 3-6 sentences, clear CTA, 3-5 local hashtags including #${(biz.suburb||"").replace(/\s+/g,"").toLowerCase()}. Sound human — like a real person, not a brand.`},
    emails:{system:`You write customer emails for Australian local businesses. Warm, personal, genuine — sounds like the owner wrote it themselves, not a marketing department. Australian spelling throughout.`,user:`Write a customer email for ${biz.name}.\n\n${ctx}\n\nEmail purpose: ${extra.purpose||"General customer update or promotion"}\nExtra details: ${extra.details||"none"}\n\nWrite the complete email package:\n\nSUBJECT LINE OPTIONS (3 — different angles: curiosity, benefit, personal)\n1.\n2.\n3.\n\nPREVIEW TEXT (under 100 chars — what shows after the subject line):\n\nEMAIL BODY:\n[Open warmly and personally — from ${biz.owner||"the owner"} at ${biz.name}. Get to the point quickly. One clear call to action. Sign off personally. Under 200 words. Sound like a real person, not a newsletter.]\n\nPOSTSCRIPT:\n[Optional PS that adds a personal touch or creates urgency]\n\nFor the call to action, use: ${biz.phone ? `Call ${biz.phone}` : biz.website ? `Visit ${biz.website}` : "contact us directly"}`},
    ads:{system:`Ad copywriter for Australian local businesses. Direct, benefit-focused, locally specific. Never use placeholder text — always use the actual business name and suburb provided.`,user:`Write 3 ad variations for ${biz.name||"this business"} in ${biz.suburb||"Australia"}.\n\n${ctx}\n\nPromoting: ${extra.offer||"the business generally"}\nTarget audience: ${extra.audience||`locals in and around ${biz.suburb||"the area"}`}\nCall to action: ${extra.cta||biz.phone?"Call "+biz.phone:"Contact us"}\n\nFor each variation:\nAD VERSION [X]:\nHEADLINE 1 (max 30 chars):\nHEADLINE 2 (max 30 chars):\nHEADLINE 3 (max 30 chars):\nDESCRIPTION (max 90 chars):\nFACEBOOK CAPTION (2-3 sentences, warm and specific):\n\nVersion 1: lead with the main benefit\nVersion 2: create urgency\nVersion 3: use social proof or local credibility\n\nUse ${biz.name||"the business name"} and ${biz.suburb||"the suburb"} naturally throughout.`},
    promo:{system:`Promotional campaign creator for local Australian businesses. Practical and complete.`,user:`Create a full promotion pack for ${biz.name}.\n${ctx}\nOffer: ${extra.offerType||"special promo"} | Details: ${extra.promoDetail||"none"}\n\nWrite: ## THE OFFER ## 5 HEADLINE OPTIONS ## FACEBOOK POST ## IN-STORE SIGNAGE ## SMS (under 160 chars) ## HOW TO RUN IT (5 steps) ## WHEN TO END IT`},
    gbp:{system:`You are a Google Business Profile post writer for Australian local businesses. You write posts that are concise, locally relevant, genuine, and optimised for local SEO. You ALWAYS use the actual business name and suburb provided — never use placeholders. Write like the owner posted it themselves.`,user:`Write 3 Google Business Profile posts for ${biz.name||"this business"} in ${biz.suburb||"their area"}.

${ctx}

Post type: ${extra.gbpType||"What's New"}
Focus: ${extra.gbpFocus||"showcase what makes us great and invite locals to visit"}
${biz.menu ? `Feature these items where relevant: ${biz.menu}` : ""}

Write POST OPTION 1, POST OPTION 2, and POST OPTION 3.

Each post:
- 150-200 words
- Mentions "${biz.suburb||"the local area"}" naturally at least once
- Mentions "${biz.name||"the business"}" by name
- Clear call to action (call ${biz.phone||"us"}, visit, or book)
- Ends with 3-4 relevant local hashtags
- Sounds like a real person wrote it — warm and genuine, not corporate

Vary the angle: POST 1 should announce or showcase something specific, POST 2 should build trust (years in business, a customer win, what makes them different), POST 3 should create urgency or a reason to visit now.`},
    blog:{system:`You are a local SEO content writer for Australian small businesses. You write blog posts that genuinely help readers AND rank on Google. Natural, friendly, specific to the local area. Proper H1/H2/H3 structure. No fluff.\n\nCRITICAL RULE: You MUST use the actual business name and suburb provided. NEVER write [Business Name], [Suburb], or any placeholder text. If you have been given a business name and suburb, use them exactly. The business name and suburb are non-negotiable — they must appear in the post.`,user:`Write a full SEO-optimised blog post for ${biz.name||"this local business"}, a ${industry?.label||biz.industry||"local business"} in ${biz.suburb||"their area"}, Australia.

BUSINESS DETAILS — use these throughout the post:
Business name: ${biz.name||"this business"} (use this exact name — do NOT replace with a placeholder)
Suburb: ${biz.suburb||"local area"} (use this exact suburb — do NOT replace with a placeholder)
Owner: ${biz.owner||"the owner"}
What they do: ${biz.description||"local services"}
${biz.menu ? `Menu / key products: ${biz.menu}` : ""}
Phone: ${biz.phone||""}
Website: ${biz.website||""}

Target keyword: "${extra.chosenKeyword?.keyword||`${industry?.label||"local business"} ${biz.suburb||"near me"}`}"
Blog post title: "${extra.chosenKeyword?.title||`Your Guide to the Best ${industry?.label||"Local Services"} in ${biz.suburb||"Your Area"}`}"

BLOG POST REQUIREMENTS:
- Length: 800–1,000 words
- Structure: H1 title at top, H2 subheadings for each section
- Use the target keyword naturally 4–6 times (not stuffed)
- Mention ${biz.suburb||"the local area"} and nearby suburbs at least 3–4 times
- Include genuinely useful information a local reader would value
- Warm, helpful, local voice — not corporate
- End with a clear call to action mentioning ${biz.name||"the business"} by name with a prompt to call or visit
- NEVER use placeholder text like [Business Name] or [Suburb] — use the actual names above

ALSO INCLUDE at the very end:
## SEO METADATA
Meta title (under 60 chars):
Meta description (under 155 chars):
Primary keyword:
Secondary keywords (3–4):
Suggested URL slug:
Image suggestion (describe the ideal hero photo):

Write the complete blog post now. Use real names throughout.`},
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
