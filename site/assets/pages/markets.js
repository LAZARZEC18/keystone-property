import { cityCard, CITY_ARTICLE } from './home.js';
import { wikiPhoto } from '../photos.js';
import { esc, aud, pct, date, setMeta, lineChart, wireCharts, hbars } from '../ui.js';
import { load } from '../data.js';

export default async function markets(main) {
  setMeta({ title: 'Australian housing market dashboard', description: 'Capital city and regional home values, rents, yields, vacancy, the RBA cash rate and mortgage rates.' });
  const [market, rba, rs] = await Promise.all([load('market'), load('rba'), load('rates-summary')]);
  const R = market.regions;
  const caps = Object.entries(R).filter(([, r]) => r.capital);
  const all = Object.entries(R);
  const abs = market.abs;
  const since = (arr, from) => arr.filter(([d]) => d >= from).map(([d, v]) => [Date.parse(d), v]);
  const cash = rba.cashRate.decisions.map((d) => [Date.parse(d.date), d.rate]);
  cash.push([Date.now(), rba.cashRate.current]);
  const bab6 = rba.market.bab6m;
  const expect = bab6 > rba.cashRate.current + 0.25 ? 'higher' : bab6 < rba.cashRate.current - 0.25 ? 'lower' : 'about the same';

  main.innerHTML = `
  <div class="page-head">
    <div class="eyebrow">Markets</div>
    <h1>The Australian housing market</h1>
    <p>Where values, rents and rates are heading, city by city. Index figures are Cotality's August 2026 Home Value Index. RBA figures are checked about every hour and lender rates several times a day.</p>
  </div>

  <div class="grid g4">
    <div class="card"><div class="stat"><span class="k">National median dwelling</span><span class="v">${aud(market.national.medianDwelling)}</span><span class="s"><span class="${market.national.annualPct >= 0 ? 'up' : 'down'}">${pct(market.national.annualPct, 1, true)}</span> y/y · ${pct(market.national.fromPeakPct, 1)} from peak</span></div></div>
    <div class="card"><div class="stat"><span class="k">RBA cash rate</span><span class="v">${pct(rba.cashRate.current, 2)}</span><span class="s">Last move ${date(rba.cashRate.lastChange)} · next meeting ${date(market.cashRate.nextMeeting)}</span></div></div>
    <div class="card"><div class="stat"><span class="k">Median new investor variable (RBA)</span><span class="v">${pct(rba.actual.newInvVariable.at(-1)?.[1], 2)}</span><span class="s">Lowest advertised ${pct(rs.best.INV_PI_variable?.[0]?.rate, 2)}</span></div></div>
    <div class="card"><div class="stat"><span class="k">National rent growth</span><span class="v">${pct(market.national.rentAnnualPct, 1, true)}</span><span class="s">Vacancy ${pct(market.national.vacancySQM, 1)} (SQM)</span></div></div>
  </div>

  <section class="section"><div class="city-grid" id="m-cities">${Object.entries(market.regions).filter(([, r]) => r.capital).map(([code, r]) => cityCard(code, r, null)).join('')}</div></section>

  <section class="section">
    <h2>Values and momentum by market</h2>
    <div class="grid g2">
      <div class="card"><h3>Last 3 months: where prices are heading now</h3>${hbars(all.map(([, r]) => ({ label: r.name, value: r.quarterPct })).sort((a, b) => b.value - a.value), { fmt: (v) => pct(v, 1, true), signedScale: true })}<h3 style="margin-top:16px">Last 12 months</h3>${hbars(all.map(([, r]) => ({ label: r.name, value: r.annualPct })).sort((a, b) => b.value - a.value), { fmt: (v) => pct(v, 1, true), signedScale: true })}</div>
      <div class="card"><h3>Gross rental yield</h3>${hbars(all.map(([, r]) => ({ label: r.name, value: r.yield })).sort((a, b) => b.value - a.value), { fmt: (v) => pct(v, 1) })}</div>
    </div>
    <div class="tbl-wrap" style="margin-top:16px"><table>
      <thead><tr><th>Market</th><th class="n">Median dwelling</th><th class="n">House</th><th class="n">Unit</th><th class="n">Month to Aug</th><th class="n">Quarter to Aug</th><th class="n">Year to Aug</th><th class="n">House yield</th><th class="n">Unit yield</th><th class="n">Advertised rent, house (SQM)</th><th class="n">Advertised rent, unit (SQM)</th><th class="n">Vacancy</th><th class="n">DOM</th><th class="n">DOM yr ago</th></tr></thead>
      <tbody>${all
        .map(
          ([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${r.name}</a></td><td class="n">${aud(r.medianDwelling, { compact: true })}</td><td class="n">${aud(r.medianHouse, { compact: true })}</td><td class="n">${aud(r.medianUnit, { compact: true })}</td>${['monthPct', 'quarterPct', 'annualPct'].map((k) => `<td class="n ${r[k] >= 0 ? 'up' : 'down'}">${pct(r[k], 1, true)}</td>`).join('')}<td class="n">${pct(r.houseYield ?? r.yield, 1)}</td><td class="n">${pct(r.unitYield, 1)}</td><td class="n">${aud(r.rentHouse)}</td><td class="n">${aud(r.rentUnit)}</td><td class="n">${pct(r.vacancy, 1)}</td><td class="n">${r.dom ?? '—'}</td><td class="n">${r.domYearAgo ?? '—'}</td></tr>`,
        )
        .join('')}</tbody></table></div>
    <p class="fine" style="margin-top:8px">Cotality Home Value Index (medians, changes, yields, days on market), SQM Research (asking rents, week ending 4 Sep 2026, and vacancy, August 2026). Regional markets report all dwellings.</p>
  </section>

  <section class="section grid g2">
    <div class="card">
      <h3>PropTrack vs Cotality: two views of the same market</h3>
      <div class="tbl-wrap"><table><thead><tr><th>City</th><th class="n">Cotality</th><th class="n">PropTrack</th><th class="n">Cotality y/y</th><th class="n">PropTrack y/y</th></tr></thead><tbody>
      ${caps.map(([c, r]) => `<tr><td>${r.name}</td><td class="n">${aud(r.medianDwelling, { compact: true })}</td><td class="n">${aud(market.proptrack[c]?.medianDwelling, { compact: true })}</td><td class="n ${r.annualPct >= 0 ? 'up' : 'down'}">${pct(r.annualPct, 1, true)}</td><td class="n ${market.proptrack[c]?.annualPct >= 0 ? 'up' : 'down'}">${pct(market.proptrack[c]?.annualPct, 1, true)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="note" style="margin-top:10px">The two index providers use different methods, so their medians differ by a few per cent. Where both point the same way, the trend is solid.</p>
    </div>
    <div class="card">
      <h3>Supply and demand fundamentals</h3>
      <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Mean dwelling price (ABS)</th><th class="n">Dwellings</th><th class="n">Population growth</th></tr></thead><tbody>
      ${Object.keys(abs.meanPrice).map((s) => `<tr><td>${s}</td><td class="n">${aud(abs.meanPrice[s], { compact: true })}</td><td class="n">${(abs.dwellingsThousands[s] * 1000).toLocaleString()}</td><td class="n">${pct(abs.populationGrowthPct[s], 1)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">ABS Total Value of Dwellings (${esc(abs.dwellingsQuarter)}); ABS population, ${esc(abs.populationPeriod)}. Total housing stock is worth ${aud(abs.totalValueBn * 1e9, { compact: true })}.</p>
    </div>
  </section>

  <section class="section grid g2">
    <div class="card">
      <div class="card-head"><h3>RBA cash rate since 2000</h3><span class="pill">Now ${pct(rba.cashRate.current, 2)}</span></div>
      ${lineChart([{ name: 'Cash rate target', points: cash }], { height: 240, yFmt: (v) => `${v}%`, area: true, zero: true })}
      <p class="note" style="margin-top:10px">Six-month bank bills are trading at ${pct(bab6, 2)} (RBA F1.1, ${date(rba.market.asAt)}), which suggests markets expect the cash rate to be <b>${expect}</b> over the next six months.</p>
      <div class="tbl-wrap"><table><thead><tr><th>Decision</th><th class="n">Change</th><th class="n">Cash rate</th></tr></thead><tbody>
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
      <p class="note" style="margin-top:10px">Banks' "standard variable" headline rates sit far above what new borrowers really pay (RBA F5 vs F6, ${date(rba.actual.newInvVariable.at(-1)?.[0])}). Always negotiate, or refinance: the gap is ${pct(rba.indicator.invStandardVariable.at(-1)[1] - rba.actual.newInvVariable.at(-1)[1], 2)}.</p>
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

  <section class="section"><h3>Sources</h3><ul class="note">${market.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}<li><a href="https://www.rba.gov.au/statistics/tables/" target="_blank" rel="noopener">RBA statistical tables A2, F1.1, F5, F6</a> (auto-updated ${date(rba.updated)})</li></ul>
  <p class="fine">${market.caveats.map(esc).join(' ')}</p></section>`;
  wireCharts(main, (v) => `${v.toFixed(2)}%`);
  Object.entries(market.regions).filter(([, r]) => r.capital).forEach(([code, r]) => wikiPhoto(CITY_ARTICLE[code] || r.name).then((ph) => {
    const el = main.querySelector(`#m-cities [data-city="${code}"]`);
    if (ph && el) el.outerHTML = cityCard(code, r, ph);
  }));
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
  s += ` The cash rate is ${pct(rba.cashRate.current, 2)}${oo ? `; the average variable rate on new owner-occupier loans was ${pct(oo[1], 2)} in ${new Date(`${oo[0]}T00:00:00`).toLocaleDateString('en-AU', { month: 'long' })} (RBA)` : ''}.`;
  return s;
}
