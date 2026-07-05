export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.akus.com.au');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { biz, suburb, bizType, ownerName, phone, email, description } = req.body;
    if (!biz || !suburb) return res.status(400).json({ error: 'Business name and suburb required' });

    const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
    const SUPABASE_URL  = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_KEY  = process.env.SUPABASE_SERVICE_KEY;
    const bizStr = `${bizType||''} ${biz||''}`.toLowerCase();

    // ── Business type detection ────────────────────────────────────────────
    const isButcher    = /butcher|meat|deli|smallgoods/.test(bizStr);
    const isBakery     = /baker|bakery|bread|pastry|cake|patisserie/.test(bizStr);
    const isCafe       = /café|cafe|coffee|espresso|brunch|breakfast/.test(bizStr);
    const isRestaurant = /restaurant|dining|bistro|eatery|diner/.test(bizStr);
    const isTakeaway   = /takeaway|pizza|burger|kebab|chinese|thai|indian|sushi/.test(bizStr);
    const isBar        = /bar|pub|brewery|cocktail|wine/.test(bizStr);
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
    // Pexels direct CDN URLs — permanent, free, hotlinking allowed
    const images = {
      butcher:    ['https://images.pexels.com/photos/3481633/pexels-photo-3481633.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2491273/pexels-photo-2491273.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3297891/pexels-photo-3297891.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=800'],
      bakery:     ['https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2135/food-france-morning-breakfast.jpg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1998920/pexels-photo-1998920.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3926122/pexels-photo-3926122.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/2434187/pexels-photo-2434187.jpeg?auto=compress&cs=tinysrgb&w=800'],
      cafe:       ['https://images.pexels.com/photos/1855214/pexels-photo-1855214.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2074130/pexels-photo-2074130.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1307698/pexels-photo-1307698.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1833306/pexels-photo-1833306.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800'],
      restaurant: ['https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/941861/pexels-photo-941861.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1579739/pexels-photo-1579739.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1640773/pexels-photo-1640773.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800'],
      takeaway:   ['https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2983101/pexels-photo-2983101.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1633578/pexels-photo-1633578.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3219547/pexels-photo-3219547.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1640775/pexels-photo-1640775.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg?auto=compress&cs=tinysrgb&w=800'],
      bar:        ['https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3407777/pexels-photo-3407777.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3407778/pexels-photo-3407778.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1574180/pexels-photo-1574180.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/338713/pexels-photo-338713.jpeg?auto=compress&cs=tinysrgb&w=800'],
      hairsalon:  ['https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1319460/pexels-photo-1319460.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3738343/pexels-photo-3738343.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3997993/pexels-photo-3997993.jpeg?auto=compress&cs=tinysrgb&w=800'],
      beauty:     ['https://images.pexels.com/photos/3997989/pexels-photo-3997989.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3985329/pexels-photo-3985329.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3764013/pexels-photo-3764013.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3738339/pexels-photo-3738339.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800'],
      plumber:    ['https://images.pexels.com/photos/8005397/pexels-photo-8005397.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/8005368/pexels-photo-8005368.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/5691611/pexels-photo-5691611.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/8005367/pexels-photo-8005367.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/5691609/pexels-photo-5691609.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/4162555/pexels-photo-4162555.jpeg?auto=compress&cs=tinysrgb&w=800'],
      electrician:['https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/4254175/pexels-photo-4254175.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3862365/pexels-photo-3862365.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/5691626/pexels-photo-5691626.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/4218547/pexels-photo-4218547.jpeg?auto=compress&cs=tinysrgb&w=800'],
      builder:    ['https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2219024/pexels-photo-2219024.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3997379/pexels-photo-3997379.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1090638/pexels-photo-1090638.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=800'],
      landscaper: ['https://images.pexels.com/photos/1453499/pexels-photo-1453499.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/589841/pexels-photo-589841.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1510088/pexels-photo-1510088.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1301856/pexels-photo-1301856.jpeg?auto=compress&cs=tinysrgb&w=800'],
      gym:        ['https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/841130/pexels-photo-841130.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1552106/pexels-photo-1552106.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800'],
      yoga:       ['https://images.pexels.com/photos/3822864/pexels-photo-3822864.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3822906/pexels-photo-3822906.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3822583/pexels-photo-3822583.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3822864/pexels-photo-3822864.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/4498574/pexels-photo-4498574.jpeg?auto=compress&cs=tinysrgb&w=800'],
      physio:     ['https://images.pexels.com/photos/3259629/pexels-photo-3259629.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/4506143/pexels-photo-4506143.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/5473955/pexels-photo-5473955.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3985163/pexels-photo-3985163.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/4506105/pexels-photo-4506105.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3822621/pexels-photo-3822621.jpeg?auto=compress&cs=tinysrgb&w=800'],
      dentist:    ['https://images.pexels.com/photos/3845769/pexels-photo-3845769.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3779706/pexels-photo-3779706.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3845806/pexels-photo-3845806.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3873211/pexels-photo-3873211.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/4269694/pexels-photo-4269694.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3845544/pexels-photo-3845544.jpeg?auto=compress&cs=tinysrgb&w=800'],
      pet:        ['https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3361739/pexels-photo-3361739.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1458916/pexels-photo-1458916.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/2023384/pexels-photo-2023384.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1851164/pexels-photo-1851164.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3361675/pexels-photo-3361675.jpeg?auto=compress&cs=tinysrgb&w=800'],
      retail:     ['https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/5632400/pexels-photo-5632400.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1884583/pexels-photo-1884583.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/5632403/pexels-photo-5632403.jpeg?auto=compress&cs=tinysrgb&w=800'],
      florist:    ['https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/931179/pexels-photo-931179.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/931174/pexels-photo-931174.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/931177/pexels-photo-931177.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1407305/pexels-photo-1407305.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/931172/pexels-photo-931172.jpeg?auto=compress&cs=tinysrgb&w=800'],
      auto:       ['https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3807517/pexels-photo-3807517.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/1409999/pexels-photo-1409999.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3807386/pexels-photo-3807386.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800'],
      cleaning:   ['https://images.pexels.com/photos/4239013/pexels-photo-4239013.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/4239091/pexels-photo-4239091.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/6197130/pexels-photo-6197130.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/4239092/pexels-photo-4239092.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/6197121/pexels-photo-6197121.jpeg?auto=compress&cs=tinysrgb&w=800'],
      default:    ['https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1920','https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=800','https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800'],
    };

    const lib = images[theme.name] || images.default;
    const seed = biz.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const hero = lib[seed % Math.min(3,lib.length)];
    const gallery = lib.slice(3);

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

    // Sanitize all AI content to prevent template literal and HTML injection
    const safe = (str) => (str||'').replace(/`/g,"'").replace(/\$/g,'&#36;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const safePlain = (str) => (str||'').replace(/`/g,"'").replace(/\\/g,'');

    // Apply sanitization to all AI fields
    c.headline = safePlain(c.headline) || `${biz} — ${suburb}`;
    c.subline = safePlain(c.subline) || `Proudly serving ${suburb} and surrounds.`;
    c.about = safePlain(c.about) || `${biz} is a trusted local business in ${suburb}.`;
    c.why1_title = safePlain(c.why1_title) || 'Quality you can trust';
    c.why1_desc = safePlain(c.why1_desc) || 'We take pride in everything we do.';
    c.why2_title = safePlain(c.why2_title) || 'Local expertise';
    c.why2_desc = safePlain(c.why2_desc) || 'We know this community inside out.';
    c.why3_title = safePlain(c.why3_title) || 'Personal service';
    c.why3_desc = safePlain(c.why3_desc) || 'Every customer is treated like family.';
    c.testimonial = safePlain(c.testimonial) || `${biz} is absolutely fantastic. Highly recommend!`;
    c.testimonial_name = safePlain(c.testimonial_name) || `Local customer, ${suburb}`;
    c.cta = safePlain(c.cta) || `Ready to experience ${biz}?`;
    c.tagline = safePlain(c.tagline) || `Proudly serving ${suburb}`;
    if (!Array.isArray(c.services)) c.services = [];
    c.services = c.services.map(s => ({
      name: safePlain(s.name)||'Our Service',
      desc: safePlain(s.desc)||'Quality service tailored to your needs.',
      icon: s.icon||'⭐',
      price: safePlain(s.price)||'Contact for pricing',
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

    // ── Generate unique ID ─────────────────────────────────────────────────
    const demoId = `demo_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

    // ── Save to Supabase (non-blocking) ────────────────────────────────────
    try {
      if (SUPABASE_URL && SUPABASE_KEY) {
        await fetch(`${SUPABASE_URL}/rest/v1/demo_sites`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            demo_id: demoId,
            biz_name: biz,
            suburb,
            biz_type: bizType||theme.name,
            html,
            created_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
          })
        });

        if (email || phone) {
          await fetch(`${SUPABASE_URL}/rest/v1/demo_leads`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
              demo_id: demoId,
              biz_name: biz,
              suburb,
              biz_type: bizType||theme.name,
              owner_name: ownerName||'',
              phone: phone||'',
              email: email||'',
              description: description||'',
              created_at: new Date().toISOString(),
            })
          });
        }
      }
    } catch(dbErr) {
      console.error('Supabase save error (non-fatal):', dbErr.message);
      // Continue — return the demo URL even if DB save fails
    }

    // Return the demo URL — served by demo-view.js
    const demoUrl = `https://app.akus.com.au/api/demo-view?id=${demoId}`;
    return res.status(200).json({ success: true, url: demoUrl, demoId });

  } catch(err) {
    console.error('Demo error:', err);
    return res.status(500).json({ error: err.message });
  }
}
