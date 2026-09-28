import { check, showErrors } from '../validate.js';
import { demo } from '../demo.js';
import { nextStepsCard } from '../insights.js';
import { esc, aud, pct, setMeta, lineChart, wireCharts } from '../ui.js';
import { load } from '../data.js';
import { stampDuty, repayment, lmi, marginalRate } from '../engine.js';
import { STATES } from '../rules.js';

const COSTS = 3000; // conveyancing, inspections, registration

/** Months to reach a savings target with monthly contributions and monthly-compounded interest. */
export function monthsToSave(start, monthly, target, ratePct) {
  let b = start;
  const r = ratePct / 1200;
  for (let m = 0; m <= 600; m++) {
    if (b >= target) return m;
    b = b * (1 + r) + monthly;
  }
  return null;
}

/**
 * First Home Super Saver. Salary-sacrifice `c` a year for `years` (max $15k a year, $50k in total, within the $30k
 * concessional cap alongside 12% employer super). Compared with taking the same pre-tax money as salary and saving it.
 * Deemed earnings use the shortfall interest charge rate (90-day bank bill + 3%). Released concessional amounts are
 * taxed at the marginal rate less a 30% offset.
 */
export function fhss({ income, c, years, bab = 3.8, savingsRate = 4.5 }) {
  const cap = Math.max(0, Math.min(15000, 30000 - income * 0.12, c));
  const mr = marginalRate(income);
  const sic = bab + 3;
  let eligible = 0;
  let earnings = 0;
  let bank = 0;
  for (let y = 0; y < years; y++) {
    const add = Math.min(cap, 50000 - eligible);
    if (add <= 0) break;
    earnings += (eligible * 0.85 + earnings) * (sic / 100);
    eligible += add;
    bank = bank * (1 + (savingsRate / 100) * (1 - mr)) + add * (1 - mr);
  }
  const gross = eligible * 0.85 + earnings;
  const taxOnRelease = gross * Math.max(0, mr - 0.3);
  const net = gross - taxOnRelease;
  return { perYear: cap, contributed: eligible, gross, taxOnRelease, net, bank, gain: net - bank, mr, sic };
}

/** Rent vs buy over `years`: both paths invest whatever they don't spend. Returns yearly net worth for each. */
export function rentVsBuy(p) {
  const upfront = p.price * p.dep + p.duty + COSTS;
  const lm = p.dep < 0.2 && !p.scheme ? lmi(p.price * (1 - p.dep), p.price, p.state).premium || 0 : 0;
  let loan = p.price * (1 - p.dep) + lm;
  const r = p.rate / 1200;
  const pay = repayment(loan, p.rate, 30);
  let value = p.price;
  let rent = p.rent * 52 / 12;
  let buyInv = 0;
  let rentInv = upfront;
  const inv = p.invest / 1200;
  const rows = [];
  let breakEven = null;
  for (let m = 1; m <= p.years * 12; m++) {
    const interest = loan * r;
    loan = Math.max(0, loan - (pay - interest));
    const own = (value * (p.ownCost / 100)) / 12 + p.strata / 12;
    const buyOut = pay + own;
    buyInv *= 1 + inv;
    rentInv *= 1 + inv;
    if (buyOut > rent) rentInv += buyOut - rent;
    else buyInv += rent - buyOut;
    value *= 1 + p.growth / 1200;
    if (m % 12 === 0) {
      rent *= 1 + p.rentGrowth / 100;
      const buyer = value * (1 - 0.025) - loan + buyInv;
      const renter = rentInv;
      rows.push({ year: m / 12, buyer, renter });
      if (breakEven === null && buyer >= renter) breakEven = m / 12;
    }
  }
  return { rows, upfront, lmi: lm, pay, breakEven, last: rows.at(-1) };
}

export default async function firstHomePage(main, _p, query = {}) {
  setMeta({ title: 'First home tools: rent vs buy, savings planner, FHSS calculator', description: 'How long it will take to save a deposit, whether buying beats renting over time, and how much the First Home Super Saver scheme adds.' });
  const [rba] = await Promise.all([load('rba')]);
  const rate = rba.actual?.newOOVariable?.at(-1)?.[1] || 6.2;
  const bab = rba.market?.bab3m ?? 3.8;
  const stOpts = Object.keys(STATES).map((s) => `<option value="${s}" ${s === 'WA' ? 'selected' : ''}>${s}</option>`).join('');

  main.innerHTML = `
  <div class="page-head with-demo"><div><div class="eyebrow">First home tools</div><h1>Plan your first home</h1>
  <p>Three calculators for the questions that come before the property search: how long it will take to save, whether buying beats renting over the years you'll stay, and how much faster the First Home Super Saver scheme gets you there. When you're ready, the <a href="/afford?buyer=fhb" data-link>affordability tool</a> finds where you can buy.</p></div>${demo('firsthome')}</div>
  <div class="row" style="margin-bottom:16px"><a class="pill" href="#save">How long to save</a><a class="pill" href="#rvb">Rent vs buy</a><a class="pill" href="#fhss">First Home Super Saver</a></div>

  <section class="section card" id="save"><h2>How long will it take to save?</h2>
    <div class="grid split-spec" style="gap:20px">
      <form class="fields" id="sv" style="grid-template-columns:1fr 1fr;align-content:start" data-nosubmit>
        <label class="field">Home price ($)<input name="price" type="number" step="1" value="650000"></label>
        <label class="field">State<select name="state">${stOpts}</select></label>
        <label class="field">Deposit<select name="dep"><option value="0.05">5% (5% Deposit Scheme)</option><option value="0.1">10%</option><option value="0.2">20%</option></select></label>
        <label class="field">Savings now ($)<input name="now" type="number" step="1" value="20000"></label>
        <label class="field">You save each month ($)<input name="monthly" type="number" step="1" value="1500"></label>
        <label class="field">Savings account rate (%)<input name="sr" type="number" step="0.05" value="4.5"></label>
        <label class="field" style="grid-column:1/-1">Income, for the FHSS comparison ($/yr)<input name="income" type="number" step="1" value="90000"></label>
      </form>
      <div id="sv-out"></div>
    </div>
  </section>

  <section class="section card" id="rvb"><h2>Rent or buy?</h2>
    <div class="grid split-spec" style="gap:20px">
      <form class="fields" id="rb" style="grid-template-columns:1fr 1fr;align-content:start" data-nosubmit>
        <label class="field">Home price ($)<input name="price" type="number" step="1" value="650000"></label>
        <label class="field">State<select name="state">${stOpts}</select></label>
        <label class="field">Deposit<select name="dep"><option value="0.05">5% (5% Deposit Scheme)</option><option value="0.1">10% (LMI)</option><option value="0.2" selected>20%</option></select></label>
        <label class="field">Interest rate (%)<input name="rate" type="number" step="0.05" value="${rate}"></label>
        <label class="field">Rent for a similar home ($/wk)<input name="rent" type="number" step="1" value="600"></label>
        <label class="field">Years you'll stay<input name="years" type="number" min="1" max="30" value="10"></label>
        <label class="field">Home price growth (%/yr)<input name="growth" type="number" step="0.1" value="3"></label>
        <label class="field">Rent growth (%/yr)<input name="rentGrowth" type="number" step="0.1" value="3.5"></label>
        <label class="field">Return on invested savings (%/yr)<input name="invest" type="number" step="0.1" value="6"></label>
        <label class="field">Owner costs (% of value/yr)<input name="ownCost" type="number" step="0.1" value="1.2"></label>
        <label class="field" style="grid-column:1/-1">Strata levies ($/yr, units)<input name="strata" type="number" step="1" value="0"></label>
      </form>
      <div id="rb-out"></div>
    </div>
  </section>

  <section class="section card" id="fhss"><h2>First Home Super Saver calculator</h2>
    <div class="grid split-spec" style="gap:20px">
      <form class="fields" id="fs" style="grid-template-columns:1fr 1fr;align-content:start" data-nosubmit>
        <label class="field">Your income ($/yr)<input name="income" type="number" step="1" value="90000"></label>
        <label class="field">Extra to super each year ($)<input name="c" type="number" step="1" value="15000"></label>
        <label class="field">Years<input name="years" type="number" min="1" max="10" value="4"></label>
        <label class="field">Savings account rate (%)<input name="sr" type="number" step="0.05" value="4.5"></label>
      </form>
      <div id="fs-out"></div>
    </div>
  </section>
  <p class="fine">General information only. These are simplified models: they ignore tax on the renter's investment returns (a home you live in is free of capital gains tax, which favours buying), and FHSS rules have more detail than shown. Check the ATO's FHSS rules and your eligibility before acting.</p>
  <div class="section">${nextStepsCard({ fhb: true })}</div>`;

  const $ = (x) => main.querySelector(x);
  const f = (id) => Object.fromEntries(new FormData($(id)));

  const runSave = () => {
    const v = f('#sv');
    const c = check(v, { price: 'price', now: 'savings', monthly: 'monthly', sr: 'pctReturn', income: { field: 'income', optional: true } });
    if (showErrors($('#sv'), c.errors, { price: '[name=price]', now: '[name=now]', monthly: '[name=monthly]', sr: '[name=sr]', income: '[name=income]' }, $('#sv-out'))) return;
    const price = +v.price;
    const dep = +v.dep;
    const duty = stampDuty(v.state, price, { buyer: 'fhb' });
    const target = price * dep + duty.duty + COSTS;
    const m = monthsToSave(+v.now, +v.monthly, target, +v.sr);
    const mr = marginalRate(+v.income || 0);
    // salary-sacrificing through FHSS: each $1 of take-home given up puts more into the deposit
    const boost = (0.85 * (1 - Math.max(0, mr - 0.3))) / Math.max(0.01, 1 - mr);
    const fhssMonthly = Math.min(+v.monthly, 15000 / 12);
    const m2 = monthsToSave(+v.now, +v.monthly - fhssMonthly + fhssMonthly * boost, target, +v.sr);
    const when = (mm) => (mm === null ? 'more than 50 years' : mm === 0 ? 'now' : `${Math.floor(mm / 12) ? `${Math.floor(mm / 12)} yr ` : ''}${mm % 12} mth (${new Date(Date.now() + mm * 30.44 * 864e5).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })})`);
    $('#sv-out').innerHTML = `<div class="stats">
      <div class="stat"><span class="k">You need</span><span class="v">${aud(target, { compact: true })}</span><span class="s">${Math.round(dep * 100)}% deposit ${aud(price * dep, { compact: true })} + duty ${aud(duty.duty)} + costs</span></div>
      <div class="stat"><span class="k">Time to save</span><span class="v">${when(m)}</span><span class="s">saving ${aud(+v.monthly)} a month</span></div>
      <div class="stat"><span class="k">With First Home Super Saver</span><span class="v up">${when(m2)}</span><span class="s">up to ${aud(fhssMonthly)}/mth through super</span></div></div>
      ${duty.notes.length ? `<p class="fine" style="margin-top:8px">${esc(duty.notes.join(' '))}</p>` : ''}
      <p class="note" style="margin-top:8px">${dep < 0.2 ? 'With a 5% or 10% deposit you reach the goal far sooner, but the loan is bigger. Under the 5% Deposit Scheme price caps there is no LMI.' : 'A 20% deposit avoids LMI and gives a smaller loan, but takes much longer to save while prices and rents move.'}</p>`;
  };

  const runRvb = () => {
    const v = f('#rb');
    const c = check(v, { price: 'price', rate: 'rate', rent: 'rent', years: 'hold', growth: 'growth', rentGrowth: 'rentGrowth', invest: 'pctReturn', ownCost: 'ownCost', strata: { field: 'strata', optional: true } });
    if (showErrors($('#rb'), c.errors, Object.fromEntries(Object.keys(c.values).map((k) => [k, `[name=${k}]`])), $('#rb-out'))) return;
    const price = +v.price;
    const dep = +v.dep;
    const duty = stampDuty(v.state, price, { buyer: 'fhb' }).duty;
    const r = rentVsBuy({ price, state: v.state, dep, duty, rate: +v.rate, rent: +v.rent, years: Math.max(1, Math.min(30, +v.years)), growth: +v.growth, rentGrowth: +v.rentGrowth, invest: +v.invest, ownCost: +v.ownCost, strata: +v.strata, scheme: dep === 0.05 });
    const L = r.last;
    const win = L.buyer >= L.renter;
    $('#rb-out').innerHTML = `<div class="stats">
      <div class="stat"><span class="k">Buy: net worth after ${v.years} yrs</span><span class="v ${win ? 'up' : ''}">${aud(L.buyer, { compact: true })}</span><span class="s">home equity after selling costs, plus savings</span></div>
      <div class="stat"><span class="k">Rent: net worth after ${v.years} yrs</span><span class="v ${win ? '' : 'up'}">${aud(L.renter, { compact: true })}</span><span class="s">upfront cash and monthly savings invested</span></div>
      <div class="stat"><span class="k">Buying pulls ahead</span><span class="v">${r.breakEven ? `year ${r.breakEven}` : 'not within this period'}</span><span class="s">repayments ${aud((r.pay * 12) / 52)}/wk vs rent ${aud(+v.rent)}/wk now</span></div></div>
      ${lineChart([{ name: 'Buy', points: r.rows.map((x) => [x.year, Math.round(x.buyer)]) }, { name: 'Rent and invest', points: r.rows.map((x) => [x.year, Math.round(x.renter)]) }], { height: 200, xFmt: (x) => `yr ${Math.round(x)}`, yFmt: (x) => aud(x, { compact: true }), label: 'Net worth each year: buying vs renting' })}
      <p class="note" style="margin-top:8px">${win ? `Over ${v.years} years buying comes out about ${aud(L.buyer - L.renter, { compact: true })} ahead.` : `Over ${v.years} years renting and investing the difference comes out about ${aud(L.renter - L.buyer, { compact: true })} ahead.`} The biggest levers are how long you stay (buying and selling costs are paid once) and the gap between price growth and the return on invested savings.</p>`;
    wireCharts($('#rb-out'), (x) => aud(x, { compact: true }), (x) => `Year ${Math.round(x)}`);
  };

  const runFhss = () => {
    const v = f('#fs');
    const c = check(v, { income: 'income', c: 'super', years: 'years10', sr: 'pctReturn' });
    if (showErrors($('#fs'), c.errors, { income: '[name=income]', c: '[name=c]', years: '[name=years]', sr: '[name=sr]' }, $('#fs-out'))) return;
    const r = fhss({ income: +v.income, c: +v.c, years: Math.max(1, Math.min(10, +v.years)), bab, savingsRate: +v.sr });
    $('#fs-out').innerHTML = `<div class="stats">
      <div class="stat"><span class="k">Contributed through super</span><span class="v">${aud(r.contributed)}</span><span class="s">${aud(r.perYear)} a year${r.perYear < +v.c ? ' (limited by the caps)' : ''}</span></div>
      <div class="stat"><span class="k">Released for your deposit</span><span class="v up">${aud(r.net)}</span><span class="s">after 15% contributions tax and ${pct(Math.max(0, r.mr - 0.3) * 100, 0)} release tax</span></div>
      <div class="stat"><span class="k">Saved the normal way</span><span class="v">${aud(r.bank)}</span><span class="s">same pre-tax money, after ${pct(r.mr * 100, 0)} tax, in a savings account</span></div>
      <div class="stat"><span class="k">FHSS advantage</span><span class="v ${r.gain >= 0 ? 'up' : 'down'}">${aud(r.gain)}</span><span class="s">extra deposit</span></div></div>
      <p class="note" style="margin-top:8px">Voluntary contributions of up to $15,000 a year and $50,000 in total can be released, with deemed earnings at ${pct(r.sic, 2)} (the 90-day bank bill rate plus 3 points). Your employer's 12% super counts toward the $30,000 concessional cap. Request the release from the ATO before you sign a contract or within 14 days after.</p>`;
  };

  // numbers carried over from the affordability tool (/afford → "plan it")
  const setv = (form, name, v) => { const el = $(`${form} [name=${name}]`); if (el && v !== undefined && v !== '' && !Number.isNaN(+v)) el.value = v; };
  if (query.price) ['#sv', '#rb'].forEach((f) => setv(f, 'price', query.price));
  if (query.state && STATES[query.state]) { const el = $('#sv [name=state]'); if (el) el.value = query.state; }
  if (query.dep && ['0.05', '0.1', '0.2'].includes(query.dep)) ['#sv', '#rb'].forEach((f) => { const el = $(`${f} [name=dep]`); if (el) el.value = query.dep; });
  setv('#sv', 'now', query.savings);
  setv('#sv', 'income', query.income);
  setv('#rb', 'rent', query.rent);
  if (query.price) $('#save')?.insertAdjacentHTML('afterbegin', '<p class="callout" style="margin:0 0 12px">Filled in from your affordability result. Change anything here.</p>');
  $('#sv').addEventListener('input', runSave);
  $('#rb').addEventListener('input', runRvb);
  $('#fs').addEventListener('input', runFhss);
  runSave();
  runRvb();
  runFhss();
}
