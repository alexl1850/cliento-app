// HTML-escapes a value so it's safe to interpolate into the generated page —
// used on BOTH raw visitor input (biz/suburb/ownerName/phone/email) and the
// AI-generated copy, since prompt-injected content in the input could also
// come back out in the AI's response.
export const safe = (str) => (str||'').replace(/\\/g,'').replace(/`/g,"'").replace(/\$/g,'&#36;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// Generates a full premium website HTML string for a business. Callers are
// responsible for sanitizing biz/suburb/bizType/ownerName/phone/email/description
// with safe() BEFORE calling this (both api/demo.js and the outreach batch
// tool do this at their own request-validation boundary) — this function
// still sanitizes the AI-generated fields itself, since prompt-injected
// content in the inputs could come back out in the model's response.
export async function generateSiteHtml({ biz, suburb, bizType, ownerName, phone, email, description }) {
    const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
    const bizStr = `${bizType||''} ${biz||''}`.toLowerCase();

    // ── Business type detection ────────────────────────────────────────────
    const isButcher    = /butcher|meat|deli|smallgoods/.test(bizStr);
    const isBakery     = /baker|bakery|bread|pastry|cake|patisserie/.test(bizStr);
    const isCafe       = /café|cafe|coffee|espresso|brunch|breakfast/.test(bizStr);
    const isRestaurant = /restaurant|dining|bistro|eatery|diner/.test(bizStr);
    const isTakeaway   = /takeaway|pizza|burger|kebab|chinese|thai|indian|sushi/.test(bizStr);
    // \b-bounded so "bar" doesn't match as a substring of "barber" (which
    // would otherwise win this check before isHairSalon is ever reached,
    // since it's tested first below) — same for "pub" vs. words like "public".
    const isBar        = /\bbar\b|\bpub\b|brewery|cocktail|wine/.test(bizStr);
    const isHairSalon  = /hair|hairdress|barber/.test(bizStr);
    const isBeautySpa  = /beauty|spa|massage|facial|nail|lash|brow|wax/.test(bizStr);
    const isPlumber    = /plumb|pipe|drain/.test(bizStr);
    const isElec       = /electri|wiring|power|solar/.test(bizStr);
    const isBuilder    = /build|construct|renovation|carpent/.test(bizStr);
    const isLandscaper = /landscap|garden|lawn|mow/.test(bizStr);
    const isGym        = /gym|fitness|crossfit|personal train/.test(bizStr);
    const isYoga       = /yoga|pilates|meditation|wellness/.test(bizStr);
    const isPhysio     = /physio|chiro|osteo|rehab/.test(bizStr);
    const isDentist    = /dentist|dental|teeth/.test(bizStr);
    const isPet        = /pet|dog|cat|groom|vet/.test(bizStr);
    const isRetail     = /shop|store|retail|boutique|gift/.test(bizStr);
    const isFlorist    = /florist|flower|bouquet/.test(bizStr);
    const isAuto       = /mechanic|auto|car|tyre/.test(bizStr);
    const isCleaning   = /clean|housekeep/.test(bizStr);

    // ── Theme per business type ────────────────────────────────────────────
    const theme = isButcher ? {
      primary:'#7C1F1F',accent:'#C5382A',light:'#FDF2F0',dark:'#3D0F0F',bg:'#FFFAF9',text:'#1A0A0A',muted:'#8B5E5E',font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(60,15,15,0.88) 0%,rgba(197,56,42,0.3) 100%)',name:'butcher',cta:'Visit the Shop',services_title:'Our Cuts'
    } : isBakery ? {
      primary:'#78350F',accent:'#D97706',light:'#FFFBEB',dark:'#1C0A00',bg:'#FFFDF5',text:'#1C0A00',muted:'#92400E',font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(28,10,0,0.85) 0%,rgba(217,119,6,0.25) 100%)',name:'bakery',cta:'Visit Us Today',services_title:'Fresh From the Oven'
    } : isCafe ? {
      primary:'#292524',accent:'#A16207',light:'#FFFBEB',dark:'#1C1917',bg:'#FAFAF9',text:'#1C1917',muted:'#78716C',font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(28,25,23,0.87) 0%,rgba(161,98,7,0.2) 100%)',name:'cafe',cta:'Come In for a Coffee',services_title:'On the Menu'
    } : isRestaurant ? {
      primary:'#1E1B4B',accent:'#7C3AED',light:'#EDE9FE',dark:'#0D0B2A',bg:'#FAFAFA',text:'#0D0B2A',muted:'#6D6A8A',font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(13,11,42,0.9) 0%,rgba(124,58,237,0.25) 100%)',name:'restaurant',cta:'Book a Table',services_title:'Our Menu'
    } : isTakeaway ? {
      primary:'#DC2626',accent:'#EF4444',light:'#FEF2F2',dark:'#450A0A',bg:'#FFFAFA',text:'#1A0000',muted:'#7F1D1D',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(69,10,10,0.88) 0%,rgba(220,38,38,0.3) 100%)',name:'takeaway',cta:'Order Now',services_title:"What's Hot"
    } : isBar ? {
      primary:'#0C0A09',accent:'#D4AF37',light:'#FFFDF0',dark:'#000000',bg:'#0C0A09',text:'#F5F0E8',muted:'#A89B7A',font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(0,0,0,0.92) 0%,rgba(212,175,55,0.2) 100%)',name:'bar',cta:'Come For a Drink',services_title:'What We Pour'
    } : isHairSalon ? {
      primary:'#1E293B',accent:'#0EA5E9',light:'#F0F9FF',dark:'#0C1A3D',bg:'#F8FAFC',text:'#0F172A',muted:'#475569',font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(12,26,61,0.85) 0%,rgba(14,165,233,0.2) 100%)',name:'hairsalon',cta:'Book an Appointment',services_title:'Our Services'
    } : isBeautySpa ? {
      primary:'#831843',accent:'#EC4899',light:'#FDF2F8',dark:'#500724',bg:'#FFF5F9',text:'#1A0010',muted:'#9D174D',font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(80,7,36,0.85) 0%,rgba(236,72,153,0.2) 100%)',name:'beauty',cta:'Book Now',services_title:'Our Treatments'
    } : isPlumber ? {
      primary:'#1E3A5F',accent:'#0EA5E9',light:'#EFF6FF',dark:'#0A1628',bg:'#F8FAFF',text:'#0F172A',muted:'#3B5A8A',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(10,22,40,0.88) 0%,rgba(14,165,233,0.2) 100%)',name:'plumber',cta:'Get a Free Quote',services_title:'Our Services'
    } : isElec ? {
      primary:'#1C1917',accent:'#FBBF24',light:'#FFFBEB',dark:'#0C0A09',bg:'#FAFAF9',text:'#1C1917',muted:'#6B6560',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(12,10,9,0.9) 0%,rgba(251,191,36,0.2) 100%)',name:'electrician',cta:'Get a Free Quote',services_title:'Our Services'
    } : isBuilder ? {
      primary:'#292524',accent:'#D97706',light:'#FFFBEB',dark:'#1C1917',bg:'#FAFAF9',text:'#1C1917',muted:'#78716C',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(28,25,23,0.88) 0%,rgba(217,119,6,0.2) 100%)',name:'builder',cta:'Get a Free Quote',services_title:'What We Build'
    } : isLandscaper ? {
      primary:'#14532D',accent:'#22C55E',light:'#F0FDF4',dark:'#052E16',bg:'#F7FFF9',text:'#052E16',muted:'#166534',font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(5,46,22,0.85) 0%,rgba(34,197,94,0.2) 100%)',name:'landscaper',cta:'Get a Free Quote',services_title:'Our Services'
    } : isGym ? {
      primary:'#111827',accent:'#EF4444',light:'#FEF2F2',dark:'#030712',bg:'#F9FAFB',text:'#030712',muted:'#4B5563',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(3,7,18,0.9) 0%,rgba(239,68,68,0.25) 100%)',name:'gym',cta:'Start Training',services_title:'Our Programs'
    } : isYoga ? {
      primary:'#4A1D96',accent:'#8B5CF6',light:'#F5F3FF',dark:'#1E0A47',bg:'#FBF9FF',text:'#1E0A47',muted:'#6D28D9',font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(30,10,71,0.85) 0%,rgba(139,92,246,0.2) 100%)',name:'yoga',cta:'Book a Class',services_title:'Our Classes'
    } : isPhysio ? {
      primary:'#0F766E',accent:'#14B8A6',light:'#F0FDFA',dark:'#042F2E',bg:'#F7FFFD',text:'#042F2E',muted:'#0D5C56',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(4,47,46,0.85) 0%,rgba(20,184,166,0.2) 100%)',name:'physio',cta:'Book an Appointment',services_title:'Our Services'
    } : isDentist ? {
      primary:'#1E40AF',accent:'#3B82F6',light:'#EFF6FF',dark:'#0A1628',bg:'#F8FBFF',text:'#0F172A',muted:'#2563EB',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(10,22,40,0.85) 0%,rgba(59,130,246,0.2) 100%)',name:'dentist',cta:'Book an Appointment',services_title:'Our Services'
    } : isPet ? {
      primary:'#92400E',accent:'#F59E0B',light:'#FFFBEB',dark:'#1C0A00',bg:'#FFFDF5',text:'#1C0A00',muted:'#B45309',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(28,10,0,0.85) 0%,rgba(245,158,11,0.2) 100%)',name:'pet',cta:'Book a Grooming',services_title:'Our Services'
    } : isRetail ? {
      primary:'#0F172A',accent:'#6366F1',light:'#EEF2FF',dark:'#020617',bg:'#F8F8FF',text:'#0F172A',muted:'#4F46E5',font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(2,6,23,0.85) 0%,rgba(99,102,241,0.2) 100%)',name:'retail',cta:'Shop Now',services_title:'What We Offer'
    } : isFlorist ? {
      primary:'#701A75',accent:'#D946EF',light:'#FDF4FF',dark:'#3B0764',bg:'#FFF8FF',text:'#1A0028',muted:'#86198F',font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(59,7,100,0.85) 0%,rgba(217,70,239,0.2) 100%)',name:'florist',cta:'Order Flowers',services_title:'Our Arrangements'
    } : isAuto ? {
      primary:'#111827',accent:'#F59E0B',light:'#FFFBEB',dark:'#030712',bg:'#0F172A',text:'#F8FAFC',muted:'#94A3B8',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(3,7,18,0.92) 0%,rgba(245,158,11,0.2) 100%)',name:'auto',cta:'Book a Service',services_title:'Our Services'
    } : isCleaning ? {
      primary:'#0369A1',accent:'#38BDF8',light:'#F0F9FF',dark:'#0C2A40',bg:'#F5FAFE',text:'#0C2A40',muted:'#0EA5E9',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(12,42,64,0.85) 0%,rgba(56,189,248,0.2) 100%)',name:'cleaning',cta:'Get a Quote',services_title:'Our Services'
    } : {
      primary:'#1E293B',accent:'#38BDF8',light:'#F0F9FF',dark:'#020617',bg:'#F8FAFC',text:'#0F172A',muted:'#475569',font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(2,6,23,0.85) 0%,rgba(56,189,248,0.2) 100%)',name:'default',cta:'Get in Touch',services_title:'Our Services'
    };

    // ── Image library ──────────────────────────────────────────────────────
    // Nano Banana Pro (Higgsfield) generated Australian business photos —
    // hotlinked from Higgsfield's CDN, same permanent/free-hotlinking pattern
    // as the Pexels library this replaced.
    const images = {
      butcher: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173216_02ad9fc4-abc2-43ec-bf3e-eea29614ffd2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173216_5137dd34-0c33-47e4-a3dc-b0463ad66ef8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173216_f8f27cbb-06be-4618-914b-3c19a47779a0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173216_fddb1218-2b11-41cd-92b4-88d54a3d7656.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173214_e9107c82-9e43-4e8b-9479-feef0e7766e3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173214_cc80c3db-f45e-44c9-a44f-6e3a2f76dadc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173214_b7cc18b8-c55a-4b66-8205-bb73f485ebf7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173214_11412d5b-ca4b-48e5-8d41-53288f00cc01.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173210_84b99a0f-0d78-4363-b963-5ae758cf7bef.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173210_ffdd8290-71ff-4de0-9519-5fe177e245fb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173210_8efdc0fc-d3b4-43b6-b880-cb35557c57a2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173210_04cd8c52-45d8-4442-b9df-e5ddbb1034d1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173208_f47abbc1-eb0d-468d-bf25-22f2b7f57130.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173208_cd59fe61-72f6-4537-8521-797b4c7ed131.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173208_856c8df3-3b50-4234-ab30-c473c86121e2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173208_414c187b-b9af-4ad6-84d0-de900be765c0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181034_81ead18d-ead1-4a84-9f94-e744df1f40b3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181034_3cbd78e5-4d62-4eaa-9d01-94a759ce2e23.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181034_70bfab8d-0ea3-4527-87b3-4e91d1a70003.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181034_83d23ae4-aa4d-40f4-82d1-c34ec7a89d47.png",
      ],
      bakery: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173237_cf3a4635-195a-4f38-b830-17ba60fa1958.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173236_1fd41d9a-c915-4e43-a55d-33384a58ab09.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173236_acf68bd3-dc69-43ef-a725-d9aad0cef3d1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173236_4708397a-a67f-415e-b28b-b260c6258598.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173226_44457def-5f56-41bf-bdfa-3ba7aa89e82a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173226_abb9b329-a7cb-42a1-9fd1-6a7521e1333a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173226_be370cae-7655-4f18-8aa9-46c634c24af7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173226_eb9934df-3a49-490f-933e-0ab8b54cedc1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173225_c56f5c04-d58e-4b9c-a2bf-b4aeec11e9ba.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173224_c0acb80f-6df4-40dc-ac25-852a3d447738.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173224_deaab3ba-8279-4bec-a836-c0d14c482ad2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173224_d716c856-77cd-4fc8-b2f6-43e388cf8aac.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173220_a48fe1c3-bcc5-4040-b175-844df6c992ac.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173220_f999412b-4f4b-464e-98b2-820f952b1270.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173220_239a6cd1-78cf-4c93-aa78-cf4d3f0d5c20.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173220_27da173b-c747-40bb-9b6c-caacef92cb03.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173218_517377cb-1425-45c9-bb89-f93f2b73f3f0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173218_b289d137-349f-4130-8068-2a853d1efb00.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173218_f138cc82-75ca-4da7-bb78-240e38c5bf9b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173218_aba73493-91b3-49ed-bacd-d8c69db9317b.png",
      ],
      cafe: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173235_c07ef6e8-d63f-4b76-80b7-6ccd6921842a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173235_bd1584da-d57e-4064-9d9c-474434deec6b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173235_311e6647-64ae-4bc5-8220-86ef2e06ae30.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173235_817e2f04-7eaf-462a-946d-0a8718a7ea68.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173231_7b3613a5-9f8c-4b2a-9361-a2621713a8cb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173230_9e2a3b7b-caab-472a-b367-140c6293e984.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173230_5f385240-ac01-40cc-8b82-3742992f5e68.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173230_89883fe0-9ca6-4256-a71c-9bcfa0d36bdc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173229_ef2af24f-b639-470e-b5c5-8141fbd38a30.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173228_9159c413-014d-44b5-9b6b-143902072a67.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173228_ee3d73c1-f1f3-47df-bcf4-31708eb98530.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173228_873a352d-485a-4999-a153-e8b407a229c9.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175540_a831f5ec-61a0-4ad2-9439-ddfb8fc5c58f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175540_4cb4950c-720d-4796-8c92-836a93119002.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175540_7f7e19f9-983d-4229-952a-3902b9d3a79a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175540_1fc03fb2-383a-46a1-afa1-02a1f98bc59c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181036_f067f69b-dc35-47ef-b4a0-9189b460adc2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181036_004b18fe-f592-4663-a445-633ae3e400fe.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181036_6c49e203-08d5-4616-8c17-a41b1b6e1c98.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181036_a94ee650-3995-4908-be86-34562bf32b60.png",
      ],
      restaurant: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173300_15fc024c-573c-4d5b-8f8a-cbb6ce13fa5a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173300_0fca1200-86fa-40fb-888b-0734946e876f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173259_6f5c2d4d-d080-413c-a5dd-35f34934d06a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173259_c317a9e0-4e42-4a6b-865a-032b902d6076.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173258_8c02585d-6879-4675-89c8-9bcb2c3240fa.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173258_11d43e5a-ad0c-4de5-9e50-795e6fa0ad6e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173258_0db940da-fbaa-4e64-a649-b99f6e199ad8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173258_7ef66eaa-b984-4c75-a833-086ebe98adf0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173253_66cd5185-30f8-4f9a-9cc9-87ca79f9925d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173253_c69bbced-e73c-499c-a995-27803ae91698.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173253_5c1fda60-30d3-4fc6-ab99-d9736d18e41c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173253_5cad6d83-e2e5-4982-b6c6-ce0cf1dc6d42.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173252_e0f000fc-5c9a-41fc-80ee-c910c82f2b61.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173251_46e80c1b-ad32-4646-a837-1333a5a97b2c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173251_5feae047-5e77-4bf7-90db-d2c02858b069.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173251_4606fca4-8762-4447-97d0-1bed8249c1a7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181038_88f0e24b-6e68-46f7-af6c-b115e32ec85c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181037_89b05516-93bc-4c39-b808-77f23251bdd0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181037_f5cd17a5-2ee5-4d44-a89d-37791437838f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181037_4973970e-9e53-44c0-a496-e22fdf8464eb.png",
      ],
      takeaway: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173310_ce6996e0-4233-4b3a-af21-232b6c8af1fa.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173310_32c29f6d-358b-41e8-9128-f8e3988528c6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173310_7eebc656-bcbb-4208-ba36-c2dce2bf2827.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173310_540fee73-890b-4cfe-b440-0f8f411d1d93.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173305_e8843f5a-46cc-4b7e-a891-7acad4499b44.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173305_5dbadc50-2652-4dca-be2c-797c25420496.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173305_722b8de7-6fd4-40b9-826c-0c61e5e78089.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173305_4552bb80-d2eb-49d5-8e39-61d27bf0d007.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173304_21fc0a23-0c76-4577-9d2c-b609bb9fa74c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173304_0e17c37e-971a-45a0-bd91-f67b1c1fe4f5.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173304_f4985e79-a2fa-4dcf-91ca-1bc47bcb317c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173304_68d21342-6ea2-4951-86b0-1e6f74f7fde0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173302_45ddcee3-ba66-4b67-a795-bc6fddc386ad.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173302_886c8f93-45e7-4080-b555-2e158eee4009.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173301_c38289db-c20e-4288-9398-fd37a9506dad.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173301_f2153662-beac-4335-b068-b9f4d6f1348d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181040_ebc97561-16ca-4e90-9c69-7d5bcdc3c68e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181040_a0d2e357-fc31-4215-8752-2f38043dc7db.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181040_5db9c1cd-ce6b-4221-ac18-fe944d743a3e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181040_0b80824c-01c2-420f-a990-8f82f4e24404.png",
      ],
      bar: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173321_d7657d50-6416-4edf-94ca-f6af2e3f69ea.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173321_27e4c004-190e-45c2-94f5-9f05ef783d44.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173321_b2965878-80ad-475e-a990-71adb718017d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173321_8fbe4fbd-4a2e-4308-8923-5021564551d3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173319_1a0d9c81-6034-4949-85bd-0a12225e89d5.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173319_29286a8a-d757-410b-be6a-c52ace57b717.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173319_2e026831-e9e2-4752-91bf-3962a3c97d2e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173319_933cffca-35ca-4b36-ad6e-696b8af2b5f4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173315_2c0cc1bb-0599-4abc-8014-f83e7c62a834.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173314_2a836deb-885a-4c3d-9e54-13eb9a400846.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173314_82633c8a-277a-4e8e-b51b-63b2b5d8e251.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173313_29cad47d-7c16-4bde-bdf7-ded4ca9dcdfb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173312_caa80ac4-0745-4a68-9818-40bb5a5337f2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173312_0ea5c4a8-57cb-486b-8724-3e2dd34e3b02.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173312_7420ba19-2697-446a-9768-b4abf9b7d114.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173312_37c039c1-4fb9-4c83-b98c-59eb786f8fe9.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181042_0ffe24a5-7053-47d7-beb8-cfdfc1886b12.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181043_9e3d4a6b-30f9-4251-a09a-dc80bd77370d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181042_0b1bfd1e-5d64-484c-bbd0-a0eeae39d49a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181042_f89cbf20-18ba-4685-8caf-004335ba45fa.png",
      ],
      hairsalon: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173331_346f01a0-f372-49fb-8485-a4e153d5690f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173331_7c7bac25-d943-442a-9225-e3bb0841e117.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173331_eebdfd09-4762-40ae-b62c-6d113c6ec232.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173331_364a99d0-001c-4a1f-a1e9-4209a632114d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173329_c92e3c4d-4bc1-4a5c-b759-e942984576f0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173329_820ea347-40ba-4232-9f0f-8da54c573d70.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173329_7b45ced2-e005-4064-8a6a-6345361f7eaa.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173329_019a9435-add5-4632-9647-c4045752789c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173325_c1f3a844-f790-4079-8843-467cf557d799.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173325_934c3398-d644-4cd5-b7b2-1c6d589de59a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173325_bee34036-5b92-4497-8bf4-035971671e82.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173325_17f730a9-02c3-4dd7-9d6c-541b8a03198f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173323_ecbbaf77-3488-47c4-a9db-bf076ad93132.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173323_2737f49f-9444-44a5-a479-bec61a2c6773.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173323_101c3a71-a8b9-4b3a-95c0-0a64b5031cb4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173323_b7c2f7ae-2296-4456-a642-fe55b3e54590.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181044_00c1094f-9695-41b4-86ab-682cfaeb2cae.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181044_56c6cbf3-7c2c-4dbf-80df-50b88350ca68.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181044_6d5449aa-40bb-4c65-bf83-74da5b74ecaa.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181044_8e61b86b-6ddf-4c49-802f-3c35a7660e91.png",
      ],
      beauty: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173409_d675cde5-c7f4-4f19-a5c5-394fdf6d476e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173409_53a11608-cce1-4f81-83fa-4a1a2e1ab8cf.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173409_8a491729-e64a-4257-b0e2-a60fa154c957.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173409_08c323cb-a192-436d-90ef-c1ab3183d661.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173341_459fff82-067e-44b1-9680-6a281c40bc0a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173341_3c9be3b4-c517-49c6-8238-359d7d738a82.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173340_648454d5-65d1-4f2a-8335-bfa3c9473c77.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173340_d528d9de-20d0-483d-97e9-c5106841c968.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173339_ab5de9c4-9b7d-4f08-afe0-088f1f642941.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173339_bcf6d945-11ae-46ed-bb23-2ec21dde91f2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173339_7d0913e7-fbfd-4ff1-a316-245b00e61829.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173339_14348cca-208e-4e2d-8ff0-c62165b27168.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173335_e470b8a3-049c-432a-a2ea-836fe7c489fc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173335_6ea1ceb8-fd94-4534-ba9d-a684409e5899.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173335_d2ccc8bf-dea4-42c3-a8df-81d02b66bbc3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173335_efe7a23f-2d45-4708-9025-aac9d839433c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173333_4f2b11ef-e4d2-4ba3-be11-8fde66f94d6b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173333_308cfff9-ea29-45ff-b2f1-75279a47ad06.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173333_7ec40d35-e1f6-4440-af41-d0a0b7a96a07.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173332_25ea8eb3-3d5e-4799-ad70-b683cd2a0c7d.png",
      ],
      plumber: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173153_996de14c-fb7b-481e-8853-28940b861a75.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173153_d88232f2-81ac-4371-a7f9-6be48a2d8eb7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173153_2db7f87a-1d67-41ab-9d31-ed622f94ecf8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173153_a9051bb5-14b1-4b71-aa28-f9c468f1eb89.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173151_9763a3cb-7294-4e0d-a8ee-757f824ae096.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173151_06ab771e-46fd-4d57-a610-8ffdc3acd50b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173151_a70ff60a-703e-444f-8191-e0c7ebe2c48c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173151_0852a7b8-57d8-42ba-ad34-54324c2c7f5e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173149_3160adf0-a5a5-4c1c-ac45-9066ddf69da5.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173149_3541683b-5042-4cfc-b8a6-19b223ba1489.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173149_c8885693-e78b-4474-bad0-c0b4b79547a1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173149_4f9b2d79-e0a2-47f6-bd43-fcdeaf8a443c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173147_95778575-064e-40e6-ab54-aac25f9c0476.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173147_2d29e462-62d8-4b5c-b93a-0a6c83541184.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173147_79796f2d-0cb6-4951-a456-3961cd3b4984.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173147_6cb6a18d-ab0d-4d35-bad0-2c22689556b9.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173145_84e88e7b-537c-42bd-8f87-313d3f03edfe.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173144_f281d95d-b336-470e-8fb9-cceabe2b8ed6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173144_719f6fe4-3c59-4672-a439-2bcf078bd171.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173144_5fa813f6-8217-477e-9d9e-6957cae4dd0d.png",
      ],
      electrician: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172611_258839b7-7a6b-41b6-8736-3431b94b84f2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172611_18ba0c38-6f5a-4850-b599-11dd0bba186d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172611_85b21941-72a1-4dfb-a081-c498959021b1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172611_6a8b348f-d0cc-4187-963c-c3a6926abd7c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172637_5d14c829-f7cf-4fef-95cc-1cebf58e25ac.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172637_5081225c-266f-4edd-aee2-a543bf5ffe57.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172636_e034f89e-3b2e-49e3-9a4a-39031373937e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172636_92a13a86-0f40-453e-96ab-ed209aa2e6d0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172638_b67df4d7-70a7-4239-bea3-647d5a506e47.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172638_9b6eab7f-91b6-4d22-94cf-f0747bb9a3c4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172638_bf6fbe0b-a6a6-4f4f-972c-783f9370d731.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172638_8fe2798e-bae0-4c33-b00f-1791e8c6b115.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172640_6e0aaa5f-f090-498e-9bc6-abbc5831e3eb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172640_736bab69-1fb2-445f-a59f-44c28ae2614d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172641_50285448-1d03-426d-96b3-d5cb9f35d5fa.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172641_67fa4dc2-d5a1-4a39-b594-23409826fee6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172642_c3e3fd6b-6120-48c3-a0ca-f4675a32c771.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172642_cc3e69fa-bc71-476c-8d62-e1afdab00884.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172642_1f9c4aa6-e7f7-448f-ae91-b9db68a21dc1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_172643_06c5429a-72fa-4751-93db-0d449fa61d12.png",
      ],
      builder: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173403_c91ef34c-b903-43d0-a8bc-56ad8e75062f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173401_1faf2453-183d-4122-a5e9-ac7ab16e04b8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173401_a8c3e459-0dfd-4239-8c48-3350b11bd252.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173401_aa30a115-3202-417c-8476-0e57d781d3a2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173359_85ad352f-9e3c-4509-b20f-41bdc8a89bad.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173359_99075c13-1529-4f22-85e2-9c349d3cbe97.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173359_cf863fbe-f137-4e34-9740-810589fe7f23.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173359_9aefc255-62cd-462e-8a21-ec8ae53b8f1e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173357_30f91647-c14e-4478-a57a-9d76e21f6b25.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173357_fc0ecbd0-9750-4394-82e4-6545f513f9c3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173357_cab91287-20f5-4039-bb7f-000382a7a969.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173357_e4beec33-1112-4b09-81f1-10e7f7802262.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173355_974aef3e-af9d-443e-9924-d9180f48d0cb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173355_4801a0c3-d6bb-441b-97f2-25a7980859ce.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173355_c7d1e0c2-e5da-46d6-b873-ce70e0b0d8f7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173355_8d099245-501c-460e-b2db-475ba4821c17.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173354_f8ad42bc-e415-41ed-b589-30b37cb73f88.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173354_3bf01a51-323e-48ae-8d99-a7bfc6b39ded.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173354_2088baf7-c700-4b09-81e1-cae98c39bb73.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173354_e4d6bb29-582d-446b-a525-1995bb4f64f3.png",
      ],
      landscaper: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173414_38d8c1be-f15e-4033-acc6-35759c0f5bbd.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173414_06735556-69af-4af4-94e5-381fc56c1f07.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173414_5dbd6e7a-37b4-40cb-8e9c-6028100403ef.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173414_19241952-cd82-4326-927c-a9a4a0c75ee4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173412_08d4a574-a8ba-4393-b8a2-7509a41b4e73.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173411_cdd5052c-29e6-48d8-8881-a03fda32899c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173411_84df65f9-3fdc-433b-9075-dca40a2a47e0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173411_e28b0a0d-25ee-41df-86dc-16306bd86db3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173407_504b40f1-b0e6-4b28-ac19-f3cd063ff39d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173407_875d4175-4414-4503-83d2-4a3e3c47d266.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173407_188c9c41-dd4d-4713-afc7-53ea64a75d83.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173406_56c0dd83-84de-4a6b-a807-ee7056e6b83c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173405_5a3810b1-c218-4936-bd9a-bde3f40d818f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173405_e836a717-e64c-40d3-83af-ad053dd6a43b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173405_9eebbdf0-7312-4fe9-9ae9-254c9eb4d489.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173405_448d0ba5-7e71-4c9b-b062-5d8262c1b837.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181046_522d5a04-d24e-49ed-bc8b-f42275cc7c5d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181046_d74323eb-2e73-4cb4-a2bd-0529045f7571.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181046_9db6eef2-30bb-46c7-987f-bd0b671f9aef.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181046_a59a99d0-c090-4389-9914-77a8fb7e546f.png",
      ],
      gym: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173423_872fe016-ac98-4e94-b37f-3feb795192c6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173423_e7661b9f-3a72-467c-b3a2-9809cac3b830.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173423_901a7f72-98ca-47ca-a2c9-98f3f6c7b122.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173423_61a199b9-d7bd-4b65-851d-a3ba3aaa8557.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173422_e0eda30b-d802-4d16-9a1a-baf01bf2d6c1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173421_07bd15f8-6207-43c0-928f-0a85a291ac3a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173421_80e6d2ee-147e-4d77-99a9-4ff20da553bc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173421_36c8f411-2771-42bb-9d95-56721cb5947f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173418_c9147bd0-e45e-4175-a75f-dd26a78f548b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173418_a6b47714-b166-4909-8da8-cab5ac2e2070.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173418_8ac2db15-73cb-42a3-80ae-6960acfa0d5c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173418_2e5f8c85-17c0-41f4-b3a2-d214b8b3d513.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173416_3794b883-3ed8-43f0-9d4e-ee4defe49d3a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173416_54f75822-a80c-4e9f-95f1-fd0291757dde.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173416_32f365bb-d5ec-4a13-824f-4dce8e2532c5.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173416_c81d7232-6550-4b63-8b23-3a53429987da.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181047_165159c3-1763-4a06-b8dd-effa26a3d2c4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181047_e3938db9-6780-465c-b355-7039429da7cc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181048_74dfc7c5-f586-4f32-9506-933228ffcb62.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181048_4bfd3702-376f-4058-83fd-d3ee7659ad24.png",
      ],
      yoga: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173434_d41861c4-6ca3-4d4f-82d7-370b45f4d4af.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173433_56233a57-9d0a-43cd-97a0-16241d7aa64d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173433_ba0ee65d-53d4-4883-bfad-1ad75435decc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173433_f8fd378a-cd41-4fe8-a8b7-f4a9dbd93d73.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173431_1adc3bf0-d645-4c29-bde8-dc87b16ba64a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173431_ac0b7d0e-ec7a-48f7-9313-482e808dd457.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173431_2a692273-eb5d-4fab-8821-26c84ddab938.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173431_d6019ba1-c4b8-45c6-8117-9f1a709417cb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173427_41ac5349-a2f1-48ca-95e4-bebc8ec2e168.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173427_4ddc149c-94c1-41db-aab9-e352abd48db1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173427_8b977919-0910-4188-bf60-a8f343896001.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173427_46d4c282-3190-46b7-abca-bc3e49f99fbb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173425_a5de129f-f438-4c6c-8aec-c2c226685f11.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173425_7254c867-bf37-48b3-af6d-48de651fd962.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173425_2b3cc853-7096-442c-b0fa-9ccefdce6e71.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173425_88958a4e-1caf-46fc-9490-a5058ec07015.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181050_4ad2c8e3-2d3a-4794-b6d3-9b3ab8cc3137.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181050_43aaee08-ea3b-43d5-a1ff-23f09dcfcc66.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181050_75df40ec-95fb-4535-bbc9-ce5d9f4586b4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181050_983bd79e-cc50-48b0-8f13-2362423dd327.png",
      ],
      physio: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173454_c11182bd-51f5-44e8-880b-707e514962f6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173454_1b0b7e4e-0319-41d6-863d-3d2c47a51d08.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173454_5705f71e-200c-41a6-8acc-8a265e7f6ecc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173453_e97c1252-39d3-465e-8cea-3a6ba64295d4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173452_e4576b99-ffe6-4cb1-9d7d-c087868aa2c2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173452_06150f07-df6f-474a-a092-51527b368bb0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173452_a2786720-fb78-495d-853b-66c7ff164416.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173452_df92887d-3fdc-42e6-8037-a5dece858e1d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173448_a6580e26-b9a6-48df-bd58-5050254e8c49.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173448_502d8d95-5c10-45e2-81c1-6b5e2dc38b27.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173448_a33e9f61-2e73-48db-ab47-02d06e4bd310.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173447_8c7b4a69-7738-47ab-a48c-053dd3633250.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173446_03f70e01-6ce9-400d-afe1-08d895e50dfb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173446_8d1fbb0b-8391-4ce3-9663-f5dd937a3e53.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173446_ed1a890f-13b3-44b4-90a6-786ffef4a280.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173446_7637390b-ceb9-49d7-9334-38ce7f548551.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181052_dfca3525-0eb1-4598-9acd-366bab47e457.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181052_a6b13e8d-ca5d-4ef3-a1f9-a71a44c05ffe.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181052_bb46e443-6d19-4eed-a500-762041de46a2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181052_bc6293ae-3d12-439c-aec1-4069a8c2ed25.png",
      ],
      dentist: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173458_5dbf2332-3083-44f0-a0b4-f8637a509504.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173457_7835bed0-385a-4c71-8fb9-535ae03b64bd.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173458_415a90ff-f49c-4ba2-8ab3-824eb63d32dc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173458_af6c5c08-1572-410f-9917-d9373b53a2a8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173456_b416ad05-da70-4007-b617-d76d8afffcb3.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173456_2e8e7a6b-8ee9-407a-8443-f09d5da6cde7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173456_b79dd0c6-ff8f-49b7-b9d3-8e22ab1315b2.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173456_7bf5bc20-19a9-4bf1-afd5-e02fe88c76d8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173504_4bb772d7-0bb0-4bb4-bab3-ac9142ba1bd4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173504_1bb11837-4d1a-4d1e-bd7d-a05f7f72749c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173504_6aafe75e-c096-47dc-be3f-214febfc0801.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173502_89cf9633-83e4-44c7-96f1-d2480a91c808.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173502_b424053c-0bf3-4295-a494-6fdfc196c668.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173502_352bde7a-3ea2-4283-aab7-f3ad29632f42.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173502_91164550-3d09-438c-969d-8ce675047dd6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181053_a9b257a6-954e-4d4f-923e-f940d873dec8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181054_9ce6a26c-fd31-4a1c-bddd-123d3ef4939a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181054_53f105fe-3691-43a5-b0b3-9f6b2c6cb37c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181054_567e1a92-6d86-4e9b-95e5-df61263d792b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181055_3c0a0b35-2753-4a66-a5a0-d166fc9aab40.png",
      ],
      pet: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173515_d8986e2f-61d8-434d-bb3f-b065e06acf7f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173515_d36d7b74-7788-44b8-bdfa-654d0b40278f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173515_b870c52e-4d0a-44a7-9f67-95cf6f9ab71a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173515_71480597-9254-4d43-bd24-be850bf17e11.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173513_8c9a8250-e54a-4297-a7a1-236ce2746ad9.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173512_da5438f6-968a-44e7-9d42-1047dfc720d6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173512_7722ec78-b2fb-44f1-bd13-a8acb7779e6b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173512_b4d6b33d-a22a-4f5a-a40f-4df20e32917e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173509_179796e2-712c-448c-8ab2-26e62b900e88.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173508_6a15a225-619a-481d-8205-1d5e01c36671.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173508_e2a69ec6-058f-4558-97dc-496c957ace10.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173508_ca72565b-6355-4935-aa4b-4383e56a9755.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173506_5e649a1e-c15d-4cf6-a869-2dad403b527e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173506_c32ca0ea-bc91-4fc7-a3ba-15e083d9db80.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173506_ec46536c-1981-47ee-b22c-539754d59527.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173506_879487a7-7f1b-489e-a92a-d0865636c0bf.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181057_bda6b00c-da26-442d-89e3-dc39a3e84645.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181057_a9a6e65a-1f9b-488b-b501-4912a0a320fa.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181057_a1562606-dbab-4fb0-bf9c-7ddd118b9f9b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181057_3e59dfc1-44f2-4a40-9407-ae72557a7e5c.png",
      ],
      retail: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173525_bbb770d3-d483-4ec0-a75e-65d13ea12b07.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173525_6d64e21a-0084-4d2a-bcfd-71e28dfa7731.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173525_fab4875c-4b1d-4d2d-86f0-9373fdb4f93a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173524_a9fa2690-cb99-4a24-b2a3-77dea1fca53a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173522_86e9ac0c-37cb-46d7-b2df-5e6b54508ae0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173522_1fb25065-daf8-4b38-aba5-2b89b259288e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173522_dc76ba68-891b-4d4f-b750-faf9b5dd515d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173522_0e1f012e-47f9-4969-8606-3ff5088ace33.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173519_471e830f-6e0f-4493-8d26-5032cb373e97.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173519_e6926195-e0f0-4102-840d-62a0a1726b41.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173519_fa0e3303-ce97-449e-ae49-c63cd973809c.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173519_59375c3c-7b5a-43cf-bb18-e0accaffec19.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173517_4a385d82-d892-4a8e-9ef2-910902273282.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173517_5515ef02-f705-4c60-8a67-ce54cc48c4a6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173517_20746a38-3d18-4b52-a316-72db7bdf1327.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181058_64dd5b95-373f-4aaf-a4b8-59317e53b188.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181058_d309a2ce-e22a-40a4-b80e-6326b6c560fc.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181058_a4accf73-5c98-465c-856c-a693f8acd222.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181059_1fc73385-e7f4-4a67-8eff-fae6814b9f3f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181101_32cb0666-7e84-470d-8939-13e1af1048ff.png",
      ],
      florist: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173832_08dbdf56-604b-4518-bfd8-5b204c558d56.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173832_b7c556d4-8fc6-4fb9-9931-cdfb9cf7b37b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173832_722869d4-8fb9-41f4-b177-9fd894dfdbfb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173832_ef2d065d-da4a-40ac-8f2c-b431e9ed316b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173830_a0013514-8699-4824-83ac-7cc7bd6d1eee.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173830_b31dd1b7-25c6-40bc-b40d-601433e2a20f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173830_d7016a7d-f623-4350-98a1-4f7f8d07c3cb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173830_b34ae332-a34b-4ac4-a63d-646395ed7f56.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173825_1058f77b-d07a-481f-a6b4-99e031f23c6f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173825_a8b39bfb-bccd-4efc-bae5-3cab92879f09.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173825_3ead7c9f-8225-49da-b231-1cba5ba81214.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173825_ec14edd3-1463-4766-8497-8f0e6171fd66.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173823_0398526d-db7c-4da8-85ae-e8e579647b6d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173823_940c0c31-d836-4979-b709-f8fb1514325e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173823_7e407c37-e5ad-415f-931d-7b16b44ba483.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173823_5998f881-f9c7-4efb-8f94-a2b2f1806db7.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181102_36e2e66e-f8bd-489a-b7f8-fdea1a3bbc14.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181102_a42865ee-4bbb-4fdd-80c7-61ec196dc91b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181102_64c1d9f7-e930-48ef-b02b-1c9aa3d0e419.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181102_050c9adb-854a-4b8b-bda8-1e5cd31544e3.png",
      ],
      auto: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173843_80899c2f-8f85-4436-b688-c49ebb211d60.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173843_614bd9d3-c2c6-4d6e-b6a1-b5ba5ddb152f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173843_96750155-fa69-4801-8f94-e42a77d40830.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173842_f9b16658-9b0b-44c3-ae4b-492e4f88dcef.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173837_0f436909-79f9-49e6-8c42-1390abb5627d.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173836_9c8530d6-3cfb-4bfb-84c8-34fce5ad6fa6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173836_3c919409-0e82-488a-a21a-612b98dd944f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173836_d9149b6e-629d-41d2-924a-6a10637aa65e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173834_213c1e0d-a8e2-4900-a5d0-720c4dfd39f5.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173834_89c37dbb-68f1-49dc-acf3-b6c0d2466a70.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173834_09c1eb45-757f-4cfa-b353-b8716bca6eb9.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173834_13f7b6ac-54c9-4ecc-a3d3-4a91e31e1753.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173841_05262351-cc13-47e2-912b-e44fc29af8a4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173841_7dd0aa24-f742-45a2-9621-5f6a5eed8369.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173841_3e7041a9-2de2-4c34-aa13-74a3921ab9e6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173840_182704ee-241b-44f1-95b2-9d02c6f32ec1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181104_ba5920cb-f40a-467c-abf5-d680764b85c6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181104_c9fa5708-8e3d-476e-b6e3-fc89181f8db4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181104_5a66b9e5-95a5-4011-b7b0-033f346644e4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181104_2c336420-425b-4fa4-b9f1-faf9a2a776bf.png",
      ],
      cleaning: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173852_9917c4c2-df31-46b2-b863-d7b6e879fb94.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173852_95982abc-a7ab-40e3-ad64-3f7f9b9dff39.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173852_ee2366ce-79c1-41cf-b300-32677b3bd018.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173852_0ed0a27f-3ece-4ae7-9f2a-6e941408c13b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173848_be73f360-bb6e-4a3c-aef8-5a1c43aea30b.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173846_66ca300a-f1e1-4a3b-a573-02fad6ed5387.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173846_0ecf0853-69ad-4769-8356-9d4e8464f331.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173846_df4e9c6c-b48f-4850-b400-c6d486f9ce77.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173845_a8a5268b-76c2-44c4-a411-bf2c08c655df.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173845_4457e900-5664-41db-86ed-457c7abd5d96.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173844_483e6609-f597-4a4b-b2bd-ee40e0fdda72.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173844_a1d04b18-99a5-40c8-8bd4-35d9afb53f3f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175547_ab74d5c7-d2cb-4075-a3c0-4a25dc47b2af.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175547_4aea07cb-f7e5-4e64-8aef-dcd533c2adfb.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175547_7be11270-fc69-4fcb-9368-cc12d2cf5831.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175547_18d61072-5248-4b33-a3b7-7f679e006196.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181106_506dce02-1478-4ca3-8c37-7346d4bd9211.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181106_cca3d62e-ae18-4821-8b77-fc0604c44e46.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181106_851d9ace-2b18-4595-81fe-0399109cef24.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_181106_6bca1a51-66ae-4118-a54c-7623941d45f4.png",
      ],
      default: [
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173900_50d9676e-220a-4ead-982c-2ee87a8e0188.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173900_5c2a0147-032b-4a23-a7b3-3a4a4f02fea6.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173858_17b1187b-dbf1-41ad-b918-ac1a634121b1.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173858_1020ea81-a0d2-4da0-a480-e25fa0252094.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173858_43fc4f8f-e18d-4a60-8298-ba18011cdab9.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173858_ee387a7e-70df-4fac-ba4c-d9d20fd4d86e.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173856_87aa29d6-65a9-40b7-ba28-40ad427371a8.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173856_25a23e8d-1756-45fb-81a9-bf809c30a2b0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173856_191d3b3d-b5a5-4eeb-885a-0739dc5a095f.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_173856_6961795f-4cda-4427-86f9-46e2f913c35a.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175552_0954f4ea-b9a6-4b53-a484-930c726b7f53.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175552_183e070a-9292-4861-865e-290f8cf0f494.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175552_1d1627a6-ee63-434b-afb1-d8164aa5fcca.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175552_8eef7890-d8e3-4a0f-9c9f-a3bede7c4dda.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175554_6e0a57d2-813e-4214-8602-d95aeda88786.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175554_10fea03e-1c10-4d1a-bd28-5a4ffa07eb99.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175554_e9ea8299-a184-412e-ba2a-18c35283e6a4.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175554_a6cff73e-cf08-4161-9ae0-c1498e7187d0.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175556_b693b10f-e69f-42bc-9686-727589068557.png",
        "https://d8j0ntlcm91z4.cloudfront.net/user_3DevHdEbsFHIyJhA1tPY7Z9wDsj/hf_20260709_175556_a0880385-b917-4213-8a08-3d27b04f8399.png",
      ],
    };

    const lib = images[theme.name] || images.default;
    const seed = biz.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const heroIdx = seed % lib.length;
    const hero = lib[heroIdx];
    // Rotate through the pool per business so different businesses in the
    // same category get a different hero + gallery combo instead of every
    // customer seeing the same first image.
    const gallery = [];
    for (let i = 1; gallery.length < 4 && i < lib.length; i++) {
      gallery.push(lib[(heroIdx + i) % lib.length]);
    }

    // ── Generate AI content ────────────────────────────────────────────────
    const aiRes = await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6',max_tokens:3000,
        system:`You are a premium website copywriter for Australian local businesses. Write vivid, specific, emotionally resonant copy personalised to this exact business. Return ONLY valid JSON.`,
        messages:[{role:'user',content:`Write premium website copy for:

Business: ${biz}
Owner: ${ownerName||'the owner'}
Location: ${suburb}, Australia
Phone: ${phone||''}
Email: ${email||''}
Type: ${bizType||theme.name}
About them: ${description||'A great local business serving '+suburb}

Return JSON:
{
  "headline": "8-12 word hero headline. Powerful. Specific to ${biz} in ${suburb}. Makes you feel something.",
  "subline": "2 vivid sentences. Sensory details. What it feels like to be their customer in ${suburb}.",
  "about": "3 personal sentences about ${ownerName||'the owner'} and ${biz}. Their story, passion, and commitment to ${suburb}.",
  "services": [
    {"name":"specific service","desc":"2 vivid sentences — benefit + experience","icon":"emoji","price":"realistic e.g. $65 or From $120"},
    {"name":"...","desc":"...","icon":"...","price":"..."},
    {"name":"...","desc":"...","icon":"...","price":"..."}
  ],
  "why1_title":"First reason customers choose ${biz}","why1_desc":"One sentence",
  "why2_title":"Second reason","why2_desc":"One sentence",
  "why3_title":"Third reason","why3_desc":"One sentence",
  "testimonial":"2 sentence glowing review. Specific detail about their experience at ${biz}.",
  "testimonial_name":"Australian first name, ${suburb}",
  "cta":"Warm, specific call to action for ${biz}",
  "tagline":"4-6 word footer tagline for ${biz}"
}`}]
      })
    });
    const aiData = await aiRes.json();
    if(aiData.error) throw new Error(aiData.error.message || JSON.stringify(aiData.error));

    let c;
    try {
      c = JSON.parse(aiData.content[0].text.replace(/```json|```/g,'').trim());
    } catch(parseErr) {
      throw new Error('AI returned invalid JSON: ' + aiData.content[0].text.slice(0,100));
    }

    // Apply sanitization to all AI fields (same escaper used on the raw
    // visitor input above, in case the model echoes any of it back verbatim)
    c.headline = safe(c.headline) || `${biz} — ${suburb}`;
    c.subline = safe(c.subline) || `Proudly serving ${suburb} and surrounds.`;
    c.about = safe(c.about) || `${biz} is a trusted local business in ${suburb}.`;
    c.why1_title = safe(c.why1_title) || 'Quality you can trust';
    c.why1_desc = safe(c.why1_desc) || 'We take pride in everything we do.';
    c.why2_title = safe(c.why2_title) || 'Local expertise';
    c.why2_desc = safe(c.why2_desc) || 'We know this community inside out.';
    c.why3_title = safe(c.why3_title) || 'Personal service';
    c.why3_desc = safe(c.why3_desc) || 'Every customer is treated like family.';
    c.testimonial = safe(c.testimonial) || `${biz} is absolutely fantastic. Highly recommend!`;
    c.testimonial_name = safe(c.testimonial_name) || `Local customer, ${suburb}`;
    c.cta = safe(c.cta) || `Ready to experience ${biz}?`;
    c.tagline = safe(c.tagline) || `Proudly serving ${suburb}`;
    if (!Array.isArray(c.services)) c.services = [];
    c.services = c.services.map(s => ({
      name: safe(s.name)||'Our Service',
      desc: safe(s.desc)||'Quality service tailored to your needs.',
      icon: safe(s.icon)||'⭐',
      price: safe(s.price)||'Contact for pricing',
    }));

    // ── Build the premium HTML ─────────────────────────────────────────────
    const darkBg = theme.name==='bar'||theme.name==='auto';
    const phoneDisplay = phone||'Contact us for details';
    const emailDisplay = email||'';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${biz} — ${suburb}</title>
<meta name="description" content="${safe(c.subline)}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(theme.accent)}'/><text y='72' x='50' text-anchor='middle' font-size='60' font-family='Georgia' font-weight='900' fill='white'>${biz[0].toUpperCase()}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${theme.font.replace(/ /g,'+')}:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:${theme.primary};--accent:${theme.accent};--light:${theme.light};
  --dark:${theme.dark};--bg:${darkBg?theme.dark:theme.bg};
  --text:${darkBg?'#F8F9FA':theme.text};
  --muted:${darkBg?'rgba(248,249,250,0.55)':theme.muted};
  --serif:'${theme.font}',Georgia,serif;--sans:'Inter',system-ui,sans-serif;
}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}
@keyframes fadeUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
@keyframes zoomHero{0%{transform:scale(1.1)}100%{transform:scale(1.0)}}
.fade-up{opacity:0;transform:translateY(40px);transition:opacity 0.8s cubic-bezier(.16,1,.3,1),transform 0.8s cubic-bezier(.16,1,.3,1)}
.fade-up.visible{opacity:1;transform:translateY(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}
#nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:all 0.4s;background:linear-gradient(to bottom,rgba(0,0,0,0.45),transparent)}
#nav.solid{background:rgba(${darkBg?'12,10,9':'255,255,255'},0.96);backdrop-filter:blur(24px);border-bottom:1px solid rgba(${darkBg?'255,255,255':'0,0,0'},0.08)}
.nav-wrap{max-width:1280px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:var(--serif);font-size:1.5rem;font-weight:700;color:#fff;letter-spacing:-0.02em;transition:color 0.3s}
#nav.solid .nav-logo{color:var(--primary)}
.nav-links{display:flex;align-items:center;gap:36px}
.nav-links a{font-size:0.8rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85);transition:color 0.2s}
#nav.solid .nav-links a{color:var(--primary)}
.nav-links a:hover,.nav-links a:hover{color:var(--accent)}
.nav-book{background:var(--accent) !important;color:#fff !important;padding:10px 24px;border-radius:99px;box-shadow:0 4px 16px ${theme.accent}44}
.nav-book:hover{transform:translateY(-2px);box-shadow:0 8px 24px ${theme.accent}55 !important}
.hero{position:relative;min-height:100vh;display:flex;align-items:flex-end;overflow:hidden;background:#000}
.hero-img{position:absolute;inset:0;background:url('${hero}') center/cover no-repeat;animation:zoomHero 16s ease-in-out forwards}
.hero-overlay{position:absolute;inset:0;background:${theme.heroOverlay}}
.hero-wrap{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:0 48px 100px;width:100%}
.hero-eyebrow{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:99px;padding:6px 16px;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.85);margin-bottom:28px;animation:fadeUp 1s ease}
.hero-dot{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
.hero h1{font-family:var(--serif);font-size:clamp(3.5rem,7vw,7rem);font-weight:900;line-height:1.0;letter-spacing:-0.03em;color:#fff;margin-bottom:28px;animation:fadeUp 1s ease 0.15s both;max-width:820px}
.hero h1 em{color:var(--accent);font-style:italic}
.hero-sub{font-size:clamp(1rem,1.8vw,1.25rem);color:rgba(255,255,255,0.75);line-height:1.85;max-width:520px;margin-bottom:48px;animation:fadeUp 1s ease 0.25s both;font-weight:300}
.hero-actions{display:flex;gap:16px;flex-wrap:wrap;animation:fadeUp 1s ease 0.35s both}
.btn{display:inline-flex;align-items:center;gap:10px;padding:18px 42px;border-radius:99px;font-weight:700;font-size:0.95rem;transition:all 0.3s}
.btn-accent{background:var(--accent);color:#fff;box-shadow:0 8px 32px ${theme.accent}50}
.btn-accent:hover{transform:translateY(-3px);box-shadow:0 16px 48px ${theme.accent}65;color:#fff}
.btn-ghost{background:rgba(255,255,255,0.1);color:#fff;border:1.5px solid rgba(255,255,255,0.3);backdrop-filter:blur(8px)}
.btn-ghost:hover{background:rgba(255,255,255,0.2);color:#fff}
.hero-stats{display:flex;gap:56px;margin-top:72px;padding-top:48px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;animation:fadeUp 1s ease 0.45s both}
.stat-n{font-family:var(--serif);font-size:3rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-0.04em;display:block}
.stat-l{font-size:0.7rem;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-top:6px;display:block}
.trust-strip{background:var(--accent);padding:16px 32px}
.trust-inner{max-width:1280px;margin:0 auto;display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:8px;font-size:0.8rem;font-weight:700;color:#fff;letter-spacing:0.02em}
.section{padding:112px 32px}
.container{max-width:1280px;margin:0 auto}
.label{font-size:0.7rem;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.h2{font-family:var(--serif);font-size:clamp(2.2rem,4.5vw,4rem);font-weight:700;letter-spacing:-0.03em;line-height:1.1;color:var(--text);margin-bottom:20px}
.h2 em{color:var(--accent);font-style:italic}
.body-text{font-size:1.05rem;color:var(--muted);line-height:1.9;max-width:600px;font-weight:300}
.svcs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:72px;border-radius:24px;overflow:hidden}
.svc{background:${darkBg?'rgba(255,255,255,0.04)':theme.light};padding:48px 40px;transition:all 0.4s;position:relative}
.svc:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.12)}
.svc:nth-child(2){background:var(--primary)}
.svc:nth-child(2) .svc-name,.svc:nth-child(2) .svc-price{color:#fff}
.svc:nth-child(2) .svc-desc{color:rgba(255,255,255,0.65)}
.svc:nth-child(2) .svc-price{color:var(--accent)}
.svc-icon{font-size:2.8rem;margin-bottom:24px;display:block}
.svc-name{font-family:var(--serif);font-size:1.4rem;font-weight:700;color:var(--text);margin-bottom:12px;letter-spacing:-0.02em;line-height:1.2}
.svc-desc{font-size:0.9rem;color:var(--muted);line-height:1.8;margin-bottom:20px;font-weight:300}
.svc-price{font-size:0.8rem;font-weight:800;color:var(--accent);letter-spacing:0.06em;text-transform:uppercase}
.gallery-wrap{background:#000;overflow:hidden}
.gallery-grid{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:320px 320px;gap:3px}
.gallery-grid img{width:100%;height:100%;object-fit:cover;transition:transform 0.6s,filter 0.4s;filter:brightness(0.88)}
.gallery-grid img:hover{transform:scale(1.04);filter:brightness(1.1)}
.gallery-grid img:first-child{grid-row:span 2}
.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:680px;border-radius:32px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.15)}
.feature-img img{width:100%;height:100%;object-fit:cover}
.feature-copy{background:var(--primary);padding:80px 64px;display:flex;flex-direction:column;justify-content:center}
.feature-copy .label{color:var(--accent)}
.feature-copy .h2{color:#fff;font-size:clamp(1.8rem,3vw,3rem)}
.feature-copy .body-text{color:rgba(255,255,255,0.65);max-width:100%;margin-bottom:40px}
.why-list{display:flex;flex-direction:column;gap:28px;margin-top:40px}
.why-item{display:flex;gap:18px;align-items:flex-start}
.why-num{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1rem;font-weight:700;color:var(--accent);flex-shrink:0}
.why-h{font-size:0.95rem;font-weight:700;color:#fff;margin-bottom:4px}
.why-p{font-size:0.85rem;color:rgba(255,255,255,0.55);line-height:1.7;font-weight:300}
.reviews-bg{background:${darkBg?theme.dark:theme.primary};padding:112px 32px}
.rev-inner{max-width:1280px;margin:0 auto}
.rev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:64px}
.rev-card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:24px;padding:40px;transition:all 0.3s}
.rev-card:hover{background:rgba(255,255,255,0.09);transform:translateY(-4px)}
.rev-stars{font-size:0.9rem;color:#FBBF24;margin-bottom:20px}
.rev-quote{font-family:var(--serif);font-size:1.15rem;color:#fff;line-height:1.7;font-style:italic;margin-bottom:28px}
.rev-bar{width:32px;height:2px;background:var(--accent);margin-bottom:20px;border-radius:2px}
.rev-name{font-size:0.85rem;font-weight:700;color:#fff}
.rev-loc{font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:3px}
.cta-bg{background:var(--accent);padding:96px 32px;text-align:center}
.cta-bg h2{font-family:var(--serif);font-size:clamp(2.5rem,5vw,5rem);font-weight:700;letter-spacing:-0.04em;line-height:1.05;color:#fff;margin-bottom:20px}
.cta-bg p{font-size:1.1rem;color:rgba(255,255,255,0.8);margin-bottom:48px;line-height:1.7}
.btn-dark{display:inline-flex;align-items:center;gap:10px;background:var(--primary);color:#fff;padding:20px 48px;border-radius:99px;font-weight:800;font-size:1rem;transition:all 0.3s;box-shadow:0 8px 32px rgba(0,0,0,0.25)}
.btn-dark:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.3);color:#fff}
.contact-section{background:var(--bg);padding:112px 32px}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
.c-list{display:flex;flex-direction:column;gap:20px;margin-top:48px}
.c-row{display:flex;gap:16px;align-items:center}
.c-icon{width:52px;height:52px;border-radius:16px;background:${darkBg?'rgba(255,255,255,0.06)':theme.light};display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
.c-label{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:3px}
.c-val{font-size:1rem;font-weight:700;color:var(--text)}
.map-box{border-radius:24px;height:380px;background:${darkBg?'rgba(255,255,255,0.04)':theme.light};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
.map-pin{font-size:3.5rem}
.map-biz{font-family:var(--serif);font-size:1.1rem;font-weight:700;color:var(--text)}
.map-link{font-size:0.85rem;font-weight:700;color:var(--accent)}
footer{background:#0F172A;padding:56px 32px 32px}
.foot-wrap{max-width:1280px;margin:0 auto}
.foot-top{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,0.07);flex-wrap:wrap;gap:28px}
.foot-name{font-family:var(--serif);font-size:1.6rem;font-weight:700;color:#fff}
.foot-tag{font-size:0.82rem;color:rgba(255,255,255,0.35);margin-top:6px;font-style:italic}
.foot-nav{display:flex;gap:32px}
.foot-nav a{font-size:0.82rem;color:rgba(255,255,255,0.45);transition:color 0.2s}
.foot-nav a:hover{color:var(--accent)}
.foot-bot{display:flex;justify-content:space-between;padding-top:28px;flex-wrap:wrap;gap:12px}
.foot-copy{font-size:0.75rem;color:rgba(255,255,255,0.2)}
.foot-akus a{font-size:0.72rem;color:rgba(255,255,255,0.3);font-weight:600}
.foot-akus a:hover{color:var(--accent)}
@media(max-width:900px){
  .svcs-grid,.rev-grid{grid-template-columns:1fr}
  .feature-grid,.contact-grid{grid-template-columns:1fr}
  .gallery-grid{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .gallery-grid img:first-child{grid-row:span 1}
  nav .nav-links{display:none}
  .hero-wrap{padding:0 24px 80px}
  .hero-stats{gap:24px}
}
@media(max-width:600px){
  .section{padding:72px 20px}.hero h1{font-size:3rem}
  .hero-stats{display:none}.svcs-grid{gap:12px}.svc{padding:32px 24px}
}
</style>
</head>
<body>
<nav id="nav">
  <div class="nav-wrap">
    <div class="nav-logo">${biz}</div>
    <div class="nav-links">
      <a href="#services">${theme.services_title}</a>
      <a href="#about">Our Story</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact" class="nav-book">${theme.cta}</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="hero-img"></div>
  <div class="hero-overlay"></div>
  <div class="hero-wrap">
    <div class="hero-eyebrow"><span class="hero-dot"></span> ${suburb}, Australia</div>
    <h1>${c.headline}</h1>
    <p class="hero-sub">${c.subline}</p>
    <div class="hero-actions">
      <a href="#contact" class="btn btn-accent">${theme.cta} →</a>
      <a href="#services" class="btn btn-ghost">See ${theme.services_title}</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><span class="stat-n">5.0 ★</span><span class="stat-l">Google Rating</span></div>
      <div class="hero-stat"><span class="stat-n">100%</span><span class="stat-l">Local & Independent</span></div>
      <div class="hero-stat"><span class="stat-n">${suburb}</span><span class="stat-l">Proudly Serving</span></div>
    </div>
  </div>
</section>

<div class="trust-strip">
  <div class="trust-inner">
    <div class="trust-item">✓ Locally owned &amp; operated</div>
    <div class="trust-item">✓ Proudly serving ${suburb}</div>
    <div class="trust-item">✓ 5-star rated on Google</div>
    <div class="trust-item">✓ ${ownerName?'Led by '+ownerName:'Trusted by locals'}</div>
  </div>
</div>

<section class="section" id="services" style="background:${darkBg?'rgba(255,255,255,0.02)':theme.bg}">
  <div class="container">
    <div class="fade-up">
      <div class="label">${theme.services_title}</div>
      <h2 class="h2">What we <em>do best</em></h2>
    </div>
    <div class="svcs-grid">
      ${(c.services||[]).map(s=>`
      <div class="svc fade-up">
        <span class="svc-icon">${s.icon}</span>
        <h3 class="svc-name">${s.name}</h3>
        <p class="svc-desc">${s.desc}</p>
        <div class="svc-price">${s.price}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<div class="gallery-wrap">
  <div class="gallery-grid">
    ${[hero,...gallery].slice(0,5).map(url=>`<img src="${url}" alt="${biz}" loading="lazy">`).join('')}
  </div>
</div>

<section class="section" id="about" style="background:${darkBg?theme.dark:theme.bg}">
  <div class="container">
    <div class="feature-grid">
      <div class="feature-img fade-up">
        <img src="${gallery[0]||hero}" alt="${biz}" loading="lazy">
      </div>
      <div class="feature-copy">
        <div class="label">Our Story</div>
        <h2 class="h2">About <em>${biz}</em></h2>
        <p class="body-text">${c.about}</p>
        <div class="why-list">
          <div class="why-item fade-up"><div class="why-num">1</div><div><div class="why-h">${c.why1_title}</div><div class="why-p">${c.why1_desc}</div></div></div>
          <div class="why-item fade-up d1"><div class="why-num">2</div><div><div class="why-h">${c.why2_title}</div><div class="why-p">${c.why2_desc}</div></div></div>
          <div class="why-item fade-up d2"><div class="why-num">3</div><div><div class="why-h">${c.why3_title}</div><div class="why-p">${c.why3_desc}</div></div></div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="reviews-bg" id="reviews">
  <div class="rev-inner">
    <div class="fade-up" style="text-align:center">
      <div class="label" style="color:var(--accent)">Customer Reviews</div>
      <h2 class="h2" style="color:#fff;text-align:center">What ${suburb} locals say</h2>
    </div>
    <div class="rev-grid">
      ${[
        {q:c.testimonial,n:c.testimonial_name,l:suburb},
        {q:`Absolutely the best in ${suburb}. I've recommended ${biz} to everyone I know — they never disappoint.`,n:'James T.',l:suburb},
        {q:`Professional, warm, and passionate about what they do. ${biz} is a true gem in our community.`,n:'Michelle K.',l:suburb},
      ].map(r=>`
      <div class="rev-card fade-up">
        <div class="rev-stars">★★★★★</div>
        <p class="rev-quote">"${r.q}"</p>
        <div class="rev-bar"></div>
        <div class="rev-name">${r.n}</div>
        <div class="rev-loc">📍 ${r.l}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="cta-bg">
  <div class="fade-up">
    <h2>${c.cta}</h2>
    <p>We'd love to have you. Get in touch today — we're always happy to chat.</p>
    <a href="#contact" class="btn-dark">${theme.cta} →</a>
  </div>
</section>

<section class="contact-section" id="contact">
  <div class="container">
    <div class="contact-grid">
      <div class="fade-up">
        <div class="label">Find Us</div>
        <h2 class="h2">Get in <em>touch</em></h2>
        <p class="body-text">We're based in ${suburb} and love hearing from locals.</p>
        <div class="c-list">
          <div class="c-row"><div class="c-icon">📍</div><div><div class="c-label">Location</div><div class="c-val">${suburb}, Australia</div></div></div>
          <div class="c-row"><div class="c-icon">📞</div><div><div class="c-label">Phone</div><div class="c-val">${phoneDisplay}</div></div></div>
          ${emailDisplay?`<div class="c-row"><div class="c-icon">✉️</div><div><div class="c-label">Email</div><div class="c-val">${emailDisplay}</div></div></div>`:''}
        </div>
      </div>
      <div class="map-box fade-up d2">
        <div class="map-pin">📍</div>
        <div class="map-biz">${biz}</div>
        <p style="font-size:0.85rem;color:var(--muted);text-align:center;padding:0 24px">Located in the heart of ${suburb}</p>
        <a href="https://maps.google.com/?q=${encodeURIComponent(biz+' '+suburb+' Australia')}" target="_blank" class="map-link">Open in Google Maps ↗</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="foot-wrap">
    <div class="foot-top">
      <div>
        <div class="foot-name">${biz}</div>
        <div class="foot-tag">${c.tagline||'Proudly serving '+suburb+' and surrounds'}</div>
      </div>
      <nav class="foot-nav">
        <a href="#services">${theme.services_title}</a>
        <a href="#about">About</a>
        <a href="#reviews">Reviews</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>
    <div class="foot-bot">
      <div class="foot-copy">© ${new Date().getFullYear()} ${biz} · ${suburb}, Australia</div>
      <div class="foot-akus"><a href="https://akus.com.au" target="_blank">Website by ⚡ Akus</a></div>
    </div>
  </div>
</footer>

<script>
const nav=document.getElementById('nav');
window.addEventListener('scroll',()=>nav.classList.toggle('solid',window.scrollY>60),{passive:true});
const fades=document.querySelectorAll('.fade-up');
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.06,rootMargin:'0px 0px -40px 0px'});
fades.forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-76,behavior:'smooth'});}});});
</script>
</body>
</html>`;

    return { html, themeName: theme.name };
}
