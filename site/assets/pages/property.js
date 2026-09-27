import { esc, aud, pct, scoreBadge, setMeta, srcBadge, date, growth12 } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, haversine, nearby } from '../data.js';
import { suburbScore, valueEstimate, analyse, verdict, stampDuty, lmi, repayment } from '../engine.js';
import { liveFactor, regionMoves } from '../live.js';
import { baseTiles } from '../map.js';
import { liveListings, valueCall } from './listings.js';
import { reaSearch } from './find.js';
import { navigate } from '../app.js';
import { STATES, guaranteeCap } from '../rules.js';
import { listingLinks, scoreVsDeal } from '../insights.js';

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
  setMeta({ title: q ? `${q}: estimated value, rent and investment rating` : 'Property value estimate by address', description: 'Enter any Australian address for an estimated value and range, the cash and repayments to buy it, or the investment numbers, plus comparable suburbs nearby.' });
  const [idx, market, index, rs, rba] = await Promise.all([suburbs(), load('market'), load('index'), load('rates-summary'), load('rba')]);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Property valuation</div><h1>What is this property worth?</h1>
  <p>Enter an address. Keyzing places it in its suburb and estimates its value from the suburb's sales data and the home's features. Buying to live in, it shows the cash you need, repayments against rent and what a rate rise would cost; buying to invest, it runs the rent, yield, after-tax cost and 10-year numbers. Add the asking price to see whether it sits inside the likely range.</p></div>
  <form class="hero-search" id="pf" style="max-width:none" onsubmit="return false"><input id="pq" type="search" value="${esc(q)}" placeholder="e.g. 7 Russell Street, Morley WA 6062" aria-label="Property address"></form>
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
    out.innerHTML = `<div class="empty"><h2>Address not found</h2><p>Keyzing couldn't match "${esc(q)}" to an Australian suburb, so it won't guess a value. Check the spelling and include the suburb and postcode, for example "7 Russell Street, Morley WA 6062".</p></div>`;
    return;
  }
  const point = prop?.lat ? { lat: prop.lat, lng: prop.lng } : g && haversine(s, g) < 25 ? { lat: g.lat, lng: g.lng } : { lat: s.lat, lng: s.lng };
  const facts = prop?.found ? prop : null;
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
    asking: +query.asking || '',
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
  let mode = ['home', 'invest'].includes(query.mode) ? query.mode : (() => { try { return localStorage.getItem('keystone.mode') || 'home'; } catch { return 'home'; } })();

  out.innerHTML = `
  <div class="card flat tint"><div class="spread"><div><b>${esc(facts?.address || q)}</b><div class="note">In <a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} ${s.s} ${s.pc || ''}</a> · ${esc(s.lga || '')} council · ${esc(R?.name || '')}${g ? ` · located to ${g.precision === 'address' ? 'the address' : 'the street'}` : ' · located from the suburb name'}</div></div>${facts ? '<span class="powered">Property facts powered by <b>Domain</b></span>' : ''}</div></div>
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
        <label class="field" style="grid-column:1/-1">Asking price (optional)<input name="asking" type="number" step="1" value="${spec.asking}" placeholder="Compare against the estimate"></label>
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
  // same default as the affordability tool: first home buyers start on the 5% Deposit Scheme
  form.dep.value = form.buyer.value === 'fhb' ? '0.05' : '0.2';
  let depTouched = false;
  form.dep.addEventListener('change', () => (depTouched = true));
  form.buyer.addEventListener('change', () => {
    if (!depTouched) form.dep.value = form.buyer.value === 'fhb' ? '0.05' : '0.2';
  });
  const res = main.querySelector('#res');
  const invRate = Math.max(rs.best.INV_PI_variable?.[0]?.rate || 6, (rs.medianInvestorVariable || 6.5) - 0.4);
  const ooRate = rba.actual?.newOOVariable?.at(-1)?.[1] || 6.2;
  const setMode = (m) => {
    mode = m;
    try {
      localStorage.setItem('keystone.mode', m);
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
    const sp = { type: f.type, beds: +f.beds, baths: +f.baths, cars: +f.cars, land: +f.land || null, condition: f.condition, pool: !!f.pool, liveFactor: lf };
    const e = valueEstimate(s, sp);
    const asking = +f.asking || null;
    const price = asking || e.value;
    const vc = valueCall(asking, e);
    const gap = vc ? vc.gap : null;
    const dEst = facts?.estimate?.mid;
    const newBuild = f.condition === 'new';
    const fhbDuty = stampDuty(s.s, price, { buyer: 'fhb', newBuild });
    const head = `
        <div class="spread" style="align-items:flex-start">
          <div><div class="eyebrow" style="margin:0">${edited ? 'Keyzing estimate' : 'Starting estimate: typical home'} · ${date(new Date().toISOString())}</div>
          <div class="big-num" style="margin:6px 0">${aud(e.value)}</div>
          <div class="note">Likely range ${aud(e.low, { compact: true })} – ${aud(e.high, { compact: true })} · ${e.beds}-bed ${e.type === 'u' ? 'unit' : 'house'}</div></div>
          __BADGE__
        </div>
        ${edited ? '' : `<div class="callout" style="margin-top:14px"><b>This is a typical ${e.beds}-bed, ${f.baths}-bath ${e.type === 'u' ? 'unit' : 'house'} in ${esc(cleanName(s.n))}, not this property yet.</b> Enter its bedrooms, bathrooms, land size and condition on the left, plus the asking price if it's for sale, and everything below updates for this home.</div>`}
        ${vc ? `<div class="callout ${vc.cls === 'up' ? 'green' : ''}" style="margin-top:14px"><b class="${vc.cls}">${vc.label}:</b> asking ${aud(asking)} is ${pct(Math.abs(gap), 1)} ${gap >= 0 ? 'above' : 'below'} the ${aud(e.value, { compact: true })} estimate (range ${aud(e.low, { compact: true })}–${aud(e.high, { compact: true })}). ${esc(vc.note)}${s.conf === 'high' || s.conf === 'medium' ? '' : ' This suburb has no official sales series, so the estimate is modelled: weigh it against recent sales in the street.'}</div>` : ''}`;
    const built = `<div><h3 style="font-size:16px">How the estimate is built</h3><div class="kv">
            <span>Typical ${e.type === 'u' ? 'unit' : 'house'} in ${esc(cleanName(s.n))} ${srcBadge(e.type === 'u' ? s.us : s.hs)}</span><span>${aud(e.basis, { compact: true })}</span>
            ${e.adjustments.map((x) => `<span>${esc(x.label)}</span><span class="${x.pct >= 0 ? 'up' : 'down'}">${x.pct >= 0 ? '+' : ''}${(x.pct * 100).toFixed(1)}%</span>`).join('')}
            <span class="tot">Estimate</span><span class="tot">${aud(e.value)}</span></div>
            <p class="fine" style="margin-top:6px">Suburb value includes ${esc(R?.name || '')} index movement to ${date(index.generated)} (${pct((lf - 1) * 100, 2, true)} since 31 Aug). ${s.conf === 'high' ? 'Based on official suburb sales.' : s.conf === 'medium' ? 'Based on official postcode sales.' : 'Modelled: no official sales series for this suburb, so treat it as a guide.'}</p>
            ${dEst ? `<p class="note" style="margin-top:8px">Domain's own estimate: <b>${aud(dEst)}</b> (${aud(facts.estimate.low, { compact: true })} – ${aud(facts.estimate.high, { compact: true })}).</p>` : ''}
            ${facts?.sales?.length ? `<p class="note" style="margin-top:8px">Sale history: ${facts.sales.slice(0, 4).map((x) => `${aud(x.price, { compact: true })} (${new Date(x.date).getFullYear()})`).join(' · ')}</p>` : ''}</div>`;
    const foot = `<p class="fine" style="margin-top:10px">An automated estimate from suburb-level data and the features entered, not a formal valuation. Individual homes vary with position, aspect, quality and street. A bank valuation or a local agent's appraisal of recent sales is more precise.</p>`;

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
      res.innerHTML = `<div class="card">${head.replace('__BADGE__', `<div style="text-align:right"><div class="note">Suburb 12 months</div><div class="mono" style="font-size:22px">${growth12(s, { suffix: '' })}</div></div>`)}
        <div class="grid g4" style="margin-top:14px;gap:12px">
          <div class="stat"><span class="k">Cash you need up front</span><span class="v">${aud(upfront, { compact: true })}</span><span class="s">${Math.round(dep * 100)}% deposit + duty + fees</span></div>
          <div class="stat"><span class="k">Repayments</span><span class="v">${aud(monthly)}<span class="muted" style="font-size:.55em">/mth</span></span><span class="s">${aud(weekly)}/wk at ${pct(ooRate, 2)}</span></div>
          <div class="stat"><span class="k">${myRent ? 'vs your rent now' : 'Renting a similar home'}</span><span class="v ${myRent ? (weekly > myRent ? 'down' : 'up') : ''}">${myRent ? `${weekly > myRent ? '+' : '−'}${aud(Math.abs(weekly - myRent))}` : aud(e.rent)}<span class="muted" style="font-size:.55em">/wk</span></span><span class="s">${myRent ? `${aud(weekly)} repayments vs ${aud(myRent)} rent` : 'estimated weekly rent'}</span></div>
          <div class="stat"><span class="k">If rates rise 2 points</span><span class="v down">${aud(weekly2)}<span class="muted" style="font-size:.55em">/wk</span></span><span class="s">+${aud(weekly2 - weekly)} a week</span></div>
        </div>
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
        <p class="fine" style="margin-top:10px">Repayments use the average rate on new owner-occupier variable loans (RBA), 30 years, principal and interest. Keep repayments under about 30% of take-home pay.</p>
        ${foot}</div>`;
    } else {
      const a = analyse({ state: s.s, price, weeklyRent: e.rent || 0, deposit: 0.2, ratePct: invRate, income: 120000, hold: 10, growth: f.type === 'u' ? 3.5 : 5, perth: s.rg === 'PER', strata: f.type === 'u' ? 3200 : 0, landValuePct: f.type === 'u' ? 0.25 : 0.55, newBuild });
      const v = verdict(a, { ...s, score: suburbScore(s.sc) }, market);
      res.innerHTML = `<div class="card">${head.replace('__BADGE__', `<div style="text-align:right"><div class="grade grade-${v.grade}" style="width:64px;height:64px;font-size:32px;margin-left:auto">${v.grade}</div><div class="note" style="margin-top:4px">Deal rating: ${esc(v.label.toLowerCase())}</div></div>`)}
        <div class="grid g4" style="margin-top:14px;gap:12px">
          <div class="stat"><span class="k">Estimated rent</span><span class="v">${aud(e.rent)}<span class="muted" style="font-size:.55em">/wk</span></span></div>
          <div class="stat"><span class="k">Gross yield</span><span class="v">${pct((e.rent * 52 * 100) / price, 2)}</span></div>
          <div class="stat"><span class="k">Weekly cost after tax</span><span class="v ${a.summary.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${aud(a.summary.weeklyCashAfterTax)}</span></div>
          <div class="stat"><span class="k">10-yr return (<abbr title="Internal rate of return: the average yearly return on your cash after costs, tax and sale">IRR</abbr>)</span><span class="v">${pct(a.summary.irr, 1)}</span></div>
        </div>
        <div class="hr"></div>
        <div class="grid g2" style="gap:12px 24px">
          ${built}
          <div><h3 style="font-size:16px">Buying it</h3><div class="kv">
            <span>Stamp duty (investor)</span><span>${aud(stampDuty(s.s, price).duty)}</span>
            <span>Cash needed at 20% deposit</span><span>${aud(a.upfront.total)}</span>
            <span>${esc(R?.name || '')} this week / past year (daily index)</span><span>${pct(mv.week, 2, true)} / ${pct(mv.year ?? s.g1, 1, true)}</span>
            <span>Suburb Keyzing Score</span><span>${scoreBadge(suburbScore(s.sc))}</span></div>
          </div>
        </div>
        <div class="grid g2" style="margin-top:10px;gap:8px 20px"><ul class="pros">${v.reasons.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><ul class="cons">${v.risks.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="row" style="margin-top:8px"><a class="btn primary" href="/analyse?suburb=${s.id}&price=${price}&rent=${e.rent}&type=${e.type}&new=${newBuild ? 1 : 0}&addr=${encodeURIComponent(facts?.address || q)}" data-link>Full deal analysis</a><a class="btn" href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} suburb report</a></div>
        <div style="margin-top:10px">${scoreVsDeal(suburbScore(s.sc), v.grade)}</div>
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
