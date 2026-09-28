import { esc, aud, pct, scoreBadge, setMeta, growth12, confBadge, date } from '../ui.js';
import { load, suburbUrl, cleanName, slug } from '../data.js';
import { attachSearch } from '../app.js';
import { applyLiveGrowth } from '../live.js';
import { rateWatchCard } from '../ratewatch.js';
import { baseTiles } from '../map.js';

// Tabs for the suburb list. "Under $700k" leads because most visitors are buying a home, not a portfolio.
const TABS = { under700: 'Under $700k', balanced: 'Balanced', growth: 'Growth', cashflow: 'Cash flow', newbuild: 'New builds' };

export default async function home(main) {
  setMeta({ title: 'Find a home you can afford, and know what it’s worth', description: 'Free and independent: see what you can afford in every state with the 5% Deposit Scheme and stamp duty concessions, estimate a home’s value with an honest range, compare suburbs and every lender’s rate.' });
  const [market, rs, rba, idx, hd] = await Promise.all([load('market'), load('rates-summary'), load('rba'), load('index'), load('home')]);
  const oo = rs.best.OO_PI_variable?.[0];
  const caps = Object.entries(market.regions).filter(([, r]) => r.capital);
  const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  const suburbs = hd.counts.suburbs.toLocaleString();
  const lists = Object.fromEntries(Object.entries(hd.lists).map(([k, rows]) => [k, rows.map((r) => { const o = Object.fromEntries(hd.cols.map((c, i) => [c, r[i]])); o.slug = slug(o); applyLiveGrowth(o, idx, market); return { s: o, v: o.v }; })]));
  const tabs = Object.entries(TABS).filter(([k]) => lists[k]?.length);

  const paths = [
    ['First home', 'Buying my first home', 'Your price ceiling in every state with the 5% Deposit Scheme, Help to Buy and stamp duty concessions, then how long it takes to save and whether buying beats renting.', [['/afford?buyer=fhb', 'What can I afford?'], ['/first-home', 'Rent vs buy and saving'], ['/guide#fhb', 'First home guide']]],
    ['Moving', 'Selling and buying again', 'An estimate for the home you have and the one you want, each with a range and how far to trust it, plus the full cost of moving: duty, fees and the new loan.', [['/property', 'Value a property'], ['/afford?buyer=owner', 'What can I afford?'], ['/compare', 'Compare suburbs']]],
    ['Investing', 'Buying to rent out', 'After-tax numbers for any property under the 2026 negative gearing and CGT rules, suburb rankings that say what’s measured, and where new builds (which keep the old tax treatment) stack up.', [['/analyse', 'Run the numbers on a property'], ['/map?strategy=newbuild', 'New-build suburbs'], ['/suburbs', 'Suburb explorer']]],
  ];

  main.innerHTML = `
  <section class="hero hero-light">
    <div>
      <div class="eyebrow">Free · independent · no sign-up</div>
      <h1>Find a home you can afford, <em>and know what it’s worth.</em></h1>
      <p class="lead">Start with your savings and income. Keyzing works out your price ceiling in every state, including the 5% Deposit Scheme and stamp duty concessions, then shows the suburbs that fit and what each home is likely worth.</p>
      <div class="row hero-cta"><a class="btn primary lg" href="/afford?buyer=fhb" data-link>Work out what I can afford →</a></div>
      <form class="hero-search" autocomplete="off" onsubmit="return false" role="search">
        <label class="fine" for="hq">Or look up an address, suburb or postcode</label>
        <input id="hq" type="search" placeholder="e.g. 7 Russell Street, Morley WA or “3 bed near the beach in Perth”" aria-label="Search an address, suburb or postcode, or describe what you want" />
        <div class="ac" id="hac" hidden></div>
      </form>
      <p class="fine">Every estimate shows its range and how it was worked out. <a href="/why" data-link>What Keyzing does, in 90 seconds →</a></p>
    </div>
    <figure class="hero-shot"><img src="/assets/media/afford.jpg" width="1280" height="800" alt="Keyzing’s affordability tool showing a buyer’s price ceiling in each state and suburbs within budget" fetchpriority="high"></figure>
  </section>

  <section class="section">
    <h2>Where are you starting?</h2>
    <div class="grid g3 paths">${paths.map(([tag, t, d, links]) => `<div class="card path"><span class="tag tag-official">${tag}</span><h3>${t}</h3><p class="muted">${d}</p><div class="path-links">${links.map(([href, l], i) => `<a class="${i ? '' : 'btn primary sm'}" href="${href}" data-link>${l}${i ? ' →' : ''}</a>`).join('')}</div></div>`).join('')}</div>
  </section>

  <section class="section">
    <div class="spread"><h2>Prices this month</h2><a href="/markets" data-link>All markets →</a></div>
    <div class="tbl-wrap"><table class="compact">
      <thead><tr><th>City</th><th class="n">Typical house</th><th class="n hide-sm">Typical unit</th><th class="n">Past 12 months</th><th class="n hide-sm">Rents, 12 months</th></tr></thead>
      <tbody>${caps.map(([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${esc(r.name)}</a></td><td class="n">${aud(r.medianHouse, { compact: true })}</td><td class="n hide-sm">${aud(r.medianUnit, { compact: true })}</td><td class="n ${cls(r.annualPct)}">${pct(r.annualPct, 1, true)}</td><td class="n hide-sm">${pct(r.rentAnnualPct, 1, true)}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="fine" style="margin-top:8px">Median values and 12-month change: Cotality monthly Home Value Index to ${esc(market.indexMonth || idx.monthEnd || '')}. The same figures appear everywhere on Keyzing. ${oo ? `Lowest advertised owner-occupier variable rate open to anyone: <b>${pct(oo.rate, 2)}</b> (${esc(oo.lender)}); <a href="/rates" data-link>compare every lender</a>.` : ''}</p>
    <div style="margin-top:12px">${rateWatchCard(rba, { compact: true })}</div>
  </section>

  <section class="section">
    <div class="spread"><h2>Suburbs worth a closer look</h2><a href="/map" data-link>Open the full map →</a></div>
    <div class="seg" id="lists" role="tablist">${tabs.map(([k, v], i) => `<button class="${i ? '' : 'on'}" data-l="${k}" role="tab">${v}</button>`).join('')}</div>
    <div class="split-map" style="margin-top:14px">
      <div class="card" style="padding:4px 0 0"><div id="toplist" style="max-height:520px;overflow:auto"></div></div>
      <div class="card" style="padding:10px"><div id="hmap" class="map" role="img" aria-label="Map of the listed suburbs"></div><p class="fine" style="margin-top:8px">Top 100 suburbs for the selected list, coloured by Keyzing Score.</p></div>
    </div>
    <p class="fine" style="margin-top:8px">The score ranks an area on rental yield, measured price trend, population growth net of new building, rental demand, affordability and stability. <b>Measured</b> means it rests on official sales; <b>Modelled</b> means there is no suburb sales series, so it is estimated and scored more cautiously. It ranks areas, not particular homes. <a href="/methodology" data-link>How it works</a>.</p>
  </section>

  <section class="section">
    <div class="card register-band">
      <div><div class="eyebrow">Weekly update · register early</div><h2 style="margin:0 0 6px">What moved in prices and rates, once a week</h2><p class="muted" style="margin:0">Plus a note when the suburbs you’re watching move. The email edition is launching soon; until then the <a href="/weekly" data-link>weekly report</a> is online.</p></div>
      <form id="hreg" name="register" method="POST" data-netlify="true" netlify-honeypot="company">
        <input type="hidden" name="form-name" value="register"><p hidden><label>Leave empty <input name="company"></label></p>
        <div class="fields" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1.2fr)">
          <label class="field">Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
          <label class="field">I'm a<select name="type"><option>First home buyer</option><option>Home owner moving</option><option>Investor</option><option>Agent or broker</option></select></label>
          <label class="field">Suburbs I'm watching<input name="suburbs" placeholder="e.g. Morley 6062"></label>
        </div>
        <input type="hidden" name="consent" value="on">
        <div class="row" style="margin-top:10px"><button class="btn primary">Register</button><span class="fine" id="hreg-s">By signing up you agree to receive Keyzing emails. <a href="/privacy" data-link>Privacy</a>.</span></div>
      </form>
    </div>
    <p class="fine" style="margin-top:12px">Keyzing is general information, not financial advice: it doesn’t know your circumstances and isn’t a lender, broker or agent. Data from Cotality, the ABS, the RBA, state valuers-general, SQM Research and lenders’ Open Banking feeds, credited where it appears. Last data check ${date(idx.updated || idx.generated)}.</p>
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
        .bindPopup(`<b>${i + 1}. <a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))}</a> ${s.s}</b><br>Score ${v} · ${s.pt === 'u' ? 'unit' : 'house'} ${aud(typ(s), { compact: true })}<br>${pct(s.y, 1)} rental yield · ${growth12(s)}`);
    });
    map.fitBounds(L.latLngBounds(rows.map(({ s }) => [s.lat, s.lng])).pad(0.05), { maxZoom: 10 });
  };
  const renderList = (k) => {
    const rows = lists[k];
    main.querySelector('#toplist').innerHTML = rows
      .slice(0, 25)
      .map(
        ({ s, v }, i) => `<a class="mrow" href="${suburbUrl(s)}" data-link style="text-decoration:none"><span class="faint mono">${i + 1}</span><span style="min-width:0"><b>${esc(cleanName(s.n))}</b> <span class="muted">${s.s} ${s.pc || ''}</span>${confBadge(s)}<span class="note" style="display:block">${s.pt === 'u' ? 'Unit' : 'House'} about ${aud(typ(s), { compact: true })} · ${pct(s.y, 1)} rental yield · ${growth12(s)}</span></span>${scoreBadge(v)}</a>`,
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
  renderList(tabs[0][0]);
  const init = () => {
    if (!window.L) return setTimeout(init, 250);
    if (!document.getElementById('hmap')) return;
    map = L.map('hmap', { scrollWheelZoom: false });
    baseTiles().addTo(map);
    map.setView([-27, 134], 4);
    drawMap(lists[main.querySelector('#lists .on')?.dataset.l || tabs[0][0]]);
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
  return { destroy: () => map?.remove() };
}
