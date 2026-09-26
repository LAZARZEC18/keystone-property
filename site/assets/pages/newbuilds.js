import { esc, aud, pct, num, date, setMeta, lineChart, wireCharts, sortable } from '../ui.js';
import { load, suburbs } from '../data.js';
import { STATES, RULES } from '../rules.js';
import { liveListings } from './listings.js';
import { attachSearch } from '../app.js';

export default async function newBuildsPage(main) {
  setMeta({ title: 'New homes and apartments: building approvals and new-build investing', description: 'Where new homes are being approved in Australia, council by council, updated with every ABS release, and why new builds matter under the 2026 tax rules.' });
  const [ap, { list }] = await Promise.all([load('approvals'), suburbs()]);
  const S = ap.states;
  const ser = (arr, from = '2015-01') => (arr || []).filter(([m]) => m >= from).map(([m, v]) => [Date.UTC(+m.slice(0, 4), +m.slice(5, 7) - 1, 1), v]);
  const last = (arr) => arr?.at(-1);
  const yoy = (arr) => {
    if (!arr || arr.length < 13) return null;
    const a = arr.at(-1)[1];
    const b = arr.at(-13)[1];
    return b ? (a / b - 1) * 100 : null;
  };
  const monthName = (ym) => (ym ? new Date(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 1)).toLocaleDateString('en-AU', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
  const sum12 = (arr) => (arr || []).slice(-12).reduce((t, [, v]) => t + v, 0);
  // council population from the suburb index (2021 Census)
  const pop = {};
  for (const s of list) pop[s.lgc] = (pop[s.lgc] || 0) + s.pop;
  const lgas = Object.entries(ap.lga)
    .filter(([code, v]) => v.fy && pop[code] > 2000)
    .map(([code, v]) => ({ code, name: v.name, s: v.s, fy: v.fy, ytd: v.ytd, per1000: (v.fy.total / pop[code]) * 1000, share: v.fy.total ? (v.fy.other / v.fy.total) * 100 : 0, pop: pop[code] }));
  const st = { sort: 'total', asc: false, state: '' };

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">New builds</div><h1>Where Australia is building</h1>
  <p>Every new home needs a building approval. Keystone reads the ABS figures for every council and SA2 as soon as they're released (latest: <b>${monthName(ap.latestMonth)}</b>), so you can see where supply is rising, which affects rents and prices, and find new builds that keep the 2026 tax advantages.</p></div>
  <div class="grid g4">
    <div class="card"><div class="stat"><span class="k">Dwellings approved, ${monthName(last(S.AUS.total)?.[0])} (seasonally adj.)</span><span class="v">${num(last(S.AUS.total)?.[1])}</span><span class="s">${pct(yoy(S.AUS.total), 1, true)} on a year ago</span></div></div>
    <div class="card"><div class="stat"><span class="k">Last 12 months, Australia</span><span class="v">${num(sum12(S.AUS.total))}</span><span class="s">vs the 240,000 a year needed for the national 1.2m homes target</span></div></div>
    <div class="card"><div class="stat"><span class="k">Houses, last month</span><span class="v">${num(last(S.AUS.houses)?.[1])}</span><span class="s">${pct(yoy(S.AUS.houses), 1, true)} y/y</span></div></div>
    <div class="card"><div class="stat"><span class="k">Apartments & townhouses, last month</span><span class="v">${num(last(S.AUS.other)?.[1])}</span><span class="s">${pct(yoy(S.AUS.other), 1, true)} y/y</span></div></div>
  </div>

  <section class="section grid g2">
    <div class="card"><h3>Monthly approvals, Australia</h3>${lineChart([{ name: 'Houses', points: ser(S.AUS.houses) }, { name: 'Apartments & townhouses', points: ser(S.AUS.other) }, { name: 'Total (trend)', points: ser(S.AUS.trend), dash: true }], { height: 250, yFmt: (v) => num(v) })}</div>
    <div class="card"><h3>By state, last 12 months</h3>
      <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Approved (12m)</th><th class="n">Latest month</th><th class="n">vs year ago</th></tr></thead><tbody>
      ${['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].filter((k) => S[k]?.total?.length).map((k) => `<tr><td>${STATES[k]}</td><td class="n">${num(sum12(S[k].total))}</td><td class="n">${num(last(S[k].total)[1])}</td><td class="n ${yoy(S[k].total) >= 0 ? 'up' : 'down'}">${pct(yoy(S[k].total), 1, true)}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">Seasonally adjusted where the ABS publishes it; trend for NT and ACT.</p>
    </div>
  </section>

  <section class="section">
    <div class="spread"><h2>New dwellings by council, ${esc(lgas[0]?.fy.period || '')}</h2>
    <label class="field">State<select id="nb-state"><option value="">All</option>${Object.keys(STATES).map((s) => `<option>${s}</option>`).join('')}</select></label></div>
    <p class="note">High approvals per resident mean lots of new stock is coming, which is good for choice and bad for rents and resale if it's mostly apartments. Low approvals in a growing area support prices.</p>
    <div id="nb-tbl"></div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Why new builds matter more after 2026</h3>
      <ul class="pros">
        <li>New builds keep <b>negative gearing</b>: rental losses still reduce your salary tax. Established homes bought after 12 May 2026 lose it from 1 July 2027.</li>
        <li>New builds can choose the <b>50% CGT discount</b> or indexation when sold. Established properties get indexation plus a 30% minimum tax on gains after 1 July 2027.</li>
        <li>Brand-new buildings carry the most <b>depreciation</b>: 2.5% a year of construction cost plus plant and equipment, which second-hand buyers can't claim.</li>
        <li>First home buyers pay <b>no stamp duty on new homes</b> of any value in Queensland and South Australia, and the ACT has removed price caps from its concession.</li>
      </ul>
      <ul class="cons">
        <li>Only the first buyer gets the new-build tax treatment. The next owner doesn't, which can make resale harder.</li>
        <li>Off-the-plan apartments often value below the contract price at settlement, and oversupplied towers see weak rent growth.</li>
        <li>A knock-down rebuild only counts if it adds dwellings to the site.</li>
      </ul>
      <p class="fine"><a href="${RULES.reform.factsheet}" target="_blank" rel="noopener">Treasury factsheet</a> · <a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO</a></p>
    </div>
    <div class="card"><h3>New homes and land for sale</h3>
      <label class="field" style="position:relative">Suburb<input id="nb-sub" type="search" placeholder="Suburb or postcode"><div class="ac" id="nb-ac" hidden style="top:62px;left:0;right:auto"></div></label>
      <div id="nb-live" style="margin-top:12px"><p class="note">Pick a suburb to see new apartments, house-and-land packages and land for sale.</p></div>
    </div>
  </section>
  <p class="fine">Source: <a href="${esc(ap.sourceUrl)}" target="_blank" rel="noopener">ABS Building Approvals, Australia</a> (${esc(ap.release)}), refreshed ${date(ap.updated)}. Approvals per 1,000 residents use 2021 Census population.</p>`;

  const draw = () => {
    const rows = lgas.filter((l) => !st.state || l.s === st.state);
    const key = { name: (l) => l.name, total: (l) => l.fy.total, per1000: (l) => l.per1000, share: (l) => l.share, value: (l) => l.fy.value, ytd: (l) => l.ytd?.total ?? 0 }[st.sort];
    rows.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * (st.asc ? 1 : -1));
    main.querySelector('#nb-tbl').innerHTML = `<div class="tbl-wrap"><table id="nbt"><thead><tr><th data-k="name">Council</th><th>State</th><th data-k="total" class="n">New dwellings</th><th class="n">Houses</th><th class="n">Other</th><th data-k="share" class="n">% apartments / townhouses</th><th data-k="per1000" class="n">Per 1,000 residents</th><th data-k="value" class="n">Value</th><th data-k="ytd" class="n">This FY to date</th></tr></thead><tbody>
    ${rows.slice(0, 150).map((l) => `<tr><td><a href="/council/${l.s.toLowerCase()}/${l.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}" data-link>${esc(l.name)}</a></td><td>${l.s}</td><td class="n">${num(l.fy.total)}</td><td class="n">${num(l.fy.houses)}</td><td class="n">${num(l.fy.other)}</td><td class="n">${pct(l.share, 0)}</td><td class="n ${l.per1000 > 15 ? 'warn' : ''}">${l.per1000.toFixed(1)}</td><td class="n">${aud((l.fy.value || 0) * 1000, { compact: true })}</td><td class="n">${num(l.ytd?.total)}</td></tr>`).join('')}
    </tbody></table></div>`;
    const t = main.querySelector('#nbt');
    t.querySelector(`th[data-k="${st.sort}"]`)?.classList.add(st.asc ? 'asc' : 'desc');
    sortable(t, (k, asc) => {
      st.sort = k;
      st.asc = asc;
      draw();
    });
  };
  main.querySelector('#nb-state').addEventListener('change', (e) => {
    st.state = e.target.value;
    draw();
  });
  draw();
  attachSearch(main.querySelector('#nb-sub'), main.querySelector('#nb-ac'), (s) => {
    main.querySelector('#nb-sub').value = `${s.n} ${s.s} ${s.pc}`;
    liveListings(main.querySelector('#nb-live'), s, { compact: true, filters: { types: 'NewApartments,NewHomeDesigns,NewLand', surrounding: '1' } });
  });
  wireCharts(main, (v) => num(v), (v) => new Date(v).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }));
}
