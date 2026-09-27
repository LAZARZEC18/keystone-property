// Understands what someone is looking for from a plain-English search,
// e.g. "3 bed house under 800k near the beach in Perth with good yield".
import { cleanName } from './data.js';

const STREET = /\b(st|street|rd|road|ave|avenue|dr|drive|cres|crescent|ct|court|pl|place|way|tce|terrace|pde|parade|hwy|highway|lane|ln|blvd|boulevard|cl|close|cct|circuit|gr|grove|loop|mews|esp|esplanade|rise|row|walk|vista|view|square|sq|chase|glade|green|link|pass)\b/i;

/** True when the text looks like a street address rather than a search. */
export function looksLikeAddress(q) {
  return /^\s*(unit\s*|u\s*|apt\s*|lot\s*)?\d+[a-z]?(\s*[/-]\s*\d+[a-z]?)?\s+[a-z]/i.test(q) && STREET.test(q);
}

const num = (s) => {
  const m = String(s).replace(/,/g, '').match(/(\d+(?:\.\d+)?)\s*(m|mil|million|k|thousand)?/i);
  if (!m) return null;
  let v = +m[1];
  const u = (m[2] || '').toLowerCase();
  if (u.startsWith('m')) v *= 1e6;
  else if (u === 'k' || u === 'thousand') v *= 1e3;
  else if (v < 20) v *= 1e6; // "1.2" on its own means $1.2m
  else if (v < 5000) v *= 1e3; // "750" means $750k
  return Math.round(v);
};

const STATE_WORDS = {
  NSW: /\b(nsw|new south wales)\b/i, VIC: /\b(vic|victoria)\b/i, QLD: /\b(qld|queensland)\b/i, WA: /\b(wa|western australia)\b/i,
  SA: /\b(sa|south australia)\b/i, TAS: /\b(tas|tasmania)\b/i, ACT: /\b(act|canberra)\b/i, NT: /\b(nt|northern territory)\b/i,
};
const REGION_WORDS = {
  SYD: /\bsydney\b/i, MEL: /\bmelbourne\b/i, BNE: /\bbrisbane\b/i, PER: /\bperth\b/i, ADL: /\badelaide\b/i, HBA: /\bhobart\b/i, DRW: /\bdarwin\b/i, CBR: /\bcanberra\b/i,
  RNSW: /\bregional (nsw|new south wales)\b/i, RVIC: /\bregional (vic|victoria)\b/i, RQLD: /\bregional (qld|queensland)\b/i, RWA: /\bregional (wa|western australia)\b/i, RSA: /\bregional (sa|south australia)\b/i, RTAS: /\bregional (tas|tasmania)\b/i, RNT: /\bregional (nt|northern territory)\b/i,
};
const LGA_ALIASES = { 'gold coast': 'Gold Coast', 'sunshine coast': 'Sunshine Coast', 'central coast': 'Central Coast', geelong: 'Greater Geelong', ballarat: 'Ballarat', bendigo: 'Greater Bendigo', newcastle: 'Newcastle', wollongong: 'Wollongong', townsville: 'Townsville', cairns: 'Cairns', toowoomba: 'Toowoomba', mandurah: 'Mandurah', bunbury: 'Bunbury', launceston: 'Launceston' };

export function parseQuery(q, list) {
  const t = ` ${q.toLowerCase()} `;
  const out = { raw: q, chips: [], places: [] };
  // bedrooms / bathrooms
  let m = t.match(/(\d)\s*\+?\s*(?:bed(?:room)?s?|br|bdr)\b/);
  if (m) {
    out.beds = +m[1];
    out.chips.push(`${out.beds}+ bed`);
  }
  m = t.match(/(\d)\s*\+?\s*(?:bath(?:room)?s?)\b/);
  if (m) {
    out.baths = +m[1];
    out.chips.push(`${out.baths}+ bath`);
  }
  // type
  if (/\b(apartment|unit|flat|studio|condo)s?\b/.test(t)) out.type = 'u';
  else if (/\b(townhouse|villa|duplex|terrace)s?\b/.test(t)) out.type = 'u';
  else if (/\b(house|home|family home|land)s?\b/.test(t)) out.type = 'h';
  if (out.type) out.chips.push(out.type === 'u' ? 'Unit / townhouse' : 'House');
  // price
  m = t.match(/between\s*\$?\s*([\d.,]+\s*(?:k|m|mil|million)?)\s*(?:and|-|to)\s*\$?\s*([\d.,]+\s*(?:k|m|mil|million)?)/);
  if (m) {
    out.minPrice = num(m[1]);
    out.maxPrice = num(m[2]);
  } else {
    m = t.match(/(?:under|below|less than|max(?:imum)?|up to|budget(?: of)?|<|for)\s*\$?\s*([\d.,]+\s*(?:k|m|mil|million)?)/);
    if (m) out.maxPrice = num(m[1]);
    m = t.match(/(?:over|above|more than|min(?:imum)?|from|>)\s*\$?\s*([\d.,]+\s*(?:k|m|mil|million)?)/);
    if (m && !/\bfrom (the )?(city|cbd|beach)/.test(t)) out.minPrice = num(m[1]);
    if (!out.maxPrice && !out.minPrice) {
      m = t.match(/\$\s*([\d.,]+\s*(?:k|m|mil|million)?)/);
      if (m) out.maxPrice = num(m[1]);
    }
  }
  if (out.maxPrice) out.chips.push(`under $${(out.maxPrice / 1000).toLocaleString()}k`);
  if (out.minPrice) out.chips.push(`over $${(out.minPrice / 1000).toLocaleString()}k`);
  // yield
  m = t.match(/(\d+(?:\.\d+)?)\s*%\s*(?:\+\s*)?(?:gross\s*)?yield/);
  if (m) {
    out.minYield = +m[1];
    out.chips.push(`${out.minYield}%+ yield`);
  }
  // strategy
  if (/\b(yield|cash ?flow|positive(ly)? geared|income|rental return|rent covers)\b/.test(t)) out.strategy = 'cashflow';
  else if (/\b(growth|capital gain|appreciat|long term|blue chip)\b/.test(t)) out.strategy = 'growth';
  else if (/\b(first home|first-home|affordable|cheap|budget|starter)\b/.test(t)) out.strategy = 'firsthome';
  if (out.strategy) out.chips.push({ cashflow: 'Cash flow focus', growth: 'Growth focus', firsthome: 'Affordability focus' }[out.strategy]);
  if (/\b(safe|low risk|stable|established|family|families|schools?)\b/.test(t)) {
    out.stable = true;
    out.chips.push('Stable, established area');
  }
  // lifestyle
  if (/\b(beach|beaches|coast|coastal|ocean|sea|seaside|surf|sea change)\b/.test(t)) {
    out.coastKm = /\b(walk|walking|close|right)\b/.test(t) ? 2 : 4;
    out.chips.push(`Within ${out.coastKm} km of the ocean`);
  } else if (/\b(river|riverside|waterfront|water|lake|estuary)\b/.test(t)) {
    out.waterKm = 2.5;
    out.chips.push('Near a river or the water');
  }
  if (/\b(city|cbd|inner|central|close to (the )?city|near (the )?city|walk to)\b/.test(t)) {
    out.cbdKm = /\binner|walk\b/.test(t) ? 8 : 15;
    out.chips.push(`Within ${out.cbdKm} km of the CBD`);
  }
  if (/\b(regional|country|rural|tree change|sea change|quiet)\b/.test(t)) {
    out.regional = true;
    out.chips.push('Regional');
  }
  if (/\b(new build|brand new|new home|off the plan|house and land)\b/.test(t)) {
    out.newBuild = true;
    out.chips.push('New build');
  }
  // places: regions, states, council aliases, suburbs / postcodes
  for (const [code, re] of Object.entries(REGION_WORDS)) if (re.test(t)) out.places.push({ kind: 'region', code });
  if (!out.places.length) for (const [st, re] of Object.entries(STATE_WORDS)) if (re.test(t)) out.places.push({ kind: 'state', code: st });
  for (const [alias, lga] of Object.entries(LGA_ALIASES)) if (t.includes(` ${alias}`)) out.places.push({ kind: 'lga', code: lga });
  const pcs = [...t.matchAll(/\b(\d{4})\b/g)].map((x) => x[1]).filter((p) => !out.maxPrice || String(out.maxPrice).indexOf(p) === -1);
  for (const pc of pcs) if (list.some((s) => s.pc === pc)) out.places.push({ kind: 'postcode', code: pc });
  // suburb names (longest first, whole words), optionally "near X"
  const words = t.replace(/[^a-z0-9 ]/g, ' ');
  const hits = [];
  for (const s of list) {
    const n = cleanName(s.n).toLowerCase();
    if (n.length < 4) continue;
    const i = words.indexOf(` ${n} `);
    if (i >= 0) hits.push([n.length, s, i]);
  }
  hits.sort((a, b) => b[0] - a[0] || b[1].pop - a[1].pop);
  const used = [];
  for (const [len, s, i] of hits) {
    if (used.some(([a, b]) => i < b && i + len > a)) continue;
    if (/^(city|beach|central|inner|west|east|north|south|park|hills|heights|gardens|house|home|land|new|river|ocean|coast|yield|growth|quiet)$/.test(cleanName(s.n).toLowerCase())) continue;
    if (Object.values(REGION_WORDS).some((re) => re.test(` ${cleanName(s.n)} `)) || Object.values(STATE_WORDS).some((re) => re.test(` ${cleanName(s.n)} `))) continue;
    used.push([i, i + len]);
    const near = new RegExp(`(near|around|close to|within \\d+ ?km of)\\s+${cleanName(s.n).toLowerCase()}`).test(t);
    out.places.push({ kind: near ? 'near' : 'suburb', code: s.id, name: cleanName(s.n), s });
    if (used.length >= 3) break;
  }
  for (const p of out.places) out.chips.push(p.kind === 'near' ? `Near ${p.name}` : p.kind === 'suburb' ? `${p.name}` : p.kind === 'postcode' ? `Postcode ${p.code}` : p.kind === 'lga' ? p.code : p.code);
  return out;
}
