// Data loading and lookups shared by every page.
const cache = new Map();

export async function load(name) {
  if (cache.has(name)) return cache.get(name);
  const p = fetch(`/data/${name}.json`, { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error(`${name}: ${r.status}`);
    return r.json();
  });
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
  const d = await load('suburbs');
  const list = d.rows.map((r) => {
    const o = {};
    d.cols.forEach((c, i) => (o[c] = r[i]));
    o.sc = { cash: o.sc_cash, momentum: o.sc_momentum, growth: o.sc_growth, demand: o.sc_demand, afford: o.sc_afford, stability: o.sc_stability, risk: o.rsk ?? 0 };
    o.slug = slug(o);
    o.key = `${o.n} ${o.s} ${o.pc || ''}`.toLowerCase();
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
      return o;
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
