import { esc, aud, pct, ago, scoreBadge, setMeta, lineChart, wireCharts, date, growth12, confBadge } from '../ui.js';
import { load, suburbUrl, cleanName, slug } from '../data.js';
import { attachSearch } from '../app.js';
import { DAILY, applyLiveGrowth } from '../live.js';
import { rateWatchCard } from '../ratewatch.js';
import { baseTiles } from '../map.js';

const TABS = { balanced: 'Balanced', growth: 'Growth', cashflow: 'Cash flow', under700: 'Under $700k' };

export default async function home(main) {
  setMeta({ title: 'Australian property values, ratings and live market data', description: 'Keystone values any Australian home, rates every suburb and any listing as an investment, and tracks prices, rates, approvals and news every hour.' });
  const [market, rs, rba, news, idx, hd] = await Promise.all([load('market'), load('rates-summary'), load('rba'), load('news'), load('index'), load('home')]);
  const n = market.national;
  const inv = rs.best.INV_PI_variable?.[0];
  const oo = rs.best.OO_PI_variable?.[0];
  const caps = Object.entries(market.regions).filter(([, r]) => r.capital);
  const regs = Object.entries(market.regions).filter(([, r]) => !r.capital);
  const cap5 = idx.daily.CAP5;
  const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  const { postcodes, councils } = hd.counts;
  const sub = { list: { length: hd.counts.suburbs } };
  const ausApprovals = hd.approvals?.total ?? null;
  const apprMonth = hd.approvals ? new Date(`${hd.approvals.month}-01T00:00:00`).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' }) : '';
  // Top-ranked suburbs per strategy, precomputed hourly (scripts/home.mjs); 3,000+ residents so every pick is investable
  const lists = Object.fromEntries(Object.entries(hd.lists).map(([k, rows]) => [k, rows.map((r) => { const o = Object.fromEntries(hd.cols.map((c, i) => [c, r[i]])); o.slug = slug(o); applyLiveGrowth(o, idx, market); return { s: o, v: o.v }; })]));
  const best = lists.balanced[0];

  // one 12-month figure per market: the daily index where it exists (matches /live and suburb pages)
  const yr = (code, r) => (DAILY[code] && idx.daily[DAILY[code]]?.year != null ? idx.daily[DAILY[code]].year : r.annualPct);
  const liveCards = Object.entries(DAILY)
    .map(([code, key]) => {
      const d = idx.daily[key];
      return `<a class="card live-card" href="/live" data-link><div class="spread"><b>${market.regions[code].name}</b><span class="mono ${cls(d.week)}">${pct(d.week, 2, true)} wk</span></div><div class="note mono" style="margin-top:4px">Mo <span class="${cls(d.month)}">${pct(d.month, 1, true)}</span> · YTD <span class="${cls(d.ytd)}">${pct(d.ytd, 1, true)}</span> · Yr <span class="${cls(d.year)}">${pct(d.year, 1, true)}</span></div></a>`;
    })
    .join('');

  const cashHist = rba.cashRate.decisions.filter((d) => d.date >= '2010-01-01').map((d) => [Date.parse(d.date), d.rate]);
  cashHist.push([Date.now(), rba.cashRate.current]);
  const invVar = rba.actual.newInvVariable.filter(([d]) => d >= '2010-01-01').map(([d, v]) => [Date.parse(d), v]);

  const groups = [
    ['Buying a home', [
      ['/afford?buyer=fhb', 'What can I afford?', 'Your savings and income turned into a buying ceiling in every state, with the 5% Deposit Scheme and stamp duty concessions, then the best places to live near where you work.', 'First home buyers and upgraders'],
      ['/property', 'Value a property', 'Any address: an estimated value and range, the cash you need, repayments against rent, and whether an asking price sits inside the likely range.', 'Any Australian address'],
      ['/guide#fhb', 'First home guide', 'The 5% Deposit Scheme, Help to Buy, First Home Super Saver, grants and duty concessions by state, and every step to settlement.', 'Updated September 2026'],
    ]],
    ['Investing', [
      ['/analyse', 'Deal analyser', 'Stamp duty, LMI, land tax, depreciation, 10-year after-tax cash flow and return, with the 2026 negative gearing and CGT rules built in.', 'All 8 states'],
      ['/map', 'Suburb scores map', 'The highest-rated suburbs for growth or cash flow on one map, priced for the home you want, with how much of each ranking is measured.', best ? `Top score now: ${esc(cleanName(best.s.n))} ${best.s.s}` : ''],
      ['/borrowing', 'Borrowing power', 'How lenders assess you: the 3-point buffer, 80% of rent, your debts and dependants.', 'Lender-style assessment'],
    ]],
    ['Suburbs and the market', [
      ['/suburbs', 'Suburb explorer', 'Prices, rents, growth, supply, demographics and risks for every suburb, postcode and council.', `${sub.list.length.toLocaleString()} suburb reports`],
      ['/live', 'Live market', 'Daily home values for the five largest capitals: this week, this month, year to date and the past year.', cap5 ? `5 capitals ${pct(cap5.week, 2, true)} this week` : ''],
      ['/rates', 'Home loan rates', 'Every advertised home loan rate from Open Banking feeds, ranked by loan type and deposit, with the next RBA decision.', inv ? `Lowest investor variable ${pct(inv.rate, 2)}` : ''],
    ]],
  ];

  main.innerHTML = `
  <section class="hero">
    <div>
      <div class="eyebrow">Australian property intelligence</div>
      <h1>Every property decision, <em>backed by the numbers.</em></h1>
      <p class="lead">Keystone values any Australian home, rates every suburb and any listing you find, and tracks the market every hour. Official sales, census, approvals and lending data for ${sub.list.length.toLocaleString()} suburbs, in one place, for home buyers and investors.</p>
      <form class="hero-search" autocomplete="off" onsubmit="return false">
        <input id="hq" type="search" placeholder="Enter an address, suburb, postcode, or describe what you want" aria-label="Search an address, suburb or postcode, or describe what you're looking for" />
        <div class="ac" id="hac" hidden></div>
      </form>
      <div class="try"><span class="muted">Try</span>
        <a href="/property?q=${encodeURIComponent('7 Russell Street, Morley WA 6062')}" data-link>7 Russell Street, Morley WA 6062</a>
        <a href="/find?q=${encodeURIComponent('3 bed house under $800k near the beach in Perth')}" data-link>3 bed house under $800k near the beach in Perth</a>
        <a href="/find?q=${encodeURIComponent('Cash flow investment in regional QLD')}" data-link>Cash flow investment in regional QLD</a>
        <a href="/why" data-link><b>▶ Watch the 90-second tour</b></a>
      </div>
    </div>
    <div class="hero-panel">
      <svg class="keystone-mark" viewBox="0 0 40 40"><path d="M4 36V22a16 16 0 0 1 32 0v14h-7V22a9 9 0 0 0-18 0v14z"/><path d="M15.5 4.6h9l-1.6 9.6h-5.8z"/></svg>
      <div class="spread"><div class="k">Market now</div><span class="badge-live" style="font-size:11px">Live</span></div>
      <div class="k" style="margin-top:10px">National median dwelling value</div>
      <div class="big">${aud(n.medianDwelling)}</div>
      <div class="k"><span class="${cls(n.annualPct)}">${pct(n.annualPct, 1, true)}</span> over 12 months · ${pct(n.quarterPct, 1, true)} over 3 months</div>
      <div class="row">
        <div><div class="k">5 capitals this week</div><div class="mono" style="font-size:22px"><span class="${cls(cap5?.week)}">${pct(cap5?.week, 2, true)}</span></div><div class="k">daily index, ${date(idx.generated)}</div></div>
        <div><div class="k">RBA cash rate</div><div class="mono" style="font-size:22px">${pct(rba.cashRate.current, 2)}</div><div class="k">since ${date(rba.cashRate.lastChange)}</div></div>
        <div><div class="k">Lowest investor variable</div><div class="mono" style="font-size:22px">${inv ? pct(inv.rate, 2) : '—'}</div><div class="k">${inv ? esc(inv.lender) : ''}</div></div>
        <div><div class="k">Lowest owner-occupier variable</div><div class="mono" style="font-size:22px">${oo ? pct(oo.rate, 2) : '—'}</div><div class="k">${oo ? esc(oo.lender) : ''}</div></div>
        <div><div class="k">Gross rental yield</div><div class="mono" style="font-size:22px">${pct(n.yield, 2)}</div><div class="k">national, all dwellings</div></div>
        <div><div class="k">Rental vacancy</div><div class="mono" style="font-size:22px">${pct(n.vacancySQM, 1)}</div><div class="k">SQM Research</div></div>
      </div>
      <div class="k" style="margin-top:14px">Rates refreshed ${ago(rs.updated)} · index ${ago(idx.updated || idx.generated)}</div>
    </div>
  </section>

  <section class="band">
    <div><b>${sub.list.length.toLocaleString()}</b><span>suburbs valued and rated</span></div>
    <div><b>${postcodes.toLocaleString()}</b><span>postcodes</span></div>
    <div><b>${councils.toLocaleString()}</b><span>council areas</span></div>
    <div><b>${rs.rows.toLocaleString()}</b><span>loan rates from ${rs.lenders} lenders</span></div>
    <div><b>Daily</b><span>home value index</span></div>
    <div><b>Hourly</b><span>index and news refresh</span></div>
  </section>

  <section class="section" style="margin-top:20px">${rateWatchCard(rba, { compact: true })}</section>

  <section class="section">
    <div class="spread"><h2>The platform</h2><a href="/methodology" data-link>Data and methodology →</a></div>
    ${groups.map(([title, items]) => `<h3 class="group-h">${title}</h3><div class="grid g3 products">${items.map(([href, t, d, stat]) => `<a class="card product" href="${href}" data-link><h3>${t}</h3><p class="muted">${d}</p>${stat ? `<span class="product-stat">${stat}</span>` : ''}</a>`).join('')}</div>`).join('')}
    <div class="row" style="margin-top:12px"><a class="pill" href="/find" data-link>Smart property search</a><a class="pill" href="/borrowing" data-link>Borrowing power</a><a class="pill" href="/compare" data-link>Compare suburbs</a><a class="pill" href="/weekly" data-link>Weekly market report</a><a class="pill" href="/guide" data-link>Buying guide</a><a class="pill" href="/news" data-link>Housing news</a></div>
  </section>

  <section class="section">
    <div class="spread"><h2><span class="badge-live" style="font-size:13px;vertical-align:middle">Live</span> Home values this week</h2><a href="/live" data-link>Day, week, month, YTD and year →</a></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${liveCards}</div>
    <p class="fine" style="margin-top:8px">Cotality Daily Home Value Index to ${date(idx.generated)}. Refreshed hourly; last update ${ago(idx.updated || idx.generated)}.</p>
  </section>

  <section class="section">
    <div class="spread"><h2>Highest-scoring suburbs</h2><a href="/map" data-link>Open the full map →</a></div>
    <div class="seg" id="lists" role="tablist">${Object.entries(TABS)
      .map(([k, v], i) => `<button class="${i ? '' : 'on'}" data-l="${k}">${v}</button>`)
      .join('')}</div>
    <div class="split-map" style="margin-top:14px">
      <div class="card" style="padding:4px 0 0"><div id="toplist" style="max-height:520px;overflow:auto"></div></div>
      <div class="card" style="padding:10px"><div id="hmap" class="map"></div><p class="fine" style="margin-top:8px">Top 100 suburbs for the selected strategy, coloured by Keystone Score. Click a dot for the numbers.</p></div>
    </div>
    <p class="fine" style="margin-top:8px">Keystone Score blends yield, price momentum, growth drivers, rental demand, affordability and stability, less a penalty for concentration risk. Suburbs with 3,000+ residents. <b>Measured</b>, <b>partly measured</b> and <b>modelled</b> show how much of each ranking rests on official sales: outside NSW, Victoria and SA most suburbs are modelled and use their city or regional growth figure. <a href="/methodology" data-link>How it works</a>.</p>
  </section>

  <section class="section">
    <div class="spread"><h2>Markets at a glance</h2><a href="/markets" data-link>Full market dashboard →</a></div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Market</th><th class="n">Median house</th><th class="n">Median unit</th><th class="n">12 months†</th><th class="n">3 months to Aug</th><th class="n">Gross yield</th><th class="n">Rent growth</th><th class="n">Vacancy</th><th class="n">Days on market</th></tr></thead>
      <tbody>${caps
        .map(
          ([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${r.name}</a></td><td class="n">${aud(r.medianHouse, { compact: true })}</td><td class="n">${aud(r.medianUnit, { compact: true })}</td><td class="n ${cls(yr(code, r))}">${pct(yr(code, r), 1, true)}</td><td class="n ${cls(r.quarterPct)}">${pct(r.quarterPct, 1, true)}</td><td class="n">${pct(r.yield, 1)}</td><td class="n">${pct(r.rentAnnualPct, 1, true)}</td><td class="n">${pct(r.vacancy, 1)}</td><td class="n">${r.dom ?? '—'}</td></tr>`,
        )
        .join('')}
      ${regs.map(([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${r.name}</a></td><td class="n muted" title="All dwellings">${aud(r.medianHouse || r.medianDwelling, { compact: true })}*</td><td class="n muted">—</td><td class="n ${cls(r.annualPct)}">${pct(r.annualPct, 1, true)}</td><td class="n ${cls(r.quarterPct)}">${pct(r.quarterPct, 1, true)}</td><td class="n">${pct(r.yield, 1)}</td><td class="n">${pct(r.rentAnnualPct, 1, true)}</td><td class="n">—</td><td class="n">${r.dom ?? '—'}</td></tr>`).join('')}
      </tbody></table></div>
    <p class="fine" style="margin-top:8px">†12 months: Cotality daily index, year to ${date(idx.generated)}, for Sydney, Melbourne, Brisbane, Adelaide and Perth; monthly index, 12 months to August, elsewhere. Medians and 3-month change: Cotality monthly index to August; vacancy: SQM Research. *Regional medians are all dwellings.</p>
  </section>

  <section class="section grid g2">
    <div class="card">
      <div class="card-head"><h3>Interest rates</h3><a href="/rates" data-link>Compare ${rs.rows.toLocaleString()} rates →</a></div>
      ${lineChart([{ name: 'RBA cash rate', points: cashHist }, { name: 'Avg new investor variable (RBA F6)', points: invVar }], { height: 230, yFmt: (v) => `${v}%`, label: 'Cash rate and investor mortgage rates since 2010' })}
      <div class="stats" style="margin-top:14px">
        ${[['INV_PI_variable', 'Investor variable'], ['INV_PI_fixed3', 'Investor 3yr fixed'], ['OO_PI_variable', 'Owner-occ variable'], ['INV_IO_variable', 'Investor interest-only']]
          .map(([k, l]) => {
            const b = rs.best[k]?.[0];
            return `<div class="stat"><span class="k">Lowest ${l}</span><span class="v">${b ? pct(b.rate, 2) : '—'}</span><span class="s">${b ? esc(b.lender) : ''}</span></div>`;
          })
          .join('')}
      </div>
      <p class="fine" style="margin-top:10px">Lowest advertised rates at 80% LVR from lenders' Open Banking feeds, updated ${ago(rs.updated)}. Excludes niche green and staff loans.</p>
    </div>
    <div class="card">
      <div class="card-head"><h3>Housing news</h3><a href="/news" data-link>All news →</a></div>
      <div class="news-list">${news.items
        .slice(0, 7)
        .map((x) => `<div class="news-item"><div><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta"><span>${esc(x.source)}</span><span>·</span><span>${ago(x.date)}</span>${x.tags.map((t) => `<span class="tag tag-news">${t}</span>`).join('')}</div></div></div>`)
        .join('')}</div>
    </div>
  </section>

  <section class="section">
    <h2>How Keystone rates a property</h2>
    <div class="grid g3 howto">
      <div class="card flat"><span class="step-n">1</span><h3>Official data, kept current</h3><p class="muted">State valuer-general and government sales medians, the ABS Census and building approvals, Cotality's daily index, and RBA and Open Banking lending data.</p></div>
      <div class="card flat"><span class="step-n">2</span><h3>A value for the exact home</h3><p class="muted">A suburb price model (R² 0.75 against official medians) sets the typical value, then each home is adjusted for bedrooms, bathrooms, land, condition and the market's movement since.</p></div>
      <div class="card flat"><span class="step-n">3</span><h3>A rating you can check</h3><p class="muted">Six scored components per suburb and a full 10-year after-tax model per property produce an A–D grade, with every reason and risk listed so you can challenge it.</p></div>
    </div>
    <div class="sources"><span class="muted">Data from</span><span>Cotality</span><span>ABS</span><span>RBA</span><span>Open Banking (CDR)</span><span>Valuer-General Victoria</span><span>NSW DCJ</span><span>SA Land Services</span><span>SQM Research</span><span>PropTrack</span><span>OpenStreetMap</span></div>
  </section>

  <section class="section">
    <div class="card register-band">
      <div><div class="eyebrow">Weekly update · register early</div><h2 style="margin:0 0 6px">The market in five minutes, once a week</h2><p class="muted" style="margin:0">What moved in values and rates, the RBA outlook, new supply, and alerts when the suburbs you're watching move. The email edition is launching soon: register now to be first on the list. Until then, the <a href="/weekly" data-link>weekly report</a> is updated online.</p></div>
      <form id="hreg" name="register" method="POST" data-netlify="true" netlify-honeypot="company">
        <input type="hidden" name="form-name" value="register"><p hidden><label>Leave empty <input name="company"></label></p>
        <div class="fields" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.2fr)">
          <label class="field">Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
          <label class="field">I'm a<select name="type"><option>First home buyer</option><option>Investor</option><option>Both</option><option>Industry</option></select></label>
          <label class="field">Suburbs I'm watching<input name="suburbs" placeholder="e.g. Morley 6062"></label>
        </div>
        <input type="hidden" name="consent" value="on">
        <div class="row" style="margin-top:10px"><button class="btn primary">Register</button><span class="fine" id="hreg-s">By signing up you agree to receive Keystone emails. <a href="/privacy" data-link>Privacy</a>.</span></div>
      </form>
    </div>
  </section>

  <section class="section">
    <div class="callout">
      <b>The 2026 tax changes are law.</b> Established properties bought after 12 May 2026 can offset rental losses against other income only until 30 June 2027; after that, losses carry forward. From 1 July 2027 the 50% CGT discount is replaced by indexation plus a 30% minimum tax. New builds keep both. Every valuation and analysis on Keystone models this. <a href="/guide#tax-2026" data-link>What it means →</a>
    </div>
  </section>`;

  let map = null;
  let layer = null;
  const col = (v) => getComputedStyle(document.documentElement).getPropertyValue(v >= 75 ? '--sc-a' : v >= 60 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
  const typ = (s) => (s.pt === 'u' ? s.u : s.h);
  const drawMap = (rows) => {
    if (!map) return;
    if (layer) layer.remove();
    layer = L.layerGroup().addTo(map);
    [...rows].reverse().forEach(({ s, v }) => {
      const i = rows.findIndex((r) => r.s === s);
      L.circleMarker([s.lat, s.lng], { radius: i < 10 ? 9 : 6, weight: 1, color: '#0009', fillColor: col(v), fillOpacity: 0.92 })
        .addTo(layer)
        .bindPopup(`<b>${i + 1}. <a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))}</a> ${s.s}</b><br>Score ${v} · ${s.pt === 'u' ? 'unit' : 'house'} ${aud(typ(s), { compact: true })}<br>${pct(s.y, 1)} yield · ${growth12(s)}`);
    });
    map.fitBounds(L.latLngBounds(rows.map(({ s }) => [s.lat, s.lng])).pad(0.05), { maxZoom: 10 });
  };
  const renderList = (k) => {
    const rows = lists[k];
    main.querySelector('#toplist').innerHTML = rows
      .slice(0, 25)
      .map(
        ({ s, v }, i) => `<a class="mrow" href="${suburbUrl(s)}" data-link style="text-decoration:none"><span class="faint mono">${i + 1}</span><span style="min-width:0"><b>${esc(cleanName(s.n))}</b> <span class="muted">${s.s} ${s.pc || ''}</span>${confBadge(s)}<span class="note" style="display:block">${aud(typ(s), { compact: true })} ${s.pt === 'u' ? 'unit' : 'house'} · ${pct(s.y, 1)} yield · ${growth12(s)}</span></span>${scoreBadge(v)}</a>`,
      )
      .join('');
    drawMap(rows);
  };
  main.querySelector('#lists').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    main.querySelectorAll('#lists button').forEach((x) => x.classList.toggle('on', x === b));
    renderList(b.dataset.l);
  });
  renderList('balanced');
  const init = () => {
    if (!window.L) return setTimeout(init, 250);
    if (!document.getElementById('hmap')) return;
    map = L.map('hmap', { scrollWheelZoom: false });
    baseTiles().addTo(map);
    map.setView([-27, 134], 4);
    drawMap(lists[main.querySelector('#lists .on')?.dataset.l || 'balanced']);
  };
  init();
  attachSearch(main.querySelector('#hq'), main.querySelector('#hac'));
  const reg = main.querySelector('#hreg');
  reg.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(reg)).toString() });
      if (!r.ok) throw new Error(r.status);
      reg.innerHTML = '<h3 style="margin:0">You\'re on the list.</h3><p class="note">We\'ll email you when the weekly edition launches.</p>';
    } catch {
      main.querySelector('#hreg-s').textContent = 'That didn\'t go through. Please try again.';
    }
  });
  wireCharts(main, (v) => `${v.toFixed(2)}%`);
  return { destroy: () => map?.remove() };
}
