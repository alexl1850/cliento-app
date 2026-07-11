// Shared site-theming palette — canonical 6-key version (primary/accent/bg/
// dark/text/light). Previously duplicated with a divergent 4-key copy
// (missing text/light) in publish-blog.js; this is now the single source
// used by build-website.js, publish-blog.js, and the blog templates so a
// post page's colours always match its site's.
export const PALETTES = {
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

export function getPalette(name) {
  return PALETTES[name] || PALETTES.slate;
}
