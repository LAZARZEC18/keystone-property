// Runs the site's server functions (written for Netlify's Request -> Response style) on Cloudflare Pages.
// - copies text environment variables into process.env
// - hands the KV namespace bound as STORE to the shared key-value store
// - caches GET responses at the edge for as long as the function's Netlify-CDN-Cache-Control header asks
export function wrap(handler) {
  return async (ctx) => {
    const { request, env } = ctx;
    globalThis.__OWN_CF = true;
    if (env.STORE) globalThis.__OWN_KV = env.STORE;
    if (typeof globalThis.process === 'undefined') globalThis.process = { env: {} };
    if (!globalThis.process.env) globalThis.process.env = {};
    for (const [k, v] of Object.entries(env || {})) if (typeof v === 'string') globalThis.process.env[k] = v;

    const cache = request.method === 'GET' && typeof caches !== 'undefined' ? caches.default : null;
    if (cache) {
      const hit = await cache.match(request).catch(() => null);
      if (hit) {
        const out = new Response(hit.body, hit);
        out.headers.set('cache-control', 'public, max-age=0, must-revalidate');
        return out;
      }
    }
    const res = await handler(request, ctx);
    const cdn = res.headers.get('netlify-cdn-cache-control') || '';
    const age = +(cdn.match(/s-maxage=(\d+)/)?.[1] || 0);
    if (cache && res.status === 200 && age > 0) {
      const copy = res.clone();
      const stored = new Response(copy.body, copy);
      stored.headers.set('cache-control', `public, s-maxage=${age}`);
      ctx.waitUntil(cache.put(request, stored).catch(() => {}));
    }
    return res;
  };
}
