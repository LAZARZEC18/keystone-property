import { aud, pct, setMeta } from '../ui.js';
import { load } from '../data.js';
import { borrowingPower, repayment, stampDuty } from '../engine.js';
import { STATES } from '../rules.js';
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
      <label class="field">Income before tax, all borrowers ($/yr)<input id="b-inc" type="number" step="1" value="110000"></label>
      <label class="field">Borrowers<select id="b-couple"><option value="0">Single</option><option value="1">Couple</option></select></label>
      <label class="field">Dependants<input id="b-dep" type="number" min="0" max="8" value="0"></label>
      <label class="field inv-only">Rent you already receive ($/yr)<input id="b-rent0" type="number" step="1" value="0"></label>
      <label class="field inv-only">Rent from the new property ($/wk)<input id="b-rent" type="number" step="1" value="650"></label>
      <label class="field">Other debt repayments ($/month)<input id="b-debt" type="number" step="1" value="0"><span class="help">Car loans, other mortgages, HECS, credit card limits (≈3.8% of the limit)</span></label>
      <label class="field">Living costs ($/month)<input id="b-live" type="number" step="1" placeholder="Benchmark"><span class="help">Leave blank to use a conservative benchmark</span></label>
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
    const ids = { inc: '#b-inc', dep: '#b-dep', rent0: '#b-rent0', rent: '#b-rent', debt: '#b-debt', live: '#b-live', rate: '#b-rate', sav: '#b-sav' };
    const raw = Object.fromEntries(Object.entries(ids).map(([k, id]) => [k, $(id).value]));
    const chk = check(raw, { inc: 'income', dep: { field: 'deps', optional: true }, rent0: { field: 'income2', optional: true }, rent: { field: 'rent', optional: true }, debt: { field: 'debts', optional: true }, live: { field: 'debts', optional: true }, rate: 'rate', sav: 'savings' });
    if (showErrors(main, chk.errors, ids, $('#b-out'))) return;
    const investor = mode === 'investor';
    const bp = borrowingPower({
      grossIncome: +$('#b-inc').value, couple: $('#b-couple').value === '1', dependants: +$('#b-dep').value, existingRentIncome: investor ? +$('#b-rent0').value : 0,
      newRentWeekly: investor ? +$('#b-rent').value : 0, otherDebtMonthly: +$('#b-debt').value, livingCostsMonthly: $('#b-live').value ? +$('#b-live').value : undefined, ratePct: +$('#b-rate').value,
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
    <span>Stamp duty at that price</span><span>${aud(stampDuty(state, price).duty)}</span></div>
    <p class="note" style="margin-top:10px">${limit === 'deposit' ? `<b>Your savings are the limit here, not the loan.</b> A ${aud(price, { compact: true })} purchase needs ${aud(price * 0.2 + stampDuty(state, price).duty + 2500, { compact: true })} for a 20% deposit, duty and costs, and uses only ${aud(price * 0.8, { compact: true })} of the ${aud(bp.amount, { compact: true })} you could borrow. With a smaller deposit (and LMI) or more savings you could pay more.` : `<b>The loan is the limit here.</b> Your savings could cover a bigger deposit, but lenders cap the loan at ${aud(bp.amount, { compact: true })}.`}</p>
    <p class="note" style="margin-top:12px">An estimate only. Each lender uses its own living-expense model (usually the Household Expenditure Measure), rental shading and treatment of other debts, so results can differ by 10-20% between banks. A broker can compare lenders' calculators for you.</p>`;
  };
  main.querySelectorAll('input,select').forEach((el) => el.addEventListener('input', run));
  run();
}
