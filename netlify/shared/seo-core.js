// Server-side page metadata and crawler-readable content for the single-page app.
// Used by the Netlify Edge Function (netlify/edge-functions/seo.js) and by the Node tests.
// Every URL gets its own <title>, description, canonical, Open Graph/Twitter tags, JSON-LD and
// a plain-HTML summary inside <main> (the app replaces it when JavaScript runs). Unknown URLs get a real 404.

const clean = (n) => n.replace(/\s*\((NSW|Vic\.|Qld|SA|WA|Tas\.|NT|ACT)\)\s*$/i, '');
const slugify = (x) => x.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (v) => (v == null ? '—' : v >= 999500 ? `$${(v / 1e6).toFixed(2)}m` : `$${Math.round(v / 1000)}k`);
const pct = (v, dp = 1, sign = false) => (v == null ? '—' : `${sign && v > 0 ? '+' : ''}${Number(v).toFixed(dp)}%`);
const STATE_NAMES = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia', SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory' };
const W = { cash: 20, momentum: 15, growth: 20, demand: 20, afford: 10, stability: 15 };

const PAGES = {
  '/': ['Find a home you can afford, and know what it’s worth', 'Free and independent: see what you can afford in every state with the 5% Deposit Scheme and stamp duty concessions, estimate a home’s value with an honest range, compare 11,000 suburbs and every lender’s rate.'],
  '/afford': ['What can I afford? Your buying ceiling in every state', 'Enter your savings and income to see the most you can pay in every state, with stamp duty, first home concessions, the 5% Deposit Scheme and lender buffers, then the best suburbs within reach.'],
  '/property': ['What is this property worth? Address valuation', 'Enter any Australian address for an estimated value and range, the cash and repayments to buy it, or the investment numbers, plus comparable suburbs nearby.'],
  '/find': ['Search property by what you want', 'Describe what you want in plain English, like "3 bed house near the beach in Perth under $800k", and Keyzing ranks every matching suburb.'],
  '/map': ['Highest-scoring suburbs in Australia: map', 'Every Australian suburb scored on yield, growth, demand, affordability and stability, on one map, with how much of each score is measured.'],
  '/suburbs': ['Suburb explorer: rank every Australian suburb', 'Filter and rank 11,000 Australian suburbs by price, rent, yield, growth, demand and risk.'],
  '/analyse': ['Investment property analyser with the 2026 tax rules', 'Stamp duty, LMI, land tax, depreciation and a 10-year after-tax cash flow and return for any Australian property, including the 2026 negative gearing and CGT changes.'],
  '/borrowing': ['How much can I borrow? Borrowing power calculator', 'Estimate your borrowing power the way Australian lenders do: 3-point buffer, 80% of rent, debts and dependants.'],
  '/rates': ['Home loan rates in Australia, compared', 'Every advertised home loan rate from Australian lenders, read from their Open Banking feeds, ranked by loan type and deposit.'],
  '/live': ['Live home values: daily index for the capitals', 'Daily home value moves for Sydney, Melbourne, Brisbane, Adelaide and Perth: this week, month, year to date and year.'],
  '/markets': ['Australian property market dashboard', 'Median values, growth, rents, yields, vacancy and days on market for every capital and regional market.'],
  '/new-builds': ['New builds and housing supply by council', 'Monthly building approvals by state, council and area, and where new supply is heaviest.'],
  '/weekly': ['Weekly Australian property market report', 'What moved in home values and rates this week, the RBA outlook and the headlines.'],
  '/news': ['Australian housing news', 'Headlines on prices, rates, rents and housing policy from Australian publishers.'],
  '/guide': ['How to buy property in Australia: first home and investment guide (2026)', 'The whole process in order for first home buyers and investors: schemes and grants, stamp duty by state, finance, the 2026 tax changes and every cost.'],
  '/first-home': ['First home tools: rent vs buy, savings planner and FHSS calculator', 'How long it will take to save a deposit, whether buying beats renting, and how much the First Home Super Saver scheme adds.'],
  '/why': ['Why Keyzing: what it does for home buyers and investors', 'How Keyzing helps first home buyers, upgraders and investors find, value and pay for the right property, and how it differs from listing portals, paid data tools and rate comparison sites.'],
  '/compare': ['Compare suburbs side by side', 'Compare up to four Australian suburbs on price, rent, yield, growth and risk.'],
  '/watchlist': ['Your suburb watchlist', 'Suburbs you have saved on Keyzing.'],
  '/methodology': ['Data sources and methodology', 'Where every Keyzing figure comes from, how the price and rent models work, and their measured error.'],
  '/about': ['About Keyzing', 'Independent Australian property research for home buyers and investors.'],
  '/contact': ['Contact Keyzing', 'Questions, corrections and partnership enquiries.'],
  '/privacy': ['Privacy policy', 'What Keyzing collects, why, and what it does with it.'],
  '/terms': ['Terms of use', 'The terms for using Keyzing.'],
};
const NOINDEX = new Set(['/compare', '/watchlist']);

/** Build lookup tables from site/data/suburbs.json and market.json. */
const DAILY = { SYD: 'SYD', MEL: 'MEL', BNE: 'BNEGC', ADL: 'ADL', PER: 'PER' };

/** Same adjustments the app makes on load: prices moved to today with the daily index. 12-month figures stay on the monthly index. */
function liveAdjust(o, index, market) {
  const d = DAILY[o.rg] ? index?.daily?.[DAILY[o.rg]] : null;
  const R = market?.regions?.[o.rg];
  if (!d || !R) return;
  let base = null;
  for (const [dt, v] of d.series || []) if (dt <= '2026-08-31') base = v;
  const lf = base ? d.value / base : 1;
  o.h = o.h ? Math.round((o.h * lf) / 1000) * 1000 : o.h;
  o.u = o.u ? Math.round((o.u * lf) / 1000) * 1000 : o.u;
}

export function buildIndex(sub, market, index = null) {
  const c = (k) => sub.cols.indexOf(k);
  const rows = sub.rows.map((r) => {
    const o = {};
    sub.cols.forEach((k, i) => (o[k] = r[i]));
    return o;
  });
  const bySlug = new Map();
  const byPc = new Map();
  const byLga = new Map();
  for (const o of rows) {
    o.name = clean(o.n);
    liveAdjust(o, index, market);
    o.slug = `${o.s.toLowerCase()}/${slugify(o.name)}-${o.pc || o.id}`;
    const sc = {};
    let t = 0;
    let w = 0;
    for (const [k, wt] of Object.entries(W)) {
      const v = o[`sc_${k}`];
      if (v == null) continue;
      t += v * wt;
      w += wt;
    }
    const risk = o.rsk ?? 0;
    const raw = w ? t / w : null;
    const base = raw != null && !(o.conf === 'high' || o.conf === 'medium') ? 50 + (raw - 50) * 0.85 : raw;
    o.score = w ? Math.max(0, Math.round(base) - (risk > 20 ? Math.round((risk - 20) * 0.31) : 0)) : null;
    bySlug.set(o.slug, o);
    if (o.pc) (byPc.get(o.pc) || byPc.set(o.pc, []).get(o.pc)).push(o);
    if (o.lga) {
      const k = `${o.s.toLowerCase()}/${slugify(o.lga)}`;
      (byLga.get(k) || byLga.set(k, []).get(k)).push(o);
    }
  }
  return { rows, bySlug, byPc, byLga, market, count: rows.length };
}

const ROUTES = [
  /^\/$/, /^\/live$/, /^\/markets$/, /^\/new-builds$/, /^\/weekly$/, /^\/suburbs$/, /^\/suburb\/[a-z]+\/[a-z0-9-]+$/, /^\/postcode\/\d{3,4}$/,
  /^\/council\/[a-z]+\/[a-z0-9-]+$/, /^\/analyse$/, /^\/afford$/, /^\/rates$/, /^\/listings$/, /^\/news$/, /^\/guide$/, /^\/compare$/, /^\/watchlist$/,
  /^\/borrowing$/, /^\/methodology$/, /^\/find$/, /^\/property$/, /^\/map$/, /^\/(about|privacy|terms|contact)$/, /^\/first-home$/, /^\/why$/,
];

function nearest(ix, s, n = 8) {
  return ix.rows
    .filter((x) => x !== s && x.pop >= 500 && Math.abs(x.lat - s.lat) < 0.3 && Math.abs(x.lng - s.lng) < 0.3)
    .map((x) => [(x.lat - s.lat) ** 2 + ((x.lng - s.lng) * Math.cos((s.lat * Math.PI) / 180)) ** 2, x])
    .sort((a, b) => a[0] - b[0])
    .slice(0, n)
    .map(([, x]) => x);
}

/**
 * Metadata + server content for a path. Returns {status, title, description, canonical, robots, jsonld[], body|null}.
 */
export function describe(pathname, search, ix, origin) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const canonical = `${origin}${path === '/' ? '/' : path}`;
  const base = { status: 200, canonical, robots: 'index,follow', jsonld: [], body: null, image: `${origin}/assets/og.png` };
  if (!ROUTES.some((re) => re.test(path))) {
    return { ...base, status: 404, robots: 'noindex', title: 'Page not found', description: 'This page does not exist on Keyzing.', body: '<div class="empty"><h1>Page not found</h1><p>Try the <a href="/suburbs">suburb explorer</a> or search above.</p></div>' };
  }
  const q = new URLSearchParams(search);
  let m = path.match(/^\/suburb\/([a-z]+\/[a-z0-9-]+)$/);
  if (m) {
    const s = ix.bySlug.get(m[1]);
    if (!s) return { ...base, status: 404, robots: 'noindex', title: 'Suburb not found', description: 'No Australian suburb matches this address.', body: '<div class="empty"><h1>Suburb not found</h1><p>Try the <a href="/suburbs">suburb explorer</a>.</p></div>' };
    const R = ix.market?.regions?.[s.rg] || {};
    const type = s.pt === 'u' ? 'unit' : 'house';
    const price = s.pt === 'u' ? s.u : s.h;
    const rent = s.pt === 'u' ? s.ru : s.rh;
    const title = `${s.name} ${s.s} ${s.pc || ''}: house prices, rents, yield and suburb score`.replace(/\s+/g, ' ');
    const description = `Typical ${type} in ${s.name} about ${money(price)}, rent about $${rent ?? '—'} a week (${pct(s.y, 1)} yield). Price trend, demographics, supply, risks and the cost to buy, updated daily.`;
    const near = nearest(ix, s);
    const lgaSlug = s.lga ? `${s.s.toLowerCase()}/${slugify(s.lga)}` : null;
    const body = `<article class="ssr"><div class="crumbs"><a href="/suburbs?state=${s.s}">${esc(STATE_NAMES[s.s] || s.s)}</a> › ${lgaSlug ? `<a href="/council/${lgaSlug}">${esc(s.lga)}</a> › ` : ''}${s.pc ? `<a href="/postcode/${s.pc}">${s.pc}</a>` : ''}</div>
<h1>${esc(s.name)} ${s.s} ${esc(s.pc || '')}</h1>
<p>${esc(s.name)} is in the ${esc(s.lga || '')} council area of ${esc(R.name || STATE_NAMES[s.s] || '')}, with about ${Number(s.pop).toLocaleString('en-AU')} residents. The typical house is about ${money(s.h)} and the typical unit about ${money(s.u)}. Typical rents are about $${s.rh ?? '—'} a week for a house and $${s.ru ?? '—'} for a unit, a gross yield of about ${pct(s.y, 1)} on a house. Over the past year values changed about ${pct(s.g1, 1, true)}${String(s.g1s).startsWith('region') ? ` (${esc(R.name || 'regional')} figure)` : ''}. Keyzing suburb score: ${s.score ?? '—'}/100.</p>
<ul><li>Price data: ${s.hs === 'model' ? 'modelled (no official suburb sales series)' : 'official government sales'}</li><li>${s.cbd != null ? `${Math.round(s.cbd)} km from the city centre` : 'Regional'}${s.ocn != null ? `, ${Number(s.ocn).toFixed(1)} km from the ocean` : ''}</li></ul>
<h2>Nearby suburbs</h2><ul>${near.map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)} ${x.s} ${esc(x.pc || '')}</a>: typical ${x.pt === 'u' ? 'unit' : 'house'} ${money(x.pt === 'u' ? x.u : x.h)}</li>`).join('')}</ul></article>`;
    const jsonld = [
      { '@context': 'https://schema.org', '@type': 'Place', name: `${s.name}, ${s.s} ${s.pc || ''}`.trim(), address: { '@type': 'PostalAddress', addressLocality: s.name, addressRegion: s.s, postalCode: s.pc || undefined, addressCountry: 'AU' }, geo: { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng }, containedInPlace: s.lga ? { '@type': 'AdministrativeArea', name: s.lga } : undefined },
      { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: STATE_NAMES[s.s] || s.s, item: `${origin}/suburbs?state=${s.s}` },
        ...(lgaSlug ? [{ '@type': 'ListItem', position: 2, name: s.lga, item: `${origin}/council/${lgaSlug}` }] : []),
        { '@type': 'ListItem', position: lgaSlug ? 3 : 2, name: s.name, item: canonical },
      ] },
    ];
    return { ...base, title, description, body, jsonld };
  }
  m = path.match(/^\/postcode\/(\d{3,4})$/);
  if (m) {
    const list = (ix.byPc.get(m[1]) || []).sort((a, b) => b.pop - a.pop);
    if (!list.length) return { ...base, status: 404, robots: 'noindex', title: 'Postcode not found', description: 'No suburbs found for this postcode.', body: '<div class="empty"><h1>Postcode not found</h1></div>' };
    const title = `Postcode ${m[1]}: suburbs, house prices and rents (${list[0].s})`;
    const description = `${list.length} suburb${list.length > 1 ? 's' : ''} in postcode ${m[1]}, ${STATE_NAMES[list[0].s]}: ${list.slice(0, 4).map((x) => x.name).join(', ')}. Typical prices, rents, yields and suburb scores.`;
    const body = `<article class="ssr"><h1>Postcode ${m[1]}</h1><ul>${list.map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)}</a>: typical house ${money(x.h)}, rent $${x.rh ?? '—'}/wk, score ${x.score ?? '—'}</li>`).join('')}</ul></article>`;
    return { ...base, title, description, body };
  }
  m = path.match(/^\/council\/([a-z]+\/[a-z0-9-]+)$/);
  if (m) {
    const list = (ix.byLga.get(m[1]) || []).sort((a, b) => b.pop - a.pop);
    if (!list.length) return { ...base, status: 404, robots: 'noindex', title: 'Council not found', description: 'No council area matches this address.', body: '<div class="empty"><h1>Council not found</h1></div>' };
    const lga = list[0].lga;
    const title = `${lga} council area: suburbs, house prices, rents and scores`;
    const description = `${list.length} suburbs in ${lga} (${list[0].s}), with typical prices, rents, yields and Keyzing suburb scores.`;
    const body = `<article class="ssr"><h1>${esc(lga)}</h1><ul>${list.slice(0, 60).map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)} ${esc(x.pc || '')}</a>: typical house ${money(x.h)}, score ${x.score ?? '—'}</li>`).join('')}</ul></article>`;
    return { ...base, title, description, body };
  }
  const page = PAGES[path] || PAGES[path.replace(/^\/listings$/, '/property')] || ['Keyzing', PAGES['/'][1]];
  let [title, description] = page;
  let robots = NOINDEX.has(path) || [...q.keys()].some((k) => ['q', 'price', 'savings', 'income', 'ids', 'asking'].includes(k)) ? 'noindex,follow' : 'index,follow';
  if (path === '/listings') robots = 'noindex,follow';
  const jsonld =
    path === '/'
      ? [
          { '@context': 'https://schema.org', '@type': 'Organization', name: 'Keyzing', url: `${origin}/`, email: 'Keyzing18@gmail.com', logo: `${origin}/assets/keyzing.svg`, address: { '@type': 'PostalAddress', addressLocality: 'Perth', addressRegion: 'WA', addressCountry: 'AU' } },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Keyzing', url: `${origin}/`, potentialAction: { '@type': 'SearchAction', target: `${origin}/find?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
        ]
      : [];
  const body = path === '/' ? null : `<article class="ssr"><h1>${esc(title)}</h1><p>${esc(description)}</p></article>`;
  return { ...base, title, description, robots, jsonld, body, canonical: path === '/listings' ? `${origin}/property` : canonical };
}

/** Rewrite the app shell for one URL. */
export function renderHtml(html, meta) {
  const full = meta.title === 'Keyzing' ? 'Keyzing' : `${meta.title} · Keyzing`;
  const tags = [
    `<link rel="canonical" href="${esc(meta.canonical)}">`,
    `<meta name="robots" content="${meta.robots}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Keyzing">`,
    `<meta property="og:title" content="${esc(meta.title)}">`,
    `<meta property="og:description" content="${esc(meta.description)}">`,
    `<meta property="og:url" content="${esc(meta.canonical)}">`,
    `<meta property="og:image" content="${esc(meta.image)}">`,
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    `<meta property="og:locale" content="en_AU">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${esc(meta.title)}">`,
    `<meta name="twitter:description" content="${esc(meta.description)}">`,
    `<meta name="twitter:image" content="${esc(meta.image)}">`,
    ...meta.jsonld.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  ].join('\n  ');
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(full)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(meta.description)}" />`)
    .replace('</head>', `  ${tags}\n</head>`);
  if (meta.body) out = out.replace(/<main id="main" class="wrap">[\s\S]*?<\/main>/, `<main id="main" class="wrap">${meta.body}</main>`);
  return out;
}
