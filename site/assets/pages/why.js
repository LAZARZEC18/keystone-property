import { demo } from '../demo.js';


// chapter starts in seconds (scripts/media/tour.mjs writes the same list to ownaroo-tour.json)
const TOUR_CH = [['Where your budget reaches', 0], ['What you can comfortably afford', 18.33], ['A price range for a home', 39.27], ['The 2026 tax changes', 56.2], ['A suburb report', 74.23], ['Lender rates', 89.63]];

export const WHO = [
  ['First home buyers', 'See exactly what you can afford with the 5% Deposit Scheme, Help to Buy, grants and duty concessions for your state; how long it will take to save; whether to keep renting; and which suburbs near work fit your budget.', '/afford?buyer=fhb'],
  ['Upgraders and downsizers', 'See a price range for your current home and the one you want, see the true cash cost of moving (duty, fees, loan) and compare suburbs on the things that matter for living there.', '/property'],
  ['Investors', 'Rank suburbs by strategy, test any deal against the 2026 negative gearing and CGT rules, model joint ownership and land tax across your holdings, and compare advertised rates from more than 90 lenders.', '/analyse'],
];


// "What it does": a screenshot and a paragraph for each tool (images in /assets/media, re-shot 29 Sept 2026)
export const TOUR = [
  ['afford', 'Know what you can comfortably afford', 'Enter your savings and income once. Ownaroo works out a comfortable price where you want to buy, the cash you need and the weekly repayment, with your state’s stamp duty and first home concessions, the 5% Deposit Scheme, Help to Buy, Keystart and the lender stress test, then ranks the suburbs where a typical home fits.', '/afford?buyer=fhb', 'What can I afford?'],
  ['analyser', 'Investment numbers that follow the 2026 rules', 'Stamp duty, LMI, land tax on your total holdings, depreciation and a 10-year after-tax cash flow and return, for one owner or two. It runs the same deal as a new build and as an established home, side by side, and compares the return with paying down your home loan.', '/analyse', '2026 tax-change calculator'],
  ['valuation', 'A price range for a typical home', 'Type an address and get a likely price range for a typical home like it in that suburb, with how far to trust it, the cash you need, the repayments, and links to the street and the official hazard maps.', '/property', 'Price range for a home'],
  ['map', 'Find the strongest suburbs', 'Every suburb with Census data (11,042) scored on yield, population growth net of new building, rental demand, affordability and stability. Filter by budget and strategy, and see how sure each figure is.', '/suburbs', 'Explore suburbs'],
  ['suburb', 'Everything about a suburb on one page', 'Prices and rents at the latest month-end, the trend, new building nearby, the people, the risks, the full cost to buy, and a report you can save as a PDF.', '/suburb/wa/morley-6062', 'See a suburb report'],
  ['price-check', 'Which buyers does a price shut out?', 'For agents and sellers: enter a listing price and see which first home buyer schemes still work at that price, the prices that bring buyers back, and a "Can you afford this home?" link and QR code for the listing.', '/price-check', 'Check a listing price'],
  ['rent-vs-buy', 'Plan before you search', 'How long it will take to save a deposit, whether buying beats renting over the years you’ll stay, and how much faster the First Home Super Saver scheme gets you there.', '/first-home', 'First home tools'],
  ['rates', 'Home loan rates, straight from lenders’ own feeds', 'Advertised rates from more than 90 lenders that publish Open Banking product data, checked several times a day, with the lowest rate open to anyone up front and the next RBA decision.', '/rates', 'Compare rates'],
];

export const DIFF = [
  ['The whole decision in one place', 'Most people juggle a listing portal, a bank calculator, a duty calculator, a rates site and a spreadsheet. Ownaroo joins them up: the same property flows from a price range, to what you can afford, to repayments, to the long-term numbers.'],
  ['Honest about uncertainty', 'Every price says how sure it is, every ranking says whether it rests on measured or modelled data, and the methodology page publishes the model’s own tested error.'],
  ['Current rules, every state and territory', 'The 2026 negative gearing and CGT changes, each state’s stamp duty and first home thresholds, the scheme price caps, Help to Buy, Keystart, the First Home Super Saver scheme and the RBA calendar, checked and dated.'],
  ['Official data, dated', 'Official sales medians where states publish them, the ABS Census, income, building approvals and population estimates, the RBA and the Open Banking rate feeds of more than 90 lenders. Anything modelled is labelled.'],
  ['Independent', 'Ownaroo doesn’t sell property or loans. Rankings are never paid for: rates are ranked on rate alone and suburbs by the same formula everywhere.'],
  ['Free, fast and private', 'No account needed. It works on your phone, and your saved suburbs and deals stay in your own browser (you can move them with a file).'],
];

/** The showcase part of the About page: tour, each tool in action, what it does, what makes it different. */
export function showcase(rs, companyHtml) {
  return `
  <section class="why-hero">
    <div>
      <div class="eyebrow">About Ownaroo</div>
      <h1>Everything you need to buy the right home, <em>in one place.</em></h1>
      <p class="lead">Ownaroo is a free, independent Australian property site. It answers four questions: what can I afford, what will this investment really cost, what is this suburb like, and what rate can I get${rs ? `, with ${rs.rows.toLocaleString()} rates from ${rs.lenders} lenders` : ''}.</p>
      <div class="row"><a class="btn primary" href="/afford?buyer=fhb" data-link>Start with what you can afford</a><a class="btn" href="/analyse" data-link>2026 tax-change calculator</a></div>
    </div>
    ${tourFigure()}
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
      <a class="why-shot" href="${href}" data-link><img src="/assets/media/${img}.jpg" alt="${t}: Ownaroo screen" loading="lazy" width="1280" height="800"></a>
      <div><h3>${t}</h3><p class="muted">${d}</p><a class="btn sm" href="${href}" data-link>${cta} →</a></div>
    </div>`).join('')}
  </section>

  <section class="section">
    <h2>What makes Ownaroo different</h2>
    <div class="grid g3">${DIFF.map(([t, d]) => `<div class="card flat"><h3 style="font-size:17px">${t}</h3><p class="muted" style="margin:0">${d}</p></div>`).join('')}</div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Why start here</h3><p class="muted">The expensive mistakes in property happen before the search: buying at the top of your budget, in the wrong area, or without knowing the true cost of holding it. Ownaroo answers those questions first, so when you open the listings you already know your comfortable price, your target suburbs and the cash you need.</p></div>
    <div class="card"><h3>What Ownaroo isn’t</h3><p class="muted">It isn’t a lender, broker, agent or financial adviser, and its estimates are general information that can be wrong. A bank valuation, recent sales in the street and independent advice still matter for a specific purchase.</p></div>
  </section>

  <section class="section"><div class="prose" style="max-width:760px">${companyHtml}</div></section>

  <section class="section callout green" style="text-align:center"><h2 style="margin-top:0">Try it with your own numbers</h2><p>It takes a minute and you don’t need an account.</p><div class="row" style="justify-content:center"><a class="btn primary" href="/afford?buyer=fhb" data-link>What can I afford?</a><a class="btn" href="/first-home" data-link>First home tools</a><a class="btn" href="/analyse" data-link>2026 tax-change calculator</a></div></section>`;
}

/** The two-minute tour with chapter buttons (used on the About page). */
export function tourFigure() {
  return `<figure class="why-video">
      <video id="tour" controls playsinline preload="metadata" poster="/assets/media/tour-poster.jpg" aria-label="Two-minute tour of Ownaroo">
        <source src="/assets/media/ownaroo-tour-720.mp4" type="video/mp4" media="(max-width: 900px)">
        <source src="/assets/media/ownaroo-tour.mp4" type="video/mp4">
        <track kind="captions" src="/assets/media/ownaroo-tour.en.vtt" srclang="en" label="English">
        <track kind="chapters" src="/assets/media/ownaroo-tour.chapters.vtt" srclang="en" label="Chapters" default>
      </video>
      <div class="tour-chapters" role="group" aria-label="Jump to a chapter">${TOUR_CH.map(([t, sec], i) => `<button type="button" data-t="${sec}" class="${i ? '' : 'on'}"><span>${String(i + 1).padStart(2, '0')}</span>${t}</button>`).join('')}</div>
      <figcaption class="fine">A two-minute tour in six chapters. Pick a chapter to jump to it.</figcaption>
    </figure>`;
}

export function wireTour(main) {
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

// /why was merged into /about
export default async function whyPage() {
  const { navigate } = await import('../app.js');
  navigate('/about', true);
}
