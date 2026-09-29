import { demo, wireDemos } from '../demo.js';
import { esc, aud, pct, num, scoreBadge, setMeta, srcBadge, growth12, copyLinkButton, wireCopyLink } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, openRate } from '../data.js';
import { stampDuty, lmi, borrowingPower, repayment, analyse, suburbScore, PROFILES, incomeTax } from '../engine.js';
import { STATES, HOME_GUARANTEE, guaranteeCap, HELP_TO_BUY, helpToBuyCap, FHOG, GROWTH, STRESS, comfortableWeekly, STATE_SCHEMES, helpRepayment, CARD_LIMIT_RATE, KEYSTART } from '../rules.js';
import { check, showErrors } from '../validate.js';
import { attachSearch, countEvent } from '../app.js';
import { haversine } from '../data.js';
import { listingLinks, nextStepsCard } from '../insights.js';
import { baseTiles } from '../map.js';

const OTHER_COSTS = 3000; // conveyancing, inspections, registration, loan fees

/**
 * Can this buyer afford this price in this state? Returns the cheapest-cash structure:
 * the largest loan allowed by the lender's LVR cap and the buyer's borrowing power.
 */
export function structure({ price, state, savings, loanCap, maxLvr, buyer, newBuild = false, guarantee = false, cap = Infinity, htb = false, htbCap = Infinity, notOwned5 = false, keystart = false, ksCap = Infinity }) {
  if (keystart && price <= ksCap) {
    // Keystart (WA): from a 2% deposit, no lenders mortgage insurance
    const loan = Math.max(0, Math.min(price * 0.98, loanCap));
    const duty = stampDuty(state, price, { buyer, newBuild }).duty;
    const deposit = price - loan;
    const cash = deposit + duty + OTHER_COSTS;
    return { ok: cash <= savings, loan, lvr: loan / price, deposit, duty, lmi: 0, cash, spare: savings - cash, keystart: true };
  }
  if (htb && price <= htbCap) {
    // Help to Buy: government owns a share, buyer puts in at least 2%, no LMI
    const share = price * HELP_TO_BUY.share[newBuild ? 'new' : 'existing'];
    const loan = Math.max(0, Math.min(price - share - price * HELP_TO_BUY.deposit, loanCap));
    const deposit = price - share - loan;
    const duty = stampDuty(state, price, { buyer, newBuild, notOwned5 }).duty;
    const cash = deposit + duty + OTHER_COSTS;
    return { ok: cash <= savings, loan, lvr: loan / price, deposit, duty, lmi: 0, cash, spare: savings - cash, htb: true, govShare: share };
  }
  if (htb) return structure({ price, state, savings, loanCap, maxLvr: Math.min(maxLvr, 0.9), buyer, newBuild, notOwned5 });
  // 5% Deposit Scheme applies only up to the location's price cap; above it the buyer needs a normal loan (10% + LMI)
  const useG = guarantee && price <= cap;
  const lvrCap = guarantee && !useG ? Math.min(maxLvr, 0.9) : maxLvr;
  const loan = Math.max(0, Math.min(price * lvrCap, loanCap));
  const lvr = loan / price;
  const lm = useG ? { premium: 0 } : lmi(loan, price, state);
  if (lm.premium === null) return { ok: false, reason: 'LVR too high' };
  const duty = stampDuty(state, price, { buyer, newBuild, notOwned5 }).duty;
  const deposit = price - loan;
  const cash = deposit + duty + OTHER_COSTS; // LMI is added to the loan
  return { ok: cash <= savings, loan: loan + (lm.premium || 0), lvr, deposit, duty, lmi: lm.premium || 0, cash, spare: savings - cash, guarantee: useG, overCap: guarantee && !useG };
}

/** Highest price affordable in a state (binary search on the structure above). */
export function maxPrice(opts) {
  if (opts.keystart && Number.isFinite(opts.ksCap)) {
    const under = search({ ...opts }, Math.min(opts.ksCap, 6000000));
    const over = search({ ...opts, keystart: false }, 6000000);
    return Math.max(under, over);
  }
  if (opts.htb && Number.isFinite(opts.htbCap)) {
    const under = search({ ...opts }, Math.min(opts.htbCap, 6000000));
    const over = search({ ...opts, htb: false, guarantee: false, maxLvr: Math.min(opts.maxLvr, 0.9) }, 6000000);
    return Math.max(under, over);
  }
  if (opts.guarantee && Number.isFinite(opts.cap)) {
    // two routes: under the cap with the scheme, or above it with a normal loan; take the better
    const under = search({ ...opts }, Math.min(opts.cap, 6000000));
    const over = search({ ...opts, guarantee: false, maxLvr: Math.min(opts.maxLvr, 0.9) }, 6000000);
    return Math.max(under, over);
  }
  return search(opts, 6000000);
}

function search(opts, top) {
  let lo = 50000;
  let hi = top;
  if (!structure({ ...opts, price: lo }).ok) return 0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (structure({ ...opts, price: mid }).ok) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo / 5000) * 5000;
}

export default async function affordPage(main, _p, query) {
  setMeta({ title: 'What can I afford? A comfortable price, and your ceiling in every state', description: 'Enter your savings and income. Ownaroo works out a comfortable price where you want to buy, the most you could stretch to in every state and territory (stamp duty, mortgage insurance, lender buffers), the schemes you qualify for and the suburbs that fit.' });
  const [{ list }, rs, market, rba] = await Promise.all([suburbs(), load('rates-summary'), load('market'), load('rba')]);
  const lowOO = openRate(rs, 'OO_PI_variable')?.rate || 6;
  const lowInv = openRate(rs, 'INV_PI_variable')?.rate || 6.3;
  // default to what borrowers are actually paying on new loans (RBA F6), not the single cheapest advertised rate
  const bestOO = rba.actual?.newOOVariable?.at(-1)?.[1] || Math.max(lowOO, 6.2);
  const bestInv = rba.actual?.newInvVariable?.at(-1)?.[1] || Math.max(lowInv, 6.4);
  const q = (k, d) => (query[k] !== undefined ? query[k] : d);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Affordability analyst</div><h1>What can I afford, and where should I buy?</h1>
  <p class="lede-short">Three numbers: a comfortable price where you want to buy, the cash you need, and the weekly repayment. Then the schemes you qualify for and the suburbs that fit.</p></div>
  <div class="grid" style="grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:20px" id="aff-grid">
    <form class="card" id="af" data-nosubmit style="align-self:start;position:sticky;top:110px">
      <div class="step-h"><span>1</span> Where</div>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field" style="grid-column:1/-1">I'm buying as<select name="buyer"><option value="fhb">First home buyer (to live in)</option><option value="owner">Owner-occupier (not first home)</option><option value="investor">Investor</option></select></label>
        <label class="field" style="grid-column:1/-1">Where do you want to buy?<select name="where"><option value="">Choose a city, state or territory…</option>${Object.entries(market.regions).filter(([, r]) => r.capital).map(([c, r]) => `<option value="r:${c}">${r.name} (city)</option>`).join('')}${Object.keys(STATES).map((s) => `<option value="s:${s}">${STATES[s]} (whole ${['ACT', 'NT'].includes(s) ? 'territory' : 'state'})</option>`).join('')}${Object.entries(market.regions).filter(([, r]) => !r.capital).map(([c, r]) => `<option value="r:${c}">${r.name}</option>`).join('')}<option value="any">Anywhere in Australia</option></select><span class="help">Your comfortable price and the suburbs are for this area</span></label>
        <div id="livef" style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <label class="field" style="grid-column:1/-1;position:relative">Where do you work?<input id="work" type="search" placeholder="Suburb, e.g. Osborne Park or Parramatta" value=""><div class="ac" id="wac" hidden style="top:62px;left:0;right:auto"></div><span class="help">Suburbs are then ranked by commute. Optional, but it makes the list far more useful.</span></label>
          <label class="field" style="grid-column:1/-1">Max distance from work<select name="commute"><option value="10">10 km</option><option value="20">20 km</option><option value="30" selected>30 km</option><option value="50">50 km</option><option value="80">80 km</option></select></label>
        </div>
      </div>
      <div class="step-h"><span>2</span> Money in</div>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field" style="grid-column:1/-1">Savings for deposit + costs ($)<input name="savings" type="number" step="1" inputmode="numeric" placeholder="e.g. 80000" value="${esc(q('savings', ''))}"></label>
        <label class="field">Your income before tax ($/yr)<input name="income" type="number" step="1" inputmode="numeric" placeholder="e.g. 95000" value="${esc(q('income', ''))}"></label>
        <label class="field">Partner's income<input name="income2" type="number" step="1" inputmode="numeric" placeholder="0" value="${esc(q('income2', ''))}"></label>
      </div>
      <div class="step-h"><span>3</span> Money out</div>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field" style="grid-column:1/-1">Deposit<select name="lvr"><option value="0.8" selected>20% deposit (no mortgage insurance)</option><option value="0.9">As low as 10% (mortgage insurance added to the loan)</option><option value="0.95">As low as 5% (mortgage insurance)</option><option value="0.95g">5% deposit, no mortgage insurance (federal 5% Deposit Scheme, first home buyers)</option><option value="htb">2% deposit with Help to Buy (government owns up to 40% of a new home, 30% of an existing one)</option><option value="ks">2% deposit with Keystart, no mortgage insurance (WA only)</option></select></label>
      </div>
      <details class="fold more-details" ${query.debts || query.cards || query.help1 || query.help2 || query.deps ? 'open' : ''}><summary><b>Debts, HECS and other details</b> <span class="note">optional</span></summary>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field">Dependants<input name="deps" type="number" min="0" max="10" value="${esc(q('deps', 0))}"></label>
        <label class="field">Other loan repayments ($/mth)<input name="debts" type="number" step="1" value="${esc(q('debts', 0))}"><span class="help">Car and personal loans, buy now pay later</span></label>
        <label class="field">Credit card limits ($)<input name="cards" type="number" step="1" value="${esc(q('cards', 0))}"><span class="help">Total limit: lenders count ${Math.round(CARD_LIMIT_RATE * 100)}% a month</span></label>
        <fieldset class="field checks" style="grid-column:1/-1"><legend>HECS or HELP study debt?</legend><label class="check"><input type="checkbox" name="help1" ${query.help1 ? 'checked' : ''}> I have one</label><label class="check"><input type="checkbox" name="help2" ${query.help2 ? 'checked' : ''}> My partner has one</label><span class="help">Lenders count the compulsory repayment, which is set by income, so there's no balance to enter</span></fieldset>
        <label class="check own-only" style="grid-column:1/-1"><input type="checkbox" name="notOwned5" ${query.notOwned5 ? 'checked' : ''}> No one buying has owned property in the last 5 years <span class="help" style="display:block">In the ACT this removes stamp duty (from 1 July 2026)</span></label>
        <label class="field">Interest rate (%)<input name="rate" type="number" step="0.05" value="${esc(q('rate', bestOO))}"></label>
        <label class="field">Max weekly repayment ($)<input name="maxWeekly" type="number" step="1" placeholder="Optional" value="${esc(q('maxWeekly', ''))}"></label>
        <label class="field">Property type<select name="type"><option value="any">House or unit</option><option value="h">House</option><option value="u">Unit / apartment</option></select></label>
        <label class="field">Rank by<select name="profile"><option value="live">Fit for living in</option><option value="balanced">Balanced</option><option value="growth">Capital growth</option><option value="cashflow">Cash flow</option><option value="firsthome">Affordability / first home</option></select></label>
        <label class="field">Min population<input name="pop" type="number" step="1" value="${esc(q('pop', 3000))}"><span class="help">Leaves out small towns</span></label>
      </div>
      <p class="fine" style="margin-top:8px">Default rate is the average rate on new variable loans (RBA): ${pct(bestOO, 2)} owner-occupier, ${pct(bestInv, 2)} investor. The lowest rates open to anyone are ${pct(lowOO, 2)} and ${pct(lowInv, 2)}; use one if you'll qualify.</p>
      <p class="fine"><a href="/borrowing" data-link>How lenders test you, in detail →</a></p>
      </details>
      <button class="btn primary" style="margin-top:14px;width:100%" id="go">Show what I can afford</button>
    </form>
    <div id="out"></div>
  </div>`;

  const form = main.querySelector('#af');
  // "Can you afford this home?" links from a listing: /afford?home=849000&suburb=<id>
  const homePrice = Math.round(+query.home || 0) || null;
  const homeSub = query.suburb ? list.find((x) => x.id === String(query.suburb)) || null : null;
  if (homePrice) {
    const where = homeSub && market.regions[homeSub.rg]?.capital ? `r:${homeSub.rg}` : homeSub ? `s:${homeSub.s}` : '';
    if (where && !query.where) query.where = where;
    main.querySelector('.page-head').insertAdjacentHTML('beforeend', `<div class="callout green home-banner" style="margin-top:10px"><b>Can you afford this home?</b> A home at <b>${aud(homePrice)}</b>${homeSub ? ` in <a href="${suburbUrl(homeSub)}" data-link>${esc(cleanName(homeSub.n))} ${homeSub.s}</a>` : ''}. Enter your savings and income and Ownaroo shows whether it's within a comfortable budget, the cash you'd need and the schemes that apply at that price.</div>`);
  }
  let work = query.work ? list.find((x) => x.id === query.work) || null : null;
  if (work) main.querySelector('#work').value = `${cleanName(work.n)} ${work.s} ${work.pc || ''}`;
  if (query.commute) form.commute.value = query.commute;
  attachSearch(main.querySelector('#work'), main.querySelector('#wac'), (x) => {
    work = x;
    main.querySelector('#work').value = `${cleanName(x.n)} ${x.s} ${x.pc || ''}`;
    run();
  });
  main.querySelector('#work').addEventListener('input', (e) => {
    if (!e.target.value.trim()) {
      work = null;
      run();
    }
  });
  if (query.buyer) form.buyer.value = query.buyer;
  if (query.where) form.where.value = query.where;
  let example = false;
  if (query.type) form.type.value = query.type;
  if (query.profile) form.profile.value = query.profile;
  else form.profile.value = form.buyer.value === 'investor' ? 'balanced' : 'live';
  form.lvr.value = query.lvr || (form.buyer.value === 'fhb' ? '0.95g' : '0.8');
  if (!query.rate && form.buyer.value === 'investor') form.rate.value = bestInv;
  const syncBuyer = () => {
    const inv = form.buyer.value === 'investor';
    main.querySelector('#livef').hidden = inv;
    main.querySelector('#livef').style.display = inv ? 'none' : 'grid';
    form.profile.querySelector('[value="live"]').disabled = inv;
    form.lvr.querySelector('[value="0.95g"]').disabled = form.buyer.value !== 'fhb';
    form.lvr.querySelector('[value="htb"]').disabled = form.buyer.value === 'investor';
    form.lvr.querySelector('[value="ks"]').disabled = form.buyer.value === 'investor';
    main.querySelector('.own-only').style.display = form.buyer.value === 'owner' ? '' : 'none';
  };
  syncBuyer();
  form.buyer.addEventListener('change', () => {
    form.rate.value = form.buyer.value === 'investor' ? bestInv : bestOO;
    form.profile.value = form.buyer.value === 'investor' ? 'balanced' : 'live';
    form.lvr.value = form.buyer.value === 'fhb' ? '0.95g' : form.lvr.value === '0.95g' || (form.buyer.value === 'investor' && ['htb', 'ks'].includes(form.lvr.value)) ? '0.8' : form.lvr.value;
    syncBuyer();
  });
  let map = null;
  let numberCard = null;
  let shareUrl = '/afford';
  wireCopyLink(main, () => shareUrl);

  function run(e) {
    // while someone is still filling the form, don't shout about the field they haven't reached yet
    const asked = e === true || e?.type === 'click';
    const f = Object.fromEntries(new FormData(form));
    const out = main.querySelector('#out');
    const missing = !String(f.savings).trim() || !String(f.income).trim();
    if ((!String(f.savings).trim() && !String(f.income).trim()) || (missing && !asked && !example)) {
      out.innerHTML = `<div class="card"><h3 style="margin-top:0">Start with where you want to buy, your savings and your income</h3><p class="note">Ownaroo then works out a comfortable price there, the most a lender might let you stretch to, the cash you need, and the schemes you qualify for. Nothing you type is stored or sent anywhere.</p><button class="btn" type="button" id="aff-example">Or try it with example numbers</button></div>${demo('afford', { caption: 'See it in action: a Perth couple with $110k saved.' })}`;
      wireDemos(out);
      out.querySelector('#aff-example').addEventListener('click', () => {
        form.savings.value = 110000;
        form.income.value = 95000;
        form.income2.value = 60000;
        if (!form.where.value) form.where.value = 'r:PER';
        example = true;
        run();
      });
      return;
    }
    const chk = check(f, { savings: 'savings', income: 'income', income2: { field: 'income2', optional: true }, deps: { field: 'deps', optional: true }, debts: { field: 'debts', optional: true }, rate: 'rate', maxWeekly: { field: 'weekly', optional: true }, pop: { field: 'pop', optional: true } });
    if (showErrors(form, chk.errors, { savings: '[name=savings]', income: '[name=income]', income2: '[name=income2]', deps: '[name=deps]', debts: '[name=debts]', rate: '[name=rate]', maxWeekly: '[name=maxWeekly]', pop: '[name=pop]' }, out)) return;
    const buyer = f.buyer;
    const investor = buyer === 'investor';
    const helpMonthly = ((f.help1 ? helpRepayment(+f.income || 0) : 0) + (f.help2 ? helpRepayment(+f.income2 || 0) : 0)) / 12;
    const debtsMonthly = (+f.debts || 0) + helpMonthly + (+f.cards || 0) * CARD_LIMIT_RATE;
    const notOwned5 = buyer === 'owner' && !!f.notOwned5;
    const ksIncomeOk = (+f.income || 0) + (+f.income2 || 0) <= ((+f.income2 || 0) > 0 ? KEYSTART.income.couple : KEYSTART.income.single);
    const savings = +f.savings || 0;
    const income = (+f.income || 0) + (+f.income2 || 0);
    const couple = +f.income2 > 0;
    const rate = +f.rate || bestOO;
    const guarantee = f.lvr === '0.95g' && buyer === 'fhb';
    const htbIncomeOk = income <= (couple ? HELP_TO_BUY.income.joint : HELP_TO_BUY.income.single);
    const htb = f.lvr === 'htb' && !investor && htbIncomeOk;
    const maxLvr = f.lvr === '0.95g' || f.lvr === 'htb' || f.lvr === 'ks' ? 0.95 : +f.lvr;
    const ksWanted = f.lvr === 'ks' && !investor;
    const maxWeekly = +f.maxWeekly || null;
    // Borrowing power without rent (owner-occupier); investors get rent added per suburb.
    const bpBase = borrowingPower({ grossIncome: income, couple, dependants: +f.deps || 0, otherDebtMonthly: debtsMonthly, ratePct: rate });
    const capFromWeekly = maxWeekly ? ((maxWeekly * 52) / 12) * (1 - (1 + rate / 1200) ** -360) / (rate / 1200) : Infinity;
    const loanCapFor = (weeklyRent) => {
      let cap = bpBase.amount;
      if (investor && weeklyRent) cap = borrowingPower({ grossIncome: income, couple, dependants: +f.deps || 0, otherDebtMonthly: debtsMonthly, ratePct: rate, newRentWeekly: weeklyRent }).amount;
      return Math.min(cap, capFromWeekly);
    };
    // the page address keeps only the choices; savings, income and debts go in a link only when you copy one
    const params = new URLSearchParams({ buyer, type: f.type, profile: f.profile, pop: f.pop, lvr: f.lvr });
    const personal = new URLSearchParams({ savings, income: +f.income || 0, income2: +f.income2 || 0, rate });
    if (+f.deps) personal.set('deps', +f.deps);
    if (+f.debts) personal.set('debts', +f.debts);
    if (+f.cards) personal.set('cards', +f.cards);
    if (f.help1) personal.set('help1', 1);
    if (f.help2) personal.set('help2', 1);
    if (notOwned5) personal.set('notOwned5', 1);
    if (maxWeekly) personal.set('maxWeekly', maxWeekly);
    // comfortable: repayments within the stress threshold of before-tax household income
    const comfyWeekly = comfortableWeekly(income);
    const mr = rate / 1200;
    const comfyLoan = ((comfyWeekly * 52) / 12) * (1 - (1 + mr) ** -360) / mr;
    const live = f.profile === 'live' && !investor;
    const maxKm = +f.commute || 30;
    if (work && !investor) {
      params.set('work', work.id);
      params.set('commute', maxKm);
    }
    if (f.where) params.set('where', f.where);
    history.replaceState(null, '', `/afford?${params}`);
    shareUrl = `/afford?${params}&${personal}`;

    // --- per-state ceilings (owner: no rent; investor: assume a 4.2% yield property)
    const optsFor = (st) => {
      const keystart = ksWanted && st === 'WA' && ksIncomeOk;
      return { state: st, savings, maxLvr: ksWanted && !keystart ? 0.9 : maxLvr, buyer, guarantee, cap: HOME_GUARANTEE.caps[st][0], htb, htbCap: HELP_TO_BUY.caps[st][0], notOwned5, keystart, ksCap: KEYSTART.cap };
    };
    const stateRows = Object.keys(STATES).map((st) => {
      const o = optsFor(st);
      const p0 = maxPrice({ ...o, loanCap: loanCapFor(investor ? 700 : 0) });
      const s = p0 ? structure({ ...o, price: p0, loanCap: loanCapFor(investor ? (p0 * 0.042) / 52 : 0) }) : null;
      const comfy = investor ? null : maxPrice({ ...o, loanCap: Math.min(loanCapFor(0), comfyLoan) });
      const cs = comfy ? structure({ ...o, price: comfy, loanCap: Math.min(loanCapFor(0), comfyLoan) }) : null;
      return { st, max: p0, s, comfy, cs };
    });

    // --- every suburb
    const w = PROFILES[f.profile] || PROFILES.balanced;
    const [kind, code] = (f.where || ':').split(':');
    const anywhere = !f.where || f.where === 'any';
    const minPop = +f.pop || 0;
    const matches = [];
    const stretch = [];
    let eligible = 0;
    for (const s of list) {
      if (s.pop < minPop) continue;
      if (kind === 's' && s.s !== code) continue;
      if (kind === 'r' && s.rg !== code) continue;
      const km = work && !investor ? haversine(work, s) : null;
      if (km !== null && km > maxKm) continue;
      // people buying a home to live in: leave out mining towns, single-industry and remote places unless they work there
      if (!investor && km === null && ((s.rsk ?? 0) >= 50 || /Remote/.test(s.ra || ''))) continue;
      // islands with no road bridge (Russell Island, Stradbroke, Magnetic Island…): not a place to live and commute from
      if (!investor && s.isl && !(work && work.isl)) continue;
      eligible++;
      const types = f.type === 'any' ? ['h', 'u'] : [f.type];
      let best = null;
      for (const t of types) {
        const price = t === 'u' ? s.u : s.h;
        const rent = t === 'u' ? s.ru : s.rh;
        if (!price) continue;
        // don't recommend a type the suburb barely has (a "unit" in a suburb that is 100% houses, or a house in a tower precinct)
        const houseShare = s['hou%'] ?? 70;
        if (t === 'u' && 100 - houseShare < 10) continue;
        if (t === 'h' && houseShare < 10) continue;
        const st = structure({ ...optsFor(s.s), price, loanCap: investor ? loanCapFor(rent) : Math.min(loanCapFor(0), comfyLoan), cap: guaranteeCap(s), htbCap: helpToBuyCap(s) });
        // high-rise dominated markets (70%+ flats): oversupply, weak resale and tighter lending, so they rank lower for living in
        const highRise = t === 'u' && (s['fla%'] ?? 0) >= 70;
        const score = Math.max(0, (live ? liveScore(s, km, maxKm) : suburbScore(s.sc, w)) - (highRise && live ? 15 : 0));
        // buying to live in: put spare savings into the deposit (keeping about 3 months' repayments as a buffer),
        // so a cheaper home means a smaller loan and a smaller weekly repayment
        const stLive = !investor && st.ok ? leaner(st, price, s.s, rate) : st;
        const rec = { s, t, price, rent, st: stLive, score, km, highRise, yld: rent ? (rent * 52 * 100) / price : null };
        if (st.ok) {
          if (!best || (t === 'h' && f.type === 'any') || rec.score > best.score) best = rec; // prefer a house when both fit
        } else if (price <= (stateRows.find((r) => r.st === s.s)?.max || 0) * (investor ? 1.12 : 1) && t === (f.type === 'any' ? s.pt : f.type) && !(rec.highRise && live)) stretch.push(rec);
      }
      if (best) matches.push(best);
    }
    matches.sort((a, b) => b.score - a.score || b.price - a.price);
    // With no workplace and no area chosen, don't let one region fill the list: at most 5 of the top picks per market.
    if (!work && anywhere) {
      const per = {};
      const head = [];
      const rest = [];
      for (const m of matches) ((per[m.s.rg] = (per[m.s.rg] || 0) + 1) <= 5 ? head : rest).push(m);
      matches.splice(0, matches.length, ...head, ...rest);
    }
    // "just out of reach" only lists suburbs with nothing affordable in them, so a suburb never appears in both lists
    const inReach = new Set(matches.map((m) => m.s));
    const stretchOnly = stretch.filter((m) => !inReach.has(m.s)).sort((a, b) => b.score - a.score);

    // Weekly cost of the top picks
    // Home buyers with no workplace and no area get no national ranking: a list of 'places to live' anywhere in
    // Australia isn't meaningful. They pick a city or add a workplace first.
    const needArea = live && !work && anywhere;
    const top = (needArea ? [] : matches.slice(0, 40)).map((m) => {
      const repay = (repayment(m.st.loan, rate, 30) * 12) / 52;
      let weekly = -repay;
      let irr = null;
      if (investor) {
        const a = analyse({ state: m.s.s, price: m.price, weeklyRent: m.rent || 0, deposit: m.st.deposit / m.price, ratePct: rate, income, hold: 10, growth: GROWTH.base, perth: m.s.rg === 'PER', strata: m.t === 'u' ? 3200 : 0, landValuePct: m.t === 'u' ? 0.25 : 0.55, otherCosts: OTHER_COSTS });
        weekly = a.summary.weeklyCashAfterTax;
        irr = a.summary.irr;
      }
      return { ...m, repay, weekly, irr };
    });
    const byState = {};
    for (const m of matches) (byState[m.s.s] ||= []).push(m);
    const capitals = Object.entries(market.regions).filter(([, r]) => r.capital);
    const takeHome = ((+f.income || 0) - incomeTax(+f.income || 0) + (+f.income2 || 0) - incomeTax(+f.income2 || 0)) / 52;

    if (!savings || !income) {
      out.innerHTML = '<div class="card"><p>Enter your savings and income to start.</p></div>';
      return;
    }
    const bestState = [...stateRows].sort((a, b) => b.max - a.max)[0];
    const areaState = kind === 's' ? code : kind === 'r' ? market.regions[code]?.state : null;
    const own = areaState ? stateRows.find((r) => r.st === areaState) : null;
    const wk = (loan) => (repayment(loan, rate, 30) * 12) / 52;
    const sharePct = (loan) => Math.round(((wk(loan) * 52) / income) * 100);
    const areaName = kind === 'r' ? market.regions[code]?.name : areaState ? STATES[areaState] : '';
    const capState = areaState || bestState.st;
    out.innerHTML = `
    <div class="card">
      <div class="eyebrow">Your buying power${example ? ' · <span class="tag">Example numbers</span>' : ''}</div>
      ${investor ? `<div class="grid g3" style="gap:14px">
        <div class="stat"><span class="k">Most a lender might lend</span><span class="v xl">${aud(Math.min(bpBase.amount, capFromWeekly), { compact: true })}</span><span class="s">Lenders check you could still pay at ${pct(bpBase.assessRate, 2)}, 3 points above your rate, and count 80% of the rent</span></div>
        <div class="stat"><span class="k">Highest price you could buy</span><span class="v xl">${aud((own || bestState).max, { compact: true })}</span><span class="s">in ${esc(areaName || STATES[bestState.st])} with ${aud(savings, { compact: true })} saved</span></div>
        <div class="stat"><span class="k">Suburbs with a house or unit you can afford</span><span class="v xl">${matches.length.toLocaleString()}</span><span class="s">of ${eligible.toLocaleString()} ${f.where && f.where !== 'any' ? `in ${esc(areaName)}` : 'across Australia'} with ${minPop.toLocaleString()}+ residents</span></div>
      </div>` : own ? `<div class="grid g3" style="gap:14px">
        <div class="stat"><span class="k">A comfortable price in ${esc(areaName)}</span><span class="v xl up">${own.comfy ? aud(own.comfy, { compact: true }) : '—'}</span><span class="s">${own.cs ? `Repayments within ${STRESS.label}` : 'Not enough saved for the deposit and costs yet'}</span></div>
        <div class="stat"><span class="k">Cash you need at that price</span><span class="v xl">${own.cs ? aud(own.cs.cash, { compact: true }) : '—'}</span><span class="s">${own.cs ? `${aud(own.cs.deposit, { compact: true })} deposit, ${own.cs.duty ? `${aud(own.cs.duty)} stamp duty` : 'no stamp duty'} and ${aud(OTHER_COSTS)} of fees${own.cs.lmi ? `; ${aud(own.cs.lmi)} mortgage insurance added to the loan` : ''}` : ''}</span></div>
        <div class="stat"><span class="k">Weekly repayment</span><span class="v xl">${own.cs ? aud(wk(own.cs.loan)) : '—'}</span><span class="s">${own.cs ? `on a ${aud(own.cs.loan, { compact: true })} loan at ${pct(rate, 2)} over 30 years` : ''}</span></div>
      </div>
      <div class="kv subtle-kv" style="margin-top:12px">
        <span>The most a lender might stretch to</span><span>${own.max ? `${aud(own.max, { compact: true })}${own.s ? `, about ${aud(wk(own.s.loan))}/wk (${sharePct(own.s.loan)}% of before-tax income${sharePct(own.s.loan) > STRESS.share * 100 ? ': mortgage stress' : ''})` : ''}` : '—'}</span>
        <span>Suburbs with a home in your comfortable budget</span><span>${matches.length.toLocaleString()} in ${esc(areaName)} with ${minPop.toLocaleString()}+ residents${work ? ` within ${maxKm} km of work` : ''}</span>
      </div>` : `<div class="callout" style="margin:0"><b>Where do you want to buy?</b> Choose a city or state at the top of the form to see your comfortable price there. The table below shows every state and territory.</div>`}
      <p class="note" style="margin-top:12px">${esc(verdictText({ matches, stateRows, capitals, savings, income, buyer, takeHome, rate, guarantee, maxLvr, live, needArea, own, areaName, areaRegion: kind === 'r' ? market.regions[code] : null, noLmi: htb || ksWanted }))}</p>
      ${investor ? '' : `<p class="note" style="margin-top:8px"><a href="/first-home?${new URLSearchParams({ price: own?.comfy || '', state: areaState || '', dep: guarantee ? '0.05' : maxLvr >= 0.9 ? '0.1' : '0.2', savings, income })}#save" data-link>How long to save more, and renting versus buying, with these numbers →</a></p>`}
    </div>

    <details class="card fold" style="margin-top:16px" ${anywhere ? 'open' : ''}><summary><h3 style="display:inline">${investor ? 'Your ceiling in each state' : 'Comfortable price and ceiling in each state'}</h3> <span class="note">stamp duty, deposit and repayments for every state and territory</span></summary>
      <div class="tbl-wrap"><table><thead><tr><th>State</th>${investor ? '' : '<th class="n">Comfortable</th>'}<th class="n">Most you could stretch to</th><th class="n">Loan</th><th class="n">Deposit</th><th class="n">Stamp duty</th><th class="n">Mortgage insurance</th><th class="n">Cash used</th><th class="n">Repayment / wk</th><th class="n">Suburbs</th></tr></thead><tbody>
      ${[...stateRows].sort((a, b) => (b.st === areaState) - (a.st === areaState))
        .map((r) => `<tr class="${r.st === areaState ? 'row-on' : ''}"><td>${STATES[r.st]}</td>${investor ? '' : `<td class="n up"><b>${r.comfy ? aud(r.comfy, { compact: true }) : '—'}</b></td>`}<td class="n">${aud(r.max, { compact: true })}</td>${r.s ? `<td class="n">${aud(r.s.loan, { compact: true })}</td><td class="n">${aud(r.s.deposit, { compact: true })}</td><td class="n">${aud(r.s.duty)}</td><td class="n">${aud(r.s.lmi)}</td><td class="n">${aud(r.s.cash, { compact: true })}</td><td class="n">${aud((repayment(r.s.loan, rate, 30) * 12) / 52)}</td>` : '<td colspan="6" class="muted">Not enough for costs</td>'}<td class="n">${anywhere || r.st === areaState || kind === 's' && r.st === code ? (byState[r.st]?.length || 0).toLocaleString() : '<span class="faint" title="Outside the area you chose">—</span>'}</td></tr>`)
        .join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">${investor ? '' : 'Loan, deposit, stamp duty, mortgage insurance, cash and repayments are at the stretch price. '}Stamp duty ${buyer === 'fhb' ? 'includes first home buyer concessions for established homes' : buyer === 'owner' ? 'uses owner-occupier concessions where they exist' : 'at investor rates'}. ${guarantee ? `5% Deposit Scheme: 5% deposit, no LMI, no income cap, up to the price cap for each area (capital-city caps shown here, e.g. ${aud(HOME_GUARANTEE.caps[capState][0], { compact: true })} in ${esc(CAPITAL_NAME[capState])}, ${aud(HOME_GUARANTEE.caps[capState][1], { compact: true })} in the rest of ${esc(STATES[capState])}). Above the cap Ownaroo uses a 10% deposit with LMI.` : ''}${f.lvr === 'htb' ? (htb ? ` Help to Buy: the government pays 30% of an existing home (40% of a new one), you need 2% plus duty and costs, no LMI, and you buy its share back over time or repay it on sale (it takes the same share of any gain). Price caps apply (${aud(HELP_TO_BUY.caps[capState][0], { compact: true })} in ${esc(CAPITAL_NAME[capState])}); above them Ownaroo uses a 10% deposit with LMI.` : ` Help to Buy isn't available at this income (limit ${aud(couple ? HELP_TO_BUY.income.joint : HELP_TO_BUY.income.single)} ${couple ? 'for couples' : 'for singles'}), so these figures use a 10% deposit with LMI.`) : ''} Includes ${aud(OTHER_COSTS)} for conveyancing, inspections and fees. ${investor ? '' : `Comfortable means repayments within ${STRESS.label} (${aud(comfyWeekly)}/wk for you); "stretch" is the most a lender might approve. `}Take-home pay about ${aud(takeHome)}/wk.</p>
    </details>

    <div class="card" style="margin-top:16px">
      <div class="card-head"><h3>Suburbs that fit your budget</h3><span class="note">${live ? `Ranked for living in: ${work ? `distance to ${esc(cleanName(work.n))}, ` : ''}local economy and stability, town size and services, and price growth` : `Ranked by ${esc(form.profile.selectedOptions[0].text.toLowerCase())} score`}</span> ${live && !work && !anywhere ? `<span class="callout" style="display:block;margin:8px 0 0">Without a workplace this ranks only on local economy, services and price trend, so it can suggest places that don't suit you. <b>Add where you work</b> (left) to rank by commute${f.where ? '' : `, or pick a city: ${capitals.map(([c, r]) => `<button type="button" class="pill" data-where="r:${c}">${esc(r.name)}</button>`).join(' ')}`}.</span>` : ''}<span class="fine" style="display:block"><span class="area-tag">city-wide</span> or <span class="area-tag">region-wide</span> = the 12-month figure for the whole city or region, where there's no suburb-level sales data.</span></div>
      ${top.length ? `${(() => {
        // a growth column where every row shows the same city-wide figure tells a buyer nothing: say it once instead
        const areaOnly = top.every((m) => String(m.s.g1s || '').startsWith('region')) && new Set(top.map((m) => m.s.rg)).size === 1;
        const R0 = market.regions[top[0].s.rg] || {};
        return `${areaOnly ? `<p class="note" style="margin:6px 0 10px">None of these suburbs has its own sales series, so there's no suburb-level price trend. ${esc(R0.name || 'The area')} as a whole: ${pct(R0.quarterPct, 1, true)} over 3 months, ${pct(R0.annualPct, 1, true)} over 12.</p>` : ''}<div class="tbl-wrap"><table class="cards-sm" id="aff-tbl"><thead><tr><th>#</th><th>Suburb</th><th class="n">${live ? 'Fit for you' : 'Score'}</th><th class="n">Typical price</th><th class="n">${investor ? "You'd need" : 'Cash in'}</th><th class="n">${investor ? 'Left over' : 'Buffer kept'}</th><th class="n">${investor ? 'Weekly after tax' : 'Repayment / wk'}</th>${investor ? '<th class="n">Rent / wk</th><th class="n">Yield</th>' : `<th class="n">Deposit type</th>${work ? '<th class="n">To work</th>' : ''}`}${areaOnly ? '' : '<th class="n">Price trend</th>'}${investor ? '<th class="n">10-yr return</th>' : ''}<th></th></tr></thead><tbody>
      ${top
        .map((m, i) => `<tr class="${i >= 10 ? 'more-row' : ''}" ${i >= 10 ? 'hidden' : ''}><td class="faint mono">${i + 1}</td><td><a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a> <span class="muted">${m.s.s} ${m.s.pc || ''}</span><div class="fine">${m.t === 'u' ? 'unit' : 'house'}${m.highRise ? ' · <span class="down">high-rise market</span>' : ''}${m.s.isl ? ' · <span class="down">island, no bridge</span>' : ''} ${srcBadge(m.t === 'u' ? m.s.us : m.s.hs)}</div></td><td class="n">${scoreBadge(m.score)}</td><td class="n">${aud(m.price, { compact: true })}</td><td class="n">${aud(m.st.cash, { compact: true })}</td><td class="n ${investor ? 'up' : ''}">${aud(m.st.spare, { compact: true })}</td><td class="n ${investor ? (m.weekly < 0 ? 'down' : 'up') : ''}">${aud(Math.round(investor ? m.weekly : -m.weekly))}</td>${investor ? `<td class="n">${aud(m.rent)}</td><td class="n">${pct(m.yld, 1)}</td>` : `<td class="n"><span class="fine">${m.st.htb ? `Help to Buy (govt ${aud(m.st.govShare, { compact: true })})` : m.st.keystart ? 'Keystart' : m.st.guarantee ? '5% scheme' : m.st.lmi ? `LMI ${aud(m.st.lmi, { compact: true })}` : 'no LMI'}</span></td>${work ? `<td class="n">${m.km.toFixed(0)} km</td>` : ''}`}${areaOnly ? '' : `<td class="n">${growth12(m.s, { suffix: '', short: true })}</td>`}${investor ? `<td class="n">${pct(m.irr, 1)}</td>` : ''}<td><a class="btn sm" href="/analyse?suburb=${m.s.id}&price=${m.price}&rent=${m.rent || ''}&type=${m.t}&dep=${Math.round((m.st.deposit / m.price) * 100)}&rate=${rate}&buyer=${buyer}" data-link>Analyse</a> <a class="btn sm ghost" data-ev="for-sale" href="${listingLinks(m.s, { type: m.t, maxPrice: Math.round(m.price * 1.1 / 10000) * 10000 }).reaBuy}" target="_blank" rel="noopener">For sale ↗</a></td></tr>`)
        .join('')}</tbody></table></div>
      <div class="row" style="margin-top:10px">${top.length > 10 ? `<button class="btn sm" type="button" id="aff-more">Show ${top.length - 10} more</button>` : ''}<a class="btn sm" href="/compare?ids=${top.slice(0, 4).map((m) => m.s.id).join(',')}" data-link>Compare the top ${Math.min(4, top.length)} side by side</a></div>
      ${investor ? '' : '<p class="fine" style="margin-top:6px">Each row puts your spare savings into the deposit and keeps about three months of repayments as a buffer, so a cheaper home means a smaller loan.</p>'}`;
      })()}` : needArea ? `<div class="callout" style="margin:8px 0 0"><b>Where do you want to live?</b> ${matches.length.toLocaleString()} suburbs across Australia fit your budget. Add your workplace on the left to rank them by commute, or pick a city: <div class="row" style="margin-top:8px">${capitals.map(([c, r]) => `<button type="button" class="pill" data-where="r:${c}">${esc(r.name)}</button>`).join(' ')}</div></div>` : nearestOptions({ list, own: own || bestState, areaName, kind, code, work, maxKm, investor, minPop, f, wk, ksWanted, areaState, cashFor: (s, price) => structure({ ...optsFor(s.s), price, loanCap: 1e12, cap: guaranteeCap(s), htbCap: helpToBuyCap(s) }).cash, savings })}
    </div>

    <div class="grid ${anywhere ? 'g2' : ''}" style="margin-top:16px">
      ${anywhere ? '' : '<!--'}<div class="card"><h3>Top match in each state and territory</h3><div class="kv">${Object.keys(STATES)
        .map((st) => {
          const b = (byState[st] || [])[0];
          return `<span>${STATES[st]}</span><span>${b ? `<a href="${suburbUrl(b.s)}" data-link>${esc(cleanName(b.s.n))}</a> · ${b.t === 'u' ? 'unit' : 'house'} ${aud(b.price, { compact: true })} · ${scoreBadge(b.score)}` : '<span class="faint">none in budget</span>'}</span>`;
        })
        .join('')}</div></div>${anywhere ? '' : '-->'}
      ${stretchOnly.length ? '' : '<!--'}<div class="card"><h3>${investor ? 'Just out of reach' : 'Only if you stretch'}</h3><p class="note">${investor ? "Strong suburbs within about 12% of your ceiling. A bit more saved, a partner's income, or a lower rate could open these up." : `Suburbs above your comfortable price but within what a lender might approve. Repayments would be over ${STRESS.label}.`}</p>
      <div class="kv">${stretchOnly.slice(0, 8).map((m) => `<span><a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a> <span class="muted">${m.s.s}</span></span><span>${m.t === 'u' ? 'unit' : 'house'} ${aud(m.price, { compact: true })}${investor ? ` · short ${aud(-m.st.spare, { compact: true })}` : ` · repayments about ${aud(wk(m.price * Math.min(maxLvr, 0.95)))}/wk`}</span>`).join('')}</div></div>${stretchOnly.length ? '' : '-->'}
    </div>

    ${top.length ? '<div class="card" style="margin-top:16px"><h3>Where your top options are</h3><div id="amap" class="map short"></div></div>' : ''}

    <div class="card" style="margin-top:16px" id="stretch"><h3>Ways to stretch your budget</h3>
      <ul class="pros">${levers({ savings, income, couple, deps: +f.deps || 0, debts: debtsMonthly, type: f.type, rate, maxLvr, buyer, guarantee, loanCapFor, bestState: own || bestState }).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    ${buyer === 'fhb' ? schemesCard({ income, couple, kind, code, bestState, market, areaState }) : ''}
    ${investor ? '' : `<div style="margin-top:16px">${nextStepsCard({ fhb: buyer === 'fhb' })}</div>`}
    <div class="row no-print" style="margin-top:12px">${investor ? '' : '<button class="btn" type="button" id="print-plan">Print or save my plan as PDF</button>'}${copyLinkButton()}</div><p class="fine no-print" style="margin-top:6px">Nothing you enter is saved or sent anywhere. The page address keeps your choices but not your savings or income; "Copy link" includes them, so you can reopen the result on another device.</p>`;

    if (homePrice && own) {
      const verdictHome = own.comfy >= homePrice ? ['green', `Within your comfortable price. ${aud(homePrice)} is ${aud(own.comfy - homePrice, { compact: true })} under it.`]
        : own.max >= homePrice ? ['', `Possible only if you stretch. ${aud(homePrice)} is above your comfortable price of ${aud(own.comfy, { compact: true })} but within the most a lender might lend.`]
        : ['red', `Out of reach for now. ${aud(homePrice)} is ${aud(homePrice - own.max, { compact: true })} above the most you could stretch to here.`];
      out.insertAdjacentHTML('afterbegin', `<div class="callout ${verdictHome[0]}" style="margin:0 0 12px"><b>This home${homeSub ? ` in ${esc(cleanName(homeSub.n))}` : ''}:</b> ${verdictHome[1]}</div>`);
    }
    if (own?.comfy && !investor) {
      const actions = out.querySelector('#print-plan')?.parentElement;
      actions?.insertAdjacentHTML('afterbegin', '<button class="btn" type="button" id="save-card">Save my number as an image</button>');
      numberCard = { place: areaName, price: own.comfy, cash: own.cs?.cash, weekly: own.cs ? wk(own.cs.loan) : null, rate, home: homePrice };
    }
    if (map) {
      map.remove();
      map = null;
    }
    if (window.L && top.length) {
      map = L.map('amap', { scrollWheelZoom: false });
      baseTiles().addTo(map);
      const css = getComputedStyle(document.documentElement);
      const col = (v) => css.getPropertyValue(v >= 65 ? '--sc-a' : v >= 55 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
      top.forEach((m, i) => L.circleMarker([m.s.lat, m.s.lng], { radius: 7, weight: 1, color: '#0008', fillColor: col(m.score), fillOpacity: 0.95 }).addTo(map).bindPopup(`<b>${i + 1}. <a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a></b> ${m.s.s}<br>${aud(m.price, { compact: true })} · score ${m.score}`));
      map.fitBounds(L.latLngBounds(top.map((m) => [m.s.lat, m.s.lng])).pad(0.1), { maxZoom: 11 });
    }
  }

  main.querySelector('#go').addEventListener('click', (e) => {
    run(e);
    countEvent('afford-result');
    if (window.innerWidth < 900) main.querySelector('#out')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  main.addEventListener('click', (e) => {
    if (e.target.closest('#print-plan')) window.print();
    if (e.target.closest('#save-card') && numberCard) {
      saveNumberCard(numberCard);
      countEvent('number-card');
    }
    if (e.target.closest('#aff-more')) {
      main.querySelectorAll('#aff-tbl .more-row').forEach((r) => (r.hidden = false));
      e.target.closest('#aff-more').remove();
    }
  });
  main.addEventListener('click', (e) => {
    const b = e.target.closest('[data-where]');
    if (!b) return;
    form.where.value = b.dataset.where;
    run();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  form.addEventListener('change', run);
  run();
  return { destroy: () => map?.remove() };
}

/** Use spare savings to borrow less, keeping a buffer of about three months' repayments. */
function leaner(st, price, state, rate) {
  const base = st.loan - (st.lmi || 0);
  const buffer = Math.min(st.spare, Math.round(((repayment(base, rate, 30) * 3) / 1000)) * 1000);
  const extra = Math.max(0, st.spare - buffer);
  const loanBase = Math.max(0, base - extra);
  const lvr = loanBase / price;
  const lmiPrem = !st.guarantee && !st.htb && !st.keystart && lvr > 0.8 ? lmi(loanBase, price, state).premium || 0 : 0;
  return { ...st, loan: loanBase + lmiPrem, lmi: lmiPrem, lvr, deposit: st.deposit + extra, cash: st.cash + extra, spare: buffer, buffer: true, guarantee: st.guarantee && lvr > 0.8 };
}

const CAPITAL_NAME = { NSW: 'Sydney', VIC: 'Melbourne', QLD: 'Brisbane', WA: 'Perth', SA: 'Adelaide', TAS: 'Hobart', ACT: 'Canberra', NT: 'Darwin' };

/**
 * When nothing fits, never stop at zero: show the closest-priced homes in the area and what each lever would open up
 * (a wider commute, units, smaller towns, 10% more, Keystart in WA), with real counts.
 */
function nearestOptions({ list, own, areaName, kind, code, work, maxKm, investor, minPop, f, wk, ksWanted, areaState, cashFor, savings }) {
  const limit = (investor ? own.max : own.comfy) || 0;
  const inArea = (s) => (kind === 's' ? s.s === code : kind === 'r' ? s.rg === code : true);
  const cand = (radius, types, pop) => {
    const out = [];
    for (const s of list) {
      if (s.pop < pop || !inArea(s)) continue;
      if (!investor && s.isl && !(work && work.isl)) continue;
      const km = work && !investor ? haversine(work, s) : null;
      if (km !== null && km > radius) continue;
      if (!investor && km === null && ((s.rsk ?? 0) >= 50 || /Remote/.test(s.ra || ''))) continue;
      let best = null;
      for (const t of types) {
        const price = t === 'u' ? s.u : s.h;
        if (!price) continue;
        const hs = s['hou%'] ?? 70;
        if ((t === 'u' && 100 - hs < 10) || (t === 'h' && hs < 10)) continue;
        if (!best || price < best.price) best = { s, t, price, km };
      }
      if (best) out.push(best);
    }
    return out.sort((a, b) => a.price - b.price);
  };
  const types = f.type === 'any' ? ['h', 'u'] : [f.type];
  const fits = (arr, cap = limit) => arr.filter((x) => x.price <= cap).length;
  const base = cand(maxKm, types, minPop);
  const closest = base.slice(0, 6);
  const plural = (n, one, many) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
  const ways = [];
  if (work && !investor) {
    for (const r of [50, 80]) {
      if (r <= maxKm) continue;
      const n = fits(cand(r, types, minPop));
      if (n) {
        ways.push(`<b>Widen the distance from work to ${r} km:</b> ${plural(n, 'suburb fits', 'suburbs fit')} your ${investor ? 'ceiling' : 'comfortable price'}.`);
        break;
      }
    }
  }
  if (f.type === 'h') {
    const n = fits(cand(maxKm, ['u'], minPop));
    ways.push(n ? `<b>Include units and townhouses:</b> ${plural(n, 'suburb has', 'suburbs have')} one within your ${investor ? 'ceiling' : 'comfortable price'}.` : '<b>Units and townhouses</b> also start above your budget here.');
  }
  if (minPop > 1000) {
    const n = fits(cand(maxKm, types, 1000)) - fits(base);
    if (n > 0) ways.push(`<b>Include smaller places (1,000+ residents):</b> ${plural(n, 'more suburb fits', 'more suburbs fit')}.`);
  }
  const over10 = fits(base, limit * 1.1);
  if (limit && over10) ways.push(`<b>Stretch 10% to ${aud(limit * 1.1, { compact: true })}:</b> ${plural(over10, 'suburb has', 'suburbs have')} a typical home in reach, for about ${aud(wk(limit * 0.1))} a week more in repayments.`);
  if (areaState === 'WA' && !investor && !ksWanted) ways.push("<b>Keystart (WA):</b> if savings are what's holding you back, its 2% deposit with no mortgage insurance can help. Choose it under Deposit.");
  ways.push("<b>A partner's income, or saving for longer:</b> the <a href=\"#stretch\">ways to stretch your budget</a> below show what each would do.");
  const rows = closest.map((x) => {
    const cash = cashFor(x.s, x.price);
    return `<tr><td><a href="${suburbUrl(x.s)}" data-link>${esc(cleanName(x.s.n))}</a> <span class="muted">${x.s.s}</span></td><td>${x.t === 'u' ? 'unit' : 'house'}</td><td class="n">${aud(x.price, { compact: true })}</td><td class="n down">${limit ? `${aud(x.price - limit, { compact: true })} over` : '—'}</td><td class="n ${cash > savings ? 'down' : ''}">${aud(cash, { compact: true })}</td>${work && !investor ? `<td class="n">${x.km.toFixed(0)} km</td>` : ''}</tr>`;
  }).join('');
  return `<div class="callout" style="margin:8px 0 0"><b>Nothing ${esc(areaName ? `in ${areaName}` : 'here')}${work && !investor ? ` within ${maxKm} km of work` : ''} fits your ${investor ? 'ceiling' : 'comfortable price'} of ${aud(limit, { compact: true })} yet.</b> Here's how close you are, and what would change it.</div>
    ${closest.length ? `<h4 style="margin:14px 0 6px">The closest-priced homes</h4><div class="tbl-wrap"><table><thead><tr><th>Suburb</th><th>Type</th><th class="n">Typical price</th><th class="n">Over your budget</th><th class="n">Least cash needed</th>${work && !investor ? '<th class="n">To work</th>' : ''}</tr></thead><tbody>${rows}</tbody></table></div>` : ''}
    <h4 style="margin:14px 0 6px">Ways in</h4><ul class="plain-list" style="margin:0;padding-left:18px;line-height:1.6">${ways.map((w) => `<li>${w}</li>`).join('')}</ul>`;
}

const AMENITY = { 'Major Cities': 100, 'Inner Regional': 72, 'Outer Regional': 42, Remote: 15, 'Very Remote': 5 };
/** Score for a place to live (not an investment): commute, local economy and stability, town size and services, growth. */
export function liveScore(s, km, maxKm) {
  const parts = [];
  if (km !== null && km !== undefined) parts.push([Math.max(0, Math.min(100, 100 * (1 - (km - 4) / Math.max(6, maxKm - 4)))), 35]);
  const size = Math.max(0, Math.min(100, ((Math.log10(Math.max(s.pop, 50)) - 2) / 2.5) * 100));
  parts.push([s.sc.stability ?? 50, 28]);
  parts.push([((AMENITY[s.ra] ?? 50) * 2 + size) / 3, 20]);
  parts.push([((s.sc.growth ?? 50) + (s.sc.momentum ?? 50)) / 2, 12]);
  parts.push([s.sc.afford ?? 50, 5]);
  const w = parts.reduce((a, [, x]) => a + x, 0);
  return Math.round(parts.reduce((a, [v, x]) => a + v * x, 0) / w);
}

function verdictText({ matches, stateRows, capitals, savings, income, buyer, takeHome, rate, guarantee, maxLvr, live, needArea = false, own = null, areaName = '', areaRegion = null, noLmi = false }) {
  // home buyers are judged on the comfortable price, investors on the ceiling
  const lim = (row) => (buyer !== 'investor' && row.comfy != null ? row.comfy : row.max);
  const word = buyer !== 'investor' ? 'your comfortable price' : 'your budget';
  let s = '';
  if (own && areaRegion && (areaRegion.medianHouse || areaRegion.medianDwelling)) {
    // lead with the place they chose
    const L = lim(own) || 0;
    const mh = areaRegion.medianHouse || areaRegion.medianDwelling;
    const mu = areaRegion.medianUnit;
    if (L >= mh) s += `In ${areaName}, ${word} covers the median house (${aud(mh, { compact: true })}). `;
    else if (mu && L >= mu) s += `In ${areaName}, ${word} covers the median unit (${aud(mu, { compact: true })}) but not the median house (${aud(mh, { compact: true })}). `;
    else s += `In ${areaName}, the median house is ${aud(mh, { compact: true })}${mu ? ` and the median unit ${aud(mu, { compact: true })}` : ''}, so what fits is below the middle of the market. `;
  } else {
    const can = capitals.filter(([, r]) => {
      const row = stateRows.find((x) => x.st === r.state);
      return row && lim(row) >= (r.medianHouse || r.medianDwelling);
    }).map(([, r]) => r.name);
    const canUnit = capitals.filter(([, r]) => {
      const row = stateRows.find((x) => x.st === r.state);
      return row && r.medianUnit && lim(row) >= r.medianUnit;
    }).map(([, r]) => r.name);
    const list = (a) => a.join(', ').replace(/, ([^,]*)$/, ' and $1');
    if (can.length) s += `Of the capital cities, ${word} would buy a median-priced house in ${list(can)}. `;
    else if (canUnit.length) s += `A median house is out of reach in every capital, but a median unit is within ${word} in ${list(canUnit)}. `;
    else s += 'Median capital-city prices are above your current ceiling, so the suburbs that fit are in regional centres and outer suburbs. ';
  }
  const top = needArea ? null : matches[0];
  if (top) s += `The ${live ? 'best match for living in' : 'highest-scoring suburb'} within ${word} is ${cleanName(top.s.n)} (${top.s.s}), a ${top.t === 'u' ? 'unit' : 'house'} at about ${aud(top.price, { compact: true })}${live ? `, on commute, local economy, services and growth (${top.score}/100)` : ` with an Ownaroo Score of ${top.score}`}. `;
  const top1 = own || [...stateRows].sort((a, b) => b.max - a.max)[0];
  const rep = top1?.s ? (repayment(top1.s.loan, rate, 30) * 12) / 52 : 0;
  if (buyer !== 'investor' && (top1?.max || 0) > (top1?.comfy || 0) + 5000 && rep > comfortableWeekly(income)) s += `At the most you could stretch to, repayments of about ${aud(rep)}/wk would be over ${STRESS.label}, which is mortgage stress. The comfortable price leaves room for rate rises. `;
  if (maxLvr > 0.8 && !guarantee && !noLmi) s += 'Borrowing above 80% adds lenders mortgage insurance; it is included in these figures. ';
  return s.trim();
}

function levers({ savings, income, couple, deps, debts, rate, maxLvr, buyer, guarantee, loanCapFor, bestState, type = 'any' }) {
  const out = [];
  const base = bestState.max;
  const alt = (o) => maxPrice({ state: bestState.st, savings, loanCap: loanCapFor(0), maxLvr, buyer, guarantee, cap: HOME_GUARANTEE.caps[bestState.st][0], ...o });
  const plus20 = alt({ savings: savings + 20000 });
  if (plus20 > base) out.push(`Saving another $20,000 lifts your ceiling in ${STATES[bestState.st]} from ${aud(base, { compact: true })} to about ${aud(plus20, { compact: true })}.`);
  const lowerRate = borrowingPower({ grossIncome: income, couple, dependants: deps, otherDebtMonthly: debts, ratePct: rate - 0.5 }).amount;
  out.push(`Every 0.5% cut in your rate adds roughly ${aud(lowerRate - borrowingPower({ grossIncome: income, couple, dependants: deps, otherDebtMonthly: debts, ratePct: rate }).amount, { compact: true })} to borrowing power. Compare lenders on the Rates page.`);
  if (debts > 0) out.push(`Clearing ${aud(debts)}/month of other debt (or reducing credit card limits) could add about ${aud(borrowingPower({ grossIncome: income, couple, dependants: deps, otherDebtMonthly: 0, ratePct: rate }).amount - borrowingPower({ grossIncome: income, couple, dependants: deps, otherDebtMonthly: debts, ratePct: rate }).amount, { compact: true })} to what you can borrow.`);
  if (maxLvr <= 0.8) out.push('Allowing a 10% deposit with LMI usually raises your ceiling a lot, at the cost of the LMI premium and more debt.');
  if (buyer === 'fhb' && !guarantee) out.push('Eligible first home buyers can use the federal 5% Deposit Scheme (Home Guarantee) to buy with 5% down and no LMI, within the scheme\'s price caps.');
  if (buyer === 'fhb' && ['QLD', 'SA'].includes(bestState.st)) out.push(`New homes are duty-free for first home buyers in ${bestState.st === 'QLD' ? 'Queensland' : 'South Australia'} regardless of price.`);
  if (buyer !== 'investor' && bestState.st === 'WA') out.push('Keystart lends from a 2% deposit with no mortgage insurance, for homes up to $860,000 (income limits apply). Choose it under Deposit to see what it does for you, and compare its rate with a bank loan under the 5% Deposit Scheme.');
  if (type !== 'u') out.push('Units and townhouses often cost 25-40% less than houses in the same suburb, which can put a better location within reach.');
  return out;
}

/** Yes/no view of the first home schemes for the numbers entered. General rules only: each has more conditions. */
function schemesCard({ income, couple, kind, code, bestState, market, areaState }) {
  const st = areaState || bestState?.st;
  const htbLimit = couple ? HELP_TO_BUY.income.joint : HELP_TO_BUY.income.single;
  const htbOk = income <= htbLimit;
  const g = FHOG[st];
  const row = (ok, name, text) => `<li><b class="${ok === true ? 'up' : ok === false ? 'down' : ''}">${ok === true ? '✓' : ok === false ? '✗' : '•'} ${name}:</b> ${text}</li>`;
  return `<div class="card" style="margin-top:16px"><h3>First home schemes${st ? ` in ${STATES[st]}` : ''}, for the numbers you entered</h3><ul class="plain-list" style="line-height:1.65;padding-left:0;list-style:none;margin:6px 0 0">
    ${row(true, '5% Deposit Scheme', `no income limit since October 2025. You need to be 18+, an Australian citizen or permanent resident, and buying your first home to live in, under the price cap for the area (${st ? `${aud(HOME_GUARANTEE.caps[st][0], { compact: true })} in ${esc(CAPITAL_NAME[st])}, ${aud(HOME_GUARANTEE.caps[st][1], { compact: true })} in the rest of ${esc(STATES[st])}` : 'set for each state and region'}).`)}
    ${row(htbOk, 'Help to Buy', htbOk ? `your ${couple ? 'combined' : ''} income of ${aud(income)} is under the ${aud(htbLimit)} limit${couple ? ' for couples' : ' for singles'}. Places are limited, and the price cap${st ? ` is ${aud(HELP_TO_BUY.caps[st][0], { compact: true })} in ${esc(CAPITAL_NAME[st])}` : 's vary by state'}.` : `your ${couple ? 'combined' : ''} income of ${aud(income)} is over the ${aud(htbLimit)} limit${couple ? ' for couples' : ' for singles'}.`)}
    ${row(true, 'First Home Super Saver', 'eligible voluntary super contributions made since 1 July 2017 count, up to $15,000 a year and $50,000 in total, plus deemed earnings. Request the release from the ATO before you sign a contract.')}
    ${g ? row(g[0] > 0 ? null : false, `First Home Owner Grant (${st})`, g[0] > 0 ? `${aud(g[0])} for ${g[1]}. Established homes don't qualify${st === 'NT' ? ' except in the NT' : ''}.` : g[1]) : ''}
    ${(STATE_SCHEMES[st] || []).map((x) => row(null, esc(x.name), `${esc(x.text)} <a href="${x.url}" target="_blank" rel="noopener">Details ↗</a>`)).join('')}
  </ul><p class="fine" style="margin-top:8px">A quick check against the main rules only; each scheme has more conditions. Confirm with a participating lender, your state revenue office or <a href="https://www.housingaustralia.gov.au/" target="_blank" rel="noopener">Housing Australia ↗</a>. Details and state duty concessions are in the <a href="/guide/fhb" data-link>first home guide</a>.</p></div>`;
}

/** "Your number" as a PNG a buyer can send to a partner or parent. Drawn in the browser; nothing is uploaded. */
function saveNumberCard(c) {
  const W = 1080, H = 1080;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d');
  x.fillStyle = '#f6f4ef';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#0e6b5c';
  x.fillRect(0, 0, W, 14);
  const font = (w, px, fam = '"IBM Plex Sans", system-ui, sans-serif') => (x.font = `${w} ${px}px ${fam}`);
  x.fillStyle = '#15181e';
  font(700, 44, 'Fraunces, Georgia, serif');
  x.fillText('Ownaroo', 80, 120);
  x.fillStyle = '#6b675e';
  font(500, 34);
  x.fillText(`A comfortable price in ${c.place}`, 80, 290);
  x.fillStyle = '#0e6b5c';
  font(700, 150, 'Fraunces, Georgia, serif');
  x.fillText(aud(c.price, { compact: true }), 74, 440);
  x.fillStyle = '#15181e';
  font(600, 40);
  const lines = [];
  if (c.cash) lines.push(`Cash needed: ${aud(c.cash, { compact: true })}`);
  if (c.weekly) lines.push(`Repayments: about ${aud(c.weekly)} a week`);
  if (c.home) lines.push(`The home we looked at: ${aud(c.home, { compact: true })}`);
  lines.forEach((l, i) => x.fillText(l, 80, 560 + i * 70));
  x.fillStyle = '#6b675e';
  font(400, 26);
  x.fillText(`Repayments kept within 30% of before-tax income, at ${c.rate.toFixed(2)}% over 30 years.`, 80, 900);
  x.fillText(`Estimate only, not credit advice · ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}`, 80, 945);
  x.fillText(location.host, 80, 990);
  cv.toBlob((b) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `my-number-${Math.round(c.price / 1000)}k.png`;
    document.body.append(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  }, 'image/png');
}
