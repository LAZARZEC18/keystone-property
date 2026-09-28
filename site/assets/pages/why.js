import { demo } from '../demo.js';
import { setMeta } from '../ui.js';
import { load } from '../data.js';

const TOUR = [
  ['valuation', 'A suburb-based price range for a typical home', 'Type an address and get a likely price range for a typical home like it, built from official sales data and the home’s bedrooms, bathrooms, land and condition, plus a plain statement of how far to trust it in that state. Buying to live in, you see the cash you need, repayments against the rent you pay now, and what a 2-point rate rise would cost. Add the asking price to see whether it sits in the lower, middle or upper part of the range.', '/property', 'Price range for a home'],
  ['afford', 'Know what you can afford, in every state and territory', 'Enter your savings and income once. Market Lenz works out a comfortable price where you want to buy and your ceiling in every state and territory, with each state’s stamp duty and first home concessions, the 5% Deposit Scheme, Help to Buy and the lender stress test, then ranks the places you can buy near where you work.', '/afford?buyer=fhb', 'What can I afford?'],
  ['rent-vs-buy', 'Plan before you search', 'How long it will take to save a deposit, whether buying beats renting over the years you’ll stay, and how much faster the First Home Super Saver scheme gets you there.', '/first-home', 'First home tools'],
  ['map', 'Find the strongest suburbs', 'Every suburb and locality with Census data (11,042) scored on yield, population growth net of new building, rental demand, affordability and stability, with a penalty for mining and single-industry towns. Filter by budget and strategy, and see how much of each score rests on measured data: about 3,100 suburbs have official suburb or postcode sales, the rest are modelled and labelled that way.', '/map', 'Suburb scores map'],
  ['suburb', 'Everything about a suburb on one page', 'Prices and rents at the latest month-end, the 3-month trend, new building nearby, demographics, risks, the full cost to buy, and a report you can download as a PDF.', '/suburb/wa/morley-6062', 'See a suburb report'],
  ['analyser', 'Investment numbers that follow the 2026 rules', 'Stamp duty, LMI, land tax on your total holdings, depreciation and a 10-year after-tax cash flow and return, for one owner or two. It applies the negative gearing cut-off for established homes and splits the capital gain either side of 1 July 2027.', '/analyse', '2026 tax-change calculator'],
  ['rates', 'Every home loan rate, straight from the banks', 'Advertised rates from more than 90 lenders, read from the banks’ own Open Banking feeds and checked several times a day, with the next RBA decision and what it does to your repayments.', '/rates', 'Compare rates'],
];

// chapter starts in seconds (scripts/media/tour.mjs writes the same list to marketlenz-tour.json)
const TOUR_CH = [['Where your budget reaches', 0], ['What you can comfortably afford', 22.1], ['A price range for a home', 46.5], ['The 2026 tax changes', 64.93], ['A suburb report', 83.33], ['Every lender’s rate', 100.87]];

const WHO = [
  ['First home buyers', 'See exactly what you can afford with the 5% Deposit Scheme, Help to Buy, grants and duty concessions for your state; how long it will take to save; whether to keep renting; and which suburbs near work fit your budget.', '/afford?buyer=fhb'],
  ['Upgraders and downsizers', 'See a price range for your current home and the one you want, see the true cash cost of moving (duty, fees, loan) and compare suburbs on the things that matter for living there.', '/property'],
  ['Investors', 'Rank suburbs by strategy, test any deal against the 2026 negative gearing and CGT rules, model joint ownership and land tax across your holdings, and compare every lender’s rate.', '/analyse'],
];

const DIFF = [
  ['The whole decision in one place', 'Most people juggle a listing portal, a bank calculator, a duty calculator, a rates site and a spreadsheet. Market Lenz joins them up: the same property flows from a price range, to what you can afford, to repayments, to the long-term numbers.'],
  ['Honest about uncertainty', 'Every estimate comes with a range and says whether the model has been tested in that state; every ranking says whether it is measured or modelled; and the methodology page publishes the model’s own tested error. An asking price is placed within the range, and only called high or low outside it.'],
  ['Current rules, every state and territory', 'The 2026 negative gearing and CGT changes, each state’s stamp duty and first home thresholds, the 5% Deposit Scheme caps, Help to Buy, the First Home Super Saver scheme and the RBA calendar, checked and dated.'],
  ['Official data, dated', 'Sales medians from state governments, the ABS census, building approvals and population estimates, the RBA, Cotality’s month-end home value index, and every bank’s own Open Banking rate feed, checked several times a day.'],
  ['Independent', 'Market Lenz doesn’t sell property or loans. Lenders don’t pay to appear and rates are ranked on rate alone. If a paid referral is ever added it will be labelled, and it will never change a number.'],
  ['Free, fast and private', 'No account needed. It works on your phone, and your saved suburbs and deals stay in your own browser.'],
];

export default async function whyPage(main) {
  setMeta({ title: 'Why Market Lenz: what it does for home buyers and investors', description: 'How Market Lenz helps first home buyers, upgraders and investors work out what they can afford, what a purchase really costs and which suburbs fit.' });
  const [rs, home] = await Promise.all([load('rates-summary').catch(() => null), load('home').catch(() => null)]);
  const suburbs = home?.counts?.suburbs?.toLocaleString() || '11,042';
  main.innerHTML = `
  <section class="why-hero">
    <div>
      <div class="eyebrow">Why Market Lenz</div>
      <h1>Everything you need to buy the right home, <em>in one place.</em></h1>
      <p class="lead">Market Lenz is a free, independent Australian property platform. It shows what you can comfortably afford and your ceiling in every state and territory, gives an honest price range for a typical home in any suburb, runs the long-term numbers under the 2026 tax rules and compares ${rs ? `${rs.rows.toLocaleString()} rates from ${rs.lenders}` : 'every'} lenders.</p>
      <div class="row"><a class="btn primary" href="/afford?buyer=fhb" data-link>Start with what you can afford</a><a class="btn" href="/analyse" data-link>2026 tax-change calculator</a></div>
    </div>
    <figure class="why-video">
      <video id="tour" controls playsinline preload="metadata" poster="/assets/media/tour-poster.jpg" aria-label="Two-minute tour of Market Lenz">
        <source src="/assets/media/marketlenz-tour.mp4" type="video/mp4">
        <track kind="captions" src="/assets/media/marketlenz-tour.en.vtt" srclang="en" label="English">
        <track kind="chapters" src="/assets/media/marketlenz-tour.chapters.vtt" srclang="en" label="Chapters" default>
      </video>
      <div class="tour-chapters" role="group" aria-label="Jump to a chapter">${TOUR_CH.map(([t, sec], i) => `<button type="button" data-t="${sec}" class="${i ? '' : 'on'}"><span>${String(i + 1).padStart(2, '0')}</span>${t}</button>`).join('')}</div>
      <figcaption class="fine">A two-minute tour in six chapters. Pick a chapter to jump to it.</figcaption>
    </figure>
  </section>

  <section class="section">
    <h2>Each tool in action</h2>
    <div class="demo-grid">${['budgetmap', 'afford', 'calculator', 'estimate', 'suburb', 'rates'].map((c) => demo(c)).join('')}</div>
  </section>

  <section class="section">
    <h2>Built for people buying a home</h2>
    <div class="grid g3 why-who">${WHO.map(([t, d, href]) => `<a class="card product" href="${href}" data-link><h3>${t}</h3><p class="muted">${d}</p></a>`).join('')}</div>
  </section>

  <section class="section">
    <h2>What it does</h2>
    ${TOUR.map(([img, t, d, href, cta], i) => `<div class="why-row ${i % 2 ? 'flip' : ''}">
      <a class="why-shot" href="${href}" data-link><img src="/assets/media/${img}.jpg" alt="${t}: Market Lenz screen" loading="lazy" width="1280" height="800"></a>
      <div><h3>${t}</h3><p class="muted">${d}</p><a class="btn sm" href="${href}" data-link>${cta} →</a></div>
    </div>`).join('')}
  </section>

  <section class="section">
    <h2>What makes Market Lenz different</h2>
    <div class="grid g3">${DIFF.map(([t, d]) => `<div class="card flat"><h3 style="font-size:17px">${t}</h3><p class="muted" style="margin:0">${d}</p></div>`).join('')}</div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Why start here</h3><p class="muted">The expensive mistakes in property happen before the search: buying at the top of your budget, in the wrong area, or without knowing the true cost of holding it. Market Lenz answers those questions first, so when you open the listings you already know your comfortable price, your target suburbs, the cash you need and what similar homes typically cost.</p></div>
    <div class="card"><h3>What Market Lenz isn’t</h3><p class="muted">It isn’t a lender, broker, agent or financial adviser, and its estimates are general information that can be wrong. It tells you when a figure is modelled rather than measured, and a bank valuation, recent sales in the street and independent advice still matter for a specific purchase.</p></div>
  </section>

  <section class="section callout green" style="text-align:center"><h2 style="margin-top:0">Try it with your own numbers</h2><p>It takes a minute and you don’t need an account.</p><div class="row" style="justify-content:center"><a class="btn primary" href="/afford?buyer=fhb" data-link>What can I afford?</a><a class="btn" href="/first-home" data-link>First home tools</a><a class="btn" href="/analyse" data-link>2026 tax-change calculator</a></div></section>`;
  const v = main.querySelector('#tour');
  const btns = [...main.querySelectorAll('.tour-chapters button')];
  btns.forEach((b) => b.addEventListener('click', () => {
    v.currentTime = +b.dataset.t + 0.05;
    btns.forEach((x) => x.classList.toggle('on', x === b));
    v.play().catch(() => {});
  }));
  v?.addEventListener('timeupdate', () => {
    let k = 0;
    TOUR_CH.forEach(([, sec], i) => { if (v.currentTime >= sec) k = i; });
    btns.forEach((b, i) => b.classList.toggle('on', i === k));
  });
}
