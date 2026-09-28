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
const W = { cash: 22, momentum: 0, growth: 25, demand: 23, afford: 12, stability: 18 };

const PAGES = {
  '/': ['What can you comfortably afford, and where?', 'Free and independent for Australian home buyers: a comfortable price where you want to buy, the schemes you qualify for (5% Deposit Scheme, Help to Buy, Keystart and state schemes), the real weekly cost of an investment under the 2026 tax rules, and every lender’s rate.'],
  '/afford': ['What can I afford? A comfortable price, and your ceiling in every state', 'Enter your savings and income. Keyzing works out a comfortable price where you want to buy, the most you could stretch to in every state and territory (stamp duty, mortgage insurance, lender buffers), the schemes you qualify for and the suburbs that fit.'],
  '/property': ['Price range for a typical home', 'A suburb-based price range for a typical home like the one you’re looking at, the cash you need and the repayments. Not an appraisal of a particular property.'],
  '/find': ['Search property by what you want', 'Describe what you want in plain English, like "3 bed house near the beach in Perth under $800k", and Keyzing ranks every matching suburb.'],
  '/map': ['Highest-scoring suburbs in Australia: map', 'Suburbs scored on yield, growth drivers, rental demand, affordability and stability, ranked within each state, on one map, with how much of each score is measured.'],
  '/suburbs': ['Suburb explorer: rank every Australian suburb', 'Filter and rank Australian suburbs within each state by price, rent, yield, growth drivers, demand and risk, with every figure marked as measured or modelled.'],
  '/analyse': ['2026 tax-change calculator for investment property', 'The weekly cost after tax and 10-year return of an Australian investment property under the 2026 negative gearing and CGT changes, with stamp duty, LMI, land tax and depreciation, and whether it beats a term deposit.'],
  '/borrowing': ['How much can I borrow?', 'Estimate your borrowing power the way Australian lenders do, for a home to live in or an investment: the 3-point rate buffer, living costs, existing debts and 80% of any rent.'],
  '/rates': ['Home loan rates in Australia, updated several times a day', 'Every advertised home loan rate from 90+ Australian lenders, read from their Open Banking feeds, with offset accounts and fees, ranked by loan type and deposit.'],
  '/markets': ['Australian property market dashboard', 'Month-end median values, the 3-month and 12-month change, rents, yields, vacancy and days on market for every capital and regional market.'],
  '/new-builds': ['New builds and housing supply by council', 'Monthly building approvals by state, council and area, and where new supply is heaviest.'],
  '/weekly': ['Property market update: rates this week, prices at month-end', 'Home loan rates and the RBA outlook checked every week, capital-city values from the latest month-end index, and the week’s housing headlines.'],
  '/news': ['Australian housing news', 'Headlines on prices, rates, rents and housing policy from Australian publishers.'],
  '/guide': ['How to buy property in Australia: first home and investment guide (2026)', 'The whole process in order for first home buyers and investors: federal and state schemes including Keystart, stamp duty by state, finance, the 2026 tax changes and every cost.'],
  '/first-home': ['First home tools: rent vs buy, savings planner and FHSS calculator', 'How long it will take to save a deposit, whether buying beats renting, and how much the First Home Super Saver scheme adds.'],
  '/why': ['Why Keyzing: what it does for home buyers and investors', 'How Keyzing helps first home buyers, upgraders and investors work out what they can afford, what a purchase really costs and which suburbs fit.'],
  '/compare': ['Compare suburbs side by side', 'Compare up to four Australian suburbs on price, rent, yield, growth and risk.'],
  '/watchlist': ['Your saved suburbs and deals', 'Suburbs and deals you have saved on Keyzing, kept only in your own browser.'],
  '/methodology': ['Data sources and methodology', 'Where every Keyzing figure comes from, how the price and rent models work, and their measured error.'],
  '/about': ['About Keyzing', 'Keyzing is a free, independent calculator site for Australian home buyers and investors: what it does, where its numbers come from, and how it stays independent.'],
  '/contact': ['Contact Keyzing', 'Contact Keyzing with a question, a data correction or a privacy request. Every message gets a reply by email.'],
  '/privacy': ['Privacy policy', 'What Keyzing collects, why, and what it does with it.'],
  '/terms': ['Terms of use', 'The terms for using Keyzing: general information and calculators, not financial, credit, tax or legal advice, and how estimates and third-party data should be used.'],
};
// thin or personal pages: aggregated headlines, comparisons and the browser-only watchlist
const NOINDEX = new Set(['/compare', '/watchlist', '/news']);

/** Build lookup tables from site/data/suburbs.json and market.json. */

/** Kept for the call sites; prices are not moved between month-ends. */
function liveAdjust() {
  // Keyzing publishes month-end figures only, so server-rendered prices are the month-end values, as in the app.
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
    o.score = w ? Math.max(0, Math.round(base) - (risk > 15 ? Math.min(30, Math.round((risk - 15) * 0.45)) : 0)) : null;
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
  /^\/$/, /^\/markets$/, /^\/new-builds$/, /^\/weekly$/, /^\/suburbs$/, /^\/suburb\/[a-z]+\/[a-z0-9-]+$/, /^\/postcode\/\d{3,4}$/,
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
    return { ...base, status: 404, robots: 'noindex', title: 'Page not found', description: 'This page does not exist on Keyzing. Try the suburb explorer, the affordability calculator or the search box.', body: '<div class="empty"><h1>Page not found</h1><p>Try the <a href="/suburbs">suburb explorer</a> or search above.</p></div>' };
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
    const description = `Typical ${type} in ${s.name} about ${money(price)}, rent about $${rent ?? '—'} a week (${pct(s.y, 1)} yield). Price trend, demographics, supply, risks and the cost to buy, at the latest month-end.`;
    const near = nearest(ix, s);
    const lgaSlug = s.lga ? `${s.s.toLowerCase()}/${slugify(s.lga)}` : null;
    const body = `<article class="ssr"><div class="crumbs"><a href="/suburbs?state=${s.s}">${esc(STATE_NAMES[s.s] || s.s)}</a> › ${lgaSlug ? `<a href="/council/${lgaSlug}">${esc(s.lga)}</a> › ` : ''}${s.pc ? `<a href="/postcode/${s.pc}">${s.pc}</a>` : ''}</div>
<h1>${esc(s.name)} ${s.s} ${esc(s.pc || '')}</h1>
<p>${esc(s.name)} is in the ${esc(s.lga || '')} council area of ${esc(R.name || STATE_NAMES[s.s] || '')}, with about ${Number(s.pop).toLocaleString('en-AU')} residents. The typical house is about ${money(s.h)} and the typical unit about ${money(s.u)}. Typical rents are about $${s.rh ?? '—'} a week for a house and $${s.ru ?? '—'} for a unit, a gross yield of about ${pct(s.y, 1)} on a house. ${R.quarterPct != null ? `Over the last 3 months ${esc(R.name || 'the area')} values changed ${pct(R.quarterPct, 1, true)} (${pct(R.annualPct, 1, true)} over 12 months, month-end ${esc(ix.market?.indexMonth || '')}).` : ''} Keyzing suburb score: ${s.score ?? '—'}/100.</p>
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
    // small places with only modelled prices are thin pages: keep them usable but out of search indexes
    const thin = s.hs === 'model' && (Number(s.pop) || 0) < 1000;
    return { ...base, title, description, body, jsonld, robots: thin ? 'noindex,follow' : base.robots };
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
    // older links ended in '-' ('campbelltown-nsw-'); treat them as the same council
    // also accept long official names ('the-hills-shire', 'campbelltown-nsw', 'dubbo-regional')
    const key = m[1].replace(/-+$/, '');
    const short = key.replace(/(-(shire|regional|city|council|nsw|vic|qld|sa|wa|tas|nt|act))+$/, '');
    const list = (ix.byLga.get(key) || ix.byLga.get(short) || []).sort((a, b) => b.pop - a.pop);
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
