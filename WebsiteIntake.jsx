import { useState, useRef } from "react";
import { supabase } from "./supabase.js";

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  brand:"#2563EB", brandLt:"#EFF6FF",
  green:"#16A34A", greenLt:"#F0FDF4",
  amber:"#D97706", amberLt:"#FFFBEB",
  red:"#DC2626",   redLt:"#FEF2F2",
  border:"#E5E7EB", text:"#111827", muted:"#6B7280", light:"#F8F9FA",
};
const ff = "'Segoe UI', system-ui, sans-serif";
const inp = {
  width:"100%", padding:"16px 18px", borderRadius:"12px",
  border:`2px solid ${C.border}`, fontSize:"1em", color:C.text,
  outline:"none", boxSizing:"border-box", fontFamily:ff, background:"#fff",
};

// ─── 12 Colour Palettes ───────────────────────────────────────────────────────
const PALETTES = [
  { id:"ocean",     name:"Ocean Blue",      primary:"#1E40AF", accent:"#06B6D4", bg:"#F0F9FF", dark:"#0C1A3D" },
  { id:"forest",    name:"Forest Green",    primary:"#166534", accent:"#65A30D", bg:"#F0FDF4", dark:"#052E16" },
  { id:"sunset",    name:"Sunset Orange",   primary:"#C2410C", accent:"#F59E0B", bg:"#FFF7ED", dark:"#431407" },
  { id:"rose",      name:"Rose Gold",       primary:"#9D174D", accent:"#F43F5E", bg:"#FFF1F2", dark:"#4C0519" },
  { id:"slate",     name:"Slate Premium",   primary:"#1E293B", accent:"#38BDF8", bg:"#F8FAFC", dark:"#020617" },
  { id:"violet",    name:"Royal Violet",    primary:"#5B21B6", accent:"#A78BFA", bg:"#F5F3FF", dark:"#1E0A47" },
  { id:"teal",      name:"Teal Modern",     primary:"#0F766E", accent:"#14B8A6", bg:"#F0FDFA", dark:"#042F2E" },
  { id:"copper",    name:"Copper & Black",  primary:"#92400E", accent:"#D97706", bg:"#FFFBEB", dark:"#1C0A00" },
  { id:"charcoal",  name:"Charcoal Bold",   primary:"#111827", accent:"#EF4444", bg:"#F9FAFB", dark:"#030712" },
  { id:"sage",      name:"Sage & Cream",    primary:"#4D7C0F", accent:"#A16207", bg:"#F7FEE7", dark:"#1A2E05" },
  { id:"navy",      name:"Navy & Gold",     primary:"#1E3A5F", accent:"#D4AF37", bg:"#F8F9FA", dark:"#0A1628" },
  { id:"blush",     name:"Blush & White",   primary:"#9D174D", accent:"#EC4899", bg:"#FDF2F8", dark:"#500724" },
];

// ─── All 15 questions ─────────────────────────────────────────────────────────
function buildQuestions(answers) {
  return [
    // ── SECTION 1: THE BASICS ─────────────────────────────────────
    {
      id:"biz_name",
      section:"The Basics",
      question:"What's your business name?",
      sub:"Exactly as it appears on your sign, cards, or receipts.",
      type:"text",
      placeholder:"e.g. Sandy's Café",
    },
    {
      id:"owner_name",
      section:"The Basics",
      question:`Hi ${answers.biz_name||"there"} — who's the face behind the business?`,
      sub:"Your name (or the main owner/operator). We'll use this to make the website feel personal.",
      type:"text",
      placeholder:"e.g. Sandra",
    },
    {
      id:"suburb",
      section:"The Basics",
      question:"Where are you based, and where do you service?",
      sub:"We'll use this for local SEO — Google needs to know exactly where you are.",
      type:"twofield",
      field1:{key:"base_suburb", placeholder:"Your suburb  e.g. Wollongong NSW"},
      field2:{key:"service_area", placeholder:"Service area  e.g. All of the Illawarra — Wollongong, Shellharbour, Kiama"},
    },
    {
      id:"phone",
      section:"The Basics",
      question:"What's the best phone number for customers to call?",
      sub:"This goes right at the top of your website. On mobile, it becomes a tap-to-call button.",
      type:"text",
      placeholder:"e.g. 0412 345 678",
    },
    {
      id:"email",
      section:"The Basics",
      question:"What email address should enquiries go to?",
      sub:"This is the address displayed on your site and used for the contact form.",
      type:"text",
      placeholder:"e.g. hello@sandyscafe.com.au",
    },

    // ── SECTION 2: THE BUSINESS ───────────────────────────────────
    {
      id:"years",
      section:"Your Business",
      question:"How long have you been in business?",
      sub:"Even if it's just a few months, be specific — it builds trust.",
      type:"choice",
      options:[
        "Just getting started (under 1 year)",
        "1–3 years",
        "4–10 years",
        "10–20 years",
        "Over 20 years — we're well established",
      ],
    },
    {
      id:"services",
      section:"Your Business",
      question:"What are your main services or products?",
      sub:"List up to 5. Each one gets its own card on your website with a proper description.",
      type:"multiline",
      placeholder:"e.g.\n1. Emergency plumbing repairs\n2. Hot water system installation\n3. Blocked drain clearing\n4. Bathroom renovations\n5. Leaking tap repairs",
    },
    {
      id:"difference",
      section:"Your Business",
      question:"What makes you different from your competitors?",
      sub:"Be honest and specific — \"great service\" isn't enough. Think about what customers actually say when they recommend you.",
      type:"multiline",
      placeholder:"e.g. We answer calls 24/7, never leave a mess, always give a fixed price upfront, and have been in Wollongong for 18 years — our customers know us by name.",
    },
    {
      id:"customer",
      section:"Your Business",
      question:"Who is your ideal customer?",
      sub:"This shapes the tone and language of your whole website.",
      type:"choice",
      options:[
        "Families and homeowners",
        "Young professionals and renters",
        "Businesses and commercial clients",
        "Retirees and older Australians",
        "A mix of everyone",
        "Other — I'll describe below",
      ],
    },
    {
      id:"awards",
      section:"Your Business",
      question:"Do you have any awards, certifications, licences or memberships?",
      sub:"These are trust signals — they go on your website as badges and build instant credibility. Leave blank if none.",
      type:"multiline",
      placeholder:"e.g. Master Plumbers Association member, QBCC Licensed #123456, 4.9 stars on Google (200+ reviews), Winner — Best Local Tradie Illawarra 2023",
      optional:true,
    },

    // ── SECTION 3: THE LOOK ───────────────────────────────────────
    {
      id:"palette",
      section:"The Look",
      question:"Pick a colour palette for your website.",
      sub:"Choose the one that feels most like your brand. You can always change it later.",
      type:"palette",
    },
    {
      id:"logo",
      section:"The Look",
      question:"Do you have a logo to upload?",
      sub:"Upload it here and it'll appear in the navigation bar of your website. PNG or JPG, any size.",
      type:"logo_upload",
      optional:true,
    },
    {
      id:"photos",
      section:"The Look",
      question:"Upload up to 10 photos of your business, team, or work.",
      sub:"Real photos make a massive difference to how professional your site looks. Your work, your team, your premises — anything authentic. If you don't have any yet, no problem — we'll use a design that looks great without them.",
      type:"photo_upload",
      optional:true,
    },

    // ── SECTION 4: SOCIAL PROOF ───────────────────────────────────
    {
      id:"testimonials",
      section:"Social Proof",
      question:"Do you have any customer reviews or testimonials?",
      sub:"Paste up to 3 real reviews — from Google, Facebook, or word of mouth. These go directly on your website and are worth their weight in gold.",
      type:"testimonials",
      optional:true,
    },
    {
      id:"socials",
      section:"Social Proof",
      question:"Do you have any social media profiles?",
      sub:"We'll add links to your website footer. Leave blank for any you don't have.",
      type:"socials",
      optional:true,
    },
  ];
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function WebsiteIntake({ data, session, onComplete }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    biz_name:"", owner_name:"", base_suburb:"", service_area:"",
    phone:"", email:"", years:"", services:"", difference:"",
    customer:"", awards:"", palette:"slate", logo_url:"",
    photo_urls:[], testimonials:"", fb:"", ig:"", tiktok:"",
  });
  const [uploading, setUploading] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [logoPreview, setLogoPreview] = useState("");
  const logoRef = useRef();
  const photosRef = useRef();

  const questions = buildQuestions(answers);
  const q = questions[step];
  const total = questions.length;

  const set = (key, val) => setAnswers(a => ({...a, [key]:val}));

  // ── Upload file to Supabase storage ─────────────────────────────
  const uploadFile = async (file, path) => {
    const { data: uploadData, error } = await supabase.storage
      .from("website-assets")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
      .from("website-assets")
      .getPublicUrl(path);
    return publicUrl;
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${session?.user?.id || "anon"}/logo/${file.name}`;
      const url = await uploadFile(file, path);
      set("logo_url", url);
      setLogoPreview(URL.createObjectURL(file));
    } catch(err) { console.error("Logo upload failed:", err); }
    setUploading(false);
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10 - uploadedPhotos.length);
    if (!files.length) return;
    setUploading(true);
    const newUrls = [];
    for (const file of files) {
      try {
        const path = `${session?.user?.id || "anon"}/photos/${Date.now()}-${file.name}`;
        const url = await uploadFile(file, path);
        newUrls.push(url);
      } catch(err) { console.error("Photo upload failed:", err); }
    }
    const combined = [...uploadedPhotos, ...newUrls].slice(0, 10);
    setUploadedPhotos(combined);
    set("photo_urls", combined);
    setUploading(false);
  };

  const removePhoto = (idx) => {
    const updated = uploadedPhotos.filter((_,i) => i !== idx);
    setUploadedPhotos(updated);
    set("photo_urls", updated);
  };

  // ── Navigation ───────────────────────────────────────────────────
  const canNext = () => {
    if (q.optional) return true;
    switch(q.type) {
      case "text":       return !!answers[q.id]?.trim();
      case "twofield":   return !!(answers.base_suburb?.trim() && answers.service_area?.trim());
      case "multiline":  return !!answers[q.id]?.trim();
      case "choice":     return !!answers[q.id];
      case "palette":    return !!answers.palette;
      case "logo_upload":   return true;
      case "photo_upload":  return true;
      case "testimonials":  return true;
      case "socials":       return true;
      default: return true;
    }
  };

  const next = () => {
    if (step < total - 1) setStep(s => s + 1);
    else onComplete(answers);
  };

  const prev = () => { if (step > 0) setStep(s => s - 1); };

  // ── Render question content ──────────────────────────────────────
  const renderQuestion = () => {
    switch(q.type) {
      case "text":
        return (
          <input
            value={answers[q.id]||""}
            onChange={e=>set(q.id,e.target.value)}
            placeholder={q.placeholder}
            style={inp}
            onKeyDown={e=>e.key==="Enter"&&canNext()&&next()}
            autoFocus
          />
        );

      case "twofield":
        return (
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            <input value={answers.base_suburb||""} onChange={e=>set("base_suburb",e.target.value)}
              placeholder={q.field1.placeholder} style={inp} autoFocus/>
            <input value={answers.service_area||""} onChange={e=>set("service_area",e.target.value)}
              placeholder={q.field2.placeholder} style={inp}/>
          </div>
        );

      case "multiline":
        return (
          <textarea
            value={answers[q.id]||""}
            onChange={e=>set(q.id,e.target.value)}
            placeholder={q.placeholder}
            rows={q.id==="services"?7:4}
            style={{...inp,resize:"vertical",lineHeight:1.7}}
            autoFocus
          />
        );

      case "choice":
        return (
          <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
            {q.options.map(opt=>(
              <button key={opt} onClick={()=>set(q.id,opt)} style={{
                padding:"16px 18px", borderRadius:"12px", textAlign:"left", cursor:"pointer",
                border:`2px solid ${answers[q.id]===opt?C.brand:C.border}`,
                background:answers[q.id]===opt?C.brandLt:"#fff",
                fontFamily:ff, fontSize:"0.95em", fontWeight:answers[q.id]===opt?700:500,
                color:answers[q.id]===opt?C.brand:C.text, transition:"all 0.12s",
              }}>
                {answers[q.id]===opt?"✓ ":""}{opt}
              </button>
            ))}
          </div>
        );

      case "palette":
        return (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px"}}>
            {PALETTES.map(p=>(
              <button key={p.id} onClick={()=>set("palette",p.id)} style={{
                padding:"0",borderRadius:"12px",overflow:"hidden",cursor:"pointer",
                border:`3px solid ${answers.palette===p.id?C.brand:"transparent"}`,
                boxShadow:answers.palette===p.id?"0 0 0 2px "+C.brand+", 0 4px 16px rgba(0,0,0,0.12)":"0 2px 8px rgba(0,0,0,0.08)",
                transition:"all 0.15s", background:"none",
              }}>
                <div style={{display:"flex",height:"48px"}}>
                  <div style={{flex:2,background:p.dark}}/>
                  <div style={{flex:3,background:p.primary}}/>
                  <div style={{flex:2,background:p.accent}}/>
                  <div style={{flex:2,background:p.bg}}/>
                </div>
                <div style={{
                  background:"#fff", padding:"8px 12px", textAlign:"left",
                  fontSize:"0.78em", fontWeight:answers.palette===p.id?700:500,
                  color:answers.palette===p.id?C.brand:C.text, fontFamily:ff,
                  display:"flex",alignItems:"center",justifyContent:"space-between",
                }}>
                  {p.name}
                  {answers.palette===p.id&&<span style={{color:C.brand}}>✓</span>}
                </div>
              </button>
            ))}
          </div>
        );

      case "logo_upload":
        return (
          <div>
            {logoPreview ? (
              <div style={{display:"flex",flexDirection:"column",gap:"12px",alignItems:"flex-start"}}>
                <img src={logoPreview} alt="Logo preview" style={{maxHeight:"80px",maxWidth:"240px",objectFit:"contain",border:`1px solid ${C.border}`,borderRadius:"8px",padding:"8px",background:"#fff"}}/>
                <button onClick={()=>{setLogoPreview("");set("logo_url","");}} style={{fontSize:"0.82em",color:C.red,background:"none",border:"none",cursor:"pointer",padding:0}}>
                  Remove logo
                </button>
              </div>
            ) : (
              <div onClick={()=>logoRef.current.click()} style={{
                border:`2px dashed ${C.border}`,borderRadius:"14px",padding:"40px",
                textAlign:"center",cursor:"pointer",background:C.light,transition:"all 0.15s",
              }}>
                <div style={{fontSize:"2em",marginBottom:"8px"}}>🖼️</div>
                <div style={{fontWeight:700,color:C.text,marginBottom:"4px"}}>Click to upload your logo</div>
                <div style={{fontSize:"0.82em",color:C.muted}}>PNG or JPG · Any size · Transparent background works best</div>
                {uploading && <div style={{marginTop:"10px",fontSize:"0.82em",color:C.brand}}>Uploading...</div>}
              </div>
            )}
            <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{display:"none"}}/>
            <div style={{marginTop:"14px",fontSize:"0.82em",color:C.muted}}>
              No logo yet? No problem — we'll use your business name in the navigation instead, which looks great.
            </div>
          </div>
        );

      case "photo_upload":
        return (
          <div>
            {uploadedPhotos.length > 0 && (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(100px,1fr))",gap:"8px",marginBottom:"14px"}}>
                {uploadedPhotos.map((url,i)=>(
                  <div key={i} style={{position:"relative",borderRadius:"10px",overflow:"hidden",aspectRatio:"1"}}>
                    <img src={url} alt={`Photo ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    <button onClick={()=>removePhoto(i)} style={{
                      position:"absolute",top:"4px",right:"4px",width:"20px",height:"20px",
                      borderRadius:"50%",background:"rgba(0,0,0,0.6)",color:"#fff",
                      border:"none",cursor:"pointer",fontSize:"0.7em",display:"flex",alignItems:"center",justifyContent:"center",
                    }}>✕</button>
                  </div>
                ))}
                {uploadedPhotos.length < 10 && (
                  <div onClick={()=>photosRef.current.click()} style={{
                    borderRadius:"10px",border:`2px dashed ${C.border}`,aspectRatio:"1",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    cursor:"pointer",background:C.light,flexDirection:"column",gap:"4px",
                  }}>
                    <div style={{fontSize:"1.2em"}}>+</div>
                    <div style={{fontSize:"0.65em",color:C.muted}}>Add more</div>
                  </div>
                )}
              </div>
            )}
            {uploadedPhotos.length === 0 && (
              <div onClick={()=>photosRef.current.click()} style={{
                border:`2px dashed ${C.border}`,borderRadius:"14px",padding:"40px",
                textAlign:"center",cursor:"pointer",background:C.light,marginBottom:"14px",
              }}>
                <div style={{fontSize:"2em",marginBottom:"8px"}}>📸</div>
                <div style={{fontWeight:700,color:C.text,marginBottom:"4px"}}>Click to upload your photos</div>
                <div style={{fontSize:"0.82em",color:C.muted}}>Up to 10 photos · JPG or PNG · Your work, team, or premises</div>
                {uploading && <div style={{marginTop:"10px",fontSize:"0.82em",color:C.brand}}>Uploading...</div>}
              </div>
            )}
            <input ref={photosRef} type="file" accept="image/*" multiple onChange={handlePhotoUpload} style={{display:"none"}}/>
            <div style={{fontSize:"0.82em",color:C.muted,lineHeight:1.6}}>
              {uploadedPhotos.length}/10 photos uploaded.
              {uploadedPhotos.length===0?" Don't have any yet? Skip this — we'll design the site to look great without them.":" You can add more or remove any by tapping the ✕."}
            </div>
          </div>
        );

      case "testimonials":
        return (
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {[1,2,3].map(n=>(
              <div key={n}>
                <label style={{fontWeight:600,fontSize:"0.82em",color:C.muted,display:"block",marginBottom:"5px"}}>
                  Review {n} {n===1?"(most important)":"(optional)"}
                </label>
                <textarea
                  value={answers[`testimonial_${n}`]||""}
                  onChange={e=>set(`testimonial_${n}`,e.target.value)}
                  placeholder={n===1
                    ? `e.g. "Sandy and her team are absolutely amazing. Best café in Wollongong — we've been coming every Saturday for 3 years. The eggs benny is legendary!" — Sarah M., Wollongong`
                    : `Paste another review here...`}
                  rows={3}
                  style={{...inp,resize:"vertical",fontSize:"0.9em"}}
                />
              </div>
            ))}
          </div>
        );

      case "socials":
        return (
          <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
            {[
              {key:"fb",     icon:"📘", label:"Facebook page URL",   placeholder:"https://facebook.com/yourbusiness"},
              {key:"ig",     icon:"📸", label:"Instagram profile URL", placeholder:"https://instagram.com/yourbusiness"},
              {key:"tiktok", icon:"🎵", label:"TikTok profile URL",   placeholder:"https://tiktok.com/@yourbusiness"},
            ].map(s=>(
              <div key={s.key}>
                <label style={{fontWeight:600,fontSize:"0.82em",color:C.muted,display:"block",marginBottom:"5px"}}>
                  {s.icon} {s.label}
                </label>
                <input value={answers[s.key]||""} onChange={e=>set(s.key,e.target.value)}
                  placeholder={s.placeholder} style={inp}/>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  // ── Layout ───────────────────────────────────────────────────────
  const sectionColors = {
    "The Basics":    C.brand,
    "Your Business": "#7C3AED",
    "The Look":      "#0D9488",
    "Social Proof":  "#D97706",
  };
  const sectionColor = sectionColors[q.section] || C.brand;

  return (
    <div style={{
      minHeight:"100vh", background:C.light, fontFamily:ff,
      display:"flex", flexDirection:"column", alignItems:"center", padding:"0 16px 60px",
    }}>
      {/* Nav */}
      <div style={{width:"100%",maxWidth:"640px",padding:"18px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"28px"}}>
        <div style={{fontWeight:900,fontSize:"1.2em",letterSpacing:"-0.03em"}}>
          <span style={{color:C.brand}}>⚡</span>Cliento<span style={{color:C.amber}}>.</span>
        </div>
        <div style={{fontSize:"0.75em",color:C.muted,fontWeight:600}}>Building your website 🏗️</div>
      </div>

      <div style={{width:"100%",maxWidth:"640px"}}>
        {/* Progress */}
        <div style={{marginBottom:"24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
            <div style={{
              display:"inline-flex",alignItems:"center",gap:"6px",
              background:sectionColor+"18",border:`1px solid ${sectionColor}33`,
              borderRadius:"20px",padding:"4px 12px",
              fontSize:"0.72em",fontWeight:800,color:sectionColor,textTransform:"uppercase",letterSpacing:"0.06em",
            }}>
              {q.section}
            </div>
            <div style={{fontSize:"0.75em",color:C.muted,fontWeight:600}}>
              {step+1} of {total}
            </div>
          </div>
          <div style={{background:C.border,borderRadius:"99px",height:"4px",overflow:"hidden"}}>
            <div style={{
              width:`${((step+1)/total)*100}%`,height:"100%",
              background:`linear-gradient(90deg,${sectionColor},${C.brand})`,
              borderRadius:"99px",transition:"width 0.4s ease",
            }}/>
          </div>
        </div>

        {/* Question card */}
        <div style={{
          background:"#fff",borderRadius:"20px",
          border:`1.5px solid ${C.border}`,padding:"32px",
          boxShadow:"0 4px 24px rgba(0,0,0,0.07)",marginBottom:"16px",
        }}>
          <h2 style={{
            fontSize:"clamp(1.3em,3.5vw,1.7em)",fontWeight:900,
            color:C.text,margin:"0 0 10px",letterSpacing:"-0.02em",lineHeight:1.25,
          }}>
            {q.question}
          </h2>
          <p style={{fontSize:"0.9em",color:C.muted,lineHeight:1.65,margin:"0 0 24px"}}>
            {q.sub}
            {q.optional && <span style={{color:C.brand,fontWeight:600}}> (optional)</span>}
          </p>
          {renderQuestion()}
        </div>

        {/* Navigation */}
        <div style={{display:"flex",gap:"10px"}}>
          {step > 0 && (
            <button onClick={prev} style={{
              padding:"16px 20px",borderRadius:"12px",border:`1.5px solid ${C.border}`,
              background:"#fff",color:C.muted,cursor:"pointer",fontFamily:ff,fontSize:"0.9em",fontWeight:600,
            }}>← Back</button>
          )}
          <button onClick={next} disabled={!canNext()||uploading} style={{
            flex:1,padding:"18px",borderRadius:"12px",border:"none",
            background:canNext()&&!uploading?sectionColor:C.border,
            color:canNext()&&!uploading?"#fff":C.muted,
            fontFamily:ff,fontSize:"1em",fontWeight:800,cursor:canNext()&&!uploading?"pointer":"not-allowed",
            transition:"all 0.15s",
          }}>
            {uploading ? "Uploading..." : step===total-1 ? "🚀 Build My Website →" : "Continue →"}
          </button>
        </div>

        {/* Skip hint */}
        {q.optional && step < total-1 && (
          <div style={{textAlign:"center",marginTop:"10px"}}>
            <button onClick={next} style={{fontSize:"0.8em",color:C.muted,background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>
              Skip this question →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
