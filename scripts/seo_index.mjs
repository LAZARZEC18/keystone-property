// Small per-state copies of the suburb index for the server-side page renderer on Cloudflare
// (a whole-country file is too slow to parse inside one request). Written to site/data/seo/<STATE>.json.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const COLS = ['id', 'n', 's', 'pc', 'rg', 'lga', 'lat', 'lng', 'pop', 'h', 'u', 'rh', 'ru', 'y', 'pt', 'conf', 'hs', 'cbd', 'ocn', 'rsk', 'sc_cash', 'sc_momentum', 'sc_growth', 'sc_demand', 'sc_afford', 'sc_stability'];
const d = JSON.parse(await readFile(new URL('../site/data/suburbs.json', import.meta.url), 'utf8'));
const idx = COLS.map((c) => d.cols.indexOf(c));
const by = {};
for (const r of d.rows) {
  const st = r[d.cols.indexOf('s')];
  (by[st] ||= []).push(idx.map((i) => (i < 0 ? null : r[i])));
}
await mkdir(new URL('../site/data/seo/', import.meta.url), { recursive: true });
for (const [st, rows] of Object.entries(by)) {
  await writeFile(new URL(`../site/data/seo/${st}.json`, import.meta.url), JSON.stringify({ cols: COLS, rows }));
}
console.log('seo index:', Object.entries(by).map(([k, v]) => `${k} ${v.length}`).join(', '));
