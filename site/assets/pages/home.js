import { esc, aud, pct, setMeta, date } from '../ui.js';
import { load, typicalRate, suburbs, suburbUrl } from '../data.js';
import { navigate } from '../app.js';
import { rateWatchCard } from '../ratewatch.js';
import { RULES } from '../rules.js';
import { demo, wireDemos } from '../demo.js';
import { trendWord } from '../live.js';
import { photoCard, figure, strip, photo, photoCredits } from '../photos.js';
import { budgetMapHtml, wireBudgetMap } from '../budgetmap.js';
import { comfortableWeekly } from '../rules.js';

// The home page leads with the two tools Ownaroo does best: what you can afford, and the 2026 tax-change numbers.
// Suburb scores and estimates sit behind them until the suburb data is licensed and measured everywhere.
export default async function home(main) {
  setMeta({ title: 'What can you comfortably afford, and where?', description: 'Free and independent for Australian home buyers: a comfortable price where you want to buy, the schemes you qualify for (5% Deposit Scheme, Help to Buy, Keystart and state schemes), the real weekly cost of an investment under the 2026 tax rules, and advertised rates from 90+ lenders.' });
  const [market, rs, rba, idx] = await Promise.all([load('market'), load('rates-summary'), load('rba'), suburbs()]);
  const oo = rs.best.OO_PI_variable?.[0];
  const caps = Object.entries(market.regions).filter(([, r]) => r.capital);
  const inv = typicalRate(rba, 'INV');
  const ooRate = typicalRate(rba, 'OO');
  const measured = idx.list.filter((s) => s.conf === 'high' || s.conf === 'medium').length;

  const paths = [
    ['First home', 'sherwood-queenslander', 'Buying your first home', 'A comfortable price where you want to live, the cash you need, which schemes you qualify for (including Keystart in WA), how long saving takes and whether buying beats renting.', [['/afford?buyer=fhb', 'What can I afford?'], ['/first-home', 'Rent vs buy and saving'], ['/guide/fhb', 'First home guide']]],
    ['Moving', 'fremantle-coast', 'Selling and buying again', 'What you can comfortably afford for the next home, the full cost of moving (duty, fees, the new loan) and a price range for a typical home like the one you want.', [['/afford?buyer=owner', 'What can I afford?'], ['/property', 'Price range for a home'], ['/rates', 'Compare loan rates']]],
    ['Investing', 'paddington-fiveways', 'Buying to rent out', 'The weekly cost after tax and the 10-year return under the 2026 negative gearing and CGT rules, with your other properties, for one owner or two, and whether it beats a term deposit.', [['/analyse', '2026 tax-change calculator'], ['/rates', 'Rates from 90+ lenders'], ['/guide/tax-2026', 'What changed in 2026']]],
  ];

  main.innerHTML = `
  <section class="home-hero">
    <div>
      <div class="eyebrow">Free · independent · for Australian home buyers</div>
      <h1>What can you comfortably afford, <em>and where?</em></h1>
      <p class="lead">Drag the budget on the map to see where a typical home is within reach. Then enter your savings and income: Ownaroo works out a comfortable price where you want to buy, the cash you need, and the schemes you qualify for.</p>
      <div class="row hero-cta"><a class="btn primary lg" href="/afford?buyer=fhb" data-link id="hero-cta">Work out what I can afford →</a></div>
      <p class="hero-alt">Buying to invest? <a href="/analyse" data-link>Run the 2026 tax-change numbers →</a></p>
    </div>
    <div>${budgetMapHtml({ budget: 750000, city: 'AU' })}</div>
  </section>

  <section class="section trust" aria-label="What Ownaroo is built on">
    <div><b>${rs.lenders}</b><span>lenders' rates, read from their Open Banking feeds several times a day</span></div>
    <div><b>8 of 8</b><span>states and territories: stamp duty, first home concessions and land tax</span></div>
    <div><b>${measured.toLocaleString()}</b><span>suburbs with official sales data; the rest are modelled and labelled that way</span></div>
    <div><b>$0</b><span>No sign-up, no ads, and no lender pays to be listed</span></div>
  </section>

  <section class="section">
    <div class="hero-steps card how-row">
      <div class="eyebrow">How it works</div>
      <ol class="how-steps">
        <li><b>Your numbers.</b> Where you want to buy, your savings, income and debts.</li>
        <li><b>A comfortable price,</b> with repayments under 30% of your income, and the most a lender might stretch to.</li>
        <li><b>The real cost.</b> Cash up front, repayments against your rent now, or an investment's weekly cost after tax.</li>
        <li><b>Your next step:</b> pre-approval from a lender or broker. Ownaroo doesn't sell loans or refer you anywhere.</li>
      </ol>
      <p class="fine">Tax, duty and scheme rules checked ${esc(date(RULES.asOf))}. <a href="/why" data-link>Two-minute tour →</a></p>
    </div>
  </section>

  <section class="section">
    <h2>Where are you starting?</h2>
    <div class="grid g3 paths">${paths.map(([tag, ph, t, d, links]) => `<div class="card path">${figure(ph, { cls: 'path-photo', sizes: '(max-width: 900px) 100vw, 33vw' })}<span class="tag tag-official">${tag}</span><h3>${t}</h3><p class="muted">${d}</p><div class="path-links">${links.map(([href, l], i) => `<a class="${i ? '' : 'btn primary sm'}" href="${href}" data-link>${l}${i ? ' →' : ''}</a>`).join('')}</div></div>`).join('')}</div>
  </section>

  <section class="section card">
    <div class="spread"><div><div class="eyebrow">Try it</div><h2 style="margin:4px 0 4px">What a household income comfortably buys in each capital</h2></div><a href="/afford?buyer=fhb" data-link>Use your own numbers →</a></div>
    <div class="inc-controls">
      <label><span>Household income</span><b id="inc-val">$110k</b><input id="inc" type="range" min="50000" max="400000" step="5000" value="110000" aria-label="Household income before tax"></label>
      <div class="seg" id="inc-dep" role="group" aria-label="Deposit"><button type="button" data-d="0.2" class="on">20% deposit</button><button type="button" data-d="0.05">5% deposit</button></div>
    </div>
    <div class="incbars" id="incbars"></div>
    <p class="fine" style="margin-top:12px">Comfortable price: repayments within 30% of before-tax income at ${pct(ooRate.rate, 2)} (the RBA's average rate on new owner-occupier loans, ${esc(ooRate.month)}), over 30 years, plus the deposit. It ignores savings, debts and stamp duty, which the full tool includes. Markers show the median house and unit (Cotality, month-end ${esc(market.indexMonth || '')}).</p>
  </section>

  <section class="section">
    <div class="spread"><h2>See it in action</h2><a href="/why" data-link>The full Two-minute tour →</a></div>
    <div class="seg" id="demo-tabs" role="tablist">${[['afford', 'What can I afford?'], ['calculator', '2026 tax calculator'], ['estimate', 'Price range for a home'], ['suburb', 'Suburb report']].map(([k, l], i) => `<button type="button" role="tab" data-demo-tab="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('')}</div>
    <div class="demo-stage" id="demo-stage">${demo('afford')}</div>
    <p class="fine" style="margin-top:6px">Recorded with example inputs in September 2026; the live figures change as the data updates.</p>
  </section>

  <section class="section">
    <div class="card tax-band">
      <div><div class="eyebrow">The 2026 tax changes, in numbers</div><h2 style="margin:4px 0 8px">Know what an investment property costs you each week</h2>
      <p class="muted" style="margin:0">Established homes bought after 12 May 2026 can offset rental losses against your salary only until 30 June 2027; after that, losses carry forward or offset rental profit from your other properties. From 1 July 2027 the 50% CGT discount is replaced by indexation with a 30% minimum tax. New builds keep the old treatment. The calculator applies all of it, with stamp duty, mortgage insurance, land tax and depreciation.</p></div>
      <div class="tax-cta"><a class="btn primary" href="/analyse" data-link>Run the numbers →</a><a class="fine" href="/guide/tax-2026" data-link>What changed, in plain English</a></div>
    </div>
  </section>

  <section class="section">
    <div class="spread"><h2>Rates and the RBA</h2><a href="/markets" data-link>Market dashboard →</a></div>
    ${rateWatchCard(rba, { compact: true })}
  </section>

  <section class="section">
    <p class="fine" style="margin-top:12px">Ownaroo is general information, not financial advice: it doesn’t know your circumstances and isn’t a lender, broker or agent. Rates last checked ${date(rs.updated)}.</p>
  </section>`;

  const destroyMap = wireBudgetMap(main, idx.list, {
    onPick: (s) => navigate(suburbUrl(s)),
    onChange: (st) => {
      const where = st.city === 'AU' ? '' : `&where=r:${st.city}`;
      main.querySelector('#hero-cta').setAttribute('href', `/afford?buyer=fhb${where}`);
    },
  });
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
