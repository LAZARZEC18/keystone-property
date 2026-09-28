// Gives every URL its own title, description, canonical, social preview, structured data and
// crawler-readable summary, and returns a real 404 for pages that don't exist.
// The app still renders everything client-side; this only rewrites the shared HTML shell.
import { buildIndex, describe, renderHtml } from '../shared/seo-core.js';

let cache = null; // { ix, at }
const TTL = 60 * 60 * 1000;

async function getIndex(origin) {
  if (cache && Date.now() - cache.at < TTL) return cache.ix;
  const [sub, market] = await Promise.all([
    fetch(`${origin}/data/suburbs.json`).then((r) => r.json()),
    fetch(`${origin}/data/market.json`).then((r) => r.json()),
  ]);
  cache = { ix: buildIndex(sub, market, null), at: Date.now() };
  return cache.ix;
}

export default async (request, context) => {
  // every page request, whatever the client asks for: search engines, link previews and AI crawlers
  // don't always send a browser-style Accept header
  if (request.method !== 'GET' && request.method !== 'HEAD') return context.next();
  const url = new URL(request.url);
  const res = await context.next();
  if (!(res.headers.get('content-type') || '').includes('text/html')) return res;
  try {
    const ix = await getIndex(url.origin);
    const primary = (typeof Netlify !== 'undefined' && Netlify.env.get('URL')) || url.origin;
    const meta = describe(url.pathname, url.search, ix, primary.replace(/\/$/, '').replace(/^http:\/\//, 'https://'));
    const html = renderHtml(await res.text(), meta);
    const headers = new Headers(res.headers);
    headers.delete('content-length');
    headers.set('content-type', 'text/html; charset=utf-8');
    headers.set('cache-control', 'public, max-age=0, must-revalidate');
    headers.set('netlify-cdn-cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return new Response(html, { status: meta.status, headers });
  } catch (e) {
    console.error('seo edge', e);
    return res;
  }
};

export const config = {
  path: '/*',
  excludedPath: ['/assets/*', '/data/*', '/api/*', '/.netlify/*', '/sitemap.xml', '/robots.txt', '/favicon.ico'],
  cache: 'manual',
};
