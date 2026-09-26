import { esc, aud, pct, scoreBadge, setMeta, srcBadge, date } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, haversine, nearby } from '../data.js';
import { suburbScore, valueEstimate, analyse, verdict, stampDuty } from '../engine.js';
import { liveFactor, regionMoves } from '../live.js';
import { baseTiles } from '../map.js';
import { liveListings, valueCall } from './listings.js';
import { reaSearch } from './find.js';
import { navigate } from '../app.js';
import { STATES } from '../rules.js';

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
  setMeta({ title: q ? `${q}: estimated value, rent and investment rating` : 'Property value estimate by address', description: 'Enter any Australian address to see an estimated value, rent, yield, investment rating and similar homes.' });
  const [idx, market, index, rs] = await Promise.all([suburbs(), load('market'), load('index'), load('rates-summary')]);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Property valuation</div><h1>What is this property worth?</h1>
  <p>Enter an address. Keystone places it in its suburb, estimates its value and rent from the suburb's sales data and the home's features, rates it as an investment, and finds similar homes and better-value alternatives nearby.</p></div>
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
  const g = geo?.results?.[0];
  if (!s && g) {
    const st = STATE_NAME[(g.state || '').toLowerCase()];
    s = idx.list.find((x) => x.s === st && cleanName(x.n).toLowerCase() === (g.suburb || '').toLowerCase()) ||
      idx.list.filter((x) => !st || x.s === st).map((x) => [haversine(x, g), x]).sort((a, b) => a[0] - b[0])[0]?.[1];
  }
  if (!s) {
    out.innerHTML = '<div class="empty">Couldn\'t place that address. Add the suburb and postcode, e.g. "7 Russell Street, Morley WA 6062".</div>';
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

  out.innerHTML = `
  <div class="card flat tint"><div class="spread"><div><b>${esc(facts?.address || q)}</b><div class="note">In <a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} ${s.s} ${s.pc || ''}</a> · ${esc(s.lga || '')} council · ${esc(R?.name || '')}${g ? ` · located to ${g.precision === 'address' ? 'the address' : 'the street'}` : ' · located from the suburb name'}</div></div>${facts ? '<span class="powered">Property facts powered by <b>Domain</b></span>' : ''}</div></div>
  <div class="grid split-spec" style="gap:20px;margin-top:16px" id="pgrid">
    <form class="card" id="spec" onsubmit="return false" style="align-self:start">
      <h3>The property</h3>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field">Type<select name="type"><option value="h">House</option><option value="u">Unit / apartment / townhouse</option></select></label>
        <label class="field">Bedrooms<input name="beds" type="number" min="0" max="8" value="${spec.beds}"></label>
        <label class="field">Bathrooms<input name="baths" type="number" min="1" max="6" value="${spec.baths}"></label>
        <label class="field">Car spaces<input name="cars" type="number" min="0" max="6" value="${spec.cars}"></label>
        <label class="field">Land (m²)<input name="land" type="number" step="10" value="${spec.land}" placeholder="Houses"></label>
        <label class="field">Condition<select name="condition"><option value="new">Brand new</option><option value="renovated">Renovated</option><option value="average" selected>Average</option><option value="original">Original</option><option value="needs-work">Needs work</option></select></label>
        <label class="check" style="grid-column:1/-1"><input type="checkbox" name="pool"> Pool</label>
        <label class="field" style="grid-column:1/-1">Asking price (optional)<input name="asking" type="number" step="5000" value="${spec.asking}" placeholder="Compare against the estimate"></label>
      </div>
      <p class="fine" style="margin-top:10px">${facts ? 'Bedrooms, bathrooms and land were filled in from Domain\'s property record. Change anything that\'s out of date.' : 'Fill in what you know. The more detail, the tighter the estimate.'}</p>
    </form>
    <div id="res"></div>
  </div>
  <section class="section grid g2">
    <div class="card"><h3>On the map</h3><div id="pmap" class="map short"></div></div>
    <div class="card" id="alts"></div>
  </section>
  <section class="section card"><div class="card-head"><h3>Similar homes for sale</h3><span class="note" id="simnote"></span></div><div class="row" id="simlinks"></div><div id="simlive" style="margin-top:14px"></div></section>`;

  const form = main.querySelector('#spec');
  form.type.value = spec.type;
  const res = main.querySelector('#res');
  const invRate = Math.max(rs.best.INV_PI_variable?.[0]?.rate || 6, (rs.medianInvestorVariable || 6.5) - 0.4);

  let edited = !!facts || !!spec.asking;
  function run() {
    const f = Object.fromEntries(new FormData(form));
    const sp = { type: f.type, beds: +f.beds, baths: +f.baths, cars: +f.cars, land: +f.land || null, condition: f.condition, pool: !!f.pool, liveFactor: lf };
    const e = valueEstimate(s, sp);
    const asking = +f.asking || null;
    const price = asking || e.value;
    const a = analyse({ state: s.s, price, weeklyRent: e.rent || 0, deposit: 0.2, ratePct: invRate, income: 120000, hold: 10, growth: f.type === 'u' ? 3.5 : 5, perth: s.rg === 'PER', strata: f.type === 'u' ? 3200 : 0, landValuePct: f.type === 'u' ? 0.25 : 0.55, newBuild: f.condition === 'new' });
    const v = verdict(a, { ...s, score: suburbScore(s.sc) }, market);
    const gap = asking ? (asking / e.value - 1) * 100 : null;
    const vc = valueCall(gap);
    const dEst = facts?.estimate?.mid;
    const fhbDuty = stampDuty(s.s, price, { buyer: 'fhb', newBuild: f.condition === 'new' });
    res.innerHTML = `
      <div class="card">
        <div class="spread" style="align-items:flex-start">
          <div><div class="eyebrow" style="margin:0">${edited ? 'Keystone estimate' : 'Starting estimate: typical home'} · ${date(new Date().toISOString())}</div>
          <div class="big-num" style="margin:6px 0">${aud(e.value)}</div>
          <div class="note">Likely range ${aud(e.low, { compact: true })} – ${aud(e.high, { compact: true })} · ${e.beds}-bed ${e.type === 'u' ? 'unit' : 'house'}</div></div>
          <div style="text-align:right"><div class="grade grade-${v.grade}" style="width:64px;height:64px;font-size:32px;margin-left:auto">${v.grade}</div><div class="note" style="margin-top:4px">${esc(v.label)} as an investment</div></div>
        </div>
        ${edited ? '' : `<div class="callout" style="margin-top:14px"><b>This is a typical ${e.beds}-bed, ${f.baths}-bath ${e.type === 'u' ? 'unit' : 'house'} in ${esc(cleanName(s.n))}, not this property yet.</b> Enter its bedrooms, bathrooms, land size and condition on the left, plus the asking price if it's for sale, and the estimate, range and rating update for this home.</div>`}
        ${vc ? `<div class="callout ${vc.cls === 'up' ? 'green' : ''}" style="margin-top:14px"><b class="${vc.cls}">${vc.label}:</b> asking ${aud(asking)} is ${pct(Math.abs(gap), 1)} ${gap >= 0 ? 'above' : 'below'} the estimate. ${esc(vc.note)}</div>` : ''}
        <div class="grid g4" style="margin-top:14px;gap:12px">
          <div class="stat"><span class="k">Estimated rent</span><span class="v">${aud(e.rent)}<span class="muted" style="font-size:.55em">/wk</span></span></div>
          <div class="stat"><span class="k">Gross yield</span><span class="v">${pct((e.rent * 52 * 100) / price, 2)}</span></div>
          <div class="stat"><span class="k">Weekly cost after tax</span><span class="v ${a.summary.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${aud(a.summary.weeklyCashAfterTax)}</span></div>
          <div class="stat"><span class="k">10-yr return (IRR)</span><span class="v">${pct(a.summary.irr, 1)}</span></div>
        </div>
        <div class="hr"></div>
        <div class="grid g2" style="gap:12px 24px">
          <div><h3 style="font-size:16px">How the estimate is built</h3><div class="kv">
            <span>Typical ${e.type === 'u' ? 'unit' : 'house'} in ${esc(cleanName(s.n))} ${srcBadge(e.type === 'u' ? s.us : s.hs)}</span><span>${aud(e.basis, { compact: true })}</span>
            ${e.adjustments.map((x) => `<span>${esc(x.label)}</span><span class="${x.pct >= 0 ? 'up' : 'down'}">${x.pct >= 0 ? '+' : ''}${(x.pct * 100).toFixed(1)}%</span>`).join('')}
            <span class="tot">Estimate</span><span class="tot">${aud(e.value)}</span></div>
            <p class="fine" style="margin-top:6px">Suburb value includes ${esc(R?.name || '')} index movement to ${date(index.generated)} (${pct((lf - 1) * 100, 2, true)} since 31 Aug).</p></div>
          <div><h3 style="font-size:16px">Buying it</h3><div class="kv">
            <span>Stamp duty (investor)</span><span>${aud(stampDuty(s.s, price).duty)}</span>
            <span>Stamp duty (first home)</span><span>${aud(fhbDuty.duty)}</span>
            <span>Cash needed at 20% deposit</span><span>${aud(a.upfront.total)}</span>
            <span>${esc(R?.name || '')} this week / past year (daily index)</span><span>${pct(mv.week, 2, true)} / ${pct(mv.year ?? s.g1, 1, true)}</span>
            <span>Suburb Keystone Score</span><span>${scoreBadge(suburbScore(s.sc))}</span></div>
            ${fhbDuty.notes.length ? `<p class="fine" style="margin-top:6px">First home: ${esc(fhbDuty.notes.join(' '))}</p>` : ''}
            ${dEst ? `<p class="note" style="margin-top:8px">Domain's own estimate: <b>${aud(dEst)}</b> (${aud(facts.estimate.low, { compact: true })} – ${aud(facts.estimate.high, { compact: true })}, ${esc(facts.estimate.confidence || '')} confidence).</p>` : ''}
            ${facts?.sales?.length ? `<p class="note" style="margin-top:8px">Sale history: ${facts.sales.slice(0, 4).map((x) => `${aud(x.price, { compact: true })} (${new Date(x.date).getFullYear()})`).join(' · ')}</p>` : ''}
          </div>
        </div>
        <div class="grid g2" style="margin-top:10px;gap:8px 20px"><ul class="pros">${v.reasons.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul><ul class="cons">${v.risks.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
        <div class="row" style="margin-top:8px"><a class="btn primary" href="/analyse?suburb=${s.id}&price=${price}&rent=${e.rent}&type=${e.type}&new=${f.condition === 'new' ? 1 : 0}&addr=${encodeURIComponent(facts?.address || q)}" data-link>Full deal analysis</a><a class="btn" href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))} suburb report</a></div>
        <p class="fine" style="margin-top:10px">An automated estimate from suburb-level data and the features entered, not a formal valuation. Individual homes vary with position, aspect, quality and street. A bank valuation or a sales appraisal from a local agent is more precise.</p>
      </div>`;

    // Comparable suburbs nearby for less: similar household incomes (a proxy for the kind of street and buyer),
    // no weaker on Keystone Score or concentration risk, and cheaper for the same home by 4-20%.
    const inc = (x) => (x.h && x.pti ? x.h / x.pti : null);
    const myInc = inc(s);
    const myScore = suburbScore(s.sc);
    const alts = nearby(idx.list, s, 60, 15)
      .filter((x) => x.pop >= 1000 && myInc && inc(x) && Math.abs(inc(x) / myInc - 1) <= 0.12 && (x.rsk ?? 0) <= (s.rsk ?? 0) + 10)
      .map((x) => ({ x, e: valueEstimate(x, sp) }))
      .filter((o) => o.e && o.e.value <= e.value * 0.96 && o.e.value >= e.value * 0.8 && suburbScore(o.x.sc) >= myScore - 2)
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
