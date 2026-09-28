import { esc, aud, pct, setMeta, date } from '../ui.js';
import { load, typicalRate } from '../data.js';
import { attachSearch } from '../app.js';
import { rateWatchCard } from '../ratewatch.js';
import { RULES } from '../rules.js';

// The home page leads with the two tools Keyzing does best: what you can afford, and the 2026 tax-change numbers.
// Suburb scores and estimates sit behind them until the suburb data is licensed and measured everywhere.
export default async function home(main) {
  setMeta({ title: 'What can you afford, and what do the 2026 tax changes mean for you?', description: 'Free and independent: your price ceiling in every state with the 5% Deposit Scheme and stamp duty concessions, and a calculator for the 2026 negative gearing and CGT changes. Plus every lender’s rate.' });
  const [market, rs, rba, idx] = await Promise.all([load('market'), load('rates-summary'), load('rba'), load('index')]);
  const oo = rs.best.OO_PI_variable?.[0];
  const caps = Object.entries(market.regions).filter(([, r]) => r.capital);
  const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  const inv = typicalRate(rba, 'INV');

  const paths = [
    ['First home', 'Buying my first home', 'Your price ceiling in every state with the 5% Deposit Scheme, Help to Buy and stamp duty concessions, which schemes you qualify for, how long it takes to save and whether buying beats renting.', [['/afford?buyer=fhb', 'What can I afford?'], ['/first-home', 'Rent vs buy and saving'], ['/guide#fhb', 'First home guide']]],
    ['Investing', 'Buying to rent out', 'The weekly cost after tax, the 10-year return and whether it beats a term deposit, under the 2026 negative gearing and CGT rules, for one owner or two.', [['/analyse', '2026 tax-change calculator'], ['/borrowing', 'Borrowing power'], ['/guide#tax-2026', 'What changed in 2026']]],
    ['Moving', 'Selling and buying again', 'What you can afford for the next home, the full cost of moving (duty, fees, the new loan) and a suburb-based price range for a typical home like the one you want.', [['/afford?buyer=owner', 'What can I afford?'], ['/property', 'Suburb estimate for a home'], ['/rates', 'Compare loan rates']]],
  ];

  main.innerHTML = `
  <section class="hero hero-light">
    <div>
      <div class="eyebrow">Free · independent · no sign-up</div>
      <h1>What can you afford, <em>and what will it really cost?</em></h1>
      <p class="lead">Enter your savings and income. Keyzing works out your price ceiling in every state with the 5% Deposit Scheme, Help to Buy and stamp duty concessions. Buying to invest? It runs the weekly cost and 10-year return under the 2026 negative gearing and CGT rules.</p>
      <div class="row hero-cta"><a class="btn primary lg" href="/afford?buyer=fhb" data-link>Work out what I can afford →</a><a class="btn lg" href="/analyse" data-link>2026 tax-change calculator</a></div>
      <form class="hero-search" autocomplete="off" onsubmit="return false" role="search">
        <label class="fine" for="hq">Or look up a suburb, postcode or address</label>
        <input id="hq" type="search" placeholder="e.g. Morley WA 6062" />
        <div class="ac" id="hac" hidden></div>
      </form>
    </div>
    <div class="hero-steps card">
      <div class="eyebrow">How it works</div>
      <ol>
        <li><b>Your numbers.</b> Savings, income, debts and whether it's your first home.</li>
        <li><b>Your ceiling in all 8 states,</b> with each state's duty and first home concessions, the lender's 3-point buffer and the schemes you qualify for.</li>
        <li><b>The real cost.</b> Cash up front and repayments against your rent now, or for an investment the weekly cost after tax under the 2026 rules.</li>
        <li><b>Your next step:</b> pre-approval from a lender or broker. Keyzing doesn't sell loans or refer you anywhere.</li>
      </ol>
      <p class="fine">Tax, duty and scheme rules checked ${esc(date(RULES.asOf))}. <a href="/why" data-link>90-second tour →</a></p>
    </div>
  </section>

  <section class="section">
    <h2>Where are you starting?</h2>
    <div class="grid g3 paths">${paths.map(([tag, t, d, links]) => `<div class="card path"><span class="tag tag-official">${tag}</span><h3>${t}</h3><p class="muted">${d}</p><div class="path-links">${links.map(([href, l], i) => `<a class="${i ? '' : 'btn primary sm'}" href="${href}" data-link>${l}${i ? ' →' : ''}</a>`).join('')}</div></div>`).join('')}</div>
  </section>

  <section class="section">
    <div class="card tax-band">
      <div><div class="eyebrow">The 2026 tax changes, in numbers</div><h2 style="margin:4px 0 8px">Know what an investment property costs you each week</h2>
      <p class="muted" style="margin:0">Established homes bought after 12 May 2026 can offset rental losses against your salary only until 30 June 2027; after that, losses carry forward. From 1 July 2027 the 50% CGT discount is replaced by indexation with a 30% minimum tax. New builds keep the old treatment. The calculator applies all of it, with stamp duty, LMI, land tax and depreciation, and tells you whether the projected return beats a term deposit.</p></div>
      <div class="tax-cta"><a class="btn primary" href="/analyse" data-link>Run the numbers →</a><a class="fine" href="/guide#tax-2026" data-link>What changed, in plain English</a></div>
    </div>
  </section>

  <section class="section">
    <div class="spread"><h2>Prices this month</h2><a href="/markets" data-link>All markets →</a></div>
    <div class="tbl-wrap"><table class="compact">
      <thead><tr><th>City</th><th class="n">Typical house</th><th class="n hide-sm">Typical unit</th><th class="n">Past 12 months</th><th class="n hide-sm">Rents, 12 months</th></tr></thead>
      <tbody>${caps.map(([code, r]) => `<tr><td><a href="/suburbs?region=${code}" data-link>${esc(r.name)}</a></td><td class="n">${aud(r.medianHouse, { compact: true })}</td><td class="n hide-sm">${aud(r.medianUnit, { compact: true })}</td><td class="n ${cls(r.annualPct)}">${pct(r.annualPct, 1, true)}</td><td class="n hide-sm">${pct(r.rentAnnualPct, 1, true)}</td></tr>`).join('')}</tbody>
    </table></div>
    <p class="fine" style="margin-top:8px">Cotality Home Value Index, month-end ${esc(market.indexMonth || idx.monthEnd || '')} (source: <a href="${esc(market.sources?.[0]?.url || '#')}" target="_blank" rel="noopener">Cotality</a>). The typical investor rate used across Keyzing is the RBA's average on new investor variable loans, ${pct(inv.rate, 2)} (${esc(inv.month)}). ${oo ? `Lowest advertised owner-occupier variable rate open to anyone: ${pct(oo.rate, 2)} (${esc(oo.lender)}); <a href="/rates" data-link>compare every lender</a>.` : ''}</p>
    <div style="margin-top:12px">${rateWatchCard(rba, { compact: true })}</div>
  </section>

  <section class="section">
    <div class="card register-band">
      <div><div class="eyebrow">Weekly update · register early</div><h2 style="margin:0 0 6px">What moved in prices and rates, once a week</h2><p class="muted" style="margin:0">The email edition is launching soon; until then the <a href="/weekly" data-link>weekly report</a> is online.</p></div>
      ${registerForm('hreg')}
    </div>
    <p class="fine" style="margin-top:12px">Keyzing is general information, not financial advice: it doesn’t know your circumstances and isn’t a lender, broker or agent. Last data check ${date(idx.updated || idx.generated)}.</p>
  </section>`;

  attachSearch(main.querySelector('#hq'), main.querySelector('#hac'));
  wireRegister(main.querySelector('#hreg'));
}

/** The one sign-up form used across the site (home page and weekly report). */
export function registerForm(id) {
  return `<form id="${id}" name="register" method="POST" data-netlify="true" netlify-honeypot="company">
        <input type="hidden" name="form-name" value="register"><p hidden><label>Leave empty <input name="company"></label></p>
        <div class="fields" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr))">
          <label class="field">Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>
          <label class="field">I'm a<select name="type"><option>First home buyer</option><option>Home owner moving</option><option>Investor</option><option>Agent or broker</option></select></label>
          <label class="field">Suburbs I'm watching (optional)<input name="suburbs" placeholder="e.g. Morley 6062"></label>
        </div>
        <label class="check" style="margin-top:10px"><input type="checkbox" name="consent" required> Email me Keyzing's weekly update. I can unsubscribe any time.</label>
        <div class="row" style="margin-top:10px"><button class="btn primary">Register</button><span class="fine" data-status>Your email is used only for this. <a href="/privacy" data-link>Privacy</a>.</span></div>
      </form>`;
}

export function wireRegister(form) {
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
      if (!r.ok) throw new Error(r.status);
      form.innerHTML = '<h3 style="margin:0">You\'re on the list.</h3><p class="note">We\'ll email you when the weekly edition launches.</p>';
    } catch {
      form.querySelector('[data-status]').textContent = 'That didn\'t go through. Please try again.';
    }
  });
}
