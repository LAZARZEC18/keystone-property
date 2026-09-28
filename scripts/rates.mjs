// Collects every advertised home loan rate from Australia's Consumer Data Right (Open Banking)
// public product feeds. No keys needed: every bank must publish its product reference data.
// Output: site/data/rates.json (columnar to keep it small) + site/data/rates-summary.json.

import { membersOnly, notPurchase, normaliseRate, isNational } from '../site/assets/rate-rules.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { getJson, pool } from './lib/http.mjs';

const REGISTER = 'https://api.cdr.gov.au/cdr-register/v1/banking/data-holders/brands/summary';
const OUT = new URL('../site/data/', import.meta.url);

const num = (x) => (x === null || x === undefined || x === '' ? null : Number(x));

/** Normalise a CDR LVR bound to a fraction 0..1. Some brands publish 80, others 0.80. */
export function normLvr(v) {
  const n = num(v);
  if (n === null || Number.isNaN(n)) return null;
  return n > 1.5 ? n / 100 : n;
}

/** ISO-8601 duration like P3Y / P36M -> years. */
export function durationYears(s) {
  if (!s || typeof s !== 'string') return null;
  const y = s.match(/(\d+(?:\.\d+)?)Y/);
  const m = s.match(/(\d+(?:\.\d+)?)M/);
  const years = (y ? Number(y[1]) : 0) + (m && !s.includes('T') ? Number(m[1]) / 12 : 0);
  return years || null;
}

/** Turn one CDR product detail into flat rate rows we can rank. */
export function flattenProduct(p, brand) {
  const rows = [];
  for (const r of p.lendingRates || []) {
    const type = r.lendingRateType;
    if (type !== 'VARIABLE' && type !== 'FIXED') continue;
    const rate = num(r.rate);
    if (rate === null || rate < 0.02 || rate > 0.2) continue; // reject junk / placeholder rows
    let comp = num(r.comparisonRate);
    if (comp !== null && (comp < 0.02 || comp > 0.25)) comp = null;
    const purpose =
      r.loanPurpose === 'INVESTMENT' ? 'INV' : r.loanPurpose === 'OWNER_OCCUPIED' ? 'OO' : guessPurpose(p.name);
    const repay =
      r.repaymentType === 'INTEREST_ONLY' ? 'IO' : r.repaymentType === 'PRINCIPAL_AND_INTEREST' ? 'PI' : 'PI';
    let lvrMin = null;
    let lvrMax = null;
    for (const t of r.tiers || []) {
      if (/lvr|loan to value/i.test(t.name || '') || t.unitOfMeasure === 'PERCENT') {
        lvrMin = normLvr(t.minimumValue);
        lvrMax = normLvr(t.maximumValue);
        break;
      }
    }
    const term = type === 'FIXED' ? durationYears(r.additionalValue) : null;
    if (type === 'FIXED' && (!term || term > 10)) continue;
    rows.push({
      lender: brand.brandName,
      product: tidyName(p.name),
      productId: p.productId,
      type: type === 'FIXED' ? 'fixed' : 'variable',
      term,
      purpose,
      repay,
      rate: round5(rate * 100),
      comparison: comp === null ? null : round5(comp * 100),
      lvrMin: lvrMin === null ? null : round5(lvrMin * 100),
      lvrMax: lvrMax === null ? null : round5(lvrMax * 100),
      // product overview page first; never a PDF application form
      url: [p.additionalInformation?.overviewUri, r.additionalInfoUri, p.applicationUri].find((u) => u && /^https?:/i.test(u) && !/\.pdf(\?|#|$)/i.test(u)) || null,
      tailored: !!p.isTailored,
      special: SPECIAL.test(p.name || '') ? 1 : 0,
      updated: p.lastUpdated || null,
    });
  }
  return rows;
}

/** Lender feeds often publish names in capitals: 'BASIC VARIABLE HOME LOAN' -> 'Basic Variable Home Loan' (keeps LVR, P&I etc). */
export function tidyName(name = '') {
  const n = String(name).trim();
  if (!n || n !== n.toUpperCase() || !/[A-Z]{4}/.test(n)) return n;
  const small = new Set(['AND', 'FOR', 'WITH', 'OF', 'TO', 'THE', 'OR', 'IN']);
  return n
    .toLowerCase()
    .split(' ')
    .map((w, i) => {
      const up = w.toUpperCase();
      if (i && small.has(up)) return w;
      if (up.length <= 3 && /^[A-Z&]+$/.test(up) && !['HOME', 'LOAN'].includes(up) && !['NEW', 'OLD', 'ONE', 'TWO', 'YR', 'YRS'].includes(up)) return up;
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');
}

// Niche products that aren't a general-purpose home loan (small green top-ups, staff,
// veterans, bridging, reverse mortgages). Kept in the table but left out of "best rate" picks.
export const SPECIAL = /green|sustainab|solar|renewable|energy|veteran|staff|employee|bridging|reverse|equity release|seniors|top.?up|land loan|vacant land|construction/i;

function guessPurpose(name = '') {
  if (/invest/i.test(name)) return 'INV';
  if (/owner|occupi|home/i.test(name)) return 'OO';
  return 'ANY';
}
const round5 = (x) => Math.round(x * 1000) / 1000;

/** Pick the highest version the server says it supports ("Versions available: 5" or "4, 5"). */
function versionsFromError(json) {
  const detail = json?.errors?.[0]?.detail || '';
  const m = detail.match(/available[^0-9]*([0-9][0-9 ,\-]*)/i);
  if (!m) return null;
  const nums = m[1].match(/\d+/g)?.map(Number) || [];
  return nums.length ? String(Math.max(...nums)) : null;
}

async function negotiate(url, candidates, state, key) {
  const tried = new Set();
  const queue = state[key] ? [state[key]] : [...candidates];
  while (queue.length) {
    const v = queue.shift();
    if (tried.has(v)) continue;
    tried.add(v);
    const r = await getJson(url, { 'x-v': v, 'x-min-v': '1' }, { retries: 1 });
    if (r?.ok) {
      state[key] = v;
      return r;
    }
    if (r?.status !== 406 && r?.status !== 400) return r;
    const hint = versionsFromError(r.json);
    if (hint && !tried.has(hint)) queue.unshift(hint);
  }
  return null;
}

async function listProducts(base, state) {
  const products = [];
  let url = `${base.replace(/\/$/, '')}/cds-au/v1/banking/products?product-category=RESIDENTIAL_MORTGAGES&page-size=100`;
  for (let page = 0; page < 10 && url; page++) {
    const r = await negotiate(url, ['4', '3', '5', '6', '2', '1'], state, 'list');
    if (!r?.ok) return { products, error: `list ${r?.status ?? 'version'}` };
    products.push(...(r.json?.data?.products || []));
    const next = r.json?.links?.next;
    url = next && next !== url ? next : null;
  }
  return { products };
}

async function productDetail(base, id, state) {
  const url = `${base.replace(/\/$/, '')}/cds-au/v1/banking/products/${encodeURIComponent(id)}`;
  const r = await negotiate(url, ['6', '5', '4', '7', '3', '2', '1'], state, 'detail');
  return r?.ok ? r.json.data : null;
}

export async function collectRates({ log = console.log } = {}) {
  const reg = await getJson(REGISTER, { 'x-v': '2' });
  if (!reg?.ok) throw new Error(`CDR register unavailable (${reg?.status})`);
  const brands = reg.json.data.filter((b) => (b.industries || ['banking']).includes('banking') && b.productBaseUri);
  log(`register: ${brands.length} banking brands`);

  const perBrand = await pool(brands, 8, async (b) => {
    const state = {};
    const { products, error } = await listProducts(b.productBaseUri, state);
    if (error && !products.length) return { brand: b.brandName, rows: [], error };
    // Resolve the detail version once, then fan out.
    const first = products.length ? await productDetail(b.productBaseUri, products[0].productId, state) : null;
    const rest = await pool(products.slice(1), 4, (p) => productDetail(b.productBaseUri, p.productId, state));
    const details = [first, ...rest];
    const rows = details.filter(Boolean).flatMap((d) => flattenProduct(d, b));
    return { brand: b.brandName, rows, products: products.length };
  });

  const rows = perBrand.flatMap((x) => x.rows || []);
  const failed = perBrand.filter((x) => x.error).map((x) => ({ lender: x.brand, error: x.error }));
  const lenders = new Set(rows.map((r) => r.lender));
  log(`rates: ${rows.length} rows from ${lenders.size} lenders; ${failed.length} brands unavailable`);
  return { rows, failed, brandsChecked: brands.length };
}

/** Best rate per segment, the numbers the dashboard headlines. */
export function summarise(rawRows) {
  const rows = rawRows.map(normaliseRate);
  const seg = (f) => rows.filter(f).sort((a, b) => a.rate - b.rate);
  const pick = (list) => list.slice(0, 5).map(({ lender, product, rate, comparison, lvrMax, url }) => ({ lender, product, rate, comparison, lvrMax, url }));
  const at80 = (r) => r.lvrMax === null || r.lvrMax >= 80;
  // headline picks: open to anyone, for buying a home, standard (not niche or negotiated), available at 80% LVR
  const std = (r) => !r.tailored && !r.special && at80(r) && !membersOnly(r) && !notPurchase(r) && !r.suspect;
  const out = {};
  for (const purpose of ['INV', 'OO']) {
    for (const repay of ['PI', 'IO']) {
      out[`${purpose}_${repay}_variable`] = pick(seg((r) => std(r) && r.purpose === purpose && r.repay === repay && r.type === 'variable'));
      for (const t of [1, 2, 3, 5]) {
        out[`${purpose}_${repay}_fixed${t}`] = pick(
          seg((r) => std(r) && r.purpose === purpose && r.repay === repay && r.type === 'fixed' && Math.abs(r.term - t) < 0.01),
        );
      }
    }
  }
  // the same picks from lenders anyone in Australia can apply to
  for (const k of Object.keys(out)) {
    const [purpose, repay, kind] = k.split('_');
    const fixed = kind.startsWith('fixed') ? +kind.slice(5) : null;
    out[`${k}_national`] = pick(seg((r) => std(r) && isNational(r) && r.purpose === purpose && r.repay === repay && (fixed ? r.type === 'fixed' && Math.abs(r.term - fixed) < 0.01 : r.type === 'variable')));
  }
  // Median advertised investor P&I variable, a fair "typical" rate for the analyser default.
  const inv = seg((r) => std(r) && r.purpose === 'INV' && r.repay === 'PI' && r.type === 'variable').map((r) => r.rate);
  const median = inv.length ? inv[Math.floor(inv.length / 2)] : null;
  return { best: out, medianInvestorVariable: median };
}

function columnar(rows) {
  const cols = ['lender', 'product', 'type', 'term', 'purpose', 'repay', 'rate', 'comparison', 'lvrMin', 'lvrMax', 'url', 'tailored', 'special'];
  const lenders = [...new Set(rows.map((r) => r.lender))].sort();
  const lidx = new Map(lenders.map((l, i) => [l, i]));
  return {
    cols,
    lenders,
    rows: rows.map((r) => cols.map((c) => (c === 'lender' ? lidx.get(r.lender) : r[c]))),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const t0 = Date.now();
  const { rows, failed, brandsChecked } = await collectRates();
  if (rows.length < 200) throw new Error(`Only ${rows.length} rate rows; refusing to overwrite good data`);
  await mkdir(OUT, { recursive: true });
  const updated = new Date().toISOString();
  const summary = summarise(rows);
  await writeFile(
    new URL('rates.json', OUT),
    JSON.stringify({ updated, source: 'Consumer Data Right product reference data (api.cdr.gov.au)', brandsChecked, failed, ...columnar(rows) }),
  );
  await writeFile(
    new URL('rates-summary.json', OUT),
    JSON.stringify({ updated, lenders: new Set(rows.map((r) => r.lender)).size, rows: rows.length, ...summary }, null, 1),
  );
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
