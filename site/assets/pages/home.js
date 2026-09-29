import { rateWatchCard } from '../ratewatch.js';
import { esc, aud, pct, setMeta, date } from '../ui.js';
import { load, typicalRate, suburbs, suburbUrl } from '../data.js';
import { navigate } from '../app.js';
import { RULES } from '../rules.js';
import { demo, wireDemos } from '../demo.js';
import { trendWord } from '../live.js';
import { photoCard, figure, strip, photo, photoCredits } from '../photos.js';
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

  // the four jobs people come with
  const jobs = [
    ['Afford', 'sherwood-queenslander', 'What can I afford?', 'A comfortable price where you want to buy, the cash you need and the schemes you qualify for, including Keystart in WA.', [['/afford?buyer=fhb', 'Work it out'], ['/first-home', 'Rent vs buy'], ['/guide/fhb', 'First home guide']]],
    ['Invest', 'paddington-fiveways', 'What will this investment cost me?', 'The weekly cost after tax and the 10-year return under the 2026 rules, new build and established side by side.', [['/analyse', 'Run the numbers'], ['/analyse#newvsold', 'New vs established'], ['/guide/tax-2026', 'What changed']]],
    ['Suburbs', 'fremantle-coast', "What's this suburb like?", 'Prices, rents, growth and risks for every suburb, with how sure each figure is.', [['/suburbs', 'Explore suburbs'], ['/property', 'Price range for a home'], ['/price-check', 'Listing price check']]],
    ['Rates', 'melbourne-southbank', 'What rate can I get?', `Advertised rates from ${rs.lenders} lenders, from their own feeds several times a day, and how much a lender might lend.`, [['/rates', 'Compare rates'], ['/borrowing', 'Borrowing power'], ['/markets', 'Market update']]],
  ];

  main.innerHTML = `
  <section class="home-hero">
    <div>
      <div class="eyebrow">Free · independent · rankings never paid for</div>
      <h1>What can you comfortably afford, <em>and where?</em></h1>
      <p class="lead">Drag the budget on the map to see where a typical home is within reach. Then enter your savings and income for a comfortable price, the cash you need and your schemes.</p>
      <div class="row hero-cta"><a class="btn primary lg" href="/afford?buyer=fhb" data-link id="hero-cta">Work out what I can afford →</a></div>
      <p class="hero-alt">Buying to invest? <a href="/analyse" data-link>Run the 2026 tax-change numbers →</a></p>
    </div>
    <div>${budgetMapHtml({ budget: 750000, city: 'AU' })}</div>
  </section>

  <section class="section">
    <div class="grid g4 paths">${jobs.map(([tag, ph, t, d, links]) => `<div class="card path">${figure(ph, { cls: 'path-photo', sizes: '(max-width: 900px) 100vw, 25vw' })}<span class="tag tag-official">${tag}</span><h3>${t}</h3><p class="muted">${d}</p><div class="path-links">${links.map(([href, l], i) => `<a class="${i ? '' : 'btn primary sm'}" href="${href}" data-link>${l}${i ? ' →' : ''}</a>`).join('')}</div></div>`).join('')}</div>
  </section>

  <section class="section trust" aria-label="What Ownaroo is built on">
    <div><b>${rs.lenders}</b><span>lenders' rates, from their Open Banking feeds several times a day</span></div>
    <div><b>8 of 8</b><span>states and territories: stamp duty, first home concessions and land tax</span></div>
    <div><b>${measured.toLocaleString()}</b><span>suburbs with official sales data; the rest are modelled and labelled</span></div>
    <div><b>Independent</b><span>Rankings are never paid for</span></div>
  </section>

  <section class="section card">
    <div class="spread"><div><div class="eyebrow">Same income, different cities</div><h2 style="margin:4px 0 4px">What one household income comfortably buys in each capital</h2></div><a href="/afford?buyer=fhb" data-link>Use your own numbers →</a></div>
    <div class="inc-controls">
      <label><span>Household income</span><b id="inc-val">$110k</b><input id="inc" type="range" min="50000" max="400000" step="5000" value="110000" aria-label="Household income before tax"></label>
      <div class="seg" id="inc-dep" role="group" aria-label="Deposit"><button type="button" data-d="0.2" class="on">20% deposit</button><button type="button" data-d="0.05">5% deposit</button></div>
    </div>
    <div class="incbars" id="incbars"></div>
    <p class="note" style="margin:10px 0 0">The comfortable price is the same in every city; what changes is how far it goes against each city's median.</p>
    <p class="fine" style="margin-top:12px">Repayments within 30% of before-tax income at ${pct(ooRate.rate, 2)} (RBA average on new owner-occupier loans, ${esc(ooRate.month)}), 30 years, plus the deposit. Savings, debts and stamp duty are in the full tool. Medians: Cotality, month-end ${esc(market.indexMonth || '')}.</p>
  </section>

  <section class="section">
    <div class="spread"><h2>See it in action</h2><a href="/about" data-link>The full two-minute tour →</a></div>
    <div class="seg" id="demo-tabs" role="tablist">${[['afford', 'What can I afford?'], ['calculator', '2026 tax calculator'], ['budgetmap', 'Budget map'], ['estimate', 'Price range for a home'], ['suburb', 'Suburb report'], ['rates', 'Rates']].map(([k, l], i) => `<button type="button" role="tab" data-demo-tab="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('')}</div>
    <div class="demo-stage" id="demo-stage">${demo('afford')}</div>
    <p class="fine" style="margin-top:6px">Recorded with example inputs on 29 September 2026; the live figures change as the data updates.</p>
  </section>

  <section class="section">
    <div class="card tax-band">
      <div><div class="eyebrow">The 2026 tax changes, in numbers</div><h2 style="margin:4px 0 8px">Know what an investment property costs you each week</h2>
      <p class="muted" style="margin:0">Established homes bought after 12 May 2026 can offset rental losses against your salary only until 30 June 2027; after that, losses carry forward or offset rental profit from your other properties. From 1 July 2027 the 50% CGT discount is replaced by indexation with a 30% minimum tax. New builds keep negative gearing and, on sale, can choose the old 50% discount or the new method. The calculator runs your deal both ways, side by side.</p></div>
      <div class="tax-cta"><a class="btn primary" href="/analyse" data-link>Run the numbers →</a><a class="fine" href="/guide/tax-2026" data-link>What changed, in plain English</a></div>
    </div>
  </section>

  <section class="section">
    <div class="spread"><h2>Rates and the RBA</h2><a href="/markets" data-link>Market update →</a></div>
    ${rateWatchCard(rba, { compact: true })}
  </section>

  <section class="section">
    <p class="fine" style="margin-top:12px">General information, not financial advice. Tax, duty and scheme rules checked ${esc(date(RULES.asOf))}; rates checked ${date(rs.updated)}.</p>
  </section>`;

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
    main.querySelectorAll('#demo-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    main.querySelector('#demo-stage').innerHTML = demo(b.dataset.demoTab);
    wireDemos(main);
  });

  // income slider: comfortable price vs median house and unit in each capital
  let dep = 0.2;
  const bars = () => {
    const income = +main.querySelector('#inc').value;
    main.querySelector('#inc-val').textContent = aud(income, { compact: true });
    const r = ooRate.rate / 1200;
    const loan = ((comfortableWeekly(income) * 52) / 12) * (1 - (1 + r) ** -360) / r;
    const price = loan / (1 - dep);
    const top = Math.max(...caps.map(([, c]) => c.medianHouse || 0), price) * 1.05;
    main.querySelector('#incbars').innerHTML = caps
      .sort((a, b) => (a[1].medianHouse || 0) - (b[1].medianHouse || 0))
      .map(([, c]) => {
        const h = c.medianHouse || c.medianDwelling;
        const u = c.medianUnit;
        const verdict = price >= h ? 'A median house is within reach' : u && price >= u ? `A median unit is within reach; a median house needs ${aud(h - price, { compact: true })} more` : `${aud((u || h) - price, { compact: true })} short of a median ${u ? 'unit' : 'home'}`;
        return `<div class="incbar"><span>${esc(c.name)}</span><div class="incbar-track"><div class="incbar-fill" style="width:${(price / top) * 100}%"></div><span class="incbar-val">${aud(price, { compact: true })}</span><i class="incbar-mark" style="left:${(h / top) * 100}%" data-l="house ${aud(h, { compact: true })}"></i>${u ? `<i class="incbar-mark unit" style="left:${(u / top) * 100}%" data-l="unit ${aud(u, { compact: true })}"></i>` : ''}</div><span class="incbar-verdict">${verdict}. <span class="incbar-meds">Median unit ${u ? aud(u, { compact: true }) : '—'} · house ${aud(h, { compact: true })}</span></span></div>`;
      })
      .join('');
  };
  main.querySelector('#inc').addEventListener('input', bars);
  main.querySelector('#inc-dep').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    dep = +b.dataset.d;
    main.querySelectorAll('#inc-dep button').forEach((x) => x.classList.toggle('on', x === b));
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
