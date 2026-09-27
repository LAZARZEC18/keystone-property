import { esc, aud, pct, num, scoreBadge, bar, srcBadge, setMeta, lineChart, wireCharts, date, growth12, confBadge } from '../ui.js';
import { baseTiles } from '../map.js';
import { load, suburbs, suburbDetail, suburbUrl, cleanName, nearby, watchlist, toggleWatch } from '../data.js';
import { suburbScore, PROFILES, stampDuty, landTax, lmi, analyse, verdict } from '../engine.js';
import { investmentCase, regionStats, COMPONENT_HELP, COMPONENT_NAMES, listingLinks, scoreVsDeal } from '../insights.js';
import { STATES } from '../rules.js';
import { liveListings } from './listings.js';
import { regionMoves, liveFactor } from '../live.js';

export default async function suburbPage(main, params) {
  const [idx, market, rs, index, approvals] = await Promise.all([suburbs(), load('market'), load('rates-summary'), load('index'), load('approvals').catch(() => null)]);
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
  // one price everywhere on the page: the typical home moved to today with the index
  ic.price = Math.round((ic.price * liveFactor(s.rg, index)) / 1000) * 1000;
  if (ic.rent) ic.yld = (ic.rent * 52 * 100) / ic.price;
  const links = listingLinks(s);
  setMeta({ title: `${name} ${s.s} ${s.pc || ''} property investment: prices, rents, yield, score`, description: `${name}, ${STATES[s.s]}: median ${ic.type} price ${aud(ic.price)}, rent ${aud(ic.rent)}/wk, yield ${pct(ic.yld, 2)}, Keystone investor score and full investment case.` });

  const profiles = Object.keys(PROFILES);
  const scores = Object.fromEntries(profiles.map((p) => [p, suburbScore(s.sc, PROFILES[p])]));
  const near = nearby(idx.list, s, 10, 30);
  const samePc = (idx.byPc.get(s.pc) || []).filter((x) => x !== s);
  const invRate = rs.medianInvestorVariable || 6.5;
  const bestRate = rs.best.INV_PI_variable?.[0]?.rate;

  // Quick deal at the suburb's typical price
  const quick = analyse({ state: s.s, price: ic.price, weeklyRent: ic.rent || 0, deposit: 0.2, ratePct: bestRate ? Math.max(bestRate, invRate - 0.4) : invRate, income: 120000, hold: 10, growth: s.pt === 'u' ? 3.5 : 5, perth: s.rg === 'PER', newBuild: false, strata: s.pt === 'u' ? 3200 : 0, landValuePct: s.pt === 'u' ? 0.25 : 0.55 });
  const qv = verdict(quick, { ...s, score: scores.balanced }, market);

  const dutyInv = stampDuty(s.s, ic.price, { buyer: 'investor' });
  const dutyOwn = stampDuty(s.s, ic.price, { buyer: 'owner' });
  const dutyFhb = stampDuty(s.s, ic.price, { buyer: 'fhb' });
  const lt = landTax(s.s, ic.price * (s.pt === 'u' ? 0.25 : 0.55), { perth: s.rg === 'PER' });
  const lmi90 = lmi(ic.price * 0.9, ic.price, s.s);
  const watched = watchlist().includes(s.id);
  const off = d.off || {};
  const hist = d.hist;

  const mv = regionMoves(s.rg, index, market);
  const lf = liveFactor(s.rg, index);
  const g12 = s.g1;
  const rRent = (R.houseYield && R.medianHouse ? (R.houseYield / 100) * R.medianHouse : (R.yield / 100) * R.medianDwelling * 1.04) / 52;
  const rYear = mv.year ?? R.annualPct;
  const cApp = approvals?.lga?.[s.lgc];
  const sApp = d.sa2 ? approvals?.sa2?.[d.sa2] : null;
  const analyseUrl = `/analyse?suburb=${s.id}&price=${ic.price}&rent=${ic.rent || ''}&type=${s.pt}`;
  const pcLink = s.pc ? `<a href="/postcode/${s.pc}" data-link>${s.pc}</a>` : '';
  const lgaSlug = (s.lga || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

  main.innerHTML = `
  <div class="crumbs"><a href="/suburbs?state=${s.s}" data-link>${STATES[s.s]}</a> › <a href="/suburbs?region=${s.rg}" data-link>${esc(R.name || '')}</a> › ${s.lga ? `<a href="/council/${s.s.toLowerCase()}/${lgaSlug}" data-link>${esc(s.lga)}</a> ›` : ''} ${pcLink}</div>
  <div class="spread" style="align-items:flex-start">
    <div>
      <h1 style="margin-bottom:6px">${esc(name)} <span class="muted" style="font-size:.5em;font-family:var(--sans)">${s.s} ${s.pc || ''}</span></h1>
      <div class="print-only report-head">Keystone suburb report · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })} · keystone-au.netlify.app</div>
      <div class="row muted" style="font-size:14px">${confBadge(s)} ${esc(s.lga || '')} council · ${esc(R.name || '')} · ${esc(s.ra || d.ra || '')} · ${num(s.pop)} residents · ${num(d.dw)} dwellings</div>
    </div>
    <div class="row">
      <button class="btn ${watched ? 'on' : ''}" id="watch">${watched ? '★ On watchlist' : '☆ Watch'}</button>
      <a class="btn" href="/compare?ids=${s.id}" data-link>Compare</a>
      <button class="btn" id="print" title="Save or print a report of this suburb">Download report</button>
      <a class="btn primary" href="${analyseUrl}" data-link>Analyse a property here</a>
    </div>
  </div>

  <div class="grid g-side section" style="margin-top:20px">
    <div class="card">
      <div class="stats">
        <div class="stat"><span class="k">Typical house today ${srcBadge(s.hs)}</span><span class="v">${aud(Math.round((s.h * lf) / 1000) * 1000, { compact: true })}</span><span class="s">${off.house ? `${esc(off.house.period)} median ${aud(off.house.median, { compact: true })}${off.house.sales ? `, ${Math.round(off.house.sales)} sales` : ''}, moved to today` : 'Modelled, moved to today with the index'}</span></div>
        <div class="stat"><span class="k">Typical unit today ${srcBadge(s.us)}</span><span class="v">${aud(Math.round((s.u * lf) / 1000) * 1000, { compact: true })}</span><span class="s">${off.unit ? `${esc(off.unit.period)} median ${aud(off.unit.median, { compact: true })}, moved to today` : 'Modelled, moved to today with the index'}</span></div>
        <div class="stat"><span class="k">Weekly rent (house / unit)</span><span class="v">${aud(s.rh)} <span class="muted" style="font-size:.6em">/ ${aud(s.ru)}</span></span><span class="s">${d.rs === 'NSW postcode' ? `NSW bond data, ${esc(off.rent?.period || '')}` : 'Modelled: official NSW bond rents and Census rents, scaled to today'}</span></div>
        <div class="stat"><span class="k">Gross yield (${ic.type})</span><span class="v">${pct(ic.yld, 2)}</span><span class="s">${R.name} average ${pct(R.yield, 1)}</span></div>
        <div class="stat"><span class="k">12-month change</span><span class="v ${g12 >= 0 ? 'up' : 'down'}">${pct(g12, 1, true)}</span><span class="s">${esc(s.g1p || '')}</span></div>
        <div class="stat"><span class="k">${d.cagr ? `Houses a year ${esc(d.cagrY || '')}` : 'Price to income'}</span><span class="v">${d.cagr ? pct(d.cagr, 1, true) : `${s.pti ?? '—'}×`}</span><span class="s">${d.cagr ? 'Valuer-General Victoria' : 'price ÷ household income'}</span></div>
      </div>
    </div>
    <div class="card" style="display:flex;gap:16px;align-items:center">
      ${scoreBadge(scores.balanced, true)}
      <div><div class="eyebrow" style="margin:0">Keystone Score</div><div style="font-family:var(--serif);font-size:20px;font-weight:600">${scores.balanced >= 75 ? 'Top-tier fundamentals' : scores.balanced >= 60 ? 'Above average' : scores.balanced >= 45 ? 'Average' : 'Below average'}</div>
      <div class="note">Growth ${scores.growth} · Cash flow ${scores.cashflow} · First home ${scores.firsthome}</div></div>
    </div>
  </div>

  <section class="section grid g2">
    <div class="card">
      <div class="card-head"><h3>How prices have moved</h3><span class="note">${mv.kind === 'daily' ? `<span class="badge-live">Daily</span> ${date(mv.date)}` : `Month-end ${esc(String(mv.date || ''))}`}</span></div>
      <div class="stats" style="grid-template-columns:repeat(3,1fr)">
        ${[['Day', mv.day], ['Week', mv.week], ['Month', mv.month], ['Quarter', mv.quarter], ['Year to date', mv.ytd], ['12 months', s.g1]].map(([k, v]) => `<div class="stat"><span class="k">${k}</span><span class="v ${v > 0 ? 'up' : v < 0 ? 'down' : ''}" style="font-size:20px">${v === null || v === undefined ? '<span class="faint">—</span>' : pct(v, 2, true)}</span></div>`).join('')}
      </div>
      <div class="hr"></div>
      <div class="kv"><span>Index change since the 31 Aug estimates</span><span class="${lf >= 1 ? 'up' : 'down'}">${pct((lf - 1) * 100, 2, true)} (${aud(Math.round(ic.price * (lf - 1)), { compact: true })} on a typical ${ic.type}, already in the prices above)</span></div>
      <p class="fine" style="margin-top:8px">Short-term moves follow the ${esc(R.name || '')} ${mv.kind === 'daily' ? 'Cotality daily index' : 'monthly index'}${s.g1s === 'region' ? '' : '; the 12-month figure is from official suburb sales'}. Individual suburbs can move differently.</p>
    </div>
    <div class="card">
      <h3>New building in the area</h3>
      ${cApp?.fy ? `<div class="kv">
        <span>${esc(s.lga)} council, new dwellings approved ${esc(cApp.fy.period)}</span><span>${num(cApp.fy.total)}</span>
        <span>Houses / apartments &amp; townhouses</span><span>${num(cApp.fy.houses)} / ${num(cApp.fy.other)}</span>
        <span>As % of existing homes (supply growth)</span><span class="${(s.sup ?? 0) > 2 ? 'warn' : ''}">${pct(s.sup, 2)}</span>
        <span>This financial year to date</span><span>${num(cApp.ytd?.total)}</span>
        ${sApp?.fy ? `<span>Local area (SA2: ${esc(sApp.name)})</span><span>${num(sApp.fy.total)} approved</span>` : ''}
        <span>Value of new residential building</span><span>${aud((cApp.fy.value || 0) * 1000, { compact: true })}</span>
      </div>
      <p class="note" style="margin-top:10px">${(s.sup ?? 0) > 2.5 ? 'Heavy new supply: rents and resale prices for similar stock (especially apartments) can be held back while it is absorbed.' : (s.sup ?? 0) < 0.8 ? 'Very little new housing is being approved here, which supports prices and rents if demand keeps growing.' : 'A moderate amount of new housing is coming, broadly in line with population growth.'} <a href="/new-builds" data-link>New builds across Australia →</a></p>` : '<p class="note">No building approvals data for this council.</p>'}
      <p class="fine">ABS Building Approvals (${esc(approvals?.release || '')}).</p>
    </div>
  </section>

  <section class="section grid g2">
    <div class="card">
      <div class="eyebrow">Investment case</div>
      <h2 style="font-size:24px">${esc(ic.headline)}</h2>
      ${ic.pros.length ? `<h3 style="font-size:16px;margin-top:14px">Why invest</h3><ul class="pros">${ic.pros.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      ${ic.cons.length ? `<h3 style="font-size:16px;margin-top:14px">What to watch</h3><ul class="cons">${ic.cons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
      <h3 style="font-size:16px;margin-top:14px">Best suited to</h3><ul class="note" style="margin:6px 0 0;padding-left:18px">${ic.suits.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="card">
      <div class="card-head"><h3>What a typical ${ic.type} here would do for you</h3><span class="pill">Deal rating ${qv.grade}</span></div>
      <div class="verdict"><div class="grade grade-${qv.grade}">${qv.grade}</div><div><div style="font-family:var(--serif);font-size:22px;font-weight:600">${qv.label}</div><p class="note" style="margin:4px 0 0">${aud(ic.price)} purchase, 20% deposit, ${pct(quick.input.ratePct, 2)} investor P&amp;I loan, $120k salary, ${quick.input.growth}% a year growth, sold after 10 years.</p></div></div>
      ${scoreVsDeal(scores.balanced, qv.grade)}
      <div class="kv" style="margin-top:14px">
        <span>Cash needed up front</span><span>${aud(quick.upfront.total)}</span>
        <span>Stamp duty (investor)</span><span>${aud(quick.upfront.duty)}</span>
        <span>Weekly cost, year 1 (after tax)</span><span class="${quick.summary.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${aud(quick.summary.weeklyCashAfterTax)}</span>
        <span>Weekly cost, year 3 (after tax)</span><span class="${quick.rows[2].cashAfterTax >= 0 ? 'up' : 'down'}">${aud(quick.rows[2].cashAfterTax / 52)}</span>
        <span>After-tax return on your cash (IRR)</span><span>${pct(quick.summary.irr, 1)}</span>
        <span>Equity after 10 years</span><span>${aud(quick.summary.equityAtSale, { compact: true })}</span>
        <span>Net profit after tax and sale</span><span class="${quick.summary.totalProfit >= 0 ? 'up' : 'down'}">${aud(quick.summary.totalProfit, { compact: true })}</span>
      </div>
      <ul class="pros">${qv.reasons.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <ul class="cons">${qv.risks.slice(0, 3).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
      <a class="btn primary" href="${analyseUrl}" data-link style="margin-top:10px">Change the assumptions →</a>
    </div>
  </section>

  <section class="section grid g2">
    <div class="card">
      <h3>Score breakdown</h3>
      ${Object.keys(COMPONENT_NAMES).map((k) => `<div class="comp" title="${esc(COMPONENT_HELP[k])}"><span>${COMPONENT_NAMES[k]}</span>${bar(s.sc[k])}<b>${s.sc[k] ?? '—'}</b></div><div class="fine" style="margin:-4px 0 8px 130px">${esc(COMPONENT_HELP[k])}</div>`).join('')}
      <p class="fine">Each component is a percentile against every Australian suburb (100 = best). The overall score weights them by strategy.</p>
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

  <section class="section grid g2">
    <div class="card">
      <h3>People and housing</h3>
      <div class="kv">
        <span>Population (2021 Census)</span><span>${num(s.pop)}</span>
        <span>Population change 2016-2021</span><span class="${(s.pg5 ?? 0) >= 0 ? 'up' : 'down'}">${pct(s.pg5, 1, true)}</span>
        <span>Median household income</span><span>${aud(d.inc)}/wk (${aud(d.inc * 52, { compact: true })}/yr)</span>
        <span>Household income change 2016-2021</span><span>${pct(d.ig5, 1, true)}</span>
        <span>Median age</span><span>${d.age ?? '—'}</span>
        <span>Unemployment</span><span>${pct(d.une, 1)}</span>
        <span>Homes rented</span><span>${pct(d['rent%'], 1)}</span>
        <span>Owned outright</span><span>${pct(d['own%'], 1)}</span>
        <span>Social housing</span><span>${pct(d['soc%'], 1)}</span>
        <span>Separate houses / flats</span><span>${pct(d['hou%'], 0)} / ${pct(d['fla%'], 0)}</span>
        <span>Census rent change 2016-2021</span><span>${pct(d.rg5, 1, true)}</span>
      </div>
      <p class="fine" style="margin-top:8px">ABS Census 2016 and 2021, Suburbs and Localities.</p>
    </div>
    <div class="card">
      <h3>${esc(name)} vs ${esc(R.name || 'region')}</h3>
      <div class="tbl-wrap"><table><thead><tr><th></th><th class="n">${esc(name)}</th><th class="n">${esc(R.name || '')}</th></tr></thead><tbody>
        <tr><td>Typical house today</td><td class="n">${aud(s.h * lf, { compact: true })}</td><td class="n">${aud((R.medianHouse || R.medianDwelling) * lf, { compact: true })}</td></tr>
        <tr><td>Typical unit today</td><td class="n">${aud(s.u * lf, { compact: true })}</td><td class="n">${R.medianUnit ? aud(R.medianUnit * lf, { compact: true }) : '—'}</td></tr>
        <tr><td>Typical house rent</td><td class="n">${aud(s.rh)}</td><td class="n">${aud(Math.round(rRent / 5) * 5)}</td></tr>
        <tr><td>Gross yield</td><td class="n">${pct(ic.yld, 2)}</td><td class="n">${pct(R.yield, 1)}</td></tr>
        <tr><td>12-month change</td><td class="n">${growth12(s, { suffix: '', short: true })}</td><td class="n">${pct(rYear, 1, true)}</td></tr>
        <tr><td>Vacancy (city-wide, SQM)</td><td class="n">—</td><td class="n">${pct(R.vacancy, 1)}</td></tr>
        <tr><td>Days on market</td><td class="n">—</td><td class="n">${R.dom ?? '—'}</td></tr>
      </tbody></table></div>
      ${Object.keys(off).length ? `<h3 style="font-size:16px;margin-top:16px">Official data</h3><div class="kv">${off.house ? `<span>House median (${esc(off.house.period)})</span><span>${aud(off.house.median)}</span>` : ''}${off.house?.medianYearAgo ? `<span>A year earlier</span><span>${aud(off.house.medianYearAgo)}</span>` : ''}${off.house?.annualPct !== undefined ? `<span>Annual change</span><span>${pct(off.house.annualPct, 1, true)}</span>` : ''}${off.house?.sales ? `<span>Sales in period</span><span>${Math.round(off.house.sales)}</span>` : ''}${off.unit ? `<span>Unit median (${esc(off.unit.period)})</span><span>${aud(off.unit.median)}</span>` : ''}${off.rent?.all ? `<span>Median new bond rent (${esc(off.rent.period)})</span><span>${aud(off.rent.all)}/wk</span>` : ''}${off.rent?.bonds ? `<span>New bonds lodged</span><span>${num(off.rent.bonds)}</span>` : ''}</div><p class="fine" style="margin-top:6px">${off.house?.source === 'NSW' || off.rent ? 'NSW figures cover the whole postcode. ' : ''}Sources: ${[off.house?.source, off.unit?.source, off.rent?.source].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map((x) => ({ VIC: 'Valuer-General Victoria', SA: 'Land Services SA', NSW: 'NSW DCJ Rent and Sales Report' })[x]).join(', ')}.</p>` : ''}
    </div>
  </section>

  <section class="section card">
    <div class="card-head"><h3>Property for sale and rent in ${esc(name)}</h3><span class="note">Opens the listing sites filtered to this suburb</span></div>
    <div class="row">
      <a class="btn" href="${links.reaBuy}" target="_blank" rel="noopener">For sale · realestate.com.au</a>
      <a class="btn" href="${links.domainBuy}" target="_blank" rel="noopener">For sale · Domain</a>
      <a class="btn" href="${links.reaSold}" target="_blank" rel="noopener">Recently sold</a>
      <a class="btn" href="${links.domainSold}" target="_blank" rel="noopener">Sold · Domain</a>
      <a class="btn" href="${links.reaRent}" target="_blank" rel="noopener">For rent</a>
      <a class="btn ghost" href="${links.domainProfile}" target="_blank" rel="noopener">Domain suburb profile</a>
    </div>
    <div id="livemap" class="map short" hidden style="margin-top:16px"></div>
    <div id="live" style="margin-top:16px"></div>
  </section>

  <section class="section grid g2">
    <div class="card">
      <h3>Nearby suburbs</h3>
      <div class="tbl-wrap"><table><thead><tr><th>Suburb</th><th class="n">km</th><th class="n">Score</th><th class="n">Price</th><th class="n">Yield</th></tr></thead><tbody>
      ${near.map((x) => `<tr><td><a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a> <span class="muted">${x.pc || ''}</span></td><td class="n">${x.km.toFixed(1)}</td><td class="n">${scoreBadge(suburbScore(x.sc))}</td><td class="n">${aud(x.pt === 'u' ? x.u : x.h, { compact: true })}</td><td class="n">${pct(x.y, 1)}</td></tr>`).join('')}
      </tbody></table></div>
      ${samePc.length ? `<p class="note" style="margin-top:10px">Also in postcode ${pcLink}: ${samePc.map((x) => `<a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a>`).join(', ')}</p>` : ''}
    </div>
    <div class="card"><h3>Map</h3><div id="smap" class="map short"></div></div>
  </section>

  <section class="section">
    <p class="fine">How these numbers are made: prices marked Estimate come from Keystone's model, which is trained on ${idx.meta.model.trainN.toLocaleString()} official suburb medians and anchored to Cotality's current ${esc(R.name || '')} median. In held-out tests it was within 20% of the official median for about ${Math.round(idx.meta.model.holdout?.VIC?.within20pct || 70)}% of suburbs. Treat it as a starting point and check recent sales before you make an offer. <a href="/methodology" data-link>Full methodology</a>. Suburb data built ${date(idx.meta.built)}.</p>
  </section>`;

  main.querySelector('#print').addEventListener('click', () => window.print());
  main.querySelector('#watch').addEventListener('click', (e) => {
    const on = toggleWatch(s.id);
    e.currentTarget.classList.toggle('on', on);
    e.currentTarget.textContent = on ? '★ On watchlist' : '☆ Watch';
  });
  wireCharts(main, (v) => aud(v, { compact: true }), (v) => new Date(v).getFullYear());
  liveListings(main.querySelector('#live'), s, { compact: true, mapEl: main.querySelector('#livemap') });

  let map = null;
  const drawMap = () => {
    if (!window.L) return setTimeout(drawMap, 300);
    map = L.map('smap', { scrollWheelZoom: false }).setView([s.lat, s.lng], 12);
    baseTiles().addTo(map);
    const css = getComputedStyle(document.documentElement);
    const col = (v) => css.getPropertyValue(v >= 75 ? '--sc-a' : v >= 60 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
    L.circleMarker([s.lat, s.lng], { radius: 10, color: '#000', weight: 2, fillColor: col(scores.balanced), fillOpacity: 1 }).addTo(map).bindTooltip(name, { permanent: true, direction: 'top', offset: [0, -8] });
    near.forEach((x) => {
      const v = suburbScore(x.sc);
      L.circleMarker([x.lat, x.lng], { radius: 6, weight: 1, color: '#0006', fillColor: col(v), fillOpacity: 0.9 }).addTo(map).bindPopup(`<a href="${suburbUrl(x)}" data-link>${esc(cleanName(x.n))}</a><br>Score ${v} · ${aud(x.pt === 'u' ? x.u : x.h, { compact: true })}`);
    });
  };
  drawMap();
  return { destroy: () => map?.remove() };
}
