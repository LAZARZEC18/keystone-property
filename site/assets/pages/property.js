import { demo } from '../demo.js';
import { esc, aud, pct, scoreBadge, setMeta, srcBadge, date, growth12, cashWeek, returnsLine } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, haversine, nearby, typicalRate } from '../data.js';
import { suburbScore, valueEstimate, analyse, verdict, stampDuty, lmi, repayment, scenarioReturns, incomeFor } from '../engine.js';
import { liveFactor, regionMoves } from '../live.js';
import { baseTiles } from '../map.js';
import { liveListings, valueCall, rangeBar } from './listings.js';
import { accuracy } from '../accuracy.js';
import { seeTheArea } from '../photos.js';
import { printHeader, brandPanel, wireBrand } from '../brand.js';
import { reaSearch } from './find.js';
import { navigate } from '../app.js';
import { STATES, guaranteeCap, GROWTH, STRESS } from '../rules.js';
import { check, showErrors } from '../validate.js';
import { listingLinks, scoreVsDeal, nextStepsCard } from '../insights.js';

const STATE_NAME = { 'new south wales': 'NSW', victoria: 'VIC', queensland: 'QLD', 'western australia': 'WA', 'south australia': 'SA', tasmania: 'TAS', 'australian capital territory': 'ACT', 'northern territory': 'NT' };

/** Find the suburb an address sits in, from the text itself (suburb + postcode/state) before any geocoding. */
export function suburbFromText(q, list) {
  const t = ` ${q.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ')} `;
  const pc = (t.match(/\b(\d{4})\s*$/) || t.match(/\b(\d{4})\b(?!.*\b\d{4}\b)/) || [])[1];
  const st = (t.match(/\b(nsw|vic|qld|wa|sa|tas|act|nt)\b/) || [])[1]?.toUpperCase();
  let best = null;
  for (const s of list) {
    const n = cleanName(s.n).toLowerCase();
    if (!t.includes(` ${n} `)) continue;
    let sc = n.length;
    if (pc && s.pc === pc) sc += 50;
    if (st && s.s === st) sc += 20;
    sc += Math.log10(s.pop + 1);
    if (!best || sc > best[0]) best = [sc, s];
  }
  return best?.[1] || null;
}

export default async function propertyPage(main, _p, query) {
  const q = (query.q || '').trim();
  setMeta({ title: q ? `${q}: suburb price range for a typical home` : 'Suburb estimate for a typical home', description: 'Enter any Australian address for an estimated value and range, the cash and repayments to buy it, or the investment numbers, plus comparable suburbs nearby.' });
  const [idx, market, rs, rba, model] = await Promise.all([suburbs(), load('market'), load('rates-summary'), load('rba'), load('model').catch(() => null)]);
  const index = null;

  main.innerHTML = `
  <div class="page-head${q ? "" : " with-demo"}"><div><div class="eyebrow">Suburb estimate for a typical home</div><h1>What would a home like this cost?</h1>
  <p>Enter an address. Keyzing checks the street exists, then estimates what a typical home with these features costs in that suburb, from the suburb's price data. It is not an appraisal of the particular property: it can't see its condition, position or recent sales in the street. Buying to live in, it shows the cash you need, repayments against rent and what a rate rise would cost; buying to invest, it runs the rent, yield, after-tax cost and 10-year numbers. Add the asking price to see whether it sits inside the likely range.</p></div>${q ? '' : demo('estimate')}</div>
  <form class="hero-search" id="pf" style="max-width:none" onsubmit="return false"><input id="pq" type="search" value="${esc(q)}" placeholder="e.g. 14 Smith Street, Collingwood VIC 3066" aria-label="Property address"></form>
  <div id="pout"></div>`;
  const input = main.querySelector('#pq');
  const go = () => input.value.trim() && navigate(`/property?q=${encodeURIComponent(input.value.trim())}`);
  input.addEventListener('keydown', (e) => e.key === 'Enter' && go());
  if (!q) {
    main.querySelector('#pout').innerHTML = '<p class="note">Include the suburb and postcode for the best match, for example "12 Smith Street, Bayswater WA 6053".</p>';
    return;
  }
  const out = main.querySelector('#pout');
  out.innerHTML = '<p class="note">Locating the address…</p>';

  let s = suburbFromText(q, idx.list);
  const [geo, prop] = await Promise.all([
    fetch(`/api/geocode?q=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => null),
    fetch(`/api/property?q=${encodeURIComponent(q)}`).then((r) => r.json()).catch(() => null),
  ]);
  // Only trust the geocoder when its suburb or postcode actually appears in what was typed:
  // it fuzzy-matches anything ("asdfgh nowhere" -> Nowhere Creek VIC), which must not produce a valuation.
  const norm = (x) => ` ${String(x || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()} `;
  const typed = norm(q);
  const g = (geo?.results || []).find((x) => (x.suburb && typed.includes(norm(x.suburb))) || (x.postcode && typed.includes(` ${x.postcode} `))) || null;
  if (!s && g) {
    const st = STATE_NAME[(g.state || '').toLowerCase()];
    s = idx.list.find((x) => x.s === st && cleanName(x.n).toLowerCase() === (g.suburb || '').toLowerCase()) ||
      idx.list.filter((x) => !st || x.s === st).map((x) => [haversine(x, g), x]).sort((a, b) => a[0] - b[0])[0]?.[1];
  }
  if (!s) {
    out.innerHTML = `<div class="empty"><h2>Address not found</h2><p>Keyzing couldn't match "${esc(q)}" to an Australian suburb, so it won't guess a value. Check the spelling and include the suburb and postcode, for example "7 Russell Street, Collingwood VIC 3066".</p></div>`;
    return;
  }
  const facts = prop?.found ? prop : null;
  // A street address must be found on that street, in or next to that suburb, before any price is shown.
  // Only a bare suburb or postcode gets the typical-home estimate without a street match.
  const STREET = /[a-z'-]+\s+(st|street|rd|road|ave?|avenue|dr|drive|cres|crescent|ct|court|pl|place|way|tce|terrace|lane|ln|pde|parade|cl|close|hwy|highway|blvd|boulevard|cct|circuit|gr|grove|esp|esplanade|loop|rise|mews|sq|square)\b/i;
  const first = q.split(',')[0];
  const bare = first.replace(/\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b|\b\d{4}\b/gi, '').trim().toLowerCase();
  const isSuburbName = idx.list.some((x) => cleanName(x.n).toLowerCase() === bare);
  const streetTyped = !isSuburbName && (/^\s*(unit|u|apt|lot|shop)?\s*\d+[a-z]?(\s*\/\s*\d+[a-z]?)?\s+[a-z]/i.test(first) || STREET.test(first));
  const streetWord = g?.street ? norm(g.street).trim().split(' ')[0] : '';
  const streetFound = !!facts || (g && g.precision !== 'area' && streetWord && typed.includes(` ${streetWord} `) && haversine(s, g) < 15);
  const typicalUrl = `/property?q=${encodeURIComponent(`${cleanName(s.n)} ${s.s} ${s.pc || ''}`.trim())}`;
  if (streetTyped && !streetFound) {
    out.innerHTML = `<div class="empty"><h2>We couldn't find that address</h2><p>${geo ? `No street matching "${esc(first.trim())}" was found in or near ${esc(cleanName(s.n))} ${s.s}` : 'The address lookup is unavailable right now'}, so Keyzing won't put a price on it. Check the spelling, or include the unit number and postcode.</p><p><a class="btn" href="${typicalUrl}" data-link>See the estimate for a typical home in ${esc(cleanName(s.n))}</a> <a class="btn ghost" href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} suburb report</a></p></div>`;
    return;
  }
  const located = facts ? 'the property record' : !streetTyped ? 'the suburb only (no street given)' : g.precision === 'address' ? 'the address' : 'the street (house number not confirmed)';
  const point = prop?.lat ? { lat: prop.lat, lng: prop.lng } : g && haversine(s, g) < 25 ? { lat: g.lat, lng: g.lng } : { lat: s.lat, lng: s.lng };
  const lf = liveFactor(s.rg, index);
  const R = market.regions[s.rg];
  const mv = regionMoves(s.rg, index, market);
  const unitLike = /unit|apartment|flat|studio|townhouse|villa/i.test(facts?.type || '') || /^\s*(unit|u|apt|apartment)?\s*\d+[a-z]?\s*\//i.test(q);
  const spec = {
    type: unitLike ? 'u' : 'h',
    beds: facts?.beds ?? Math.floor((unitLike ? s.bu || 2 : s.bh || 3) + 0.4),
    baths: facts?.baths ?? (unitLike ? 1 : 2),
    land: facts?.land ?? '',
    cars: facts?.cars ?? 1,
    condition: 'average',
    pool: false,
    asking: query.asking ?? '',
  };

  const PLAN = {
    WA: ['PlanWA zoning map', 'https://espatial.dplh.wa.gov.au/PlanWA/Index.html?viewer=PlanWA'],
    NSW: ['NSW Planning Portal spatial viewer', 'https://www.planningportal.nsw.gov.au/spatialviewer/'],
    VIC: ['VicPlan planning map', 'https://mapshare.vic.gov.au/vicplan/'],
    SA: ['SA Property and Planning Atlas', 'https://sappa.plan.sa.gov.au/'],
    TAS: ['LISTmap planning layers', 'https://maps.thelist.tas.gov.au/listmap/app/list/map'],
    ACT: ['ACTmapi territory plan', 'https://www.actmapi.act.gov.au/'],
    NT: ['NR Maps planning zones', 'https://nrmaps.nt.gov.au/'],
  };
  const plan = PLAN[s.s];
  // always opens on "buying to live in" unless a link asks for the investor view
  let mode = query.mode === 'invest' ? 'invest' : 'home';

  out.innerHTML = `
  <div class="card flat tint"><div class="spread"><div><b>${esc(facts?.address || q)}</b><div class="note">In <a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} ${s.s} ${s.pc || ''}</a> · ${esc(s.lga || '')} council · ${esc(R?.name || '')}· located from ${located}</div></div>${facts ? '<span class="powered">Property facts powered by <b>Domain</b></span>' : ''}</div></div>
  <div style="margin-top:14px">${seeTheArea(point.lat, point.lng, { place: facts?.address || (streetTyped ? first.trim() : cleanName(s.n)), sold: listingLinks(s).reaSold })}</div>
  <div class="grid split-spec" style="gap:20px;margin-top:16px" id="pgrid">
    <form class="card" id="spec" onsubmit="return false" style="align-self:start">
      <div class="seg" id="pmode" role="tablist" style="width:100%;margin-bottom:14px"><button type="button" data-m="home" style="flex:1">Buying to live in</button><button type="button" data-m="invest" style="flex:1">Buying to invest</button></div>
      <h3>The property</h3>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field">Type<select name="type"><option value="h">House</option><option value="u">Unit / apartment / townhouse</option></select></label>
        <label class="field">Bedrooms<input name="beds" type="number" min="0" max="8" value="${spec.beds}"></label>
        <label class="field">Bathrooms<input name="baths" type="number" min="1" max="6" value="${spec.baths}"></label>
        <label class="field">Car spaces<input name="cars" type="number" min="0" max="6" value="${spec.cars}"></label>
        <label class="field">Land (m²)<input name="land" type="number" step="1" value="${spec.land}" placeholder="Houses"></label>
        <label class="field">Condition<select name="condition"><option value="new">Brand new</option><option value="renovated">Renovated</option><option value="average" selected>Average</option><option value="original">Original</option><option value="needs-work">Needs work</option></select></label>
        <label class="check" style="grid-column:1/-1"><input type="checkbox" name="pool"> Pool</label>
        <label class="field" style="grid-column:1/-1">Asking price (optional)<input name="asking" type="number" step="1" value="${esc(String(spec.asking))}" placeholder="Compare against the estimate"></label>
      </div>
      <div id="homef" class="fields" style="grid-template-columns:1fr 1fr;margin-top:12px">
        <label class="field">I am a<select name="buyer"><option value="fhb">First home buyer</option><option value="owner">Home owner moving</option></select></label>
        <label class="field">Deposit<select name="dep"><option value="0.05">5%</option><option value="0.1">10%</option><option value="0.2">20%</option></select></label>
        <label class="field" style="grid-column:1/-1">Rent you pay now ($/wk, optional)<input name="myrent" type="number" step="1" placeholder="To compare with repayments"></label>
      </div>
      <p class="fine" style="margin-top:10px">${facts ? 'Bedrooms, bathrooms and land were filled in from Domain\'s property record. Change anything that\'s out of date.' : 'Fill in what you know. The more detail, the tighter the estimate.'}</p>
    </form>
    <div id="res"></div>
  </div>
  <section class="section grid g2">
    <div class="card"><h3>On the map</h3><div id="pmap" class="map short"></div>${plan ? `<p class="note" style="margin-top:10px">Zoning and subdivision potential: check the lot on the <a href="${plan[1]}" target="_blank" rel="noopener">${plan[0]} ↗</a>. Zoning (in WA, the R-code) can be worth more than the house itself.</p>` : `<p class="note" style="margin-top:10px">Zoning and subdivision potential: check ${esc(s.lga || 'the council')}'s planning scheme maps.</p>`}</div>
    <div class="card" id="alts"></div>
  </section>
  <section class="section card"><div class="card-head"><h3>Similar homes for sale</h3><span class="note" id="simnote"></span></div><div class="row" id="simlinks"></div><div id="simlive" style="margin-top:14px"></div><p class="fine" style="margin-top:10px">Recent sales nearby are the best guide to value: <a href="${listingLinks(s).reaSold}" target="_blank" rel="noopener">sold homes in ${esc(cleanName(s.n))} ↗</a>.</p></section>`;

  const form = main.querySelector('#spec');
  form.type.value = spec.type;
  // everyone starts on a 20% deposit: a 5% loan is only realistic for some buyers and prices, so it's a choice, not a default
  form.dep.value = '0.2';
  const res = main.querySelector('#res');
  wireBrand(res);
  const invRate = typicalRate(rba, 'INV').rate;
  const ooRate = rba.actual?.newOOVariable?.at(-1)?.[1] || 6.2;
  const setMode = (m) => {
    mode = m;
    try {
      sessionStorage.setItem('keystone.mode', m);
    } catch {
      /* private browsing */
    }
    main.querySelectorAll('#pmode button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    main.querySelector('#homef').style.display = m === 'home' ? 'grid' : 'none';
  };
  main.querySelector('#pmode').addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    setMode(b.dataset.m);
    run();
  });
  setMode(mode);

  let edited = !!facts || !!spec.asking;
  function run() {
    const f = Object.fromEntries(new FormData(form));
    const chk = check(f, { beds: 'beds', baths: 'baths', cars: 'cars', land: { field: 'land', optional: true }, asking: { field: 'asking', optional: true }, myrent: { field: 'myrent', optional: true } });
    if (showErrors(form, chk.errors, { beds: '[name=beds]', baths: '[name=baths]', cars: '[name=cars]', land: '[name=land]', asking: '[name=asking]', myrent: '[name=myrent]' }, res)) return;
    const sp = { type: f.type, beds: +f.beds, baths: +f.baths, cars: +f.cars, land: +f.land || null, condition: f.condition, pool: !!f.pool, liveFactor: lf };
    const e = valueEstimate(s, sp);
    const asking = +f.asking || null;
    const price = asking || e.value;
    const vc = valueCall(asking, e, { measured: s.conf === 'high' || s.conf === 'medium' });
    const acc = accuracy(s, e.type, model);
    const gap = vc ? vc.gap : null;
    const dEst = facts?.estimate?.mid;
    const newBuild = f.condition === 'new';
    const fhbDuty = stampDuty(s.s, price, { buyer: 'fhb', newBuild });
    const head = `
        ${printHeader(`Suburb estimate: ${facts?.address || q}`)}
        <div class="spread" style="align-items:flex-start">
          <div><div class="eyebrow" style="margin:0">Suburb estimate for a typical home like this · ${date(new Date().toISOString())}</div>
          <div class="big-num" style="margin:6px 0">${aud(e.low, { compact: true })} – ${aud(e.high, { compact: true })}</div>
          <div class="note">Likely range for a typical ${e.beds}-bed ${e.type === 'u' ? 'unit' : 'house'} like this${acc.level === 'untested' ? '. No single figure is shown: the model hasn’t been tested against sales in this state.' : ` · middle of the range about ${aud(e.value, { compact: true })}`}</div></div>
          __BADGE__
        </div>
        ${edited ? '' : `<div class="callout" style="margin-top:14px"><b>This is a typical ${e.beds}-bed, ${f.baths}-bath ${e.type === 'u' ? 'unit' : 'house'} in ${esc(cleanName(s.n))}, not this property yet.</b> Enter its bedrooms, bathrooms, land size and condition on the left, plus the asking price if it's for sale, and everything below updates for this home.</div>`}
        <div class="acc acc-${acc.level}"><b>${esc(acc.label)}.</b> ${esc(acc.text)}</div>
        ${e.rent ? `<details class="explain"><summary>Rent estimate for this home: ${aud(Math.round((e.rent * 0.9) / 5) * 5)}–${aud(Math.round((e.rent * 1.1) / 5) * 5)} a week</summary><div class="kv" style="margin-top:8px"><span>Estimated weekly rent</span><span>${aud(e.rent)}</span><span>Likely range</span><span>${aud(Math.round((e.rent * 0.9) / 5) * 5)} – ${aud(Math.round((e.rent * 1.1) / 5) * 5)}</span><span>Typical house / unit in ${esc(cleanName(s.n))}</span><span>${aud(s.rh)} / ${aud(s.ru)}</span><span>Gross yield at the estimate</span><span>${pct((e.rent * 52 * 100) / e.value, 2)}</span></div><p>${s.s === 'NSW' && String(s.hs).includes('NSW') ? 'Suburb rent from NSW bond lodgements by postcode' : `Suburb rent modelled from Census rents and price, centred on typical ${esc(R?.name || 'regional')} rents`}; the rent model's median error against official bond data is about 9% for houses and 10% for units. Adjusted for the bedrooms and condition entered. A sanity check only, not a rental appraisal: rents have moved a lot since the 2021 Census, and a local property manager's appraisal of current listings is far more reliable.</p></details>` : ''}
        ${vc ? `<div class="callout ${vc.cls === 'up' ? 'green' : ''}" style="margin-top:14px"><b class="${vc.cls}">${vc.label}:</b> ${acc.level === 'untested' ? `asking ${aud(asking)} against a range of ${aud(e.low, { compact: true })} – ${aud(e.high, { compact: true })}.` : `asking ${aud(asking)} is ${pct(Math.abs(gap), 1)} ${gap >= 0 ? 'above' : 'below'} the middle of the range.`} ${esc(vc.note)}${s.conf === 'high' || s.conf === 'medium' || vc.key !== 'within' ? rangeBar(asking, e) : ''}</div>` : ''}`;
    const built = `<div><h3 style="font-size:16px">How the estimate is built</h3><div class="kv">
            <span>Typical ${e.type === 'u' ? 'unit' : 'house'} in ${esc(cleanName(s.n))} ${srcBadge(e.type === 'u' ? s.us : s.hs)}</span><span>${aud(e.basis, { compact: true })}</span>
            ${e.adjustments.map((x) => `<span>${esc(x.label)}</span><span class="${x.pct >= 0 ? 'up' : 'down'}">${x.pct >= 0 ? '+' : ''}${(x.pct * 100).toFixed(1)}%</span>`).join('')}
            <span class="tot">Likely range</span><span class="tot">${aud(e.low, { compact: true })} – ${aud(e.high, { compact: true })}</span></div>
            <p class="fine" style="margin-top:6px">Suburb value as at ${esc(market.indexMonth || 'the latest month-end')}; ${esc(R?.name || 'the area')} moved ${pct(R?.quarterPct, 1, true)} over the last 3 months. ${s.conf === 'high' ? 'Based on official suburb sales.' : s.conf === 'medium' ? 'Based on official postcode sales.' : 'Modelled: no official sales series for this suburb, so treat it as a guide.'}</p>
            ${dEst ? `<p class="note" style="margin-top:8px">Domain's own estimate: <b>${aud(dEst)}</b> (${aud(facts.estimate.low, { compact: true })} – ${aud(facts.estimate.high, { compact: true })}).</p>` : ''}
            ${facts?.sales?.length ? `<p class="note" style="margin-top:8px">Sale history: ${facts.sales.slice(0, 4).map((x) => `${aud(x.price, { compact: true })} (${new Date(x.date).getFullYear()})`).join(' · ')}</p>` : ''}</div>`;
    const foot = `${brandPanel('Print or save as PDF')}<p class="fine" style="margin-top:10px">An automated estimate from suburb-level data and the features entered, not a formal valuation. Individual homes vary with position, aspect, quality and street. For a figure on this specific home, get a bank valuation or a local agent's appraisal of recent sales.</p>`;

    if (mode === 'home') {
      const buyer = f.buyer || 'fhb';
      const dep = +f.dep || 0.2;
      const cap = guaranteeCap(s);
      const scheme = buyer === 'fhb' && dep < 0.2 && price <= cap;
      const duty = stampDuty(s.s, price, { buyer, newBuild });
      const base = price * (1 - dep);
      const lm = scheme || dep >= 0.2 ? { premium: 0 } : lmi(base, price, s.s);
      const loan = base + (lm.premium || 0);
      const monthly = repayment(loan, ooRate, 30);
      const weekly = (monthly * 12) / 52;
      const weekly2 = (repayment(loan, ooRate + 2, 30) * 12) / 52;
      const upfront = price * dep + duty.duty + 3000;
      const myRent = +f.myrent || null;
      // income a lender would want for this loan, and the income at which repayments stay under the stress line
      const incNeeded = incomeFor(loan, ooRate);
      const incComfort = Math.round((weekly * 52) / STRESS.share / 1000) * 1000;
      const stretch = dep < 0.2 && (loan > 900000 || (buyer === 'fhb' && price > cap));
      res.innerHTML = `<div class="card">${head.replace('__BADGE__', `<div style="text-align:right"><div class="note">${esc(R?.name || 'Area')}, last 3 months</div><div class="mono ${(R?.quarterPct ?? 0) < 0 ? 'down' : 'up'}" style="font-size:22px">${pct(R?.quarterPct, 1, true)}</div><div class="note">${s.trend ? `${s.trend} · ` : ''}12 months ${pct(R?.annualPct, 1, true)}${s.g1s === 'region' ? ' (area-wide)' : ''}</div></div>`)}
        <div class="grid g4" style="margin-top:14px;gap:12px">
          <div class="stat"><span class="k">Cash you need up front</span><span class="v">${aud(upfront, { compact: true })}</span><span class="s">${Math.round(dep * 100)}% deposit + duty + fees</span></div>
          <div class="stat"><span class="k">Repayments</span><span class="v">${aud(monthly)}<span class="muted" style="font-size:.55em">/mth</span></span><span class="s">${aud(weekly)}/wk at ${pct(ooRate, 2)}</span></div>
          <div class="stat"><span class="k">${myRent ? 'vs your rent now' : 'Renting a similar home'}</span><span class="v ${myRent ? (weekly > myRent ? 'down' : 'up') : ''}">${myRent ? `${weekly > myRent ? '+' : '−'}${aud(Math.abs(weekly - myRent))}` : aud(e.rent)}<span class="muted" style="font-size:.55em">/wk</span></span><span class="s">${myRent ? `${aud(weekly)} repayments vs ${aud(myRent)} rent` : 'estimated weekly rent'}</span></div>
          <div class="stat"><span class="k">If rates rise 2 points</span><span class="v down">${aud(weekly2)}<span class="muted" style="font-size:.55em">/wk</span></span><span class="s">+${aud(weekly2 - weekly)} a week</span></div>
        </div>
        ${stretch ? `<div class="callout warn-box" style="margin-top:14px"><b>A ${Math.round(dep * 100)}% deposit at this price is a stretch.</b> The loan would be ${aud(loan, { compact: true })}${lm.premium ? `, including ${aud(lm.premium)} of LMI` : ''}. A lender would typically want a household income of about <b>${aud(incNeeded, { compact: true })}</b> a year for it, and about ${aud(incComfort, { compact: true })} to keep repayments under ${STRESS.label}.${buyer === 'fhb' && price > cap ? ` It's also above the ${aud(cap, { compact: true })} 5% Deposit Scheme price cap here, so the no-LMI scheme doesn't apply.` : ''} Few lenders offer 95% loans this large.</div>` : ''}
        <p class="note" style="margin-top:10px">Household income for comfortable repayments (under ${STRESS.label}): <b>about ${aud(incComfort, { compact: true })} a year</b>.</p>
        <div class="hr"></div>
        <div class="grid g2" style="gap:12px 24px">
          ${built}
          <div><h3 style="font-size:16px">Buying it</h3><div class="kv">
            <span>Deposit (${Math.round(dep * 100)}%)</span><span>${aud(price * dep)}</span>
            <span>Stamp duty (${buyer === 'fhb' ? 'first home' : 'home owner'})</span><span>${aud(duty.duty)}</span>
            <span>Conveyancing, inspections, fees</span><span>${aud(3000)}</span>
            <span>Lenders mortgage insurance</span><span>${scheme ? '$0 (5% Deposit Scheme)' : lm.premium ? `${aud(lm.premium)} (added to loan)` : '$0'}</span>
            <span class="tot">Cash up front</span><span class="tot">${aud(upfront)}</span>
            <span>Loan</span><span>${aud(loan)}</span></div>
            ${duty.notes.length ? `<p class="fine" style="margin-top:6px">${esc(duty.notes.join(' '))}</p>` : ''}
            ${buyer === 'fhb' && dep < 0.2 ? `<p class="fine" style="margin-top:6px">${scheme ? `Under the ${aud(cap, { compact: true })} 5% Deposit Scheme cap here, so no LMI if you're eligible.` : `Above the ${aud(cap, { compact: true })} 5% Deposit Scheme cap here, so LMI applies.`}</p>` : ''}
          </div>
        </div>
        <div class="row" style="margin-top:12px"><a class="btn primary" href="/afford?buyer=${buyer}" data-link>What can I afford?</a><a class="btn" href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} suburb report</a></div>
        <p class="fine" style="margin-top:10px">Repayments use the average rate on new owner-occupier variable loans (RBA), 30 years, principal and interest. ${esc(STRESS.note)}</p>
        <div style="margin-top:12px">${nextStepsCard({ fhb: buyer === 'fhb' })}</div>
        ${foot}</div>`;
    } else {
      const a = analyse({ state: s.s, price, weeklyRent: e.rent || 0, deposit: 0.2, ratePct: invRate, income: 120000, hold: 10, growth: GROWTH.base, perth: s.rg === 'PER', strata: f.type === 'u' ? 3200 : 0, landValuePct: f.type === 'u' ? 0.25 : 0.55, newBuild });
      const v = verdict(a, { ...s, score: suburbScore(s.sc) }, market, { depositRate: rba.cashRate.current });
      res.innerHTML = `<div class="card">${head.replace('__BADGE__', `<div style="text-align:right"><div class="note">Each week after tax</div><div class="cost-head ${a.summary.weeklyCashAfterTax >= 0 ? 'up' : 'down'}" style="font-size:22px">${cashWeek(a.summary.weeklyCashAfterTax)}</div></div>`)}
        <div class="grid g4" style="margin-top:14px;gap:12px">
          <div class="stat"><span class="k">Estimated rent</span><span class="v">${aud(e.rent)}<span class="muted" style="font-size:.55em">/wk</span></span></div>
          <div class="stat"><span class="k">Gross yield</span><span class="v">${pct((e.rent * 52 * 100) / price, 2)}</span></div>
          <div class="stat"><span class="k">Cash needed at 20% deposit</span><span class="v">${aud(a.upfront.total, { compact: true })}</span></div>
          <div class="stat"><span class="k">10-yr return (<abbr title="Internal rate of return: the average yearly return on your cash after costs, tax and sale">IRR</abbr>)</span><span class="v">${pct(a.summary.irr, 1)}</span></div>
        </div>
        <div class="hr"></div>
        <div class="grid g2" style="gap:12px 24px">
          ${built}
          <div><h3 style="font-size:16px">Buying it</h3><div class="kv">
            <span>Stamp duty (investor)</span><span>${aud(stampDuty(s.s, price).duty)}</span>
            <span>Cash needed at 20% deposit</span><span>${aud(a.upfront.total)}</span>
            <span>${esc(R?.name || '')}: last 3 months / 12 months</span><span>${pct(R?.quarterPct, 1, true)} / ${pct(R?.annualPct, 1, true)}</span>
            <span>Suburb Keyzing Score</span><span>${scoreBadge(suburbScore(s.sc))}</span></div>
          </div>
        </div>
        <div class="grid g2" style="margin-top:10px;gap:8px 20px"><ul class="pros">${v.reasons.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><ul class="cons">${v.risks.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="row" style="margin-top:8px"><a class="btn primary" href="/analyse?suburb=${s.id}&price=${price}&rent=${e.rent}&type=${e.type}&new=${newBuild ? 1 : 0}&addr=${encodeURIComponent(facts?.address || q)}" data-link>Full deal analysis</a><a class="btn" href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} suburb report</a></div>
        ${returnsLine(scenarioReturns(a.input), v)}
        ${foot}</div>`;
    }

    // Comparable suburbs nearby for less: similar household incomes (a proxy for the kind of street and buyer),
    // no weaker on Keyzing Score or concentration risk, and cheaper for the same home by 4-20%.
    const inc = (x) => (x.h && x.pti ? x.h / x.pti : null);
    const myInc = inc(s);
    const myScore = suburbScore(s.sc);
    const alts = nearby(idx.list, s, 60, 15)
      .filter((x) => x.pop >= 1000 && myInc && inc(x) && Math.abs(inc(x) / myInc - 1) <= 0.12 && (x.rsk ?? 0) <= (s.rsk ?? 0) + 10)
      .map((x) => ({ x, e: valueEstimate(x, sp) }))
      .filter((o) => o.e && o.e.value <= e.value * 0.96 && o.e.value >= e.value * 0.8 && suburbScore(o.x.sc) >= myScore)
      .sort((a1, b1) => suburbScore(b1.x.sc) - suburbScore(a1.x.sc) || a1.x.km - b1.x.km)
      .slice(0, 6);
    main.querySelector('#alts').innerHTML = `<h3>Comparable suburbs nearby for less</h3><p class="note" style="margin-top:-4px">Within 15 km, household incomes within 12% of ${esc(cleanName(s.n))}'s, rated as well or better, and 4–20% cheaper for this same home.</p>${alts.length ? `<div class="tbl-wrap"><table><thead><tr><th>Suburb</th><th class="n">km</th><th class="n">This home there</th><th class="n">Less by</th><th class="n">Score</th></tr></thead><tbody>${alts.map((o) => `<tr><td><a href="${suburbUrl(o.x)}" data-link>${esc(cleanName(o.x.n))}</a></td><td class="n">${o.x.km.toFixed(1)}</td><td class="n">${aud(o.e.value, { compact: true })}</td><td class="n up">${aud(e.value - o.e.value, { compact: true })}</td><td class="n">${scoreBadge(suburbScore(o.x.sc))}</td></tr>`).join('')}</tbody></table></div>` : `<p class="note">No nearby suburb with similar incomes is both cheaper and rated as well. For this kind of home, ${esc(cleanName(s.n))} is already fair value against its neighbours.</p>`}`;

    // Similar homes for sale: deep links + live listings (Domain) filtered to match
    const lo = Math.round((e.value * 0.85) / 10000) * 10000;
    const hi = Math.round((e.value * 1.15) / 10000) * 10000;
    main.querySelector('#simnote').textContent = `${e.beds}-bed ${e.type === 'u' ? 'units' : 'houses'} between ${aud(lo, { compact: true })} and ${aud(hi, { compact: true })}`;
    main.querySelector('#simlinks').innerHTML = `<a class="btn" href="${reaSearch(s, e.type, { beds: e.beds, minPrice: lo, maxPrice: hi })}" target="_blank" rel="noopener">In ${esc(cleanName(s.n))} on realestate.com.au ↗</a>${alts.slice(0, 2).map((o) => `<a class="btn ghost" href="${reaSearch(o.x, e.type, { beds: e.beds, maxPrice: hi })}" target="_blank" rel="noopener">In ${esc(cleanName(o.x.n))} ↗</a>`).join('')}`;
    const key = `${e.type}|${e.beds}|${lo}|${hi}`;
    if (key !== run.key) {
      run.key = key;
      liveListings(main.querySelector('#simlive'), s, { compact: true, filters: { types: e.type === 'u' ? 'ApartmentUnitFlat,Townhouse' : 'House', beds: String(Math.max(1, e.beds)), max: String(hi), min: String(lo), surrounding: '1' } });
    }
  }
  form.addEventListener('input', () => {
    edited = true;
    clearTimeout(run.t);
    run.t = setTimeout(run, 200);
  });
  run();

  let map = null;
  const draw = () => {
    if (!window.L) return setTimeout(draw, 250);
    map = L.map('pmap', { scrollWheelZoom: false }).setView([point.lat, point.lng], 14);
    baseTiles().addTo(map);
    L.marker([point.lat, point.lng]).addTo(map).bindPopup(esc(facts?.address || q)).openPopup();
  };
  draw();
  if (geo?.attribution) main.insertAdjacentHTML('beforeend', `<p class="fine">${esc(geo.attribution)}. ${facts ? esc(prop.attribution) : ''}</p>`);
  return { destroy: () => map?.remove() };
}

export { STATES };
