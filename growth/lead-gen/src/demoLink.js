const CLIENTO_BASE_URL = process.env.CLIENTO_BASE_URL || 'https://cliento.com.au';

// Mirrors the demo hand-off App.jsx already reads: ?demo=1&biz=X&suburb=Y&type=Z
export function buildDemoLink({ name, suburb, category }) {
  const params = new URLSearchParams({
    demo: '1',
    biz: name,
    suburb: suburb || '',
    type: category || '',
  });
  return `${CLIENTO_BASE_URL}/?${params.toString()}`;
}
