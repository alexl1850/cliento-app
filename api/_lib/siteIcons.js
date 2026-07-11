// Shared stroke-icon set for generated sites — replaces emoji everywhere.
// Extracted from build-website.js so generateSite.js (which previously let
// the AI pick a raw emoji glyph per service) can use the same constrained,
// consistently-styled icon system instead.
export const ICONS = {
  phone: `<path d="M6.6 10.8c1.5 3 4 5.4 7 7l2.3-2.3c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.5.6.6 0 1 .4 1 1v3.4c0 .6-.4 1-1 1C10.4 21.3 2.7 13.6 2.7 3.5c0-.6.4-1 1-1H7c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.5.1.3 0 .7-.2 1L6.6 10.8Z"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>`,
  mappin: `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
  star: `<path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3L3 9.5l6.4-.6L12 3Z"/>`,
  starfilled: `<path d="m12 3 2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 17l-5.6 3.1 1.4-6.3L3 9.5l6.4-.6L12 3Z" fill="currentColor" stroke="none"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  checkcircle: `<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.3 2.3 4.7-5"/>`,
  wrench: `<path d="M15 6a4.5 4.5 0 0 0-6 4.9L3 17v4h4l6-6a4.5 4.5 0 0 0 5-7.4l-3.2 3.2-2.6-.9-.9-2.6L14.6 4c-.2 0-.4 0-.6 0Z"/>`,
  droplet: `<path d="M12 3s6.5 7 6.5 11.5A6.5 6.5 0 0 1 5.5 14.5C5.5 10 12 3 12 3Z"/>`,
  flame: `<path d="M12 2s5 4.5 5 9.5a5 5 0 0 1-10 0c0-1.4.7-2.6 1.5-3.5.2 1 .8 1.8 1.5 1.8 1 0 1-1.3 1-2.3C11 6 11 4 12 2Z"/>`,
  shield: `<path d="M12 3 4.5 6v6c0 5 3.4 8 7.5 9 4.1-1 7.5-4 7.5-9V6L12 3Z"/>`,
  home: `<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h4v-6h2v6h4a1 1 0 0 0 1-1v-9"/>`,
  heart: `<path d="M12 20.5s-7.5-4.6-9.8-9.4C.7 7.6 2.3 4.5 5.4 4c2-.3 3.7.7 4.6 2.3.5-1.6 2.6-2.6 4.6-2.3 3.1.5 4.7 3.6 3.2 7.1-2.3 4.8-9.8 9.4-9.8 9.4Z"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>`,
  truck: `<path d="M2 7h11v9H2z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="6.5" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>`,
  leaf: `<path d="M5 20C3 12 8 5 20 4c1 10-5 16-15 16Z"/><path d="M6 19c3-4 6-7 12-13"/>`,
  dollar: `<circle cx="12" cy="12" r="9"/><path d="M12 6.5v11M15 9.2c0-1.2-1.3-2.2-3-2.2s-3 .9-3 2.2 1.3 1.9 3 2.2 3 1 3 2.2-1.3 2.1-3 2.1-3-.8-3-2.1"/>`,
  users: `<circle cx="9" cy="8" r="3.3"/><path d="M3 20c0-3.6 2.7-6 6-6s6 2.4 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c2.6.4 4.5 2.4 4.5 5.3"/>`,
  thumbsup: `<path d="M7 11v9H4v-9h3Z"/><path d="M7 11l3.5-7c1.5 0 2.5 1.2 2.2 2.6L12 9h5.5c1.2 0 2 1.1 1.6 2.2l-2 6c-.3.9-1.1 1.5-2 1.5H7"/>`,
  award: `<circle cx="12" cy="8" r="5.3"/><path d="m8.5 12.8-1.3 7 4.8-2.6 4.8 2.6-1.3-7"/>`,
  sparkles: `<path d="M12 3v4M12 17v4M4 12h4M16 12h4M6.5 6.5l2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2"/>`,
  coffee: `<path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z"/><path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3.5c0 1-1 1-1 2s1 1 1 2M12 3.5c0 1-1 1-1 2s1 1 1 2"/>`,
  utensils: `<path d="M6 2v8a2 2 0 0 0 2 2v10M6 2v8M9 2v8M15 2c-1.7 0-3 2-3 5s1.3 5 3 5v10M15 2c1.7 0 3 2 3 5s-1.3 5-3 5"/>`,
  dumbbell: `<path d="M4 9v6M2 10.5v3M20 9v6M22 10.5v3M7 12h10"/><rect x="5" y="7.5" width="4" height="9" rx="1"/><rect x="15" y="7.5" width="4" height="9" rx="1"/>`,
  stethoscope: `<path d="M6 3v6a4 4 0 0 0 8 0V3M6 3H4.5M14 3h1.5"/><path d="M10 13v2.5a5.5 5.5 0 0 0 11 0V13.8"/><circle cx="20.5" cy="12.5" r="1.8"/>`,
  tooth: `<path d="M7 3c-2.5 0-4 2-4 5 0 4 1.5 6 2 10 .3 2 2 2 2.5.3.4-1.3.6-3.3 2.5-3.3s2.1 2 2.5 3.3c.5 1.7 2.2 1.7 2.5-.3.5-4 2-6 2-10 0-3-1.5-5-4-5-1.2 0-2 .6-2.5 1-.5-.4-1.3-1-3.5-1Z"/>`,
  paw: `<circle cx="6" cy="9" r="2"/><circle cx="12" cy="6.5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M8 15c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5-1.8 4-4 4-4-2-4-4Z"/>`,
  palette: `<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.4-.7-.4-1.1 0-.9.7-1.5 1.6-1.5H16a4 4 0 0 0 4-4c0-4.7-3.6-8.4-8-8.4Z"/><circle cx="7.5" cy="10.5" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>`,
  hammer: `<rect x="13.5" y="2.5" width="4.2" height="7" rx="1" transform="rotate(45 15.6 6)"/><path d="M13 8.5 4.5 17a1.8 1.8 0 0 0 0 2.5l0 0a1.8 1.8 0 0 0 2.5 0L15.5 11"/>`,
  broom: `<path d="M20 4 10.5 13.5"/><path d="m10.5 13.5-3 6.8L4 22l1.7-3.8 3-6.8Z"/><path d="M9 12.3 12.2 15.5"/>`,
  car: `<path d="M4 16V11l2-5h12l2 5v5"/><path d="M4 16h16v2a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2Z"/><circle cx="7.5" cy="16" r="1.3"/><circle cx="16.5" cy="16" r="1.3"/>`,
  flower: `<circle cx="12" cy="12" r="2.2"/><circle cx="12" cy="6" r="2.6"/><circle cx="12" cy="18" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="12" r="2.6"/><path d="M12 18v3"/>`,
  briefcase: `<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>`,
  scissors: `<circle cx="6" cy="6" r="2.3"/><circle cx="6" cy="18" r="2.3"/><path d="m20 5-12.5 8M20 19 7.5 11"/>`,
  messagecircle: `<path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l1.5-5A8.5 8.5 0 1 1 21 11.5Z"/>`,
  clipboardlist: `<rect x="5" y="4" width="14" height="17" rx="2"/><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="M8.5 11h.01M8.5 15h.01M11.5 11h5M11.5 15h5"/>`,
  alert: `<path d="M12 3 2 20h20L12 3Z"/><path d="M12 10v4M12 17h.01"/>`,
  chevronleft: `<path d="M15 18l-6-6 6-6"/>`,
  chevronright: `<path d="M9 18l6-6-6-6"/>`,
};

export function svgIcon(name, size = 20) {
  const path = ICONS[name] || ICONS.sparkles;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-4px;flex-shrink:0">${path}</svg>`;
}

export const ICON_VOCAB = Object.keys(ICONS).filter(k => k !== 'starfilled').join(', ');
