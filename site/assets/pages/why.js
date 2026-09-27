import { setMeta } from '../ui.js';
import { load } from '../data.js';

const TOUR = [
  ['valuation', 'Value any home in seconds', 'Type an address and get an estimated value with its likely range, built from official sales data and the home’s bedrooms, bathrooms, land and condition. Buying to live in, you see the cash you need, repayments against the rent you pay now, and what a 2-point rate rise would cost. Add the asking price to see whether it sits inside the likely range.', '/property', 'Value a property'],
  ['afford', 'Know what you can afford, in every state', 'Enter your savings and income once. Keystone works out your buying ceiling in all eight states and territories with each state’s stamp duty and first home concessions, the 5% Deposit Scheme, Help to Buy and the lender stress test, then ranks the places you can buy near where you work.', '/afford?buyer=fhb', 'What can I afford?'],
  ['rent-vs-buy', 'Plan before you search', 'How long it will take to save a deposit, whether buying beats renting over the years you’ll stay, and how much faster the First Home Super Saver scheme gets you there.', '/first-home', 'First home tools'],
  ['map', 'Find the strongest suburbs', 'All 11,042 suburbs scored on yield, price trend, population growth, rental demand, affordability and stability, with a penalty for mining and single-industry towns. Filter by budget and strategy, and see how much of each score rests on measured data.', '/map', 'Suburb scores map'],
  ['suburb', 'Everything about a suburb on one page', 'Prices and rents moved to today, daily index movement, new building nearby, demographics, risks, the full cost to buy, and a report you can download as a PDF.', '/suburb/wa/morley-6062', 'See a suburb report'],
  ['analyser', 'Investment numbers that follow the 2026 rules', 'Stamp duty, LMI, land tax on your total holdings, depreciation and a 10-year after-tax cash flow and return, for one owner or two. It applies the negative gearing cut-off for established homes and splits the capital gain either side of 1 July 2027.', '/analyse', 'Deal analyser'],
  ['rates', 'Every home loan rate, straight from the banks', 'Advertised rates from more than 90 lenders, read from the banks’ own Open Banking feeds and checked several times a day, with the next RBA decision and what it does to your repayments.', '/rates', 'Compare rates'],
];

const WHO = [
  ['First home buyers', 'See exactly what you can afford with the 5% Deposit Scheme, Help to Buy, grants and duty concessions for your state; how long it will take to save; whether to keep renting; and which suburbs near work fit your budget.', '/afford?buyer=fhb'],
  ['Upgraders and downsizers', 'Value your current home and the one you want, see the true cash cost of moving (duty, fees, loan) and compare suburbs on the things that matter for living there.', '/property'],
  ['Investors', 'Rank suburbs by strategy, test any deal against the 2026 negative gearing and CGT rules, model joint ownership and land tax across your holdings, and compare every lender’s rate.', '/analyse'],
  ['Agents and brokers', 'Share a clean suburb report with buyers and vendors, and give clients a neutral price-range check instead of a portal “estimate” with no range. Built to support conversations, not to grade people’s homes.', '/suburbs'],
];

const DIFF = [
  ['The whole decision in one place', 'Most people juggle a listing portal, a bank calculator, a duty calculator, a rates site and a spreadsheet. Keystone joins them up: the same property flows from value, to affordability, to repayments, to the long-term numbers.'],
  ['Honest about uncertainty', 'Every estimate comes with a range, every ranking says whether it is measured or modelled, and the methodology page publishes the model’s own tested error. Prices are only called high or low when they fall outside the range.'],
  ['Current rules, all eight states', 'The 2026 negative gearing and CGT changes, each state’s stamp duty and first home thresholds, the 5% Deposit Scheme caps, Help to Buy, the First Home Super Saver scheme and the RBA calendar, checked and dated.'],
  ['Official, live data', 'Sales medians from state governments, the ABS census, building approvals and population estimates, the RBA, a daily home value index, and every bank’s own Open Banking rate feed, refreshed through the day.'],
  ['Independent', 'Keystone doesn’t sell property or loans. Lenders don’t pay to appear and rates are ranked on rate alone. If a paid referral is ever added it will be labelled, and it will never change a number.'],
  ['Free, fast and private', 'No account needed. Pages load in under a second, work on your phone, and your watchlist stays in your own browser.'],
];

// Typical of each category; individual sites differ.
const CMP = [
  ['Address value estimate', 'Yes, with a range', 'Often, usually one figure', 'Yes', '—'],
  ['Cash needed, repayments vs rent for your own situation', 'Yes', 'Basic calculators', 'Rarely', 'Repayment calculators'],
  ['Buying ceiling in every state with duty concessions, 5% Deposit Scheme and Help to Buy', 'Yes', 'Rarely', 'Rarely', 'Rarely'],
  ['Scores and risks for every suburb', 'Yes, 11,042', 'Suburb profiles (prices, not scores)', 'Yes, usually paid', '—'],
  ['After-tax investment analysis with the 2026 negative gearing and CGT rules', 'Yes', 'No', 'Rarely', 'No'],
  ['Every lender’s advertised rate from Open Banking', 'Yes, 90+ lenders', 'Partner lenders', 'No', 'Yes'],
  ['Shows how certain each number is', 'Yes', 'Rarely', 'Sometimes', '—'],
  ['Homes for sale', 'Links to the portals (live listings when connected)', 'Yes', 'Some', 'No'],
  ['Cost', 'Free', 'Free', 'Subscription', 'Free'],
];

export default async function whyPage(main) {
  setMeta({ title: 'Why Keystone: what it does for home buyers and investors', description: 'How Keystone helps first home buyers, upgraders and investors find, value and pay for the right property, and how it differs from listing portals, paid data tools and rate comparison sites.' });
  const [rs, home] = await Promise.all([load('rates-summary').catch(() => null), load('home').catch(() => null)]);
  const suburbs = home?.counts?.suburbs?.toLocaleString() || '11,042';
  main.innerHTML = `
  <section class="why-hero">
    <div>
      <div class="eyebrow">Why Keystone</div>
      <h1>Everything you need to buy the right home, <em>in one place.</em></h1>
      <p class="lead">Keystone is a free, independent Australian property platform. It values any home, shows what you can afford in every state, scores all ${suburbs} suburbs, runs the long-term numbers under the 2026 tax rules and compares ${rs ? `${rs.rows.toLocaleString()} rates from ${rs.lenders}` : 'every'} lenders, all from official data that updates through the day.</p>
      <div class="row"><a class="btn primary" href="/afford?buyer=fhb" data-link>Start with what you can afford</a><a class="btn" href="/property" data-link>Value a property</a></div>
    </div>
    <figure class="why-video">
      <video controls playsinline preload="metadata" poster="/assets/media/tour-poster.jpg" aria-label="90-second tour of Keystone">
        <source src="/assets/media/keystone-tour.mp4" type="video/mp4">
      </video>
      <figcaption class="fine">A 90-second tour: valuing a home, affordability, suburb scores, the deal analyser and rates.</figcaption>
    </figure>
  </section>

  <section class="section">
    <h2>Built for everyone looking for a home</h2>
    <div class="grid g4 why-who">${WHO.map(([t, d, href]) => `<a class="card product" href="${href}" data-link><h3>${t}</h3><p class="muted">${d}</p></a>`).join('')}</div>
  </section>

  <section class="section">
    <h2>What it does</h2>
    ${TOUR.map(([img, t, d, href, cta], i) => `<div class="why-row ${i % 2 ? 'flip' : ''}">
      <a class="why-shot" href="${href}" data-link><img src="/assets/media/${img}.jpg" alt="${t}: Keystone screen" loading="lazy" width="1280" height="800"></a>
      <div><h3>${t}</h3><p class="muted">${d}</p><a class="btn sm" href="${href}" data-link>${cta} →</a></div>
    </div>`).join('')}
  </section>

  <section class="section">
    <h2>What makes Keystone different</h2>
    <div class="grid g3">${DIFF.map(([t, d]) => `<div class="card flat"><h3 style="font-size:17px">${t}</h3><p class="muted" style="margin:0">${d}</p></div>`).join('')}</div>
  </section>

  <section class="section">
    <h2>How it compares</h2>
    <p class="muted">What each kind of site typically offers. Individual sites differ, and many do some of these things well; Keystone’s aim is to put all of them together, free.</p>
    <div class="tbl-wrap"><table class="why-cmp"><thead><tr><th></th><th>Keystone</th><th>Listing portals</th><th>Paid suburb-data tools</th><th>Rate comparison sites</th></tr></thead><tbody>
      ${CMP.map(([k, ...v]) => `<tr><td>${k}</td>${v.map((x, i) => `<td class="${i === 0 ? 'ks' : ''}">${x}</td>`).join('')}</tr>`).join('')}
    </tbody></table></div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Why it’s the best place to start</h3><p class="muted">The expensive mistakes in property happen before the search: buying at the top of your budget, in the wrong area, or without knowing the true cost of holding it. Keystone answers those questions first, so when you open the listings you already know your ceiling, your target suburbs, the cash you need and what a fair price looks like.</p></div>
    <div class="card"><h3>What Keystone isn’t</h3><p class="muted">It isn’t a lender, broker, agent or financial adviser, and its estimates are general information that can be wrong. It tells you when a figure is modelled rather than measured, and a bank valuation, recent sales in the street and independent advice still matter for a specific purchase.</p></div>
  </section>

  <section class="section callout green" style="text-align:center"><h2 style="margin-top:0">Try it with your own numbers</h2><p>It takes a minute and you don’t need an account.</p><div class="row" style="justify-content:center"><a class="btn primary" href="/afford?buyer=fhb" data-link>What can I afford?</a><a class="btn" href="/first-home" data-link>First home tools</a><a class="btn" href="/analyse" data-link>Analyse a deal</a></div></section>`;
}
