import { esc, aud, pct, ago, scoreBadge, setMeta, lineChart, wireCharts, date } from '../ui.js';
import { load, suburbs, suburbUrl, cleanName } from '../data.js';
import { suburbScore, PROFILES } from '../engine.js';
import { attachSearch } from '../app.js';
import { DAILY } from '../live.js';

export default async function home(main) {
  setMeta({ title: 'Australian property investment intelligence', description: 'Every Australian suburb scored for investors, live home loan rates from 90+ lenders, and a deal analyser with the 2026 tax rules.' });
  const [market, rs, rba, news, sub, idx] = await Promise.all([load('market'), load('rates-summary'), load('rba'), load('news'), suburbs(), load('index')]);
  const liveCards = Object.entries(DAILY)
    .map(([code, key]) => {
      const d = idx.daily[key];
      const c = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
      return `<a class="card" href="/live" data-link style="color:inherit;padding:14px 16px"><div class="spread"><b>${market.regions[code].name}</b><span class="mono ${c(d.week)}">${pct(d.week, 2, true)} wk</span></div><div class="note mono" style="margin-top:4px">Mo <span class="${c(d.month)}">${pct(d.month, 1, true)}</span> · YTD <span class="${c(d.ytd)}">${pct(d.ytd, 1, true)}</span> · Yr <span class="${c(d.year)}">${pct(d.year, 1, true)}</span></div></a>`;
    })
    .join('');
  const n = market.national;
  const inv = rs.best.INV_PI_variable?.[0];
  const caps = Object.entries(market.regions).filter(([, r]) => r.capital);
  const regs = Object.entries(market.regions).filter(([, r]) => !r.capital);

  // Top suburbs for three strategies (population >= 3,000 so the list is investable)
  const pool = sub.list.filter((s) => s.pop >= 3000 && s.h);
  const top = (profile, filt = () => true) =>
    pool
      .filter(filt)
      .map((s) => ({ s, v: suburbScore(s.sc, PROFILES[profile]) }))
      .sort((a, b) => b.v - a.v)
      .slice(0, 8);
  const lists = {
    balanced: top('balanced'),
    cashflow: top('cashflow'),
    growth: top('growth'),
    under700: top('balanced', (s) => (s.pt === 'u' ? s.u : s.h) <= 700000),
  };

  const cashHist = rba.cashRate.decisions.filter((d) => d.date >= '2010-01-01').map((d) => [Date.parse(d.date), d.rate]);
  cashHist.push([Date.now(), rba.cashRate.current]);
  const invVar = rba.actual.newInvVariable.filter(([d]) => d >= '2010-01-01').map(([d, v]) => [Date.parse(d), v]);

  main.innerHTML = `
  <section class="hero">
    <div>
      <div class="eyebrow">Australian property · investment intelligence</div>
      <h1>Know what a property is <em>really</em> worth to you before you buy it.</h1>
      <p class="lead">${sub.list.length.toLocaleString()} suburbs across all 8 states and territories, each priced, scored and explained for investors. Plus the best advertised loan rates from ${rs.lenders} lenders, refreshed every hour, and a deal analyser that already knows the 2026 negative gearing and CGT changes.</p>
      <form class="hero-search" autocomplete="off" onsubmit="return false">
        <input id="hq" type="search" placeholder="Search any suburb or postcode, e.g. Morley or 6062" aria-label="Search suburb or postcode" />
        <div class="ac" id="hac" hidden></div>
      </form>
      <div class="hero-links">
        <a class="btn primary" href="/suburbs" data-link>Find the best suburbs</a>
        <a class="btn" href="/analyse" data-link>Analyse a property</a>
        <a class="btn ghost" href="/guide" data-link>How to buy an investment property</a>
      </div>
    </div>
    <div class="hero-panel">
      <svg class="keystone-mark" viewBox="0 0 40 40"><path d="M4 36V22a16 16 0 0 1 32 0v14h-7V22a9 9 0 0 0-18 0v14z"/><path d="M15.5 4.6h9l-1.6 9.6h-5.8z"/></svg>
      <div class="k">National median dwelling value · ${esc(market.asOf ? 'Cotality, August 2026' : '')}</div>
      <div class="big">${aud(n.medianDwelling)}</div>
      <div class="k"><span class="${n.annualPct >= 0 ? 'up' : 'down'}">${pct(n.annualPct, 1, true)}</span> over 12 months · ${pct(n.quarterPct, 1, true)} over 3 months</div>
      <div class="row">
        <div><div class="k">RBA cash rate</div><div class="mono" style="font-size:24px">${pct(rba.cashRate.current, 2)}</div><div class="k">since ${date(rba.cashRate.lastChange)}</div></div>
        <div><div class="k">Lowest investor variable</div><div class="mono" style="font-size:24px">${inv ? pct(inv.rate, 2) : '—'}</div><div class="k">${inv ? esc(inv.lender) : ''}</div></div>
        <div><div class="k">Gross rental yield</div><div class="mono" style="font-size:24px">${pct(n.yield, 2)}</div><div class="k">national, all dwellings</div></div>
        <div><div class="k">Rental vacancy</div><div class="mono" style="font-size:24px">${pct(n.vacancySQM, 1)}</div><div class="k">SQM Research, August</div></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="spread"><h2><span class="badge-live" style="font-size:13px;vertical-align:middle">Live</span> This week in home values</h2><a href="/live" data-link>Day, week, month, YTD, year →</a></div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr))">${liveCards}</div>
    <p class="fine" style="margin-top:8px">Cotality Daily Home Value Index, ${idx.generated}. Updated every hour.</p>
  </section>

  <section class="section">
    <div class="spread"><h2>Capital cities right now</h2><a href="/markets" data-link>Full market dashboard →</a></div>
    <div class="tbl-wrap"><table>
      <thead><tr><th>Market</th><th class="n">Median house</th><th class="n">Median unit</th><th class="n">12 months</th><th class="n">3 months</th><th class="n">Gross yield</th><th class="n">Rent growth</th><th class="n">Vacancy</th><th class="n">Days on market</th></tr></thead>
      <tbody>${caps
        .map(
          ([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${r.name}</a></td><td class="n">${aud(r.medianHouse, { compact: true })}</td><td class="n">${aud(r.medianUnit, { compact: true })}</td><td class="n ${r.annualPct >= 0 ? 'up' : 'down'}">${pct(r.annualPct, 1, true)}</td><td class="n ${r.quarterPct >= 0 ? 'up' : 'down'}">${pct(r.quarterPct, 1, true)}</td><td class="n">${pct(r.yield, 1)}</td><td class="n">${pct(r.rentAnnualPct, 1, true)}</td><td class="n">${pct(r.vacancy, 1)}</td><td class="n">${r.dom ?? '—'}</td></tr>`,
        )
        .join('')}
      ${regs.map(([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${r.name}</a></td><td class="n muted" title="All dwellings">${aud(r.medianHouse || r.medianDwelling, { compact: true })}*</td><td class="n muted">—</td><td class="n ${r.annualPct >= 0 ? 'up' : 'down'}">${pct(r.annualPct, 1, true)}</td><td class="n ${r.quarterPct >= 0 ? 'up' : 'down'}">${pct(r.quarterPct, 1, true)}</td><td class="n">${pct(r.yield, 1)}</td><td class="n">${pct(r.rentAnnualPct, 1, true)}</td><td class="n">—</td><td class="n">${r.dom ?? '—'}</td></tr>`).join('')}
      </tbody></table></div>
    <p class="fine" style="margin-top:8px">Values, growth, yields and days on market: Cotality Home Value Index (August 2026). Vacancy: SQM Research (August 2026). *Regional medians are all dwellings.</p>
  </section>

  <section class="section">
    <div class="spread"><h2>Top-ranked suburbs</h2><a href="/suburbs" data-link>Rank all ${sub.list.length.toLocaleString()} suburbs →</a></div>
    <div class="seg" id="lists" role="tablist">
      <button class="on" data-l="balanced">Balanced</button><button data-l="cashflow">Cash flow</button><button data-l="growth">Growth</button><button data-l="under700">Under $700k</button>
    </div>
    <div class="grid g2" style="margin-top:14px" id="toplist"></div>
    <p class="fine" style="margin-top:8px">Keystone Score blends yield, price momentum, population, income and rent growth, rental demand, affordability and stability. Suburbs with 3,000+ residents. <a href="/methodology" data-link>How it works</a>.</p>
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
    <div class="callout">
      <b>The 2026 tax changes are now law.</b> Established properties bought after 12 May 2026 can only offset rental losses against other income until 30 June 2027. After that, losses carry forward against property income and gains. From 1 July 2027 the 50% CGT discount is replaced by indexation plus a 30% minimum tax. New builds keep both. Keystone's analyser models all of this. <a href="/guide#tax-2026" data-link>What it means for you →</a>
    </div>
  </section>

  <section class="section grid g3">
    <a class="card" href="/analyse" data-link style="color:inherit"><div class="eyebrow">Analyse</div><h3>Run the numbers on any property</h3><p class="muted">Stamp duty in all 8 states, LMI, land tax, 10-year cash flow, after-tax return and a buy / pass verdict with reasons.</p></a>
    <a class="card" href="/borrowing" data-link style="color:inherit"><div class="eyebrow">Borrowing</div><h3>How much could you borrow?</h3><p class="muted">The same 3-point serviceability buffer lenders use, with 80% of rent counted.</p></a>
    <a class="card" href="/guide" data-link style="color:inherit"><div class="eyebrow">Guide</div><h3>How to buy an investment property</h3><p class="muted">Every step from pre-approval to settlement, what each costs, and the traps to avoid.</p></a>
  </section>`;

  const renderList = (k) => {
    const rows = lists[k];
    const half = Math.ceil(rows.length / 2);
    const col = (arr, off) =>
      `<div class="card flat" style="padding:6px 14px">${arr
        .map(
          ({ s, v }, i) => `<div class="spread" style="padding:9px 0;border-bottom:1px solid var(--line)"><div><span class="faint mono">${i + 1 + off}.</span> <a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))}</a> <span class="muted">${s.s} ${s.pc || ''}</span><div class="note">${aud(s.pt === 'u' ? s.u : s.h, { compact: true })} ${s.pt === 'u' ? 'unit' : 'house'} · ${pct(s.y, 1)} yield · ${pct(s.g1, 1, true)} 12m</div></div>${scoreBadge(v)}</div>`,
        )
        .join('')}</div>`;
    main.querySelector('#toplist').innerHTML = col(rows.slice(0, half), 0) + col(rows.slice(half), half);
  };
  renderList('balanced');
  main.querySelector('#lists').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    main.querySelectorAll('#lists button').forEach((x) => x.classList.toggle('on', x === b));
    renderList(b.dataset.l);
  });
  attachSearch(main.querySelector('#hq'), main.querySelector('#hac'));
  wireCharts(main, (v) => `${v.toFixed(2)}%`);
}
