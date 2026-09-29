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

export const PAGES = {
  '/': ['What can you comfortably afford, and where?', 'Free and independent for Australian home buyers: a comfortable price where you want to buy, the schemes you qualify for (5% Deposit Scheme, Help to Buy, Keystart and state schemes), the real weekly cost of an investment under the 2026 tax rules, and advertised rates from 90+ lenders.'],
  '/afford': ['What can I afford? A comfortable price, and your ceiling in every state', 'Enter your savings and income. Ownaroo works out a comfortable price where you want to buy, the most you could stretch to in every state and territory (stamp duty, mortgage insurance, lender buffers), the schemes you qualify for and the suburbs that fit.'],
  '/property': ['Price range for a typical home', 'A suburb-based price range for a typical home like the one you’re looking at, the cash you need and the repayments. Not an appraisal of a particular property.'],
  '/find': ['Search property by what you want', 'Describe what you want in plain English, like "3 bed house near the beach in Perth under $800k", and Ownaroo ranks every matching suburb.'],
  '/map': ['Highest-scoring suburbs in Australia: map', 'Suburbs scored on yield, growth drivers, rental demand, affordability and stability, ranked within each state, on one map, with how much of each score is measured.'],
  '/suburbs': ['Suburb explorer: rank every Australian suburb', 'Filter and rank Australian suburbs within each state by price, rent, yield, growth drivers, demand and risk, with every figure marked as measured or modelled.'],
  '/analyse': ['2026 tax-change investment property calculator', 'The weekly cost after tax and 10-year return of an Australian investment property under the 2026 negative gearing and CGT changes, with stamp duty, LMI, land tax and depreciation, and whether it beats a term deposit.'],
  '/borrowing': ['How much can I borrow?', 'Estimate your borrowing power the way Australian lenders do, for a home to live in or an investment: the 3-point rate buffer, living costs, existing debts and 80% of any rent.'],
  '/rates': ['Home loan rates in Australia, updated several times a day', 'Advertised home loan rates from 90+ Australian lenders, read from their Open Banking feeds, with offset accounts and fees, ranked by loan type and deposit.'],
  '/markets': ['Australian housing market update', 'Which way prices are moving in each capital, the RBA cash rate, rates week by week, and the housing headlines that matter for your numbers.'],
  '/new-builds': ['New homes and apartments: building approvals and new-build investing', 'Monthly building approvals by state, council and area, and where new supply is heaviest.'],
  '/guide': ['How to buy property in Australia: first home and investment (2026 guide)', 'The whole process in order for first home buyers and investors: federal and state schemes including Keystart, stamp duty by state, finance, the 2026 tax changes and every cost.'],
  '/first-home': ['First home tools: rent vs buy, savings planner, FHSS calculator', 'How long it will take to save a deposit, whether buying beats renting, and how much the First Home Super Saver scheme adds.'],
  '/compare': ['Compare suburbs side by side', 'Compare up to four Australian suburbs on price, rent, yield, growth and risk.'],
  '/watchlist': ['Your watchlist and saved deals', 'Suburbs and deals you have saved on Ownaroo, kept only in your own browser.'],
  '/methodology': ['Data sources and methodology', 'Where every Ownaroo figure comes from, how the price and rent models work, and their measured error.'],
  '/about': ['About Ownaroo', 'What Ownaroo does for home buyers and investors, who runs it, where its numbers come from and how it stays independent.'],
  '/contact': ['Contact Ownaroo', 'Contact Ownaroo with a question, a data correction or a privacy request. Every message gets a reply by email.'],
  '/price-check': ['Listing price check: which first home buyers a price shuts out', 'Enter a listing price and suburb. See which first home buyer schemes, grants and stamp duty concessions still apply at that price, and the nearest price that brings buyers back.'],
  '/privacy': ['Privacy policy', 'What Ownaroo collects, why, and what it does with it.'],
  '/terms': ['Terms of use', 'The terms for using Ownaroo: general information and calculators, not financial, credit, tax or legal advice, and how estimates and third-party data should be used.'],
};
// thin or personal pages: aggregated headlines, comparisons and the browser-only watchlist
const NOINDEX = new Set(['/compare', '/watchlist']);


// Crawler-readable content for the calculator pages: how each works, a worked example and short answers.
// (The app replaces it with the live tool when JavaScript runs.) Worked examples are dated because rates move.
const TOOL = {
  '/afford': {
    how: ['Choose where you want to buy, then enter your savings and before-tax income.', 'Ownaroo finds a comfortable price: repayments within 30% of before-tax household income, with your savings covering the deposit, stamp duty and fees.', 'It also shows the most a lender might stretch to (tested at your rate plus 3 points), the schemes you qualify for and the suburbs where a typical home fits.'],
    example: 'Example (September 2026 rates): a first home buyer couple in Perth with $110,000 saved and $155,000 combined income. A comfortable price is about $720,000, needing about $110,000 in cash with repayments of about $894 a week; a lender might stretch to about $735,000.',
    faq: [['What is a comfortable price?', 'The price at which repayments stay within 30% of your before-tax household income, a common measure of mortgage stress, and your savings cover the deposit, stamp duty and fees.'], ['Why is the most I could borrow different?', 'Lenders test whether you could still pay at your rate plus 3 percentage points, after living costs and debts. That limit is often higher than a comfortable price.'], ['Does it include first home schemes?', 'Yes: the 5% Deposit Scheme, Help to Buy, Keystart in WA and state first home concessions, with the price caps where you want to buy.']],
  },
  '/analyse': {
    how: ['Enter the price, rent, deposit, rate and your income, or pick a suburb to fill them in.', 'Ownaroo works out stamp duty, LMI, land tax and running costs, then projects ten years of cash flow, tax and the sale.', 'It applies the 2026 rules: for established homes bought from 12 May 2026, rental losses stop reducing salary tax from 1 July 2027, and gains after that date are indexed with a 30% minimum tax. New builds keep negative gearing and can choose either CGT method.'],
    example: 'Example (September 2026): an $850,000 NSW house renting at $650 a week, bought with a 20% deposit at 6.40% on a $120,000 salary, costs about $480 a week after tax in year one, with about $205,000 needed up front.',
    faq: [['Does negative gearing still apply?', 'For established homes contracted from 12 May 2026, losses offset salary only until 30 June 2027, then carry forward against rental profits and the eventual gain. New builds and earlier contracts keep it.'], ['New build or established?', 'The calculator runs the same deal both ways side by side: weekly cost, tax refunds, capital gains tax and the after-tax return.'], ['What return does it show?', 'The annual after-tax return on the cash you put in (IRR), at 1%, 3% and 5% a year price growth, next to a cash-rate deposit and paying down your own home loan.']],
  },
  '/rates': {
    how: ['Every Australian bank publishes its home loans in a standard Open Banking (Consumer Data Right) feed.', 'Ownaroo reads those feeds several times a day and ranks the rates by loan type, repayment type and deposit.', 'Rates from credit unions and regional lenders with membership or area rules are marked "Check eligibility", so the headline figures are ones anyone can apply for.'],
    faq: [['Are these the rates I will get?', 'They are advertised rates. Lenders may offer less to strong applicants, and the rate depends on your deposit, loan size and purpose.'], ['What is a comparison rate?', 'The rate with most fees built in, for a $150,000 loan over 25 years. Useful for comparing, but not the exact cost of your loan.']],
  },
  '/borrowing': {
    how: ['Enter your income, debts, card limits, dependants and any HECS debt.', 'Ownaroo tests repayments at your rate plus 3 points, after tax and living costs, counting 80% of any rent, the way lenders do.', 'If you already own property, it counts that loan and shows the equity you could borrow against for the next deposit.'],
    faq: [['Why do lenders add 3%?', 'The banking regulator expects lenders to check you could still pay if rates rose by 3 percentage points.'], ['Do credit card limits count?', 'Yes. Lenders count about 3% of the limit each month, even if the card is paid off.']],
  },
  '/property': {
    how: ['Type an address or suburb.', 'Ownaroo shows a price range for a typical home of that kind in the suburb, the cash needed and the repayments, plus local risks and hazard map links.', 'It is a suburb-based range, not an appraisal of a particular home.'],
    faq: [['Is this a valuation?', 'No. It is a range for a typical home in the suburb. Only an inspection by a valuer can value a particular property.']],
  },
  '/first-home': {
    how: ['See how long it takes to save a deposit at your savings rate.', 'Compare buying with renting over the years you expect to stay.', 'Work out how much the First Home Super Saver scheme adds to your deposit.'],
    faq: [['What is the First Home Super Saver scheme?', 'You can make voluntary super contributions and later withdraw up to $50,000 of them, with earnings, for a first home deposit, taxed at a discount.']],
  },
  '/price-check': {
    how: ['Enter a listing price and suburb.', 'Ownaroo shows which first home buyer schemes, grants and duty concessions still apply at that price, and the prices that bring buyers back.', 'It makes a "Can you afford this home?" link and QR code for the listing.'],
    example: 'Example: in Perth the 5% Deposit Scheme and Help to Buy caps are both $850,000 and Keystart stops at $860,000, so a home listed at $869,000 loses every first home buyer relying on them.',
    faq: [['Why do price caps matter to sellers?', 'Buyers using a government scheme cannot buy above its cap for the area, so a price just over it removes them from the market.']],
  },
};
function toolBody(title, description, t) {
  return `<article class="ssr"><h1>${esc(title)}</h1><p>${esc(description)}</p><h2>How it works</h2><ol>${t.how.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>${t.example ? `<h2>Worked example</h2><p>${esc(t.example)}</p>` : ''}<h2>Questions</h2>${t.faq.map(([q, a]) => `<h3>${esc(q)}</h3><p>${esc(a)}</p>`).join('')}<p>General information, not financial advice.</p></article>`;
}
const faqLd = (t) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: t.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

/** Build lookup tables from site/data/suburbs.json and market.json. */

/** Kept for the call sites; prices are not moved between month-ends. */
function liveAdjust() {
  // Ownaroo publishes month-end figures only, so server-rendered prices are the month-end values, as in the app.
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

// guide sections, one page each (keep in step with site/assets/pages/guide.js)
export const GUIDE = [["before","Before you buy: goals, budget and timing","What to decide before you look at a single property: why you are buying, what you can hold through a rate rise, and your timeline."],["fhb","Buying your first home in Australia (2026)","The 5% Deposit Scheme, Help to Buy, first home grants, stamp duty concessions and state home lenders like Keystart, and each step to settlement."],["strategy","Property investment strategies: growth, yield or new builds","Capital growth, cash flow and new builds under the 2026 tax rules: what each strategy needs and who it suits."],["finance","Getting your home loan ready","Pre-approval, deposit, lenders mortgage insurance, the 3-point serviceability buffer and the documents lenders ask for."],["research","How to research a suburb before you buy","Prices, rents, vacancy, supply, local economy and hazards: what to check about a suburb and where to find it."],["buy","Finding, inspecting and buying a property","Inspections, building and pest reports, making an offer, auctions and exchanging contracts."],["settle","Property settlement in Australia","What happens between exchange and settlement, and what to check on the day."],["own","Owning an investment property","Tenants, property managers, insurance, depreciation and records for tax time."],["costs","Every cost of buying property, in one place","Deposit, stamp duty, LMI, legal and inspection fees, and the ongoing costs of owning."],["duty","Stamp duty in every state and territory (2026)","Stamp duty at common prices in each state and territory, with first home and owner-occupier concessions."],["landtax","Land tax by state (2026)","Land tax thresholds and rates for investors in each state and territory."],["tax-2026","The 2026 negative gearing and CGT changes, explained","Who keeps negative gearing, how capital gains are taxed from 1 July 2027, and what it means for your weekly cost and return."],["mistakes","Common property buying mistakes","The mistakes that cost buyers most, and how to avoid them."],["glossary","Property and home loan glossary","Plain-English definitions of LVR, LMI, comparison rates, offset accounts and more."],["faq","Property buying questions, answered","Short answers to the questions buyers ask most."]];
for (const [id, t, d] of GUIDE) PAGES[`/guide/${id}`] = [t, d];

const ROUTES = [
  /^\/$/, /^\/markets$/, /^\/new-builds$/, /^\/weekly$/, /^\/suburbs$/, /^\/suburb\/[a-z]+\/[a-z0-9-]+$/, /^\/postcode\/\d{3,4}$/,
  /^\/council\/[a-z]+\/[a-z0-9-]+$/, /^\/analyse$/, /^\/afford$/, /^\/rates$/, /^\/listings$/, /^\/news$/, /^\/guide$/, /^\/guide\/[a-z0-9-]+$/, /^\/compare$/, /^\/watchlist$/,
  /^\/borrowing$/, /^\/methodology$/, /^\/find$/, /^\/property$/, /^\/map$/, /^\/(about|privacy|terms|contact)$/, /^\/first-home$/, /^\/why$/, /^\/price-check$/,
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
    return { ...base, status: 404, robots: 'noindex', title: 'Page not found', description: 'This page does not exist on Ownaroo. Try the suburb explorer, the affordability calculator or the search box.', body: '<div class="empty"><h1>Page not found</h1><p>Try the <a href="/suburbs">suburb explorer</a> or search above.</p></div>' };
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
<p>${esc(s.name)} is in the ${esc(s.lga || '')} council area of ${esc(R.name || STATE_NAMES[s.s] || '')}, with about ${Number(s.pop).toLocaleString('en-AU')} residents. The typical house is about ${money(s.h)}${s.u ? ` and the typical unit or townhouse about ${money(s.u)}` : ''}. The typical house rent is about $${s.rh ?? '—'} a week${s.ru ? ` ($${s.ru} for a unit)` : ''}${s.y ? `, a gross yield of about ${pct(s.y, 1)} on a house` : ''}. ${R.quarterPct != null ? `Over the last 3 months ${esc(R.name || 'the area')} values changed ${pct(R.quarterPct, 1, true)} (${pct(R.annualPct, 1, true)} over 12 months, month-end ${esc(ix.market?.indexMonth || '')}).` : ''} Ownaroo suburb score: ${s.score ?? '—'}/100.</p>
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
    // places under 3,000 people with only modelled prices are thin pages: keep them usable but out of search indexes
    const thin = s.hs === 'model' && (Number(s.pop) || 0) < 3000;
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
    const description = `${list.length} suburbs in ${lga} (${list[0].s}), with typical prices, rents, yields and Ownaroo suburb scores.`;
    const body = `<article class="ssr"><h1>${esc(lga)}</h1><ul>${list.slice(0, 60).map((x) => `<li><a href="/suburb/${x.slug}">${esc(x.name)} ${esc(x.pc || '')}</a>: typical house ${money(x.h)}, score ${x.score ?? '—'}</li>`).join('')}</ul></article>`;
    return { ...base, title, description, body };
  }
  const page = PAGES[path] || PAGES[path.replace(/^\/listings$/, '/property')] || ['Ownaroo', PAGES['/'][1]];
  let [title, description] = page;
  let robots = NOINDEX.has(path) || [...q.keys()].some((k) => ['q', 'price', 'savings', 'income', 'ids', 'asking'].includes(k)) ? 'noindex,follow' : 'index,follow';
  if (path === '/listings') robots = 'noindex,follow';
  const jsonld =
    path === '/'
      ? [
          { '@context': 'https://schema.org', '@type': 'Organization', name: 'Ownaroo', url: `${origin}/`, email: 'Keyzing18@gmail.com', logo: `${origin}/assets/ownaroo.svg`, address: { '@type': 'PostalAddress', addressLocality: 'Perth', addressRegion: 'WA', addressCountry: 'AU' } },
          { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Ownaroo', url: `${origin}/`, potentialAction: { '@type': 'SearchAction', target: `${origin}/find?q={search_term_string}`, 'query-input': 'required name=search_term_string' } },
        ]
      : [];
  const tool = TOOL[path];
  if (tool) jsonld.push(faqLd(tool));
  const body = path === '/' ? null : tool ? toolBody(title, description, tool) : `<article class="ssr"><h1>${esc(title)}</h1><p>${esc(description)}</p></article>`;
  return { ...base, title, description, robots, jsonld, body, canonical: path === '/listings' ? `${origin}/property` : canonical };
}

/** Rewrite the app shell for one URL. */
export function renderHtml(html, meta) {
  const full = meta.title === 'Ownaroo' ? 'Ownaroo' : `${meta.title} · Ownaroo`;
  const tags = [
    `<link rel="canonical" href="${esc(meta.canonical)}">`,
    `<meta name="robots" content="${meta.robots}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Ownaroo">`,
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
