import { nextDecision, sensitivity } from '../ratewatch.js';
import { esc, aud, pct, setMeta, date } from '../ui.js';
import { load, typicalRate, suburbs, suburbUrl } from '../data.js';
import { navigate } from '../app.js';
import { RULES, RBA_DECISIONS } from '../rules.js';
import { demo, wireDemos } from '../demo.js';
import { trendWord } from '../live.js';
import { photoCard, img, photo } from '../photos.js';
import { budgetMapHtml, wireBudgetMap } from '../budgetmap.js';
import { comfortableWeekly } from '../rules.js';

// The home page: the affordability hero, the four jobs people come with, one proof point, one widget and one demo.
// Suburb scores and estimates sit behind them until the suburb data is licensed and measured everywhere.
export default async function home(main) {
  setMeta({ title: 'What can you comfortably afford, and where?', description: 'Free and independent for Australian home buyers: a comfortable price where you want to buy, the schemes you qualify for (5% Deposit Scheme, Help to Buy, Keystart and state schemes), the real weekly cost of an investment under the 2026 tax rules, and advertised rates from 90+ lenders.' });
  const [market, rs, rba, idx] = await Promise.all([load('market'), load('rates-summary'), load('rba'), suburbs()]);
  const caps = Object.entries(market.regions).filter(([, r]) => r.capital);
  const ooRate = typicalRate(rba, 'OO');
  const measured = idx.list.filter((s) => s.conf === 'high' || s.conf === 'medium').length;

  // the four jobs people come with: a photo, one question, one line, one link
  const jobs = [
    ['sherwood-queenslander', 'What can I afford?', 'A comfortable price, the cash you need and your schemes.', '/afford?buyer=fhb', 'Work it out'],
    ['paddington-fiveways', 'What will an investment cost me?', 'The weekly cost after tax under the 2026 rules.', '/analyse', 'Run the numbers'],
    ['fremantle-coast', "What's this suburb like?", 'Prices, rents, growth and risks, with how sure each figure is.', '/suburbs', 'Explore suburbs'],
    ['melbourne-southbank', 'What rate can I get?', `Today's rates from ${rs.lenders} lenders, straight from their feeds.`, '/rates', 'Compare rates'],
  ];
  const credits = jobs.map(([id]) => photo(id)).filter(Boolean);
  const next = nextDecision();
  const last = (rba.cashRate?.decisions || []).at(-1);
  const per25 = sensitivity(ooRate.rate, [750000])[0].up25;
  const shortDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });

  main.innerHTML = `
  <section class="home-hero">
    <div>
      <div class="eyebrow">Free · independent</div>
      <h1>What can you comfortably afford, <em>and where?</em></h1>
      <p class="lead">Drag the budget on the map. Then put in your savings and income for a price that won't stretch you.</p>
      <div class="row hero-cta"><a class="btn primary lg" href="/afford?buyer=fhb" data-link id="hero-cta">Work out what I can afford →</a></div>
      <p class="hero-alt">Investing? <a href="/analyse" data-link>Run the 2026 numbers →</a></p>
    </div>
    <div>${budgetMapHtml({ budget: 750000, city: 'AU' })}</div>
  </section>

  <section class="section-lg">
    <div class="paths-clean">${jobs.map(([ph, t, d, href, cta]) => `<a class="path-clean" href="${href}" data-link><div class="path-img">${img(ph, { sizes: '(max-width: 900px) 50vw, 25vw' })}</div><h3>${t}</h3><p>${d}</p><span class="path-go">${cta} <span aria-hidden="true">→</span></span></a>`).join('')}</div>
    <p class="trust-line">${rs.lenders} lenders' rates <span>·</span> Every state's duty and first home rules <span>·</span> ${measured.toLocaleString()} suburbs with official sales data <span>·</span> Rankings never paid for</p>
  </section>

  <section class="section-lg">
    <div class="sec-head"><div class="eyebrow">Same income, different cities</div><h2>How far one income goes in each capital</h2></div>
    <div class="card calm">
      <div class="inc-controls">
        <label><span>Household income</span><b id="inc-val">$110k</b><input id="inc" type="range" min="50000" max="400000" step="5000" value="110000" aria-label="Household income before tax"></label>
        <div class="seg" id="inc-dep" role="group" aria-label="Deposit"><button type="button" data-d="0.05" class="on" aria-pressed="true">5% deposit</button><button type="button" data-d="0.2" aria-pressed="false">20% deposit</button></div>
      </div>
      <p class="inc-summary">Comfortably buys about <b id="inc-price">—</b> in any city. <span class="inc-legend"><span><i class="unit"></i>median unit</span><span><i></i>median house</span></span></p>
      <div class="incbars clean" id="incbars"></div>
      <details class="quiet-more"><summary>How this is worked out</summary><p class="fine">Repayments within 30% of before-tax income at ${pct(ooRate.rate, 2)} (${esc(ooRate.label)}), 30 years, plus the deposit (a 5% deposit assumes the 5% Deposit Scheme: no mortgage insurance, up to each area's price cap). The marks show each city's median unit and house (Cotality, month-end ${esc(market.indexMonth || '')}). Savings, debts and stamp duty are in the <a href="/afford?buyer=fhb" data-link>full tool</a>.</p></details>
    </div>
  </section>

  <section class="section-lg">
    <div class="sec-head spread"><div><div class="eyebrow">See it in action</div><h2>Twenty seconds each</h2></div><a href="/about" data-link>Full tour →</a></div>
    <div class="seg seg-quiet" id="demo-tabs" role="tablist">${[['afford', 'Afford'], ['calculator', 'Investment'], ['suburb', 'Suburb report'], ['rates', 'Rates']].map(([k, l], i) => `<button type="button" role="tab" data-demo-tab="${k}" class="${i ? '' : 'on'}" aria-selected="${!i}">${l}</button>`).join('')}</div>
    <div class="demo-stage" id="demo-stage">${demo('afford', { caption: '' })}</div>
  </section>

  <section class="section-lg">
    <div class="duo">
      <a class="duo-card" href="/analyse" data-link><div class="eyebrow">2026 tax changes</div><h3>Know what an investment really costs each week</h3><p>Established homes bought after 12 May 2026 lose the salary tax refund from 1 July 2027. See your deal both ways, new and established.</p><span class="path-go">Run the numbers <span aria-hidden="true">→</span></span></a>
      <a class="duo-card" href="/markets" data-link><div class="eyebrow">Rates and the RBA</div>
        <div class="rate-trio"><div><b>${pct(rba.cashRate.current, 2)}</b><span>cash rate${last?.change ? `, ${last.change > 0 ? 'raised' : 'cut'} ${shortDay(RBA_DECISIONS.filter((d) => d < (rba.cashRate.lastChange || '')).at(-1) || rba.cashRate.lastChange)}` : ''}</span></div><div><b>${next ? shortDay(next) : '—'}</b><span>next decision</span></div><div><b>+${aud(per25)}</b><span>a month per 0.25 rise on $750k</span></div></div>
        <span class="path-go">Market update <span aria-hidden="true">→</span></span></a>
    </div>
  </section>

  <p class="fine home-foot">General information, not financial advice. Rules checked ${esc(date(RULES.asOf))}; rates checked ${date(rs.updated)}. Photos from Wikimedia Commons: ${credits.map((p) => `<a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)}</a>`).join(', ')} (${[...new Set(credits.map((p) => p.license))].map(esc).join(', ')}).</p>`;

  const destroyMap = wireBudgetMap(main, idx.list, {
    onPick: (s) => navigate(suburbUrl(s)),
    onChange: (st) => {
      const where = st.city === 'AU' ? '' : `&where=r:${st.city}`;
      main.querySelector('#hero-cta').setAttribute('href', `/afford?buyer=fhb${where}`);
    },
  });
  wireDemos(main);
  main.querySelector('#demo-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-demo-tab]');
    if (!b) return;
    main.querySelectorAll('#demo-tabs button').forEach((x) => (x.classList.toggle('on', x === b), x.setAttribute('aria-selected', String(x === b))));
    const stage = main.querySelector('#demo-stage');
    stage.innerHTML = demo(b.dataset.demoTab, { caption: '' });
    stage.classList.remove('swap');
    void stage.offsetWidth;
    stage.classList.add('swap');
    wireDemos(main);
  });

  // income slider: comfortable price vs median house and unit in each capital
  let dep = 0.05;
  const bars = () => {
    const income = +main.querySelector('#inc').value;
    main.querySelector('#inc-val').textContent = aud(income, { compact: true });
    const priceOut = main.querySelector('#inc-price');
    const r = ooRate.rate / 1200;
    const loan = ((comfortableWeekly(income) * 52) / 12) * (1 - (1 + r) ** -360) / r;
    const price = loan / (1 - dep);
    if (priceOut) priceOut.textContent = aud(price, { compact: true });
    const top = Math.max(...caps.map(([, c]) => c.medianHouse || 0), price) * 1.05;
    main.querySelector('#incbars').innerHTML = caps
      .sort((a, b) => (a[1].medianHouse || 0) - (b[1].medianHouse || 0))
      .map(([, c]) => {
        const h = c.medianHouse || c.medianDwelling;
        const u = c.medianUnit;
        const verdict = price >= h ? 'A median house is within reach' : u && price >= u ? `A median unit is within reach; a median house needs ${aud(h - price, { compact: true })} more` : `${aud((u || h) - price, { compact: true })} short of a median ${u ? 'unit' : 'home'}`;
        const tag = price >= h ? ['House ✓', 'ok'] : u && price >= u ? ['Unit ✓', 'ok'] : [`−${aud((u || h) - price, { compact: true })}`, 'short'];
        return `<div class="incbar" title="${esc(`${verdict}. Median unit ${u ? aud(u, { compact: true }) : '—'}, house ${aud(h, { compact: true })}`)}"><span class="incbar-name">${esc(c.name)}</span><div class="incbar-track"><div class="incbar-fill" style="width:${(price / top) * 100}%"></div><i class="incbar-mark" style="left:${(h / top) * 100}%" data-l="house ${aud(h, { compact: true })}"></i>${u ? `<i class="incbar-mark unit" style="left:${(u / top) * 100}%" data-l="unit ${aud(u, { compact: true })}"></i>` : ''}</div><span class="incbar-tag ${tag[1]}">${tag[0]}</span></div>`;
      })
      .join('');
  };
  main.querySelector('#inc').addEventListener('input', bars);
  main.querySelector('#inc-dep').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    dep = +b.dataset.d;
    main.querySelectorAll('#inc-dep button').forEach((x) => (x.classList.toggle('on', x === b), x.setAttribute('aria-pressed', String(x === b))));
    bars();
  });
  bars();
  return { destroy: destroyMap };
}

export const CITY_PHOTO = { SYD: 'sydney-millers-point', MEL: 'melbourne-southbank', BNE: 'sherwood-queenslanders', PER: 'fremantle-coast', ADL: 'adelaide-torrens', HBA: 'battery-point-lace', CBR: 'canberra-anzac-parade', DRW: 'darwin-waterfront' };
/** A curated photo in the shape photoCard expects. */
export function cityPhoto(code) {
  const p = photo(CITY_PHOTO[code]);
  return p ? { thumb: `/assets/media/photos/${p.id}-960.webp`, title: p.caption, artist: p.author, license: p.license } : null;
}

export const CITY_ARTICLE = { SYD: 'Sydney', MEL: 'Melbourne', BNE: 'Brisbane', PER: 'Perth', ADL: 'Adelaide', HBA: 'Hobart', CBR: 'Canberra', DRW: 'Darwin' };
export function cityCard(code, r, photo) {
  const c = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  const t = trendWord(r.quarterPct);
  return `<div data-city="${code}">${photoCard(photo, `<b>${esc(r.name)}</b>${t ? `<span class="pc-trend pc-${t.toLowerCase()}">${t}</span>` : ''}<span class="pc-stats">3 months <span class="${c(r.quarterPct)}">${pct(r.quarterPct, 1, true)}</span> · 12 months ${pct(r.annualPct, 1, true)}</span><span class="pc-stats">All homes ${aud(r.medianDwelling, { compact: true })} · houses ${aud(r.medianHouse, { compact: true })} · units ${aud(r.medianUnit, { compact: true })}</span>`, { href: `/suburbs?region=${code}`, alt: `${r.name} skyline` })}</div>`;
}
