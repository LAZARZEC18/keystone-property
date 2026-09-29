// Cookie-free page counts. The browser sends only the page path; nothing that identifies a visitor (no IP address,
// device ID or cookie) is stored. Counts are kept per day and page in the site's Netlify Blobs store "analytics",
// which can be browsed in the Netlify dashboard (Site → Blobs).
import { getStore } from '@netlify/blobs';

// suburb, postcode and council pages are grouped so the counts show which tools are used, not who looked at what
function group(path) {
  const p = String(path || '/').split(/[?#]/)[0].slice(0, 120).replace(/[^a-z0-9/_-]/gi, '') || '/';
  if (/^\/suburb\//.test(p)) return '/suburb/*';
  if (/^\/postcode\//.test(p)) return '/postcode/*';
  if (/^\/council\//.test(p)) return '/council/*';
  return p;
}

export default async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  let counted = false;
  try {
    const body = await req.text();
    const { p, e } = JSON.parse(body || '{}');
    const day = new Date().toISOString().slice(0, 10);
    const store = getStore('analytics');
    // events: a tool finished, a link copied, a plan printed, a listing link opened (names only, nothing personal)
    const ev = e ? String(e).toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) : '';
    const key = ev ? `${day}/event/${ev}` : `${day}${group(p)}`;
    const n = Number(await store.get(key)) || 0;
    await store.set(key, String(n + 1));
    counted = true;
  } catch {
    // counting must never break a page
  }
  return new Response(null, { status: 204, headers: { 'cache-control': 'no-store', 'x-counted': String(counted) } });
};

export const config = { path: '/api/hit' };
