import { esc, aud, pct, date, ago, setMeta, lineChart, wireCharts, hbars } from '../ui.js';
import { load, loadStaleFirst, typicalRate } from '../data.js';
import { lenderName } from '../rate-rules.js';
import { nextDecision } from '../ratewatch.js';
import { RBA_DECISIONS } from '../rules.js';

export default async function markets(main) {
  setMeta({ title: 'Australian housing market update', description: 'Which way prices are moving in each capital, the RBA cash rate, rates week by week, and the housing headlines that matter for your numbers.' });
  const { stored: newsStored, live: newsLive } = loadStaleFirst('news');
  const [market, rba, rs, weekly, news0] = await Promise.all([load('market'), load('rba'), load('rates-summary'), load('weekly').catch(() => []), newsStored.catch(() => ({ items: [] }))]);
  let news = news0;
  const R = market.regions;
  const caps = Object.entries(R).filter(([, r]) => r.capital);
  const abs = market.abs;
  const since = (arr, from) => arr.filter(([d]) => d >= from).map(([d, v]) => [Date.parse(d), v]);
  const cash = rba.cashRate.decisions.map((d) => [Date.parse(d.date), d.rate]);
  cash.push([Date.now(), rba.cashRate.current]);
  const bab6 = rba.market.bab6m;
  // compare bank bills with the cash rate on the day they were read, not today's (a rise since then is already priced in)
  const cashAt = [...rba.cashRate.decisions].reverse().find((d) => d.date <= (rba.market.asAt || ''))?.rate ?? rba.cashRate.current;
  const gap = bab6 - cashAt;
  const expect = gap > 0.2 ? 'higher' : gap < -0.2 ? 'lower' : 'about the same';

  main.innerHTML = `
  <div class="page-head">
    <div class="eyebrow">Markets</div>
    <h1>The Australian housing market</h1>
    <p>Where values, rents and rates are heading, city by city. Price direction is from Cotality's month-end Home Value Index; RBA figures and lender rates are checked several times a day. Full index results are published by <a href="https://www.cotality.com/au/our-data/indices" target="_blank" rel="noopener">Cotality</a>; Ownaroo shows the headline changes only.</p>
  </div>

  <div class="grid g4">
    <div class="card"><div class="stat"><span class="k">National median dwelling</span><span class="v">${aud(Math.round(market.national.medianDwelling / 1000) * 1000, { compact: true })}</span><span class="s"><span class="${market.national.annualPct >= 0 ? 'up' : 'down'}">${pct(market.national.annualPct, 1, true)}</span> y/y · ${pct(market.national.fromPeakPct, 1)} from peak</span></div></div>
    <div class="card"><div class="stat"><span class="k">RBA cash rate</span><span class="v">${pct(rba.cashRate.current, 2)}</span><span class="s">${rba.cashRate.published && rba.cashRate.published > rba.cashRate.lastChange ? `Held on ${date(rba.cashRate.published)}; last ${(rba.cashRate.decisions?.at(-1)?.change || 0) > 0 ? 'raised' : 'cut'} with effect from ${date(rba.cashRate.lastChange)}` : `${(rba.cashRate.decisions?.at(-1)?.change || 0) > 0 ? 'Raised' : 'Cut'} ${(() => { const d = RBA_DECISIONS.filter((x) => x < rba.cashRate.lastChange).at(-1); return d ? `${date(d)} (takes effect ${date(rba.cashRate.lastChange)})` : `with effect from ${date(rba.cashRate.lastChange)}`; })()}`} ${nextDecision() ? ` · next decision ${date(nextDecision())}` : ''}</span></div></div>
    <div class="card"><div class="stat"><span class="k">Average new investor variable (RBA, ${new Date(`${rba.actual.newInvVariable.at(-1)?.[0]}T00:00:00`).toLocaleDateString('en-AU', { month: 'long' })})</span><span class="v">${pct(rba.actual.newInvVariable.at(-1)?.[1], 2)}</span><span class="s">Lowest advertised open to anyone ${pct((rs.best.INV_PI_variable_national?.[0] || rs.best.INV_PI_variable?.[0])?.rate, 2)} (the figure in the ticker)${rs.best.INV_PI_variable?.[0] && rs.best.INV_PI_variable[0].rate < (rs.best.INV_PI_variable_national?.[0]?.rate ?? 99) ? `, or ${pct(rs.best.INV_PI_variable[0].rate, 2)} from a lender with eligibility rules` : ''}</span></div></div>
    <div class="card"><div class="stat"><span class="k">National rent growth</span><span class="v">${pct(market.national.rentAnnualPct, 1, true)}</span><span class="s">Vacancy ${pct(market.national.vacancySQM, 1)} (SQM)</span></div></div>
  </div>

  <section class="section">
    <h2>Which way prices are moving in each capital</h2>
    <div class="grid g2">
      <div class="card"><h3>Last 3 months: the direction now</h3>${hbars(caps.map(([, r]) => ({ label: r.name, value: r.quarterPct })).sort((a, b) => b.value - a.value), { fmt: (v) => pct(v, 1, true), signedScale: true })}</div>
      <div class="card"><h3>Last 12 months</h3>${hbars(caps.map(([, r]) => ({ label: r.name, value: r.annualPct })).sort((a, b) => b.value - a.value), { fmt: (v) => pct(v, 1, true), signedScale: true })}</div>
    </div>
    <p class="fine" style="margin-top:8px">Change in the value of all dwellings, Cotality Home Value Index, month-end ${esc(market.indexMonth || '')}. Cotality publishes the full results, with medians, regional markets and rents, <a href="https://www.cotality.com/au/our-data/indices" target="_blank" rel="noopener">on its website ↗</a>. Suburb-level figures are on each <a href="/suburbs" data-link>suburb report</a>.</p>
  </section>

  <section class="section">
    <div class="card">
      <h3>Supply and demand fundamentals</h3>
      <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Mean dwelling price (ABS)</th><th class="n">Dwellings</th><th class="n">Population growth</th></tr></thead><tbody>
      ${Object.keys(abs.meanPrice).map((s) => `<tr><td>${s}</td><td class="n">${aud(abs.meanPrice[s], { compact: true })}</td><td class="n">${(abs.dwellingsThousands[s] * 1000).toLocaleString()}</td><td class="n">${pct(abs.populationGrowthPct[s], 1)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">ABS Total Value of Dwellings, ${esc(abs.dwellingsQuarter)}; ABS population, ${esc(abs.populationPeriod)}. Total housing stock is worth ${aud(abs.totalValueBn * 1e9, { compact: true })}.</p>
    </div>
  </section>

  <section class="section grid g2">
    <div class="card">
      <div class="card-head"><h3>RBA cash rate since 2000</h3><span class="pill">Now ${pct(rba.cashRate.current, 2)}</span></div>
      ${lineChart([{ name: 'Cash rate target', points: cash }], { height: 240, yFmt: (v) => `${v}%`, area: true, zero: true })}
      <p class="note" style="margin-top:10px">On ${date(rba.market.asAt)} six-month bank bills were at ${pct(bab6, 2)} against a cash rate of ${pct(cashAt, 2)} (RBA F1.1, month-end), so markets were pricing a cash rate <b>${expect}</b> over the following six months${gap > 0.2 ? `, roughly ${Math.round(gap / 0.25)} rise${Math.round(gap / 0.25) === 1 ? '' : 's'} of 0.25 points` : ''}.${rba.cashRate.lastChange > (rba.market.asAt || '') ? ` The cash rate has since ${rba.cashRate.current > cashAt ? 'risen' : 'fallen'} to ${pct(rba.cashRate.current, 2)} (from ${date(rba.cashRate.lastChange)}), which uses up part of that.` : ''} This reading updates monthly; the ASX RBA Rate Tracker shows today's pricing.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Effective date</th><th class="n">Change</th><th class="n">Cash rate</th></tr></thead><tbody>
        ${rba.cashRate.decisions.slice(-8).reverse().map((d) => `<tr><td>${date(d.date)}</td><td class="n ${d.change > 0 ? 'down' : d.change < 0 ? 'up' : ''}">${d.change ? `${d.change > 0 ? '+' : ''}${d.change} bp` : '—'}</td><td class="n">${pct(d.rate, 2)}</td></tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="card">
      <h3>What borrowers actually pay</h3>
      ${lineChart(
        [
          { name: 'New investor variable', points: since(rba.actual.newInvVariable, '2015-01-01') },
          { name: 'New owner-occupier variable', points: since(rba.actual.newOOVariable, '2015-01-01') },
          { name: 'New investor fixed ≤3y', points: since(rba.actual.newInvFixed, '2019-01-01'), dash: true },
          { name: 'Investor standard variable (headline)', points: since(rba.indicator.invStandardVariable, '2015-01-01'), dash: true },
        ],
        { height: 260, yFmt: (v) => `${v}%` },
      )}
      <p class="note" style="margin-top:10px">Banks' "standard variable" headline rates sit far above what new borrowers really pay (RBA F5 vs F6, ${date(rba.actual.newInvVariable.at(-1)?.[0])}). The gap is ${(rba.indicator.invStandardVariable.at(-1)[1] - rba.actual.newInvVariable.at(-1)[1]).toFixed(2)} percentage points, which is why rates differ so much between lenders and between new and existing customers.</p>
    </div>
  </section>

  <section class="section grid g3">
    <div class="card"><h3>Lending</h3><div class="kv">
      <span>Investor new loans (${esc(abs.lending.period)})</span><span>${aud(abs.lending.investorBn * 1e9, { compact: true })}</span>
      <span>Investor, year on year</span><span class="${abs.lending.investorYoY >= 0 ? 'up' : 'down'}">${pct(abs.lending.investorYoY, 1, true)}</span>
      <span>Investor, quarter on quarter</span><span class="${abs.lending.investorQoQ >= 0 ? 'up' : 'down'}">${pct(abs.lending.investorQoQ, 1, true)}</span>
      <span>Owner-occupier new loans</span><span>${aud(abs.lending.ownerOccBn * 1e9, { compact: true })}</span>
      <span>First home buyers</span><span>${aud(abs.lending.fhbBn * 1e9, { compact: true })} (${pct(abs.lending.fhbYoY, 1, true)})</span>
    </div><p class="fine" style="margin-top:8px">ABS Lending Indicators (quarterly).</p></div>
    <div class="card"><h3>Economy</h3><div class="kv">
      <span>CPI inflation (${esc(abs.cpi.period)})</span><span>${pct(abs.cpi.annualPct, 1)}</span>
      <span>Trimmed mean</span><span>${pct(abs.cpi.trimmedMean, 1)}</span>
      <span>Housing CPI</span><span>${pct(abs.cpi.housingPct, 1)}</span>
      <span>Unemployment (${esc(abs.unemployment.period)})</span><span>${pct(abs.unemployment.rate, 1)}</span>
      <span>Population</span><span>${(abs.population / 1e6).toFixed(2)}m (+${pct(abs.populationGrowthPct.AUS, 1)})</span>
    </div><p class="fine" style="margin-top:8px">ABS monthly CPI and Labour Force; ABS population.</p></div>
    <div class="card"><h3>Reading the market</h3><p class="note">${commentary(market, rba)}</p></div>
  </section>

  <section class="section" id="weekly"><h2>Rates week by week</h2>
    <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Week of</th><th class="n">Cash rate</th><th class="n">Lowest owner-occupier variable</th><th class="n">Lowest investor variable</th></tr></thead><tbody>${[...weekly].reverse().slice(0, 12).map((x, i) => `<tr><td>${date(x.week)}${i === 0 ? ` <span class="fine">(latest snapshot, ${date(x.updated)})</span>` : ''}</td><td class="n">${pct(x.cash, 2)}${i === 0 && x.cash !== rba.cashRate.current ? ` <span class="fine">now ${pct(rba.cashRate.current, 2)}</span>` : ''}</td><td class="n">${pct(x.bestOO?.rate, 2)}${x.bestOO?.lender ? ` <span class="fine">${esc(lenderName(x.bestOO.lender))}</span>` : ''}</td><td class="n">${pct(x.bestInv?.rate, 2)}</td></tr>`).join('')}</tbody></table></div>
    <p class="fine" style="margin-top:8px">A snapshot is saved each week from the lenders' own feeds and the RBA; each row shows the rates on the day it was taken${weekly.at(-1)?.cash !== rba.cashRate.current ? `, so the latest row is from before the ${rba.cashRate.current > weekly.at(-1)?.cash ? 'rise' : 'cut'} to ${pct(rba.cashRate.current, 2)} that took effect ${date(rba.cashRate.lastChange)}` : ''}. <a href="/rates" data-link>Today's rates →</a></p></div>
  </section>

  <section class="section" id="news"><div class="spread"><h2>Housing news</h2><span class="note" id="n-when"></span></div>
    <div class="seg" id="nt" role="group" aria-label="Filter headlines">${['All', 'Rates', 'Prices', 'Rents', 'Policy', 'Supply', 'Lending'].map((t, i) => `<button type="button" data-t="${t}" class="${i ? '' : 'on'}" aria-pressed="${!i}">${t}</button>`).join('')}</div>
    <div class="card" style="margin-top:10px"><div class="news-list" id="nl"></div></div>
    <p class="fine" style="margin-top:8px">Headlines only, linking straight to the publisher. Sport, celebrity and crime stories are left out.</p>
  </section>

  <section class="section"><h3>Sources</h3><ul class="note">${market.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}<li><a href="https://www.rba.gov.au/statistics/tables/" target="_blank" rel="noopener">RBA statistical tables A2, F1.1, F5, F6</a> (auto-updated ${date(rba.updated)})</li></ul>
  <p class="fine">${market.caveats.map(esc).join(' ')}</p></section>`;
  wireCharts(main, (v) => `${v.toFixed(2)}%`);
  // headlines: straight publisher links only, with a pointer to the tool that turns each kind of story into your numbers
  const CTA = { Rates: ['What a rate change does to your repayment', '/rates'], Lending: ['How lenders test what you can borrow', '/borrowing'], Prices: ['What you can comfortably afford now', '/afford'], Rents: ['Renting versus buying for you', '/first-home#rvb'], Policy: ['The 2026 tax changes in dollars', '/analyse'], Supply: ['Where new homes are being approved', '/new-builds'] };
  let tag = 'All';
  const drawNews = () => {
    const items = (news.items || []).filter((x) => !/news\.google\./.test(x.link) && (tag === 'All' || x.tags.includes(tag))).slice(0, 12);
    const when = main.querySelector('#n-when');
    if (when) when.textContent = news.updated ? `Updated ${ago(news.updated)}` : '';
    main.querySelector('#nl').innerHTML = items.length
      ? items.map((x) => { const c = CTA[x.tags.find((t) => CTA[t])]; return `<div class="news-item"><div><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta"><span>${esc(x.source)}</span><span>·</span><span>${ago(x.date)}</span>${c ? `<span>·</span><a class="news-cta" href="${c[1]}" data-link>${c[0]} →</a>` : ''}</div></div></div>`; }).join('')
      : '<p class="empty">No headlines in this category right now.</p>';
  };
  main.querySelector('#nt').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    tag = b.dataset.t;
    main.querySelectorAll('#nt button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
    drawNews();
  });
  drawNews();
  newsLive.then((d) => {
    if (d?.items?.length && main.isConnected && Date.parse(d.updated) > Date.parse(news.updated || 0)) {
      news = d;
      drawNews();
    }
  });

}

/** Plain-English description of the current numbers, generated from the data. Describes what moved; never says what to do. */
export function commentary(market, rba) {
  const caps = Object.values(market.regions).filter((r) => r.capital);
  const falling = caps.filter((r) => r.quarterPct < 0).map((r) => r.name);
  const upYear = caps.filter((r) => r.annualPct > 5).map((r) => r.name);
  const downYear = caps.filter((r) => r.annualPct < 0).map((r) => r.name);
  const list = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a.at(-1)}`);
  const n = market.national;
  const decisions = rba.cashRate.decisions;
  const hikes = decisions.filter((d) => d.date >= `${new Date().getFullYear()}-01-01` && d.change > 0).length;
  const parts = [];
  if (downYear.length) parts.push(`${list(downYear)} ${downYear.length > 1 ? 'are' : 'is'} lower than a year ago`);
  if (upYear.length) parts.push(`${list(upYear)} ${upYear.length > 1 ? 'are' : 'is'} still up more than 5% over the year`);
  let s = `${parts.join(', while ')}.`;
  if (falling.length >= 5) s += ` Values eased over the last three months in ${falling.length} of 8 capitals${hikes ? ` after ${hikes} RBA rate rise${hikes > 1 ? 's' : ''} this year` : ''}.`;
  if (n.rentAnnualPct > n.annualPct) s += ` Nationally, rents (${pct(n.rentAnnualPct, 1, true)}) have risen faster than values (${pct(n.annualPct, 1, true)}) over the year, so gross yields have risen.`;
  const oo = rba.actual?.newOOVariable?.at?.(-1);
  const t = typicalRate(rba, 'OO');
  s += ` The cash rate is ${pct(rba.cashRate.current, 2)}${oo ? `; the average variable rate on new owner-occupier loans was ${pct(oo[1], 2)} in ${new Date(`${oo[0]}T00:00:00`).toLocaleDateString('en-AU', { month: 'long' })} (RBA)${t.adj ? `, so new loans are now about ${pct(t.rate, 1)} after the latest ${t.adj > 0 ? 'rise' : 'cut'}` : ''}` : ''}.`;
  return s;
}
