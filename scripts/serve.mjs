// Tiny static server for local testing: serves site/ with the same SPA fallback as Netlify.
// /api/listings runs the real Netlify function handler.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../site/', import.meta.url).pathname;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' };
const port = Number(process.env.PORT || 8788);
const fns = {
  '/api/listings': (await import('../netlify/functions/listings.mjs')).default,
  '/api/geocode': (await import('../netlify/functions/geocode.mjs')).default,
  '/api/property': (await import('../netlify/functions/property.mjs')).default,
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  if (fns[url.pathname]) {
    const r = await fns[url.pathname](new Request(url));
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(await r.text());
    return;
  }
  if (req.method === 'POST') {
    res.writeHead(200);
    res.end('ok');
    return;
  }
  let p = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!p.startsWith(ROOT)) p = join(ROOT, 'index.html');
  try {
    const st = await stat(p);
    if (st.isDirectory()) p = join(p, 'index.html');
    await stat(p);
  } catch {
    p = join(ROOT, 'index.html');
  }
  const body = await readFile(p);
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  res.end(body);
}).listen(port, () => console.log(`Keystone on http://localhost:${port}`));
