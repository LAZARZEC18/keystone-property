import { normaliseRate } from './rate-rules.js';
// Data loading and lookups shared by every page.
const cache = new Map();

// Served live by a Netlify function (cached up to an hour), falling back to the stored file.
const LIVE = new Set(['news', 'rba']);
/** The stored copy at once, plus the live copy when it arrives (up to 20 s), for pages that can update in place. */
export function loadStaleFirst(name) {
  const stored = getStatic(name);
  const live = fetch(`/api/live-${name}`, { signal: AbortSignal.timeout(20000) })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((d) => (d && !d.error ? d : Promise.reject(new Error('live'))))
    .catch(() => null);
  return { stored, live };
}
const getStatic = (name) =>
  fetch(`/data/${name}.json`, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    return r.json();
  });

export async function load(name) {
  if (cache.has(name)) return cache.get(name);
  const p = LIVE.has(name)
    ? fetch(`/api/live-${name}`, { signal: AbortSignal.timeout(6000) })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
        .then((d) => (d && !d.error ? d : Promise.reject(new Error('live'))))
        .catch(() => getStatic(name))
    : getStatic(name);
  cache.set(name, p);
  try {
    return await p;
  } catch (e) {
    cache.delete(name);
    throw e;
  }
}

let suburbIndex = null;
/** All suburbs as objects, with lookup maps. */
export async function suburbs() {
  if (suburbIndex) return suburbIndex;
  const [d, market] = await Promise.all([load('suburbs'), load('market').catch(() => null)]);
  const idx = null;
  const { applyLiveGrowth } = await import('./live.js');
  const list = d.rows.map((r) => {
    const o = {};
    d.cols.forEach((c, i) => (o[c] = r[i]));
    o.sc = { cash: o.sc_cash, momentum: o.sc_momentum, growth: o.sc_growth, demand: o.sc_demand, afford: o.sc_afford, stability: o.sc_stability, risk: o.rsk ?? 0, modelled: !(o.conf === 'high' || o.conf === 'medium') };
    o.slug = slug(o);
    o.key = `${o.n} ${o.s} ${o.pc || ''}`.toLowerCase();
    applyLiveGrowth(o, idx, market);
    return o;
  });
  const byId = new Map(list.map((s) => [s.id, s]));
  const bySlug = new Map(list.map((s) => [s.slug, s]));
  const byPc = new Map();
  for (const s of list) {
    if (!s.pc) continue;
    if (!byPc.has(s.pc)) byPc.set(s.pc, []);
    byPc.get(s.pc).push(s);
  }
  suburbIndex = { list, byId, bySlug, byPc, meta: d.meta };
  return suburbIndex;
}

export async function suburbDetail(s) {
  const d = await load(`suburbs-${s.s}`);
  return d[s.id] || {};
}

export function cleanName(n) {
  return n.replace(/\s*\((NSW|Vic\.|Qld|SA|WA|Tas\.|NT|ACT)\)\s*$/i, '');
}

export function slug(s) {
  const base = cleanName(s.n)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${s.s.toLowerCase()}/${base}-${s.pc || s.id}`;
}

export const suburbUrl = (s) => `/suburb/${s.slug}`;

/** Search suburbs by name or postcode; ranks exact and prefix matches first. */
export function searchSuburbs(list, q, limit = 12) {
  q = q.trim().toLowerCase();
  if (!q) return [];
  const isPc = /^\d{3,4}$/.test(q);
  const out = [];
  for (const s of list) {
    const name = cleanName(s.n).toLowerCase();
    let rank = -1;
    if (isPc) {
      if (s.pc === q.padStart(4, '0')) rank = 0;
      else if (s.pc && s.pc.startsWith(q)) rank = 2;
    } else if (name === q) rank = 0;
    else if (name.startsWith(q)) rank = 1;
    else if (name.includes(q)) rank = 3;
    else if (s.key.includes(q)) rank = 4;
    if (rank >= 0) out.push([rank, -s.pop, s]);
  }
  out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  return out.slice(0, limit).map((x) => x[2]);
}

export function haversine(a, b) {
  const R = 6371;
  const toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b.lat - a.lat);
  const dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearby(list, s, n = 8, maxKm = 25) {
  return list
    .filter((x) => x !== s && Math.abs(x.lat - s.lat) < 0.5 && Math.abs(x.lng - s.lng) < 0.5)
    .map((x) => [haversine(s, x), x])
    .filter(([d]) => d <= maxKm)
    .sort((a, b) => a[0] - b[0])
    .slice(0, n)
    .map(([d, x]) => ({ ...x, km: d }));
}

/** Rates file (columnar) to row objects. */
export async function rateRows() {
  const d = await load('rates');
  return {
    updated: d.updated,
    brandsChecked: d.brandsChecked,
    failed: d.failed,
    lenders: d.lenders,
    rows: d.rows.map((r) => {
      const o = {};
      d.cols.forEach((c, i) => (o[c] = r[i]));
      o.lender = d.lenders[o.lender];
      return normaliseRate(o);
    }),
  };
}

// ---- watchlist (per-browser convenience only)
const WL = 'keystone.watchlist';
export function watchlist() {
  try {
    return JSON.parse(localStorage.getItem(WL) || '[]');
  } catch {
    return [];
  }
}
export function toggleWatch(id) {
  const w = new Set(watchlist());
  if (w.has(id)) w.delete(id);
  else w.add(id);
  try {
    localStorage.setItem(WL, JSON.stringify([...w]));
  } catch {
    /* storage unavailable */
  }
  return w.has(id);
}

// Saved deals (analyser): kept in this browser only.
const DEALS = 'keyzing.deals';
export function savedDeals() {
  try {
    return JSON.parse(localStorage.getItem(DEALS) || '[]');
  } catch {
    return [];
  }
}
export function saveDeal(d) {
  const list = savedDeals().filter((x) => x.url !== d.url);
  list.unshift({ ...d, saved: new Date().toISOString() });
  try {
    localStorage.setItem(DEALS, JSON.stringify(list.slice(0, 50)));
    return true;
  } catch {
    return false;
  }
}
export function removeDeal(url) {
  try {
    localStorage.setItem(DEALS, JSON.stringify(savedDeals().filter((x) => x.url !== url)));
  } catch {}
}

/**
 * The one "typical" rate used as a default everywhere: the RBA's average rate actually paid on new variable loans
 * (table F6), not a lender's advertised rate. kind: 'INV' | 'OO'.
 */
export function typicalRate(rba, kind = 'INV') {
  const row = (kind === 'OO' ? rba?.actual?.newOOVariable : rba?.actual?.newInvVariable)?.at?.(-1);
  return { rate: row?.[1] ?? (kind === 'OO' ? 6.2 : 6.4), month: row?.[0] ? new Date(`${row[0]}T00:00:00`).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : '' };
}

/** One minimum population for every suburb ranking (explorer, map, affordability). */
export const MIN_POP = 3000;

/**
 * A fair national order. States publish very different amounts of suburb sales data, so raw scores across states
 * aren't comparable. Each row gets its rank within its own state, and the national list is ordered by that
 * within-state position (top of each state first, in proportion to the state's size), then by score.
 */
export function fairOrder(rows, scoreOf = (r) => r.score, stateOf = (r) => r.s.s) {
  const by = {};
  for (const r of rows) (by[stateOf(r)] ||= []).push(r);
  for (const arr of Object.values(by)) {
    arr.sort((a, b) => scoreOf(b) - scoreOf(a));
    arr.forEach((r, i) => {
      r.stateRank = i + 1;
      r.statePct = (i + 0.5) / arr.length;
    });
  }
  return rows.sort((a, b) => a.statePct - b.statePct || scoreOf(b) - scoreOf(a));
}

/** One slug for council pages everywhere (matches the server's). 'Campbelltown (NSW)' -> 'campbelltown-nsw'. */
export const lgaSlug = (x) => String(x || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
