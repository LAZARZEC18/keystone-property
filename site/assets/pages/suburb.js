import { esc, aud, pct, num, scoreBadge, bar, srcBadge, setMeta, lineChart, wireCharts, date, growth12, confBadge, confLevel, cashWeek, dealContext, rankPill, returnsLine } from '../ui.js';
import { baseTiles } from '../map.js';
import { load, suburbs, suburbDetail, suburbUrl, cleanName, nearby, watchlist, toggleWatch, typicalRate, openRate } from '../data.js';
import { suburbScore, PROFILES, stampDuty, landTax, lmi, analyse, verdict, scenarioReturns, valueEstimate, repayment } from '../engine.js';
import { investmentCase, regionStats, COMPONENT_HELP, COMPONENT_NAMES, listingLinks, scoreVsDeal } from '../insights.js';
import { STATES, GROWTH } from '../rules.js';
import { liveListings } from './listings.js';
import { regionMoves } from '../live.js';
import { printHeader, brandPanel, wireBrand } from '../brand.js';
import { accuracy } from '../accuracy.js';
import { seeTheArea } from '../photos.js';
import { hazardCard } from '../hazards.js';

// 'jul-2026' or '2026-07' -> 'July 2026'
const monthName = (x) => {
  const m = String(x).match(/([a-z]{3})[a-z]*-(\d{4})/i) || String(x).match(/(\d{4})-(\d{2})/);
  if (!m) return x;
  const d = /^\d{4}$/.test(m[1]) ? new Date(+m[1], +m[2] - 1, 1) : new Date(`${m[1]} 1, ${m[2]}`);
  return Number.isNaN(+d) ? x : d.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' });
};

export default async function suburbPage(main, params) {
  const [idx, market, rs, approvals, rba] = await Promise.all([suburbs(), load('market'), load('rates-summary'), load('approvals').catch(() => null), load('rba').catch(() => null)]);
  const index = null;
  const s = idx.bySlug.get(`${params.state}/${params.slug}`);
  if (!s) {
    main.innerHTML = `<div class="empty"><h1>Suburb not found</h1><p>Try the search box, or <a href="/suburbs" data-link>browse all suburbs</a>.</p></div>`;
    return;
  }
  const d = await suburbDetail(s);
  const name = cleanName(s.n);
  const R = market.regions[s.rg] || {};
  const rstats = regionStats(idx.list, s.rg);
  const ic = investmentCase(s, d, R, rstats, market);
  // one price everywhere on the page: the typical home as at the latest month-end
  if (ic.rent) ic.yld = (ic.rent * 52 * 100) / ic.price;
  const links = listingLinks(s);
  setMeta({ title: `${name} ${s.s} ${s.pc || ''}: house prices, rents, yield and suburb score`.replace(/\s+/g, ' '), description: `${name}, ${STATES[s.s]}: median ${ic.type} price ${aud(ic.price)}, rent ${aud(ic.rent)}/wk, yield ${pct(ic.yld, 2)}, Ownaroo investor score and full investment case.` });

  const profiles = Object.keys(PROFILES);
  const scores = Object.fromEntries(profiles.map((p) => [p, suburbScore(s.sc, PROFILES[p])]));
  const near = nearby(idx.list, s, 10, 30);
  const samePc = (idx.byPc.get(s.pc) || []).filter((x) => x !== s);
  const invRate = rs.medianInvestorVariable || 6.5;
  const bestRate = openRate(rs, 'INV_PI_variable')?.rate;

  // Quick deal at the suburb's typical price
  const quickIn = { state: s.s, price: ic.price, weeklyRent: ic.rent || 0, deposit: 0.2, ratePct: typicalRate(rba, 'INV').rate, income: 120000, hold: 10, growth: GROWTH.base, perth: s.rg === 'PER', newBuild: false, strata: s.pt === 'u' ? 3200 : 0, landValuePct: s.pt === 'u' ? 0.25 : 0.55 };
  const quick = analyse(quickIn);
  // condition spread for the main home type: needs work, typical, renovated
  const condType = s.pt === 'u' && s.u ? 'u' : 'h';
  const condRows = (() => {
    const e = (c) => valueEstimate(s, { type: condType, condition: c })?.value || (condType === 'u' ? s.u : s.h);
    return [['Needs work', e('needs-work'), 'dated, repairs due'], ['Typical', condType === 'u' ? s.u : s.h, 'the middle of sales here'], ['Renovated', e('renovated'), 'updated kitchen and bathrooms']];
  })();
  const quickSc = scenarioReturns(quickIn);
  const qv = verdict(quick, { ...s, score: scores.balanced }, market, { depositRate: rba?.cashRate?.current ?? 4.35 });

  const dutyInv = stampDuty(s.s, ic.price, { buyer: 'investor' });
  const dutyOwn = stampDuty(s.s, ic.price, { buyer: 'owner' });
  const dutyFhb = stampDuty(s.s, ic.price, { buyer: 'fhb' });
  const lt = landTax(s.s, ic.price * (s.pt === 'u' ? 0.25 : 0.55), { perth: s.rg === 'PER' });
  const lmi90 = lmi(ic.price * 0.9, ic.price, s.s);
  const watched = watchlist().includes(s.id);
  const off = d.off || {};
  const hist = d.hist;

  const mv = regionMoves(s.rg, index, market);
  const g12 = s.g1;
  const rRent = (R.houseYield && R.medianHouse ? (R.houseYield / 100) * R.medianHouse : (R.yield / 100) * R.medianDwelling * 1.04) / 52;
  const rYear = mv.year ?? R.annualPct;
  const cApp = approvals?.lga?.[s.lgc];
  const sApp = d.sa2 ? approvals?.sa2?.[d.sa2] : null;
  const analyseUrl = `/analyse?suburb=${s.id}&price=${ic.price}&rent=${ic.rent || ''}&type=${s.pt}`;
  const pcLink = s.pc ? `<a href="/postcode/${s.pc}" data-link>${s.pc}</a>` : '';
  const lgaSlug = (s.lga || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // in apartment suburbs (a CBD), lead with units and work price-to-income off units, not the few houses
  const hShare = d['hou%'] ?? s['hou%'] ?? 70;
  const fewHouses = hShare < 35 && s.u > 0;
  const ptiShown = s.pti && fewHouses ? Math.round(((s.u / (s.h / s.pti)) || 0) * 10) / 10 : s.pti;
  // NSW: the model predicts worse than the regional average there, so modelled NSW prices are shown as a range
  const nswErr = (idx.meta.model?.holdout?.NSW?.medianAbsPctError || 20) / 100;
  const rangeOf = (v, src) => (s.s === 'NSW' && src === 'model' && v ? `${aud(v * (1 - nswErr), { compact: true })}–${aud(v * (1 + nswErr), { compact: true })}` : aud(v, { compact: true }));
  const noUnit = s.us === 'few' ? `Not shown: units and townhouses are under 5% of homes here (${pct((d['fla%'] ?? s['fla%'] ?? 0), 0)} flats)` : s.us === 'held' ? 'Held back: the figure failed a data check' : '';
  const unitStat = `<div class="stat"><span class="k">Typical unit or townhouse ${s.u ? srcBadge(s.us) : ''}</span><span class="v">${s.u ? rangeOf(s.u, s.us) : '<span class="faint" style="font-size:15px">—</span>'}</span><span class="s">${!s.u ? esc(noUnit) : off.unit ? `${esc(off.unit.period)} median ${aud(off.unit.median, { compact: true })}, moved to ${esc(market.indexMonth || 'month-end')}` : `Modelled, as at ${esc(market.indexMonth || 'month-end')}`}</span></div>`;
  const heldNote = d.held?.length ? `<p class="note held-note">⚠ ${d.held.map(esc).join(' ')} <a href="/methodology#checks" data-link>How figures are checked</a></p>` : '';
  main.innerHTML = `
  <div class="crumbs"><a href="/suburbs?state=${s.s}" data-link>${STATES[s.s]}</a> › <a href="/suburbs?region=${s.rg}" data-link>${esc(R.name || '')}</a> › ${s.lga ? `<a href="/council/${s.s.toLowerCase()}/${lgaSlug}" data-link>${esc(s.lga)}</a> ›` : ''} ${pcLink}</div>
  <div class="spread" style="align-items:flex-start">
    <div>
      <h1 style="margin-bottom:6px">${esc(name)} <span class="muted" style="font-size:.5em;font-family:var(--sans)">${s.s} ${s.pc || ''}</span></h1>
      ${printHeader(`Suburb report: ${name} ${s.s} ${s.pc || ''}`)}
      ${String(s.hs).includes('postcode') && samePc.length ? `<p class="note" style="margin:4px 0">Prices, rents and the 12-month change here are for postcode ${esc(s.pc)} as a whole (NSW publishes them by postcode), shared with ${samePc.slice(0, 6).map((x) => `<a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a>`).join(', ')}${samePc.length > 6 ? ` and ${samePc.length - 6} more` : ''}.</p>` : ''}<div class="row muted" style="font-size:14px">${confBadge(s)} ${esc(s.lga || '')} council · ${esc(R.name || '')} · ${esc(s.ra || d.ra || '')} · ${num(s.pop)} residents · ${num(d.dw)} dwellings</div>
    </div>
    <div class="row">
      <button class="btn ${watched ? 'on' : ''}" id="watch">${watched ? '★ On watchlist' : '☆ Watch'}</button>
      <a class="btn" href="/compare?ids=${s.id}" data-link>Compare</a>
      <button class="btn" id="print" title="Save or print a report of this suburb">Download report</button>
      <a class="btn primary" href="${analyseUrl}" data-link>Analyse a property here</a>
    </div>
  </div>
  ${brandPanel(null)}
  <nav class="page-menu no-print" aria-label="On this page"><a href="#s-price">Price</a><a href="#s-sale">For sale</a><a href="#condition">Condition</a><a href="#s-hazards">Hazards</a><a href="#s-moves">Trends</a><a href="#s-case">Investment case</a><a href="#s-score">Score</a><a href="#s-people">People</a><a href="#s-nearby">Nearby</a></nav>
  <section class="section" style="margin-top:14px">${seeTheArea(s.lat, s.lng, { place: name, sold: listingLinks(s).reaSold })}</section>

  <div class="grid g-side section" style="margin-top:20px" id="s-price">
    <div class="card">
      <div class="stats">
        ${fewHouses ? `${unitStat}
        <div class="stat"><span class="k">Typical house ${srcBadge(s.hs)} <span class="tag">only ${Math.round(hShare)}% of homes</span></span><span class="v">${rangeOf(s.h, s.hs)}</span><span class="s">${off.house ? `${esc(off.house.period)} median ${aud(off.house.median, { compact: true })}${off.house.sales ? `, ${Math.round(off.house.sales)} sales` : ''}, moved to ${esc(market.indexMonth || 'month-end')}` : `Modelled, as at ${esc(market.indexMonth || 'month-end')}`}</span></div>` : `<div class="stat"><span class="k">Typical house ${srcBadge(s.hs)}</span><span class="v">${rangeOf(s.h, s.hs)}</span><span class="s">${off.house ? `${esc(off.house.period)} median ${aud(off.house.median, { compact: true })}${off.house.sales ? `, ${Math.round(off.house.sales)} sales` : ''}, moved to ${esc(market.indexMonth || 'month-end')}` : `Modelled, as at ${esc(market.indexMonth || 'month-end')}`}</span></div>
        ${unitStat}`}
        <div class="stat"><span class="k">Weekly rent (house / unit)</span><span class="v">${aud(s.rh)} <span class="muted" style="font-size:.6em">/ ${s.ru ? aud(s.ru) : '—'}</span></span><span class="s">${d.rs === 'NSW postcode' ? `NSW bond data, ${esc(off.rent?.period || '')}` : `Modelled from this suburb’s Census rents and price, centred on typical ${esc(R.name || 'regional')} rents today`}</span></div>
        <div class="stat"><span class="k">Gross yield (${ic.type})</span><span class="v">${pct(ic.yld, 2)}</span><span class="s">${R.name} average ${pct(R.yield, 1)}</span></div>
        <div class="stat"><span class="k">12-month change</span><span class="v ${g12 >= 0 ? 'up' : 'down'}">${pct(g12, 1, true)}</span><span class="s">${esc(s.g1p || '')}</span></div>
        <div class="stat"><span class="k">${d.cagr ? `Houses a year ${esc(d.cagrY || '')}` : 'Price to income'}</span><span class="v">${d.cagr ? pct(d.cagr, 1, true) : `${ptiShown ?? '—'}×`}</span><span class="s">${d.cagr ? 'Valuer-General Victoria' : `typical ${fewHouses ? 'unit' : 'house'} price ÷ household income`}</span></div>
      </div>
      ${heldNote}
    </div>
    <div class="card" style="display:flex;gap:16px;align-items:center">
      ${scoreBadge(scores.balanced, true)}
      <div><div class="eyebrow" style="margin:0">Ownaroo Score</div><div style="font-family:var(--serif);font-size:20px;font-weight:600">${scores.balanced >= 65 ? 'Strong on these measures' : scores.balanced >= 55 ? 'Solid on these measures' : scores.balanced >= 45 ? 'Mid-range on these measures' : 'Other suburbs score higher on these measures'}</div>
      <div class="note">Ranks the area against every Australian suburb. It isn't a rating of any particular home.</div></div>
    </div>
  </div>

  <section class="section card" id="s-sale">
    <div class="card-head"><h3>Homes for sale in ${esc(name)} now</h3><span class="note">and what homes here actually sold for</span></div>
    <div class="row">
      <a class="btn primary" href="${links.reaBuy}" target="_blank" rel="noopener">For sale · realestate.com.au ↗</a>
      <a class="btn" href="${links.domainBuy}" target="_blank" rel="noopener">For sale · Domain</a>
      <a class="btn" href="${links.reaSold}" target="_blank" rel="noopener">Recently sold · realestate.com.au</a>
      <a class="btn" href="${links.domainSold}" target="_blank" rel="noopener">Sold · Domain</a>
      <a class="btn" href="${links.reaRent}" target="_blank" rel="noopener">For rent</a>
      <a class="btn ghost" href="${links.domainProfile}" target="_blank" rel="noopener">Domain suburb profile</a>
    </div>
    <div id="livemap" class="map short" hidden style="margin-top:16px"></div>
    <div id="live" style="margin-top:16px"></div>
  </section>

  <section class="section card" id="condition">
    <div class="card-head"><h3>What the typical price hides</h3><span class="tag tag-model" title="The same percentages for every suburb, not local sales">Rule of thumb</span></div>
    <p class="note" style="margin-top:0">The typical ${condType === 'u' ? 'unit' : 'house'} price is the middle of every sale here, from homes that need a lot of work to fully renovated ones. A low typical price can simply mean many homes need work, so compare the <b>all-in cost</b>: price plus renovation.</p>
    <div class="grid g3" style="gap:10px">${condRows.map(([label, v, note]) => `<div class="stat"><span class="k">${label}</span><span class="v">${aud(v, { compact: true })}</span><span class="s">${note}</span></div>`).join('')}</div>
    <form class="fields reno" data-nosubmit style="grid-template-columns:repeat(3,minmax(0,1fr));align-items:end;margin-top:14px">
      <label class="field">Price of a home that needs work ($)<input name="rp" type="number" step="1000" min="0" value="${condRows[0][1]}"></label>
      <label class="field">Renovation it needs ($)<input name="rr" type="number" step="1000" min="0" value="${Math.round((condRows[2][1] - condRows[0][1]) / 5000) * 5000}"></label>
      <div class="reno-out note" aria-live="polite"></div>
    </form>
    <p class="fine" style="margin-top:8px">These condition figures are a rule of thumb, not local sales data: the same percentages (needs work about 18% below the typical price, renovated about 7% above) are applied in every suburb, and in some suburbs the real gap is much bigger or smaller. Get builder's quotes and a building inspection before relying on a renovation figure. For a particular home, use the <a href="/property" data-link>price range tool</a> and set its condition.</p>
  </section>
  <section class="section" id="s-hazards">${hazardCard(s.s, { place: name, coastKm: s.cst })}</section>

  <section class="section grid g2" id="s-moves">
    <div class="card">
      <div class="card-head"><h3>How prices have moved</h3><span class="note">Month-end ${esc(String(mv.monthEnd || ''))}</span></div>
      ${s.trend ? `<div class="trend-banner trend-${s.trend.toLowerCase()}">${esc(R.name || 'This area')}: <b>${s.trend.toLowerCase()}</b>, ${pct(R.quarterPct, 1, true)} over the last 3 months${R.annualPct != null ? ` (${pct(R.annualPct, 1, true)} over 12)` : ''}.</div>` : ''}
      <div class="stats" style="grid-template-columns:repeat(3,1fr)">
        ${[[`${esc(R.name || 'Area')}, month`, R.monthPct], [`${esc(R.name || 'Area')}, 3 months`, R.quarterPct], [`${esc(R.name || 'Area')}, 12 months`, R.annualPct], [s.g1s === 'region' ? 'This suburb, 12 months' : 'This suburb, 12 months (official sales)', s.g1s === 'region' ? null : s.g1]].map(([k, v]) => `<div class="stat"><span class="k">${k}</span><span class="v ${v > 0 ? 'up' : v < 0 ? 'down' : ''}" style="font-size:20px">${v === null || v === undefined ? '<span class="faint" style="font-size:14px">no suburb data</span>' : pct(v, 1, true)}</span></div>`).join('')}
      </div>
      <p class="fine" style="margin-top:8px">Cotality Home Value Index, month-end results as published. ${s.g1s === 'region' ? `There is no official sales series for ${esc(name)}, so only ${esc(R.name || 'the area')}-wide figures are shown.` : 'The suburb figure is its measured gap from official sales, added to the area figure.'} Individual suburbs can move differently.</p>
    </div>
    <div class="card">
      <h3>New building in the area</h3>
      ${cApp?.fy ? `<div class="kv">
        <span>${esc(s.lga)} council, new dwellings approved ${esc(cApp.fy.period)}</span><span>${num(cApp.fy.total)}</span>
        <span>Houses / apartments &amp; townhouses${cApp.fy.total - cApp.fy.houses - cApp.fy.other > 0 ? ' / not split by type' : ''}</span><span>${num(cApp.fy.houses)} / ${num(cApp.fy.other)}${cApp.fy.total - cApp.fy.houses - cApp.fy.other > 0 ? ` / ${num(cApp.fy.total - cApp.fy.houses - cApp.fy.other)}` : ''}</span>
        <span>As % of existing homes (supply growth)</span><span class="${(s.sup ?? 0) > 2 ? 'warn' : ''}">${pct(s.sup, 2)}</span>
        <span>This financial year to date</span><span>${num(cApp.ytd?.total)}</span>
        ${sApp?.fy ? `<span>Local area (SA2: ${esc(sApp.name)})</span><span>${num(sApp.fy.total)} approved</span>` : ''}
        <span>Value of new residential building</span><span>${aud((cApp.fy.value || 0) * 1000, { compact: true })}</span>
      </div>
      <p class="note" style="margin-top:10px">${(s.sup ?? 0) > 2.5 ? 'Heavy new supply: rents and resale prices for similar stock (especially apartments) can be held back while it is absorbed.' : (s.sup ?? 0) < 0.8 ? (cApp?.ytd?.total > (cApp?.fy?.total || 0) ? `Few homes were approved here last financial year, but ${num(cApp.ytd.total)} have been approved so far this year, so watch for new supply.` : 'Very little new housing is being approved here, which supports prices and rents if demand keeps growing.') : 'A moderate amount of new housing is coming, broadly in line with population growth.'} <a href="/new-builds" data-link>New builds across Australia →</a></p>` : '<p class="note">No building approvals data for this council.</p>'}
      <p class="fine">ABS Building Approvals, data to ${esc(monthName(approvals?.latestMonth || approvals?.release || ''))}. The ABS suppresses very small counts by type, so the parts can add up to slightly less than the total.</p>
    </div>
  </section>

  <section class="section grid g2" id="s-case">
    <div class="card">
      <div class="eyebrow">Investment case</div>
      <h2 style="font-size:24px">${esc(ic.headline)}</h2>
      ${ic.pros.length ? `<h3 style="font-size:16px;margin-top:14px">In ${esc(name)}'s favour</h3><ul class="pros">${ic.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${ic.cons.length ? `<h3 style="font-size:16px;margin-top:14px">What to watch</h3><ul class="cons">${ic.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${ic.wider.length ? `<h3 style="font-size:16px;margin-top:14px">The wider ${esc(R.name || 'area')} market <span class="tag">not specific to ${esc(name)}</span></h3><ul class="note" style="margin:6px 0 0;padding-left:18px">${ic.wider.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${(() => {
        // never suggest an investor profile when the typical deal here fails the deposit test
        const failsTest = qv && qv.beatsDeposit === false;
        let suits = failsTest ? ic.suits.filter((x) => !/investor/i.test(x)) : ic.suits;
        const dropped = suits.length < ic.suits.length;
        if (!suits.length) suits = ['Buyers with a specific reason to be here (work, family, lifestyle) rather than a pure investment play'];
        return `<h3 style="font-size:16px;margin-top:14px">Tends to suit</h3><ul class="note" style="margin:6px 0 0;padding-left:18px">${suits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>${dropped ? `<p class="fine" style="margin-top:6px">Not investors, on today's numbers: a typical ${esc(ic.type)} here returns less than a term deposit after tax at 3% growth (see the deal on the right).</p>` : ''}`;
      })()}
    </div>
    <div class="card">
      <div class="card-head"><h3>What a typical ${ic.type} here would do for you</h3>${rankPill(qv)}</div>
      <div><div class="cost-head ${quick.summary.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${cashWeek(quick.summary.weeklyCashAfterTax)}</div><p class="note" style="margin:2px 0 0">after tax in year 1</p>${returnsLine(quickSc, qv)}<p class="note" style="margin:4px 0 0">${dealContext(qv)}</p><p class="note" style="margin:4px 0 0">${aud(ic.price)} purchase, 20% deposit, ${pct(quick.input.ratePct, 2)} investor P&amp;I loan, $120k salary, ${quick.input.growth}% a year growth, sold after 10 years.</p></div>
      ${scoreVsDeal(scores.balanced, qv.grade)}
      <div class="kv" style="margin-top:14px">
        <span>Cash needed up front</span><span>${aud(quick.upfront.total)}</span>
        <span>Stamp duty (investor)</span><span>${aud(quick.upfront.duty)}</span>
        ${quick.summary.split2027 ? `<span>Each week until 30 June 2027 (after tax)</span><span class="${quick.summary.split2027.before >= 0 ? 'up' : 'down'}">${cashWeek(quick.summary.split2027.before)}</span>
        <span>Each week from 1 July 2027 (after tax)</span><span class="${quick.summary.split2027.after >= 0 ? 'up' : 'down'}">${cashWeek(quick.summary.split2027.after)}</span>` : `<span>Each week, year 1 (after tax)</span><span class="${quick.summary.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${cashWeek(quick.summary.weeklyCashAfterTax)}</span>`}
        <span>Each week, year 3 (after tax)</span><span class="${quick.rows[2].cashAfterTax >= 0 ? 'up' : 'down'}">${cashWeek(quick.rows[2].cashAfterTax / 52)}</span>
        <span>After-tax return on your cash (IRR)</span><span>${pct(quick.summary.irr, 1)}</span>
        <span>Equity after 10 years</span><span>${aud(quick.summary.equityAtSale, { compact: true })}</span>
        <span>Net profit after tax and sale</span><span class="${quick.summary.totalProfit >= 0 ? 'up' : 'down'}">${aud(quick.summary.totalProfit, { compact: true })}</span>
      </div>
      <ul class="pros">${qv.reasons.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <ul class="cons">${qv.risks.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <a class="btn primary" href="${analyseUrl}" data-link style="margin-top:10px">Change the assumptions →</a>
    </div>
  </section>

  <section class="section grid g2" id="s-score">
    <div class="card">
      <h3>Score breakdown</h3>
      ${Object.keys(COMPONENT_NAMES).map((k) => `<div class="comp" title="${esc(COMPONENT_HELP[k])}"><span>${COMPONENT_NAMES[k]}</span>${bar(s.sc[k])}<b>${s.sc[k] ?? '—'}</b></div><div class="fine" style="margin:-4px 0 8px 130px">${esc(COMPONENT_HELP[k])}</div>`).join('')}
      <p class="fine">Each component is a percentile against every Australian suburb (100 = best). The overall score weights them by strategy.${confLevel(s) !== 'high' ? ` <b>${esc(name)} has no suburb-level sales series</b>, so rental demand uses ${esc(R.name || 'city')}-wide vacancy and days on market, and growth uses the ${esc(R.name || 'city')} index. Here the score mostly separates suburbs by yield, affordability and population growth.` : ''}</p>
    </div>
    <div class="card">
      <h3>Cost to buy a typical ${ic.type} (${aud(ic.price, { compact: true })})</h3>
      <div class="kv">
        <span>Stamp duty, investor</span><span>${aud(dutyInv.duty)}</span>
        <span>Stamp duty, owner-occupier</span><span>${aud(dutyOwn.duty)}</span>
        <span>Stamp duty, first home buyer</span><span>${aud(dutyFhb.duty)}</span>
        <span>LMI at 90% LVR (indicative)</span><span>${aud(lmi90.premium)}</span>
        <span>Land tax a year (investor, this property only)</span><span>${lt.tax ? aud(lt.tax) : '$0'}${lt.approx ? '*' : ''}</span>
        <span>Deposit at 20%</span><span>${aud(ic.price * 0.2)}</span>
        <span class="tot">Cash to buy at 20% deposit</span><span class="tot">${aud(ic.price * 0.2 + dutyInv.duty + 2500)}</span>
      </div>
      <p class="fine" style="margin-top:8px">${esc(dutyInv.label)}. Land tax assumes land is ${s.pt === 'u' ? '25' : '55'}% of the price and that you own no other land in ${s.s}. ${lt.note ? esc(lt.note) : ''} ${dutyFhb.notes.map(esc).join(' ')}</p>
    </div>
  </section>

  ${
    hist
      ? `<section class="section card"><h3>House price history, ${esc(name)}</h3>${lineChart([{ name: 'Median house price', points: hist.map(([y, v]) => [Date.UTC(y, 6, 1), v]) }], { height: 230, yFmt: (v) => aud(v, { compact: true }), area: true })}<p class="fine">Annual median house price, Victorian Property Sales Report (Valuer-General Victoria).</p></section>`
      : ''
  }

  <section class="section grid g2" id="s-people">
    <div class="card">
      <h3>People and housing</h3>
      <div class="kv">
        <span>Population (2021 Census)</span><span>${num(s.pop)}</span>
        <span>Population change ${esc(d.pgS && !/census/i.test(d.pgS) ? '2020-2025 (ABS estimates, surrounding area)' : '2016-2021 (Census)')}</span><span class="${(s.pg5 ?? 0) >= 0 ? 'up' : 'down'}">${pct(s.pg5, 1, true)}</span>
        <span>Median household income, ${esc(String(idx.meta.areaNow?.wpiTo || '2026').slice(0, 4))} estimate <span class="fine">(2021 Census: ${aud(d.inc21)}/wk)</span></span><span>${aud(d.inc)}/wk (${aud(d.inc * 52, { compact: true })}/yr)</span>
        <span>${/SA2/.test(d.igS || '') ? 'Median personal income change, 2018-19 to 2022-23 (surrounding area)' : 'Household income change 2016-2021'}</span><span>${pct(d.ig5, 1, true)}</span>
        <span>Median age (2021 Census)</span><span>${d.age ?? '—'}</span>
        <span>Unemployment, estimate for now <span class="fine">(2021 Census: ${pct(d.une21, 1)})</span></span><span>${pct(d.une, 1)}</span>
        <span>Homes rented</span><span>${pct(d['rent%'], 1)}</span>
        <span>Owned outright</span><span>${pct(d['own%'], 1)}</span>
        <span>Social housing</span><span>${pct(d['soc%'], 1)}</span>
        <span>Separate houses / flats</span><span>${pct(d['hou%'] ?? s['hou%'], 0)} / ${pct(d['fla%'] ?? s['fla%'], 0)}</span>
        <span>Census rent change 2016-2021</span><span>${pct(d.rg5, 1, true)}</span>
      </div>
      <p class="fine" style="margin-top:8px">ABS Census 2016 and 2021, Suburbs and Localities. Income is the 2021 Census figure carried forward by the ABS's personal income data for the surrounding area (to 2022-23) and national wage growth since. Unemployment is the 2021 Census rate moved by the change in the ABS modelled rate for the region (to ${esc(monthName(idx.meta.areaNow?.unemploymentTo || ''))}). Population change from ABS estimates for the surrounding area (SA2).</p>
    </div>
    <div class="card">
      <h3>${esc(name)} vs ${esc(R.name && R.name === name ? `greater ${R.name}` : R.name || 'the region')}</h3>
      <div class="tbl-wrap"><table><thead><tr><th></th><th class="n">${esc(name)}</th><th class="n">${esc(R.name || '')}</th></tr></thead><tbody>
        <tr><td>Typical house</td><td class="n">${aud(s.h, { compact: true })}</td><td class="n">${aud(R.medianHouse || R.medianDwelling, { compact: true })}</td></tr>
        <tr><td>Typical unit or townhouse</td><td class="n">${s.u ? aud(s.u, { compact: true }) : '—'}</td><td class="n">${R.medianUnit ? aud(R.medianUnit, { compact: true }) : '—'}</td></tr>
        <tr><td>Typical house rent</td><td class="n">${aud(s.rh)}</td><td class="n">${aud(Math.round(rRent / 5) * 5)}</td></tr>
        <tr><td>Gross yield</td><td class="n">${pct(ic.yld, 2)}</td><td class="n">${pct(R.yield, 1)}</td></tr>
        <tr><td>12-month change</td><td class="n">${growth12(s, { suffix: '', short: true })}</td><td class="n">${pct(rYear, 1, true)}</td></tr>
        <tr><td>Rental vacancy (SQM Research, ${/^Regional/.test(R.name || '') ? 'region' : 'city'}-wide)</td><td class="n">—</td><td class="n">${pct(R.vacancy, 1)}</td></tr>
        <tr><td>Days on market</td><td class="n">—</td><td class="n">${R.dom ?? '—'}</td></tr>
      </tbody></table></div>
      ${Object.keys(off).length ? `<h3 style="font-size:16px;margin-top:16px">Official data</h3><div class="kv">${off.house ? `<span>House median (${esc(off.house.period)})</span><span>${aud(off.house.median)}</span>` : ''}${off.house?.medianYearAgo ? `<span>A year earlier</span><span>${aud(off.house.medianYearAgo)}</span>` : ''}${off.house?.annualPct !== undefined ? `<span>Annual change</span><span>${pct(off.house.annualPct, 1, true)}</span>` : ''}${off.house?.sales ? `<span>Sales in period</span><span>${Math.round(off.house.sales)}</span>` : ''}${off.unit ? `<span>Unit median (${esc(off.unit.period)})</span><span>${aud(off.unit.median)}</span>` : ''}${off.rent?.all ? `<span>Median new bond rent (${esc(off.rent.period)})</span><span>${aud(off.rent.all)}/wk</span>` : ''}${off.rent?.bonds ? `<span>New bonds lodged</span><span>${num(off.rent.bonds)}</span>` : ''}</div><p class="fine" style="margin-top:6px">${off.house?.source === 'NSW' || off.rent ? 'NSW figures cover the whole postcode. ' : ''}Sources: ${[off.house?.source, off.unit?.source, off.rent?.source].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((x) => ({ VIC: 'Valuer-General Victoria', SA: 'Land Services SA', NSW: 'NSW DCJ Rent and Sales Report' })[x]).join(', ')}.</p>` : ''}
    </div>
  </section>



  <section class="section grid g2" id="s-nearby">
    <div class="card">
      <h3>Nearby suburbs</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Suburb</th><th class="n">km</th><th class="n">Score</th><th class="n">Price</th><th class="n">Yield</th></tr></thead><tbody>
      ${near.map((x) => `<tr><td><a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a> <span class="muted">${x.pc || ''}</span></td><td class="n">${x.km.toFixed(1)}</td><td class="n">${scoreBadge(suburbScore(x.sc))}</td><td class="n">${aud(x.pt === 'u' && x.u ? x.u : x.h, { compact: true })}</td><td class="n">${pct(x.y, 1)}</td></tr>`).join('')}
      </tbody></table></div>
      ${samePc.length ? `<p class="note" style="margin-top:10px">Also in postcode ${pcLink}: ${samePc.map((x) => `<a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a>`).join(', ')}</p>` : ''}
    </div>
    <div class="card"><h3>Map</h3><div id="smap" class="map short"></div></div>
  </section>

  <section class="section">
    <p class="fine">How these numbers are made: prices marked Modelled come from Ownaroo's model, which is trained on ${idx.meta.model.trainN.toLocaleString()} official suburb medians and anchored to Cotality's current ${esc(R.name || '')} median. ${esc(accuracy(s, s.pt, { model: idx.meta.model }).text)} <a href="/methodology" data-link>Full methodology</a>. Suburb data built ${date(idx.meta.built)}.</p>
  </section>`;

  main.querySelector('#print').addEventListener('click', () => window.print());
  wireBrand(main, `Suburb report: ${name} ${s.s} ${s.pc || ''}`);
  // the in-page menu sticks just under the site header, whatever its height on this screen
  const topBar = document.querySelector('.top');
  if (topBar) main.style.setProperty('--menu-top', `${topBar.offsetHeight}px`);
  main.querySelector('#watch').addEventListener('click', (e) => {
    const on = toggleWatch(s.id);
    e.currentTarget.classList.toggle('on', on);
    e.currentTarget.textContent = on ? '★ On watchlist' : '☆ Watch';
  });
  wireCharts(main, (v) => aud(v, { compact: true }), (v) => new Date(v).getFullYear());
  liveListings(main.querySelector('#live'), s, { compact: true, mapEl: main.querySelector('#livemap') });
  // price + renovation = all-in cost, against a renovated home here
  const reno = main.querySelector('form.reno');
  const renoRun = () => {
    const p = +reno.rp.value || 0;
    const w = +reno.rr.value || 0;
    const all = p + w;
    const ren = condRows[2][1];
    const diff = all - ren;
    reno.querySelector('.reno-out').innerHTML = p ? `All-in <b>${aud(all)}</b>: ${Math.abs(diff) < 5000 ? 'about the same as' : `<b class="${diff > 0 ? 'down' : 'up'}">${aud(Math.abs(diff), { compact: true })} ${diff > 0 ? 'more' : 'less'}</b> than`} a renovated home here (about ${aud(ren, { compact: true })}). The bank lends on the purchase price, so the work usually comes from savings.` : '';
  };
  reno?.addEventListener('input', renoRun);
  if (reno) renoRun();

  let map = null;
  const drawMap = () => {
    if (!window.L) return setTimeout(drawMap, 300);
    map = L.map('smap', { scrollWheelZoom: false }).setView([s.lat, s.lng], 12);
    baseTiles().addTo(map);
    const css = getComputedStyle(document.documentElement);
    const col = (v) => css.getPropertyValue(v >= 65 ? '--sc-a' : v >= 55 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
    L.circleMarker([s.lat, s.lng], { radius: 10, color: '#000', weight: 2, fillColor: col(scores.balanced), fillOpacity: 1 }).addTo(map).bindTooltip(name, { permanent: true, direction: 'top', offset: [0, -8] });
    near.forEach((x) => {
      const v = suburbScore(x.sc);
      L.circleMarker([x.lat, x.lng], { radius: 6, weight: 1, color: '#0006', fillColor: col(v), fillOpacity: 0.9 }).addTo(map).bindPopup(`<a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a><br>Score ${v} · ${aud(x.pt === 'u' ? x.u : x.h, { compact: true })}`);
    });
  };
  drawMap();
  return { destroy: () => map?.remove() };
}
