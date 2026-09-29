// Cloudflare Pages: gives every page its own title, description, canonical link, social preview, structured data and
// crawler-readable summary, and a real 404, like netlify/edge-functions/seo.js does on Netlify. It loads only the
// state that a suburb, postcode or council page needs (site/data/seo/<STATE>.json) so each request stays fast.
import { buildIndex, describe, renderHtml } from '../netlify/shared/seo-core.js';

// old addresses (Cloudflare doesn't apply _redirects to routes that run through Functions)
const MOVED = { '/why': '/about', '/news': '/markets#news', '/weekly': '/markets#weekly', '/live': '/markets', '/listings': '/property' };

const cache = new Map(); // key -> { at, value }
const TTL = 30 * 60 * 1000;
async function cached(key, load) {
  const c = cache.get(key);
  if (c && Date.now() - c.at < TTL) return c.value;
  const value = await load();
  cache.set(key, { at: Date.now(), value });
  return value;
}

function statesFor(path) {
  let m = path.match(/^\/(?:suburb|council)\/([a-z]+)\//);
  if (m) return [m[1].toUpperCase()];
  m = path.match(/^\/postcode\/(\d{3,4})\/?$/);
  if (m) {
    const pc = +m[1];
    if (pc < 1000) return ['NT'];
    if (pc < 3000) return ['NSW', 'ACT'];
    if (pc < 4000 || (pc >= 8000 && pc < 9000)) return ['VIC'];
    if (pc < 5000 || pc >= 9000) return ['QLD'];
    if (pc < 6000) return ['SA'];
    if (pc < 7000) return ['WA'];
    return ['TAS'];
  }
  return [];
}

export async function onRequest(ctx) {
  const { request, env, next } = ctx;
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (MOVED[path]) return Response.redirect(new URL(MOVED[path], url.origin).href, 301);
  if ((request.method !== 'GET' && request.method !== 'HEAD') || path.startsWith('/api/')) return next();
  const res = await next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  try {
    const asset = (p) => env.ASSETS.fetch(new URL(p, url.origin)).then((r) => (r.ok ? r.json() : null));
    const states = statesFor(url.pathname).filter((s) => /^(NSW|VIC|QLD|WA|SA|TAS|ACT|NT)$/.test(s));
    const market = await cached('market', () => asset('/data/market.json'));
    const ix = await cached(`ix:${states.join(',')}`, async () => {
      const parts = (await Promise.all(states.map((s) => asset(`/data/seo/${s}.json`)))).filter(Boolean);
      const sub = { cols: parts[0]?.cols || ['id', 'n', 's'], rows: parts.flatMap((p) => p.rows) };
      return buildIndex(sub, market, null);
    });
    const origin = (env.SITE_URL || url.origin).replace(/\/$/, '').replace(/^http:\/\//, 'https://');
    const meta = describe(url.pathname, url.search, ix, origin);
    const html = renderHtml(await res.text(), meta);
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');
    return new Response(request.method === 'HEAD' ? null : html, { status: meta.status, headers });
  } catch (e) {
    console.error('seo middleware', e);
    return res;
  }
}
