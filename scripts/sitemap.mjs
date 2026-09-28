// sitemap.xml + robots.txt for every page and every suburb, postcode and council.
import { readFile, writeFile } from 'node:fs/promises';

const SITE = (process.env.SITE_URL || 'https://keystone-au.netlify.app').replace(/\/$/, '');
const d = JSON.parse(await readFile(new URL('../site/data/suburbs.json', import.meta.url), 'utf8'));
const col = (c) => d.cols.indexOf(c);
const clean = (n) => n.replace(/\s*\((NSW|Vic\.|Qld|SA|WA|Tas\.|NT|ACT)\)\s*$/i, '');
const slug = (x) => x.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const today = new Date().toISOString().slice(0, 10);
const urls = new Set(['/', '/markets', '/suburbs', '/new-builds', '/analyse', '/afford', '/rates', '/news', '/guide', '/weekly', '/borrowing', '/methodology', '/compare', '/map', '/property', '/find', '/about', '/contact', '/privacy', '/terms', '/first-home', '/why']);
for (const r of d.rows) {
  const n = r[col('n')], s = r[col('s')], pc = r[col('pc')], lga = r[col('lga')], id = r[col('id')];
  urls.add(`/suburb/${s.toLowerCase()}/${slug(clean(n))}-${pc || id}`);
  if (pc) urls.add(`/postcode/${pc}`);
  if (lga) urls.add(`/council/${s.toLowerCase()}/${slug(lga)}`);
}
const daily = new Set(['/', '/markets', '/rates', '/news', '/weekly', '/map']);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls].map((u) => `<url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><changefreq>${daily.has(u) ? 'hourly' : 'weekly'}</changefreq></url>`).join('\n')}\n</urlset>\n`;
await writeFile(new URL('../site/sitemap.xml', import.meta.url), xml);
await writeFile(new URL('../site/robots.txt', import.meta.url), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`sitemap: ${urls.size} urls`);
