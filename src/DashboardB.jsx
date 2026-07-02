import { useState } from "react";

export function GrowPanel({biz, industry, customers}) {
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
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"6px"}}>
                <button onClick={copy} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid ${C.green}`,background:copied?C.green:C.greenLt,color:copied?"#fff":C.green,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s",minWidth:"90px"}}>
                  {copied?"✓ Copied!":"📋 Copy Campaign"}
                </button>
                <button onClick={()=>{
                  const body = output.replace(/^#+\s*/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").trim().substring(0,1800);
                  window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("We miss you — come back soon")}&body=${encodeURIComponent(body)}`,"_blank");
                }} style={{flex:1,padding:"11px",borderRadius:"8px",border:"2px solid #FECACA",background:"#FFF5F5",color:"#EA4335",fontWeight:700,cursor:"pointer",fontSize:"0.85em",minWidth:"90px"}}>
                  ✉️ Gmail
                </button>
                <button onClick={()=>{
                  const body = output.replace(/^#+\s*/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").trim().substring(0,1800);
                  window.location.href = `mailto:?subject=${encodeURIComponent("We miss you — come back soon")}&body=${encodeURIComponent(body)}`;
                }} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid #BFDBFE`,background:C.brandLt,color:C.brand,fontWeight:700,cursor:"pointer",fontSize:"0.85em",minWidth:"90px"}}>
                  📨 Mail app
                </button>
              </div>
              <div style={{fontSize:"0.74em",color:C.muted}}>💡 Gmail and Mail app open with the SMS/email pre-filled — add your customer's details and send.</div>
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
              <div style={{display:"flex",gap:"8px",flexWrap:"wrap",marginBottom:"6px"}}>
                <button onClick={copy} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid ${C.green}`,background:copied?C.green:C.greenLt,color:copied?"#fff":C.green,fontWeight:700,cursor:"pointer",fontSize:"0.88em",transition:"all 0.2s",minWidth:"90px"}}>
                  {copied?"✓ Copied!":"📋 Copy Program"}
                </button>
                <button onClick={()=>{
                  const body = output.replace(/^#+\s*/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").trim().substring(0,1800);
                  window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent("Tell a friend and you both win!")}&body=${encodeURIComponent(body)}`,"_blank");
                }} style={{flex:1,padding:"11px",borderRadius:"8px",border:"2px solid #FECACA",background:"#FFF5F5",color:"#EA4335",fontWeight:700,cursor:"pointer",fontSize:"0.85em",minWidth:"90px"}}>
                  ✉️ Gmail
                </button>
                <button onClick={()=>{
                  const body = output.replace(/^#+\s*/gm,"").replace(/\*\*([^*]+)\*\*/g,"$1").trim().substring(0,1800);
                  window.location.href = `mailto:?subject=${encodeURIComponent("Tell a friend and you both win!")}&body=${encodeURIComponent(body)}`;
                }} style={{flex:1,padding:"11px",borderRadius:"8px",border:`2px solid #BFDBFE`,background:C.brandLt,color:C.brand,fontWeight:700,cursor:"pointer",fontSize:"0.85em",minWidth:"90px"}}>
                  📨 Mail app
                </button>
              </div>
              <div style={{fontSize:"0.74em",color:C.muted}}>💡 Gmail and Mail app open with the referral email pre-filled — personalise and send to your customers.</div>
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
export function HealthPanel({biz, industry, customers, results}) {
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
export function NetworkPanel({biz, industry, networkMembers}) {
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
export function ProductTour({ step, setStep, onClose, isShopify, ownerName }) {
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

export function PublishWebsite({ biz, websiteContent, onBack }) {
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
export function ConnectShopify({ biz, onBack }) {
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
export function HelpCentre({ isShopify, onStartTour }) {
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

export { inputSt, btnPrimary, backBtn, Field };
