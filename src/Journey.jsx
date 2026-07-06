import { useState } from "react";
import WebsiteIntake from "./WebsiteIntake.jsx";
import { authHeaders } from "./supabase.js";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  black:"#07090E", dark:"#0D1117", dark2:"#161B27",
  brand:"#2563EB", brandLt:"#EFF6FF",
  green:"#16A34A", greenLt:"#F0FDF4",
  amber:"#D97706", amberLt:"#FFFBEB",
  red:"#DC2626",   redLt:"#FEF2F2",
  purple:"#7C3AED",purpleLt:"#F5F3FF",
  teal:"#0D9488",  tealLt:"#F0FDFA",
  border:"#E5E7EB", text:"#111827", muted:"#6B7280", light:"#F8F9FA",
};

const ff = "'Inter', system-ui, sans-serif";

// ─── Shared styles ────────────────────────────────────────────────────────────
const inp = {
  width:"100%", padding:"16px 18px", borderRadius:"12px",
  border:`2px solid ${C.border}`, fontSize:"1em", color:C.text,
  outline:"none", boxSizing:"border-box", fontFamily:ff,
  background:"#fff", transition:"border-color 0.15s",
};
const btnPrimary = (color=C.brand) => ({
  width:"100%", padding:"18px", borderRadius:"12px", border:"none",
  background:color, color:"#fff", fontSize:"1.05em", fontWeight:800,
  cursor:"pointer", letterSpacing:"-0.01em",
  boxShadow:`0 4px 20px ${color}44`, transition:"all 0.2s",
  fontFamily:ff,
});
const btnSecondary = {
  width:"100%", padding:"16px", borderRadius:"12px",
  border:`2px solid ${C.border}`, background:"#fff",
  color:C.muted, fontSize:"0.95em", fontWeight:600,
  cursor:"pointer", fontFamily:ff,
};

// ─── Anthropic API call via serverless function ───────────────────────────────
async function callClaude(system, user, maxTokens=1000) {
  const res = await fetch("/api/generate", {
    method:"POST",
    headers:{"Content-Type":"application/json",...(await authHeaders())},
    body: JSON.stringify({ system, user, max_tokens: maxTokens })
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text;
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function Progress({ step, total=6 }) {
  const steps = [
    "Your Website","Tell Everyone","Email Your Customers",
    "Get Found on Google","Google Reviews","You're All Set"
  ];
  return (
    <div style={{padding:"0 0 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:"8px"}}>
        {steps.map((s,i)=>(
          <div key={i} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center",
            gap:"4px", opacity:i>step?0.35:1,
          }}>
            <div style={{
              width:"28px", height:"28px", borderRadius:"50%",
              background:i<step?C.green:i===step?C.brand:C.border,
              color:"#fff", fontWeight:800, fontSize:"0.72em",
              display:"flex", alignItems:"center", justifyContent:"center",
              flexShrink:0, transition:"all 0.3s",
            }}>
              {i<step?"✓":i+1}
            </div>
            <div style={{
              fontSize:"0.58em", fontWeight:600, textAlign:"center",
              color:i===step?C.brand:i<step?C.green:C.muted,
              display:"none", // hide labels on mobile, shown via step title
            }}>{s}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.border,borderRadius:"99px",height:"4px",overflow:"hidden"}}>
        <div style={{
          width:`${(step/total)*100}%`, height:"100%",
          background:`linear-gradient(90deg,${C.brand},${C.green})`,
          borderRadius:"99px", transition:"width 0.4s ease",
        }}/>
      </div>
      <div style={{fontSize:"0.75em",color:C.muted,marginTop:"6px",textAlign:"right"}}>
        Step {step+1} of {total}
      </div>
    </div>
  );
}

// ─── Wrapper layout ───────────────────────────────────────────────────────────
function Screen({ children, step }) {
  return (
    <div style={{
      minHeight:"100vh", background:C.light, fontFamily:ff,
      display:"flex", flexDirection:"column", alignItems:"center",
      padding:"0 16px 40px",
    }}>
      {/* Nav */}
      <div style={{
        width:"100%", maxWidth:"680px",
        padding:"18px 0 0",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:"32px",
      }}>
        <div style={{fontWeight:900,fontSize:"1.2em",letterSpacing:"-0.03em"}}>
          <span style={{color:C.brand}}>⚡</span>Akus<span style={{color:C.amber}}>.</span>
        </div>
        <div style={{fontSize:"0.75em",color:C.muted,fontWeight:600}}>
          Getting your business set up 🇦🇺
        </div>
      </div>

      {/* Content */}
      <div style={{width:"100%",maxWidth:"680px"}}>
        {step !== undefined && <Progress step={step}/>}
        {children}
      </div>
    </div>
  );
}

// ─── Card container ───────────────────────────────────────────────────────────
function Card({ children, accent }) {
  return (
    <div style={{
      background:"#fff", borderRadius:"20px",
      border:`1.5px solid ${accent||C.border}`,
      padding:"32px",
      boxShadow:accent?`0 0 0 4px ${accent}12,0 8px 32px rgba(0,0,0,0.06)`:"0 4px 24px rgba(0,0,0,0.07)",
    }}>
      {children}
    </div>
  );
}

// ─── Big heading ──────────────────────────────────────────────────────────────
function Heading({ emoji, title, sub }) {
  return (
    <div style={{marginBottom:"28px"}}>
      {emoji && <div style={{fontSize:"2.8em",marginBottom:"12px"}}>{emoji}</div>}
      <h1 style={{fontSize:"clamp(1.6em,4vw,2.2em)",fontWeight:900,color:C.text,margin:"0 0 10px",letterSpacing:"-0.03em",lineHeight:1.2}}>
        {title}
      </h1>
      {sub && <p style={{fontSize:"1em",color:C.muted,lineHeight:1.7,margin:0}}>{sub}</p>}
    </div>
  );
}

// ─── Result box ──────────────────────────────────────────────────────────────
function ResultBox({ content, onCopy, copied, emailSubject, isEmail }) {

  // Extract first subject line from content if it's an email (looks for "1." or "Subject:")
  const extractSubject = () => {
    if (emailSubject) return emailSubject;
    const subjectMatch = content.match(/(?:Subject:|1\.\s*)([^\n]+)/i);
    return subjectMatch ? subjectMatch[1].trim().replace(/^["']|["']$/g,"") : "Message from Akus";
  };

  // Build mailto body — strip markdown headers, keep it clean for email clients
  const buildMailtoBody = () => {
    return content
      .replace(/^#+\s*/gm, "")           // remove markdown headers
      .replace(/\*\*([^*]+)\*\*/g, "$1") // remove bold
      .replace(/\*([^*]+)\*/g, "$1")     // remove italic
      .trim();
  };

  const openGmail = () => {
    const subject = encodeURIComponent(extractSubject());
    const body = encodeURIComponent(buildMailtoBody().substring(0, 1800)); // Gmail URL limit
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank");
  };

  const openMailto = () => {
    const subject = encodeURIComponent(extractSubject());
    const body = encodeURIComponent(buildMailtoBody().substring(0, 1800));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div style={{marginTop:"16px"}}>
      <div style={{
        background:C.greenLt, border:"1px solid #BBF7D0", borderRadius:"12px",
        padding:"18px", fontSize:"0.88em", color:C.text, lineHeight:1.8,
        whiteSpace:"pre-wrap", maxHeight:"320px", overflowY:"auto",
        marginBottom:"12px",
      }}>
        {content}
      </div>
      <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
        <button onClick={onCopy} style={{
          flex:1, ...btnSecondary,
          color:copied?C.green:C.muted,
          borderColor:copied?"#BBF7D0":C.border,
          background:copied?C.greenLt:"#fff",
          minWidth:"120px",
        }}>
          {copied?"✓ Copied!":"📋 Copy"}
        </button>
        {isEmail && (
          <>
            <button onClick={openGmail} style={{
              flex:1, ...btnSecondary,
              color:"#EA4335", borderColor:"#FECACA",
              background:"#FFF5F5", minWidth:"120px",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
            }}>
              <span style={{fontSize:"1em"}}>✉️</span> Open in Gmail
            </button>
            <button onClick={openMailto} style={{
              flex:1, ...btnSecondary,
              color:C.brand, borderColor:"#BFDBFE",
              background:C.brandLt, minWidth:"120px",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"6px",
            }}>
              <span style={{fontSize:"1em"}}>📨</span> Open in Mail app
            </button>
          </>
        )}
      </div>
      {isEmail && (
        <div style={{fontSize:"0.74em",color:C.muted,marginTop:"8px",lineHeight:1.5}}>
          💡 Gmail and Mail app buttons open with the email pre-filled — just add your customer list and hit send.
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 0 — Welcome + business type
// ═════════════════════════════════════════════════════════════════════════════
function Step0_Welcome({ onNext }) {
  const [bizType, setBizType] = useState("");
  const [name, setName] = useState("");

  return (
    <Screen>
      <Card>
        <Heading
          emoji="👋"
          title="Welcome to Akus. Let's get your business sorted."
          sub="This will take about 5–10 minutes. By the end, you'll have done more marketing than most businesses do in a month. Let's start with the basics."
        />
        <div style={{display:"flex",flexDirection:"column",gap:"12px",marginBottom:"24px"}}>
          <label style={{fontWeight:700,fontSize:"0.85em",color:C.muted}}>Your first name</label>
          <input
            value={name} onChange={e=>setName(e.target.value)}
            placeholder="e.g. Sandra"
            style={inp}
          />
        </div>
        <div style={{marginBottom:"28px"}}>
          <label style={{fontWeight:700,fontSize:"0.85em",color:C.muted,display:"block",marginBottom:"12px"}}>
            What kind of business do you have?
          </label>
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {[
              {id:"local", icon:"🏪", title:"Local Business", desc:"Café, salon, tradie, gym, retail shop, health clinic — customers come to you or you go to them"},
              {id:"shopify", icon:"🛍️", title:"Online Store", desc:"You sell products online through Shopify or another platform"},
            ].map(opt=>(
              <button key={opt.id} onClick={()=>setBizType(opt.id)} style={{
                padding:"18px", borderRadius:"12px", textAlign:"left", cursor:"pointer",
                border:`2px solid ${bizType===opt.id?C.brand:C.border}`,
                background:bizType===opt.id?C.brandLt:"#fff",
                transition:"all 0.15s",
              }}>
                <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
                  <span style={{fontSize:"1.6em"}}>{opt.icon}</span>
                  <div>
                    <div style={{fontWeight:800,fontSize:"0.95em",color:bizType===opt.id?C.brand:C.text,marginBottom:"2px"}}>{opt.title}</div>
                    <div style={{fontSize:"0.8em",color:C.muted,lineHeight:1.4}}>{opt.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={()=>onNext({bizType, name})}
          disabled={!bizType||!name}
          style={{...btnPrimary(C.brand), opacity:bizType&&name?1:0.4}}
        >
          Let's get started, {name||"there"} →
        </button>
      </Card>
    </Screen>
  );
}
// ═════════════════════════════════════════════════════════════════════════════
// STEP 1 — Website builder (15-question intake + deploy)
// ═════════════════════════════════════════════════════════════════════════════
function Step1_Website({ data, session, onNext }) {
  const [phase, setPhase] = useState("intake"); // intake | building | done
  const [liveUrl, setLiveUrl] = useState("");
  const [error, setError] = useState("");

  const handleIntakeComplete = async (intake) => {
    setPhase("building");
    setError("");
    try {
      const res = await fetch("/api/build-website", {
        method:"POST",
        headers:{"Content-Type":"application/json",...(await authHeaders())},
        body: JSON.stringify({ intake })
      });
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setLiveUrl(d.url);
      setPhase("done");
    } catch(e) {
      setError(e.message || "Something went wrong — please try again.");
      setPhase("intake");
    }
  };

  if (phase==="intake") return (
    <WebsiteIntake
      data={data}
      session={session}
      onComplete={handleIntakeComplete}
    />
  );

  if (phase==="building") return (
    <Screen step={0}>
      <Card accent={C.brand}>
        <div style={{textAlign:"center",padding:"40px 20px"}}>
          <div style={{fontSize:"3em",marginBottom:"16px"}}>🔨</div>
          <h2 style={{fontSize:"1.4em",fontWeight:900,color:C.text,marginBottom:"10px",letterSpacing:"-0.02em"}}>
            Building your website...
          </h2>
          <p style={{fontSize:"0.9em",color:C.muted,lineHeight:1.7,marginBottom:"28px",maxWidth:"400px",margin:"0 auto 28px"}}>
            We're designing your site, writing all the copy, and publishing it live right now. This takes about 30–60 seconds.
          </p>
          <div style={{background:C.light,borderRadius:"99px",height:"6px",overflow:"hidden",maxWidth:"320px",margin:"0 auto"}}>
            <div style={{
              height:"100%",
              background:`linear-gradient(90deg,${C.brand},${C.green})`,
              borderRadius:"99px",
              animation:"shimmer 1.5s ease-in-out infinite",
            }}/>
          </div>
          <style>{`@keyframes shimmer{0%{width:0%}50%{width:70%}100%{width:95%}}`}</style>
          <p style={{fontSize:"0.78em",color:C.muted,marginTop:"16px"}}>Generating content · Designing pages · Publishing live</p>
        </div>
      </Card>
    </Screen>
  );

  if (phase==="done") return (
    <Screen step={0}>
      <Card accent={C.green}>
        <Heading emoji="🎉" title="Your website is live!" sub="We've built and published your real website. It's live right now — share it with anyone."/>
        <div style={{background:C.greenLt,border:"1.5px solid #BBF7D0",borderRadius:"14px",padding:"20px",marginBottom:"20px",textAlign:"center"}}>
          <div style={{fontSize:"0.78em",color:C.muted,marginBottom:"6px",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>Your live website</div>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:"1.05em",fontWeight:800,color:C.green,wordBreak:"break-all"}}>
            🌐 {liveUrl}
          </a>
        </div>
        <div style={{background:"#fff",border:`1.5px solid ${C.border}`,borderRadius:"14px",overflow:"hidden",marginBottom:"20px"}}>
          <div style={{background:C.light,padding:"10px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:"8px"}}>
            <div style={{display:"flex",gap:"5px"}}>
              {["#FF5F56","#FFBD2E","#27C93F"].map(c=><div key={c} style={{width:"10px",height:"10px",borderRadius:"50%",background:c}}/>)}
            </div>
            <div style={{flex:1,background:"#fff",borderRadius:"6px",padding:"4px 10px",fontSize:"0.75em",color:C.muted,border:`1px solid ${C.border}`,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{liveUrl}</div>
          </div>
          <iframe src={liveUrl} style={{width:"100%",height:"420px",border:"none",display:"block"}} title="Your live website" loading="lazy"/>
        </div>
        <div style={{display:"flex",gap:"8px",marginBottom:"16px"}}>
          <a href={liveUrl} target="_blank" rel="noopener noreferrer" style={{flex:1,padding:"14px",borderRadius:"10px",background:C.brand,color:"#fff",fontWeight:800,fontSize:"0.9em",textAlign:"center",textDecoration:"none",display:"block"}}>
            🌐 Open My Website
          </a>
          <button onClick={()=>navigator.clipboard.writeText(liveUrl)} style={{padding:"14px 18px",borderRadius:"10px",border:`1.5px solid ${C.border}`,background:"#fff",cursor:"pointer",fontSize:"0.9em",fontWeight:600,color:C.muted}}>
            📋 Copy
          </button>
        </div>
        <div style={{background:C.amberLt,border:`1px solid #FDE68A`,borderRadius:"10px",padding:"14px",fontSize:"0.82em",color:"#78350F",lineHeight:1.65,marginBottom:"20px"}}>
          💡 Want to connect your own domain (e.g. yourbusiness.com.au)? Head to <strong>Marketing → Publish My Website</strong> in the dashboard after setup.
        </div>
        <button onClick={()=>onNext({liveUrl})} style={{width:"100%",padding:"18px",borderRadius:"12px",border:"none",background:C.green,color:"#fff",fontWeight:800,fontSize:"1.05em",cursor:"pointer",fontFamily:"'Inter',system-ui,sans-serif"}}>
          Amazing — what's next? →
        </button>
      </Card>
    </Screen>
  );

  return null;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 2 — Social posts announcing the new website
// ═════════════════════════════════════════════════════════════════════════════
function Step2_Social({ data, onNext }) {
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState("");
  const [copied, setCopied] = useState(false);
  const biz = data.bizInfo || {};

  const generate = async () => {
    setGenerating(true);
    try {
      const text = await callClaude(
        `You write Facebook and Instagram posts for local Australian businesses. Warm, genuine, conversational — not corporate. Always include relevant emojis. Always include a 10% off celebration offer naturally.`,
        `Write 3 social media posts for ${biz.name||"this business"} in ${biz.suburb||"Australia"} announcing their new website and a 10% off celebration offer.

Business: ${biz.description||"local business"}

POST 1 — FACEBOOK (announcement, 150-200 words, warm and excited, mentions the website is live)
POST 2 — INSTAGRAM (punchier, more visual language, 80-100 words, ends with call to action)
POST 3 — FACEBOOK (follow-up 3 days later — "last chance" for the 10% offer, 100 words)

For each post:
- Start with a hook that stops the scroll (not "We're excited to announce")
- Mention the 10% off offer with code NEWSITE or similar
- Include a clear call to action (visit the website, call, book, etc.)
- Add 5-8 relevant local hashtags at the end
- Make it sound genuinely human — like the owner wrote it themselves

Australian spelling throughout.`,
        1000
      );
      setPosts(text);
    } catch(e) { setPosts("Something went wrong — try again."); }
    setGenerating(false);
  };

  const copy = () => { navigator.clipboard.writeText(posts).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{}); };

  return (
    <Screen step={1}>
      <Card accent={C.purple}>
        <Heading
          emoji="📱"
          title="Now let's tell everyone about it."
          sub={`Your website is ready. Let's write some Facebook and Instagram posts to announce it — including a 10% off celebration offer to get people through the door.`}
        />
        {!posts && !generating && (
          <>
            <div style={{background:C.purpleLt,border:`1px solid #DDD6FE`,borderRadius:"12px",padding:"16px",fontSize:"0.88em",color:"#4C1D95",lineHeight:1.65,marginBottom:"20px"}}>
              🎁 We'll write 3 posts — an announcement, an Instagram version, and a "last chance" follow-up 3 days later. All ready to copy and paste. Takes about 15 seconds.
            </div>
            <button onClick={generate} style={btnPrimary(C.purple)}>
              ✨ Write my social posts →
            </button>
          </>
        )}
        {generating && (
          <div style={{textAlign:"center",padding:"32px"}}>
            <div style={{fontSize:"2em",marginBottom:"10px"}}>📱</div>
            <div style={{fontWeight:700,color:C.text}}>Writing your posts...</div>
            <div style={{fontSize:"0.85em",color:C.muted,marginTop:"6px"}}>About 15 seconds</div>
          </div>
        )}
        {posts && (
          <>
            <ResultBox content={posts} onCopy={copy} copied={copied}/>
            <button onClick={()=>onNext({posts})} style={{...btnPrimary(C.green),marginTop:"16px"}}>
              Great — what's next? →
            </button>
          </>
        )}
      </Card>
    </Screen>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 3 — Email to customer list
// ═════════════════════════════════════════════════════════════════════════════
function Step3_Email({ data, onNext }) {
  const [generating, setGenerating] = useState(false);
  const [email, setEmail] = useState("");
  const [copied, setCopied] = useState(false);
  const biz = data.bizInfo || {};

  const generate = async () => {
    setGenerating(true);
    try {
      const text = await callClaude(
        `You write email campaigns for local Australian businesses. Personal, warm, gets to the point quickly. Written like the owner sent it personally.`,
        `Write a customer email announcing the new website and 10% off celebration offer for ${biz.name||"this business"} in ${biz.suburb||"Australia"}.

Business: ${biz.description||"local business"}

Write:

SUBJECT LINE OPTIONS (3 different angles — curiosity, benefit, personal):
1. 
2.
3.

EMAIL BODY (150-200 words):
- Opens warmly and personally (like from the owner, not a marketing team)
- Announces the new website in an exciting but genuine way
- Clearly states the 10% off offer — code, what it applies to, expiry (valid for 2 weeks)
- Tells them to visit the website or call/book
- Signs off personally from the owner's name [OWNER NAME] at ${biz.name||"the business"}

POST-SCRIPT (PS): One extra line that adds urgency or a personal touch

Australian spelling. Warm and genuine throughout — not promotional-sounding.`,
        800
      );
      setEmail(text);
    } catch(e) { setEmail("Something went wrong — try again."); }
    setGenerating(false);
  };

  const copy = () => { navigator.clipboard.writeText(email).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{}); };

  return (
    <Screen step={2}>
      <Card accent={C.brand}>
        <Heading
          emoji="📧"
          title="Let's email your customers too."
          sub="While the social posts are going up, let's send your existing customers an email about the new website and the 10% off offer. Even a small list gets real results."
        />
        {!email && !generating && (
          <>
            <div style={{background:C.brandLt,border:`1px solid #BFDBFE`,borderRadius:"12px",padding:"16px",fontSize:"0.88em",color:"#1E40AF",lineHeight:1.65,marginBottom:"20px"}}>
              📬 We'll write a full email with 3 subject line options, a warm body, and a PS. You paste it into Mailchimp, Gmail, or whatever you use to email your list. The average local business email gets 35-45% open rate when it's written like this — way better than a newsletter.
            </div>
            <button onClick={generate} style={btnPrimary(C.brand)}>
              ✍️ Write my customer email →
            </button>
          </>
        )}
        {generating && (
          <div style={{textAlign:"center",padding:"32px"}}>
            <div style={{fontSize:"2em",marginBottom:"10px"}}>📧</div>
            <div style={{fontWeight:700,color:C.text}}>Writing your email...</div>
            <div style={{fontSize:"0.85em",color:C.muted,marginTop:"6px"}}>About 15 seconds</div>
          </div>
        )}
        {email && (
          <>
            <ResultBox content={email} onCopy={copy} copied={copied} isEmail={true}/>
            <button onClick={()=>onNext({email})} style={{...btnPrimary(C.green),marginTop:"16px"}}>
              Perfect — keep going →
            </button>
          </>
        )}
      </Card>
    </Screen>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 4 — Keyword finder + blog post
// ═════════════════════════════════════════════════════════════════════════════
function Step4_Blog({ data, onNext }) {
  const [phase, setPhase] = useState("intro"); // intro | finding | keywords | writing | done
  const [keywords, setKeywords] = useState([]);
  const [chosen, setChosen] = useState(null);
  const [blogPost, setBlogPost] = useState("");
  const [copied, setCopied] = useState(false);
  const biz = data.bizInfo || {};

  const findKeywords = async () => {
    setPhase("finding");
    try {
      const text = await callClaude(
        `You are a local SEO expert for Australian small businesses. You find low-competition, high-value blog post keywords that local businesses can realistically rank for on Google within 30-90 days.`,
        `Find 5 easy-win blog post keyword opportunities for this business:

Business: ${biz.name||"local business"}
Type: ${biz.industry||"local business"}
Location: ${biz.suburb||"Australia"}
What they do: ${biz.description||"local services"}

Rules for good keywords:
- Long-tail (5-8 words), very specific
- Include the suburb or nearby area naturally
- Question-based, "how to", or "best [X] in [suburb]" format  
- Low competition — this business can realistically rank in 30-90 days
- High buyer intent — people searching are likely to become customers
- Easy win — topics not many local businesses are writing about

Return ONLY a JSON array, no other text:
[
  {
    "keyword": "best family cafe wollongong for breakfast",
    "title": "The 5 Best Family-Friendly Cafés in Wollongong for Breakfast",
    "difficulty": "Very easy",
    "why": "Families with young kids actively searching — no local businesses writing about this"
  }
]`,
        600
      );
      const cleaned = text.replace(/```json|```/g,"").trim();
      setKeywords(JSON.parse(cleaned));
      setPhase("keywords");
    } catch(e) {
      setKeywords([]);
      setPhase("keywords");
    }
  };

  const writeBlog = async () => {
    setPhase("writing");
    try {
      const text = await callClaude(
        `You write local SEO blog posts for Australian small businesses. Well-structured, genuinely useful, naturally optimised — never stuffed with keywords. Warm, helpful, locally specific.`,
        `Write a full SEO blog post for ${biz.name||"this business"}.

Target keyword: "${chosen.keyword}"
Blog post title: "${chosen.title}"
Business: ${biz.industry||"local business"} in ${biz.suburb||"Australia"}
What they do: ${biz.description||"local services"}

REQUIREMENTS:
- Length: 600-800 words
- H1 title at top, H2 subheadings for each section
- Target keyword used naturally 3-5 times (never stuffed)
- Suburb mentioned naturally throughout
- Genuinely useful — a reader should learn something or be helped
- End with a natural call to action mentioning ${biz.name||"the business"}

After the post, add:
---
SEO METADATA
Meta title (under 60 chars):
Meta description (under 155 chars):
URL slug:
Best time to publish: now / within 7 days

Australian spelling throughout. Sound human and genuinely helpful.`,
        1000
      );
      setBlogPost(text);
      setPhase("done");
    } catch(e) { setBlogPost("Something went wrong — try again."); setPhase("done"); }
  };

  const copy = () => { navigator.clipboard.writeText(blogPost).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{}); };

  return (
    <Screen step={3}>
      <Card accent={C.teal}>
        {phase==="intro" && (
          <>
            <Heading
              emoji="🔍"
              title="While that's all going — let's get you found on Google."
              sub="Here's something that pays off for months: a blog post that targets a keyword real people in your area are searching for. We'll find the easiest opportunity and write it for you right now."
            />
            <div style={{background:C.tealLt,border:"1px solid #99F6E4",borderRadius:"12px",padding:"16px",fontSize:"0.88em",color:"#0F766E",lineHeight:1.65,marginBottom:"20px"}}>
              🎯 We're looking for <strong>easy wins</strong> — keywords that are being searched but that almost no local businesses are writing about yet. One blog post published today can be bringing in free customers in 30-60 days.
            </div>
            <button onClick={findKeywords} style={btnPrimary(C.teal)}>
              🔍 Find easy keyword opportunities →
            </button>
          </>
        )}

        {phase==="finding" && (
          <div style={{textAlign:"center",padding:"40px"}}>
            <div style={{fontSize:"2.5em",marginBottom:"14px"}}>🔍</div>
            <div style={{fontWeight:800,fontSize:"1.1em",color:C.text,marginBottom:"8px"}}>Finding your best keyword opportunities...</div>
            <div style={{fontSize:"0.85em",color:C.muted,lineHeight:1.6}}>
              Looking for low-competition topics people in {biz.suburb||"your area"} are searching for. About 15 seconds.
            </div>
          </div>
        )}

        {phase==="keywords" && (
          <>
            <Heading emoji="🎯" title="Here are your easy keyword wins" sub="These are topics real people are searching for in your area — and almost no local businesses are writing about them yet. Pick one and we'll write the full blog post."/>
            <div style={{display:"flex",flexDirection:"column",gap:"10px",marginBottom:"16px"}}>
              {keywords.map((kw,i)=>(
                <button key={i} onClick={()=>setChosen(kw)} style={{
                  padding:"16px", borderRadius:"12px", textAlign:"left", cursor:"pointer",
                  border:`2px solid ${chosen?.keyword===kw.keyword?C.teal:C.border}`,
                  background:chosen?.keyword===kw.keyword?C.tealLt:"#fff",
                  transition:"all 0.1s",
                }}>
                  <div style={{fontWeight:700,fontSize:"0.9em",color:C.text,marginBottom:"4px"}}>"{kw.title}"</div>
                  <div style={{fontSize:"0.76em",color:C.muted,marginBottom:"3px"}}>🔍 Keyword: {kw.keyword}</div>
                  <div style={{fontSize:"0.76em",color:C.green}}>✓ {kw.why}</div>
                  <div style={{fontSize:"0.72em",color:C.teal,marginTop:"3px",fontWeight:600}}>Difficulty: {kw.difficulty}</div>
                </button>
              ))}
            </div>
            {chosen && (
              <button onClick={writeBlog} style={btnPrimary(C.teal)}>
                ✍️ Write this blog post →
              </button>
            )}
          </>
        )}

        {phase==="writing" && (
          <div style={{textAlign:"center",padding:"40px"}}>
            <div style={{fontSize:"2.5em",marginBottom:"14px"}}>✍️</div>
            <div style={{fontWeight:800,fontSize:"1.1em",color:C.text,marginBottom:"8px"}}>Writing your blog post...</div>
            <div style={{fontSize:"0.85em",color:C.muted}}>About 30 seconds — writing a proper 600-800 word post for you.</div>
          </div>
        )}

        {phase==="done" && (
          <>
            <Heading emoji="📝" title="Blog post ready!" sub="Copy this and paste it into your website, WordPress, Squarespace, or wherever you publish. Add a photo and publish it today for the fastest results."/>
            <ResultBox content={blogPost} onCopy={copy} copied={copied}/>
            <button onClick={()=>onNext({blogPost, chosenKeyword:chosen})} style={{...btnPrimary(C.green),marginTop:"16px"}}>
              Keep going →
            </button>
          </>
        )}
      </Card>
    </Screen>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 5 — Google Business Profile + reviews
// ═════════════════════════════════════════════════════════════════════════════
function Step5_Google({ data, onNext }) {
  const [phase, setPhase] = useState("intro"); // intro | gbp | reviews
  const [generatingGbp, setGeneratingGbp] = useState(false);
  const [gbpPost, setGbpPost] = useState("");
  const [copiedGbp, setCopiedGbp] = useState(false);
  const [review, setReview] = useState("");
  const [generatingReply, setGeneratingReply] = useState(false);
  const [reviewReply, setReviewReply] = useState("");
  const [copiedReply, setCopiedReply] = useState(false);
  const biz = data.bizInfo || {};

  const generateGbp = async () => {
    setGeneratingGbp(true);
    try {
      const text = await callClaude(
        `You write Google Business Profile posts for local Australian businesses. Short, locally relevant, genuine. Always include a clear call to action and relevant keywords for local SEO.`,
        `Write 2 Google Business Profile posts for ${biz.name||"this business"} in ${biz.suburb||"Australia"}.

Business: ${biz.description||"local business"}

POST 1 — New website announcement (mentioning the new website and 10% offer)
POST 2 — General "what makes us great" post (focuses on what they do best, why locals choose them)

Each post:
- 100-150 words
- Mentions ${biz.suburb||"the suburb"} naturally
- Clear call to action (call, visit, book, etc.)
- Warm and human — not like a corporate press release
- Include 3-4 relevant search terms naturally (not stuffed)

Label them clearly: POST 1 and POST 2`,
        600
      );
      setGbpPost(text);
    } catch(e) { setGbpPost("Something went wrong — try again."); }
    setGeneratingGbp(false);
  };

  const generateReply = async () => {
    if (!review) return;
    setGeneratingReply(true);
    try {
      const text = await callClaude(
        `You write responses to Google reviews for local Australian businesses. Always personal, never copy-paste corporate. Respond to both positive and negative reviews appropriately.`,
        `Write a professional response to this Google review for ${biz.name||"this business"} in ${biz.suburb||"Australia"}:

Review: "${review}"

Response requirements:
- Under 80 words
- Don't start with "Thank you for your review"
- Reference something specific from their review
- Warm and genuine — sounds like the actual owner wrote it
- If negative: acknowledge, apologise for the impact, invite them to contact you directly
- If positive: reinforce what they loved, invite them back, mention something new
- Sign off with the owner's name or just the business name`,
        300
      );
      setReviewReply(text);
    } catch(e) { setReviewReply("Something went wrong — try again."); }
    setGeneratingReply(false);
  };

  const copyGbp = () => { navigator.clipboard.writeText(gbpPost).then(()=>{setCopiedGbp(true);setTimeout(()=>setCopiedGbp(false),2000);}).catch(()=>{}); };
  const copyReply = () => { navigator.clipboard.writeText(reviewReply).then(()=>{setCopiedReply(true);setTimeout(()=>setCopiedReply(false),2000);}).catch(()=>{}); };

  return (
    <Screen step={4}>
      <Card accent={C.amber}>
        <Heading
          emoji="⭐"
          title="Last one — your Google presence."
          sub="Google is where most people find local businesses. Let's get a post up on your Google listing and handle any reviews while we're here."
        />

        {/* Google Business Post */}
        <div style={{marginBottom:"28px"}}>
          <div style={{fontWeight:800,fontSize:"1em",color:C.text,marginBottom:"8px"}}>📍 Google Business Profile Post</div>
          <div style={{fontSize:"0.85em",color:C.muted,lineHeight:1.6,marginBottom:"14px"}}>
            Google Business Profile posts show up right when people are searching for you. They take 2 minutes to publish and they work. Let's write yours now.
          </div>
          {!gbpPost && !generatingGbp && (
            <button onClick={generateGbp} style={btnPrimary(C.amber)}>
              ✍️ Write my Google Business posts →
            </button>
          )}
          {generatingGbp && (
            <div style={{textAlign:"center",padding:"20px"}}>
              <div style={{fontSize:"1.5em",marginBottom:"8px"}}>📍</div>
              <div style={{fontWeight:700,color:C.text,fontSize:"0.9em"}}>Writing your Google posts...</div>
            </div>
          )}
          {gbpPost && (
            <>
              <ResultBox content={gbpPost} onCopy={copyGbp} copied={copiedGbp}/>
              <div style={{fontSize:"0.8em",color:C.muted,marginTop:"8px",lineHeight:1.5}}>
                📱 To post: open Google Maps → search your business name → tap "Add update" → paste and publish.
              </div>
            </>
          )}
        </div>

        {/* Review responder */}
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"24px",marginBottom:"20px"}}>
          <div style={{fontWeight:800,fontSize:"1em",color:C.text,marginBottom:"8px"}}>💬 Got a review to respond to?</div>
          <div style={{fontSize:"0.85em",color:C.muted,lineHeight:1.6,marginBottom:"14px"}}>
            Responding to reviews — especially bad ones — shows potential customers that you care. Paste any review below and we'll write the perfect response.
          </div>
          <textarea
            value={review}
            onChange={e=>setReview(e.target.value)}
            placeholder={`Paste a Google review here — positive or negative. e.g. "Absolutely love this place! Best coffee in Wollongong by far. Staff are always friendly and it's great for the whole family."`}
            rows={4}
            style={{...inp,resize:"vertical",marginBottom:"10px"}}
          />
          {review && (
            <button onClick={generateReply} disabled={generatingReply} style={btnPrimary(C.amber)}>
              {generatingReply?"Writing your response...":"✍️ Write my review response →"}
            </button>
          )}
          {reviewReply && (
            <>
              <ResultBox content={reviewReply} onCopy={copyReply} copied={copiedReply}/>
              <div style={{fontSize:"0.8em",color:C.muted,marginTop:"8px"}}>
                📱 To respond: open Google Maps → your business → find the review → tap Reply → paste and post.
              </div>
            </>
          )}
        </div>

        <button onClick={()=>onNext({gbpPost, reviewReply})} style={btnPrimary(C.green)}>
          {gbpPost?"🎉 I'm done — show me my results →":"Skip this for now →"}
        </button>
      </Card>
    </Screen>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 6 — Celebration / summary
// ═════════════════════════════════════════════════════════════════════════════
function Step6_Done({ data, onEnterDashboard }) {
  const completedItems = [
    data.websiteContent && "✅ New website content — ready to go live",
    data.posts && "✅ 3 social media posts — ready to schedule",
    data.email && "✅ Customer email — ready to send",
    data.blogPost && "✅ Blog post for Google — ready to publish",
    data.gbpPost && "✅ Google Business post — ready to paste in",
    data.reviewReply && "✅ Review response — ready to post",
  ].filter(Boolean);

  return (
    <Screen step={5}>
      <Card accent={C.green}>
        <div style={{textAlign:"center",padding:"12px 0 28px"}}>
          <div style={{fontSize:"3.5em",marginBottom:"12px"}}>🎉</div>
          <h1 style={{fontSize:"clamp(1.5em,4vw,2em)",fontWeight:900,color:C.text,margin:"0 0 12px",letterSpacing:"-0.03em",lineHeight:1.2}}>
            You've done more marketing today than most businesses do in a month.
          </h1>
          <p style={{fontSize:"0.95em",color:C.muted,lineHeight:1.7,margin:0}}>
            Seriously. Most business owners mean to do all of this — you actually did it.
          </p>
        </div>

        <div style={{background:C.greenLt,border:"1px solid #BBF7D0",borderRadius:"12px",padding:"20px",marginBottom:"24px"}}>
          <div style={{fontWeight:800,color:C.green,marginBottom:"12px",fontSize:"0.95em"}}>Here's what you just completed:</div>
          <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
            {completedItems.map((item,i)=>(
              <div key={i} style={{fontSize:"0.88em",color:C.text,lineHeight:1.5}}>{item}</div>
            ))}
          </div>
        </div>

        <div style={{background:C.amberLt,border:`1px solid #FDE68A`,borderRadius:"12px",padding:"16px",marginBottom:"24px",fontSize:"0.85em",color:"#78350F",lineHeight:1.7}}>
          <strong>What to expect in the next 30 days:</strong><br/>
          🌐 Your website copy is ready to go live — the sooner it's published, the sooner Google finds it.<br/>
          📱 Post your social posts over the next 3 days — spread them out for better reach.<br/>
          📧 Send your customer email in the next 24 hours while the momentum is up.<br/>
          📝 Publish your blog post today — it can start ranking within 2-4 weeks.<br/>
          ⭐ Keep responding to reviews — every reply builds trust with future customers.
        </div>

        <div style={{background:C.dark,borderRadius:"12px",padding:"20px",marginBottom:"24px",textAlign:"center"}}>
          <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.78em",marginBottom:"4px"}}>YOUR HEALTH SCORE</div>
          <div style={{fontSize:"3em",fontWeight:900,color:"#fff",letterSpacing:"-0.04em",lineHeight:1}}>{completedItems.length * 14}<span style={{fontSize:"0.4em",color:"rgba(255,255,255,0.4)"}}>/100</span></div>
          <div style={{color:"#6EE7B7",fontSize:"0.82em",fontWeight:700,marginTop:"4px"}}>
            {completedItems.length >= 5 ? "Excellent start! 💚" : "Great start — keep going 🟡"}
          </div>
        </div>

        <button onClick={onEnterDashboard} style={btnPrimary(C.brand)}>
          🚀 Take me to my dashboard →
        </button>
        <div style={{fontSize:"0.78em",color:C.muted,textAlign:"center",marginTop:"10px",lineHeight:1.5}}>
          Everything you've created is saved in your dashboard — come back any time to create more content, check your health score, or manage your customers.
        </div>
      </Card>
    </Screen>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN JOURNEY COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
export default function Journey({ onComplete, session }) {
  const [step, setStep] = useState(0);
  const [collectedData, setCollectedData] = useState({});

  const next = (newData={}) => {
    setCollectedData(prev => ({...prev, ...newData}));
    setStep(s => s+1);
  };

  if (step===0) return <Step0_Welcome onNext={next}/>;
  if (step===1) return <Step1_Website data={collectedData} session={session} onNext={next}/>;
  if (step===2) return <Step2_Social data={collectedData} onNext={next}/>;
  if (step===3) return <Step3_Email data={collectedData} onNext={next}/>;
  if (step===4) return <Step4_Blog data={collectedData} onNext={next}/>;
  if (step===5) return <Step5_Google data={collectedData} onNext={next}/>;
  if (step===6) return <Step6_Done data={collectedData} onEnterDashboard={()=>onComplete(collectedData)}/>;
  return null;
}
