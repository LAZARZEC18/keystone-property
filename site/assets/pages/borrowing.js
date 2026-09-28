import { aud, pct, setMeta } from '../ui.js';
import { load } from '../data.js';
import { borrowingPower, repayment, stampDuty, livingBenchmark } from '../engine.js';
import { STATES, helpRepayment, HELP_REPAY, CARD_LIMIT_RATE } from '../rules.js';
import { check, showErrors } from '../validate.js';

export default async function borrowingPage(main, _p, query = {}) {
  setMeta({ title: 'How much can I borrow?', description: 'Estimate your borrowing power the way Australian lenders do, for a home to live in or an investment: the 3-point rate buffer, living costs, existing debts and 80% of any rent.' });
  const [rs, rba] = await Promise.all([load('rates-summary'), load('rba')]);
  // what investors actually pay on new variable loans (RBA), not the cheapest advertised rate
  const invRate = rba.actual?.newInvVariable?.at(-1)?.[1] || Math.max(rs.best.INV_PI_variable?.[0]?.rate || 6.2, 6.4);
  const ooRate = rba.actual?.newOOVariable?.at(-1)?.[1] || 6.2;
  const inv = query.buyer === 'investor';
  const rate = inv ? invRate : ooRate;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Borrowing power</div><h1>How much could you borrow?</h1>
  <p>Lenders don't test you at today's rate. They check you could still make the repayments if the rate were 3 percentage points higher (the banking regulator's buffer), after tax, living costs and other debts, and they count only about 80% of any rent. This calculator follows the same logic, for a home to live in or an investment.</p></div>
  <div class="grid g2">
    <div class="card"><div class="seg" id="b-mode" style="width:100%;margin-bottom:14px"><button type="button" data-m="home" class="${inv ? '' : 'on'}" style="flex:1">A home to live in</button><button type="button" data-m="investor" class="${inv ? 'on' : ''}" style="flex:1">An investment</button></div><div class="fields">
      <label class="field">Your income before tax ($/yr)<input id="b-inc" type="number" step="1" value="110000"></label>
      <label class="field">Partner's income before tax ($/yr)<input id="b-inc2" type="number" step="1" value="0"><span class="help">0 if you're buying alone</span></label>
      <label class="field">Dependants<input id="b-dep" type="number" min="0" max="8" value="0"></label>
      <label class="field inv-only">Rent you already receive ($/yr)<input id="b-rent0" type="number" step="1" value="0"></label>
      <label class="field inv-only">Rent from the new property ($/wk)<input id="b-rent" type="number" step="1" value="650"></label>
      <label class="field">Other loan repayments ($/month)<input id="b-debt" type="number" step="1" value="0"><span class="help">Car and personal loans, other mortgages, buy now pay later</span></label>
      <label class="field">Credit card limits, total ($)<input id="b-cards" type="number" step="1" value="0"><span class="help">Lenders count about ${Math.round(CARD_LIMIT_RATE * 100)}% of the limit a month, even if the card is paid off</span></label>
      <fieldset class="field checks"><legend>HECS or HELP study debt?</legend><label class="check"><input type="checkbox" id="b-help1"> I have one</label><label class="check"><input type="checkbox" id="b-help2"> My partner has one</label><span class="help">Lenders count the compulsory repayment, set by income, not the balance</span></fieldset>
      <label class="field">Living costs ($/month)<input id="b-live" type="number" step="1" placeholder="Benchmark"><span class="help">Leave blank for a benchmark that rises with income, as lenders' does</span></label>
      <label class="field">Interest rate (%)<input id="b-rate" type="number" step="0.05" value="${rate}"></label>
      <label class="field">Deposit and savings ($)<input id="b-sav" type="number" step="1" value="120000"></label>
      <label class="field">State<select id="b-state">${Object.keys(STATES).map((s) => `<option>${s}</option>`).join('')}</select></label>
    </div></div>
    <div class="card" id="b-out"></div>
  </div>`;
  const $ = (x) => main.querySelector(x);
  let mode = inv ? 'investor' : 'home';
  const setMode = (m) => {
    mode = m;
    main.querySelectorAll('#b-mode button').forEach((b) => b.classList.toggle('on', b.dataset.m === m));
    main.querySelectorAll('.inv-only').forEach((el) => (el.style.display = m === 'investor' ? '' : 'none'));
  };
  setMode(mode);
  $('#b-mode').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    setMode(b.dataset.m);
    $('#b-rate').value = b.dataset.m === 'investor' ? invRate : ooRate;
    run();
  });
  const run = () => {
    const ids = { inc: '#b-inc', inc2: '#b-inc2', dep: '#b-dep', rent0: '#b-rent0', rent: '#b-rent', debt: '#b-debt', cards: '#b-cards', live: '#b-live', rate: '#b-rate', sav: '#b-sav' };
    const raw = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, $(id).value]));
    const chk = check(raw, { inc: 'income', inc2: { field: 'income2', optional: true }, cards: { field: 'savings', optional: true }, dep: { field: 'deps', optional: true }, rent0: { field: 'income2', optional: true }, rent: { field: 'rent', optional: true }, debt: { field: 'debts', optional: true }, live: { field: 'debts', optional: true }, rate: 'rate', sav: 'savings' });
    if (showErrors(main, chk.errors, ids, $('#b-out'))) return;
    const investor = mode === 'investor';
    const inc1 = +$('#b-inc').value || 0;
    const inc2 = +$('#b-inc2').value || 0;
    const couple = inc2 > 0;
    const helpM = ((($('#b-help1').checked ? helpRepayment(inc1) : 0) + ($('#b-help2').checked ? helpRepayment(inc2) : 0)) / 12);
    const cardM = (+$('#b-cards').value || 0) * CARD_LIMIT_RATE;
    const living = $('#b-live').value ? +$('#b-live').value : livingBenchmark(inc1 + inc2, { couple, dependants: +$('#b-dep').value || 0 });
    const bp = borrowingPower({
      grossIncome: inc1 + inc2, couple, dependants: +$('#b-dep').value, existingRentIncome: investor ? +$('#b-rent0').value : 0,
      newRentWeekly: investor ? +$('#b-rent').value : 0, otherDebtMonthly: (+$('#b-debt').value || 0) + helpM + cardM, livingCostsMonthly: living, ratePct: +$('#b-rate').value,
    });
    const sav = +$('#b-sav').value;
    const state = $('#b-state').value;
    // Largest price where savings cover 20% deposit + duty + $2.5k costs, and the loan fits borrowing power
    let price = 100000;
    let limit = 'deposit';
    for (let p = 100000; p <= 5000000; p += 5000) {
      const need = p * 0.2 + stampDuty(state, p).duty + 2500;
      if (need > sav) {
        limit = 'deposit';
        break;
      }
      if (p * 0.8 > bp.amount) {
        limit = 'loan';
        break;
      }
      price = p;
    }
    const m = repayment(bp.amount, +$('#b-rate').value, 30);
    $('#b-out').innerHTML = `<div class="stat"><span class="k">Estimated maximum loan</span><span class="v xl">${aud(bp.amount)}</span><span class="s">The loan whose repayments at ${pct(bp.assessRate, 2)} (your rate plus the 3-point buffer) would use up all of the ${aud(bp.surplus)} a month left after tax, living costs and other debts. At that loan, nothing is left over.</span></div>
    <div class="hr"></div>
    <div class="kv"><span>Repayment at ${pct(+$('#b-rate').value, 2)}</span><span>${aud(m)}/month</span>
    <span>Price you could buy with 20% down (${state})</span><span>${aud(price)}</span>
    <span>Stamp duty at that price (standard rate, before any first home concession)</span><span>${aud(stampDuty(state, price).duty)}</span>
    <span>Living costs assumed</span><span>${aud(living)}/month${$('#b-live').value ? '' : ' (benchmark)'}</span>
    ${helpM ? `<span>HECS/HELP compulsory repayment (${HELP_REPAY.year})</span><span>${aud(helpM)}/month</span>` : ''}
    ${cardM ? `<span>Credit card limits, as lenders count them</span><span>${aud(cardM)}/month</span>` : ''}</div>
    <p class="note" style="margin-top:10px">${limit === 'deposit' ? `<b>Your savings are the limit here, not the loan.</b> A ${aud(price, { compact: true })} purchase needs ${aud(price * 0.2 + stampDuty(state, price).duty + 2500, { compact: true })} for a 20% deposit, duty and costs, and uses only ${aud(price * 0.8, { compact: true })} of the ${aud(bp.amount, { compact: true })} you could borrow. With a smaller deposit (and LMI) or more savings you could pay more.` : `<b>The loan is the limit here.</b> Your savings could cover a bigger deposit, but lenders cap the loan at ${aud(bp.amount, { compact: true })}.`}</p>
    <p class="note" style="margin-top:12px">A conservative estimate. Each lender uses its own living-expense model (usually the Household Expenditure Measure, which rises with income and household size), rental shading and treatment of other debts, so results can differ by 10-20% between banks, and many will lend a little more than this. A broker can compare lenders' calculators for you.</p>`;
  };
  main.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', run));
  run();
}
