import { suburbPhotos, photoCard } from '../photos.js';
import { demo } from '../demo.js';
import { esc, aud, pct, num, scoreBadge, setMeta, srcBadge, growth12 } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load } from '../data.js';
import { stampDuty, lmi, borrowingPower, repayment, analyse, suburbScore, PROFILES, incomeTax } from '../engine.js';
import { STATES, HOME_GUARANTEE, guaranteeCap, HELP_TO_BUY, helpToBuyCap, FHOG } from '../rules.js';
import { attachSearch } from '../app.js';
import { haversine } from '../data.js';
import { listingLinks, nextStepsCard } from '../insights.js';
import { baseTiles } from '../map.js';

const OTHER_COSTS = 3000; // conveyancing, inspections, registration, loan fees

/**
 * Can this buyer afford this price in this state? Returns the cheapest-cash structure:
 * the largest loan allowed by the lender's LVR cap and the buyer's borrowing power.
 */
export function structure({ price, state, savings, loanCap, maxLvr, buyer, newBuild = false, guarantee = false, cap = Infinity, htb = false, htbCap = Infinity }) {
  if (htb && price <= htbCap) {
    // Help to Buy: government owns a share, buyer puts in at least 2%, no LMI
    const share = price * HELP_TO_BUY.share[newBuild ? 'new' : 'existing'];
    const loan = Math.max(0, Math.min(price - share - price * HELP_TO_BUY.deposit, loanCap));
    const deposit = price - share - loan;
    const duty = stampDuty(state, price, { buyer, newBuild }).duty;
    const cash = deposit + duty + OTHER_COSTS;
    return { ok: cash <= savings, loan, lvr: loan / price, deposit, duty, lmi: 0, cash, spare: savings - cash, htb: true, govShare: share };
  }
  if (htb) return structure({ price, state, savings, loanCap, maxLvr: Math.min(maxLvr, 0.9), buyer, newBuild });
  // 5% Deposit Scheme applies only up to the location's price cap; above it the buyer needs a normal loan (10% + LMI)
  const useG = guarantee && price <= cap;
  const lvrCap = guarantee && !useG ? Math.min(maxLvr, 0.9) : maxLvr;
  const loan = Math.max(0, Math.min(price * lvrCap, loanCap));
  const lvr = loan / price;
  const lm = useG ? { premium: 0 } : lmi(loan, price, state);
  if (lm.premium === null) return { ok: false, reason: 'LVR too high' };
  const duty = stampDuty(state, price, { buyer, newBuild }).duty;
  const deposit = price - loan;
  const cash = deposit + duty + OTHER_COSTS; // LMI is added to the loan
  return { ok: cash <= savings, loan: loan + (lm.premium || 0), lvr, deposit, duty, lmi: lm.premium || 0, cash, spare: savings - cash, guarantee: useG, overCap: guarantee && !useG };
}

/** Highest price affordable in a state (binary search on the structure above). */
export function maxPrice(opts) {
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
  setMeta({ title: 'What can I afford? Find the best property you can buy', description: 'Enter your deposit and income. Keyzing works out your maximum price in every state (stamp duty, LMI, lender buffers) and ranks the best suburbs you can afford.' });
  const [{ list }, rs, market, rba] = await Promise.all([suburbs(), load('rates-summary'), load('market'), load('rba')]);
  const lowOO = rs.best.OO_PI_variable?.[0]?.rate || 6;
  const lowInv = rs.best.INV_PI_variable?.[0]?.rate || 6.3;
  // default to what borrowers are actually paying on new loans (RBA F6), not the single cheapest advertised rate
  const bestOO = rba.actual?.newOOVariable?.at(-1)?.[1] || Math.max(lowOO, 6.2);
  const bestInv = rba.actual?.newInvVariable?.at(-1)?.[1] || Math.max(lowInv, 6.4);
  const q = (k, d) => (query[k] !== undefined ? query[k] : d);

  main.innerHTML = `
  <div class="page-head with-demo"><div><div class="eyebrow">Affordability analyst</div><h1>What can I afford, and where should I buy?</h1>
  <p>Tell Keyzing what you have saved and what you earn. It calculates the most you can pay in every state, including stamp duty, first home concessions, the 5% Deposit Scheme and the 3-point lender buffer, then searches all ${list.length.toLocaleString()} suburbs for the best places you can actually afford. Buying a home to live in? Add where you work and it ranks by commute, local economy, town size and growth instead of investment returns.</p></div>${demo('afford')}</div>
  <div class="grid" style="grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:20px" id="aff-grid">
    <form class="card" id="af" onsubmit="return false" style="align-self:start;position:sticky;top:110px">
      <h3>Your situation</h3>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field" style="grid-column:1/-1">I'm buying as<select name="buyer"><option value="fhb">First home buyer (to live in)</option><option value="owner">Owner-occupier (not first home)</option><option value="investor">Investor</option></select></label>
        <label class="field" style="grid-column:1/-1">Savings for deposit + costs ($)<input name="savings" type="number" step="1" value="${esc(q('savings', 120000))}"></label>
        <label class="field">Gross income ($/yr)<input name="income" type="number" step="1" value="${esc(q('income', 110000))}"></label>
        <label class="field">Partner income<input name="income2" type="number" step="1" value="${esc(q('income2', 0))}"></label>
        <label class="field">Dependants<input name="deps" type="number" min="0" max="8" value="${esc(q('deps', 0))}"></label>
        <label class="field">Other debts ($/mth)<input name="debts" type="number" step="1" value="${esc(q('debts', 0))}"></label>
        <label class="field" style="grid-column:1/-1">Deposit strategy<select name="lvr"><option value="0.8">20% deposit (no LMI)</option><option value="0.9" selected>As low as 10% (LMI added to loan)</option><option value="0.95">As low as 5% (LMI)</option><option value="0.95g">5% deposit, no LMI (5% Deposit Scheme, first home buyers)</option><option value="htb">2% deposit with Help to Buy (government owns up to 30%)</option></select></label>
        <label class="field">Interest rate (%)<input name="rate" type="number" step="0.05" value="${esc(q('rate', bestOO))}"></label>
        <label class="field">Max weekly repayment ($)<input name="maxWeekly" type="number" step="1" placeholder="Lender limit"></label>
        <label class="field">Property type<select name="type"><option value="any">House or unit</option><option value="h">House</option><option value="u">Unit / apartment</option></select></label>
        <div id="livef" style="grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <label class="field" style="grid-column:1/-1;position:relative">Where do you work? (optional)<input id="work" type="search" placeholder="Suburb, e.g. Perth or Osborne Park" value=""><div class="ac" id="wac" hidden style="top:62px;left:0;right:auto"></div></label>
          <label class="field" style="grid-column:1/-1">Max distance from work<select name="commute"><option value="10">10 km</option><option value="20">20 km</option><option value="30" selected>30 km</option><option value="50">50 km</option><option value="80">80 km</option></select></label>
        </div>
        <label class="field">Rank by<select name="profile"><option value="live">Best place to live</option><option value="balanced">Balanced</option><option value="growth">Capital growth</option><option value="cashflow">Cash flow</option><option value="firsthome">Affordability / first home</option></select></label>
        <label class="field">Where<select name="where"><option value="">Anywhere in Australia</option>${Object.keys(STATES).map((s) => `<option value="s:${s}">${STATES[s]}</option>`).join('')}${Object.entries(market.regions).map(([c, r]) => `<option value="r:${c}">${r.name}</option>`).join('')}</select></label>
        <label class="field">Min population<input name="pop" type="number" step="1" value="${esc(q('pop', 3000))}"></label>
      </div>
      <button class="btn primary" style="margin-top:14px;width:100%" id="go">Find what I can afford</button>
      <p class="fine" style="margin-top:8px">Default rate is the average rate on new variable loans (RBA): ${pct(bestOO, 2)} owner-occupier, ${pct(bestInv, 2)} investor. The lowest advertised rates are ${pct(lowOO, 2)} and ${pct(lowInv, 2)} (checked several times a day); use one if you'll qualify for it. Estimates only: a lender or broker will assess you properly.</p>
    </form>
    <div id="out"></div>
  </div>`;

  const form = main.querySelector('#af');
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
  if (query.type) form.type.value = query.type;
  if (query.profile) form.profile.value = query.profile;
  else form.profile.value = form.buyer.value === 'investor' ? 'balanced' : 'live';
  form.lvr.value = query.lvr || (form.buyer.value === 'fhb' ? '0.95g' : '0.9');
  if (!query.rate && form.buyer.value === 'investor') form.rate.value = bestInv;
  const syncBuyer = () => {
    const inv = form.buyer.value === 'investor';
    main.querySelector('#livef').hidden = inv;
    main.querySelector('#livef').style.display = inv ? 'none' : 'grid';
    form.profile.querySelector('[value="live"]').disabled = inv;
    form.lvr.querySelector('[value="0.95g"]').disabled = form.buyer.value !== 'fhb';
    form.lvr.querySelector('[value="htb"]').disabled = form.buyer.value === 'investor';
  };
  syncBuyer();
  form.buyer.addEventListener('change', () => {
    form.rate.value = form.buyer.value === 'investor' ? bestInv : bestOO;
    form.profile.value = form.buyer.value === 'investor' ? 'balanced' : 'live';
    form.lvr.value = form.buyer.value === 'fhb' ? '0.95g' : form.lvr.value === '0.95g' ? '0.9' : form.lvr.value;
    syncBuyer();
  });
  let map = null;

  function run() {
    const f = Object.fromEntries(new FormData(form));
    const buyer = f.buyer;
    const investor = buyer === 'investor';
    const savings = +f.savings || 0;
    const income = (+f.income || 0) + (+f.income2 || 0);
    const couple = +f.income2 > 0;
    const rate = +f.rate || bestOO;
    const guarantee = f.lvr === '0.95g' && buyer === 'fhb';
    const htbIncomeOk = income <= (couple ? HELP_TO_BUY.income.joint : HELP_TO_BUY.income.single);
    const htb = f.lvr === 'htb' && !investor && htbIncomeOk;
    const maxLvr = f.lvr === '0.95g' || f.lvr === 'htb' ? 0.95 : +f.lvr;
    const maxWeekly = +f.maxWeekly || null;
    // Borrowing power without rent (owner-occupier); investors get rent added per suburb.
    const bpBase = borrowingPower({ grossIncome: income, couple, dependants: +f.deps || 0, otherDebtMonthly: +f.debts || 0, ratePct: rate });
    const capFromWeekly = maxWeekly ? ((maxWeekly * 52) / 12) * (1 - (1 + rate / 1200) ** -360) / (rate / 1200) : Infinity;
    const loanCapFor = (weeklyRent) => {
      let cap = bpBase.amount;
      if (investor && weeklyRent) cap = borrowingPower({ grossIncome: income, couple, dependants: +f.deps || 0, otherDebtMonthly: +f.debts || 0, ratePct: rate, newRentWeekly: weeklyRent }).amount;
      return Math.min(cap, capFromWeekly);
    };
    const params = new URLSearchParams({ buyer, savings, income: +f.income || 0, income2: +f.income2 || 0, type: f.type, profile: f.profile, pop: f.pop, rate, lvr: f.lvr });
    const live = f.profile === 'live' && !investor;
    const maxKm = +f.commute || 30;
    if (work && !investor) {
      params.set('work', work.id);
      params.set('commute', maxKm);
    }
    if (f.where) params.set('where', f.where);
    history.replaceState(null, '', `/afford?${params}`);

    // --- per-state ceilings (owner: no rent; investor: assume a 4.2% yield property)
    const stateRows = Object.keys(STATES).map((st) => {
      const cap = HOME_GUARANTEE.caps[st][0];
      const htbCap = HELP_TO_BUY.caps[st][0];
      const p0 = maxPrice({ state: st, savings, loanCap: loanCapFor(investor ? 700 : 0), maxLvr, buyer, guarantee, cap, htb, htbCap });
      const s = p0 ? structure({ price: p0, state: st, savings, loanCap: loanCapFor(investor ? (p0 * 0.042) / 52 : 0), maxLvr, buyer, guarantee, cap, htb, htbCap }) : null;
      return { st, max: p0, s };
    });

    // --- every suburb
    const w = PROFILES[f.profile] || PROFILES.balanced;
    const [kind, code] = (f.where || ':').split(':');
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
        const st = structure({ price, state: s.s, savings, loanCap: loanCapFor(rent), maxLvr, buyer, guarantee, cap: guaranteeCap(s), htb, htbCap: helpToBuyCap(s) });
        // high-rise dominated markets (70%+ flats): oversupply, weak resale and tighter lending, so they rank lower for living in
        const highRise = t === 'u' && (s['fla%'] ?? 0) >= 70;
        const score = Math.max(0, (live ? liveScore(s, km, maxKm) : suburbScore(s.sc, w)) - (highRise && live ? 15 : 0));
        const rec = { s, t, price, rent, st, score, km, highRise, yld: rent ? (rent * 52 * 100) / price : null };
        if (st.ok) {
          if (!best || (t === 'h' && f.type === 'any') || rec.score > best.score) best = rec; // prefer a house when both fit
        } else if (price <= (stateRows.find((r) => r.st === s.s)?.max || 0) * 1.12 && t === (f.type === 'any' ? s.pt : f.type) && !(rec.highRise && live)) stretch.push(rec);
      }
      if (best) matches.push(best);
    }
    matches.sort((a, b) => b.score - a.score || b.price - a.price);
    // With no workplace and no area chosen, don't let one region fill the list: at most 5 of the top picks per market.
    if (!work && !f.where) {
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
    const top = matches.slice(0, 40).map((m) => {
      const repay = (repayment(m.st.loan, rate, 30) * 12) / 52;
      let weekly = -repay;
      let irr = null;
      if (investor) {
        const a = analyse({ state: m.s.s, price: m.price, weeklyRent: m.rent || 0, deposit: m.st.deposit / m.price, ratePct: rate, income, hold: 10, growth: m.t === 'u' ? 3.5 : 5, perth: m.s.rg === 'PER', strata: m.t === 'u' ? 3200 : 0, landValuePct: m.t === 'u' ? 0.25 : 0.55, otherCosts: OTHER_COSTS });
        weekly = a.summary.weeklyCashAfterTax;
        irr = a.summary.irr;
      }
      return { ...m, repay, weekly, irr };
    });
    const byState = {};
    for (const m of matches) (byState[m.s.s] ||= []).push(m);
    const capitals = Object.entries(market.regions).filter(([, r]) => r.capital);
    const takeHome = (income - incomeTax(income)) / 52;

    const out = main.querySelector('#out');
    if (!savings || !income) {
      out.innerHTML = '<div class="card"><p>Enter your savings and income to start.</p></div>';
      return;
    }
    const bestState = [...stateRows].sort((a, b) => b.max - a.max)[0];
    const ownCap = stateRows.find((r) => r.st === (kind === 's' ? code : kind === 'r' ? market.regions[code]?.state : 'NSW'));
    out.innerHTML = `
    <div class="card">
      <div class="eyebrow">Your buying power</div>
      <div class="grid g3" style="gap:14px">
        <div class="stat"><span class="k">Most a lender might lend</span><span class="v xl">${aud(Math.min(bpBase.amount, capFromWeekly), { compact: true })}</span><span class="s">tested at ${pct(bpBase.assessRate, 2)} (rate + 3)${investor ? ', plus 80% of rent' : ''}</span></div>
        <div class="stat"><span class="k">Highest price you could buy</span><span class="v xl">${aud(bestState.max, { compact: true })}</span><span class="s">in ${STATES[bestState.st]} with ${aud(savings, { compact: true })} saved${bestState.s && bestState.s.loan < Math.min(bpBase.amount, capFromWeekly) * 0.97 ? '. Your deposit is the limit, not your income' : '. Your borrowing power is the limit'}</span></div>
        <div class="stat"><span class="k">Suburbs with a house or unit you can afford</span><span class="v xl">${matches.length.toLocaleString()}</span><span class="s">of ${eligible.toLocaleString()} ${f.where ? 'in your chosen area' : 'across Australia'} with ${minPop.toLocaleString()}+ residents${work && !investor ? ` within ${maxKm} km of work` : ''}</span></div>
      </div>
      <p class="note" style="margin-top:12px">${esc(verdictText({ matches, stateRows, capitals, savings, income, buyer, takeHome, rate, guarantee, maxLvr, live }))}</p>
    </div>

    <div class="card" style="margin-top:16px"><h3>Your ceiling in each state</h3>
      <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Max price</th><th class="n">Loan</th><th class="n">Deposit</th><th class="n">Stamp duty</th><th class="n">LMI (on loan)</th><th class="n">Cash used</th><th class="n">Repayment / wk</th><th class="n">Suburbs</th></tr></thead><tbody>
      ${stateRows
        .map((r) => `<tr><td>${STATES[r.st]}</td><td class="n"><b>${aud(r.max, { compact: true })}</b></td>${r.s ? `<td class="n">${aud(r.s.loan, { compact: true })}</td><td class="n">${aud(r.s.deposit, { compact: true })}</td><td class="n">${aud(r.s.duty)}</td><td class="n">${aud(r.s.lmi)}</td><td class="n">${aud(r.s.cash, { compact: true })}</td><td class="n">${aud((repayment(r.s.loan, rate, 30) * 12) / 52)}</td>` : '<td colspan="6" class="muted">Not enough for costs</td>'}<td class="n">${(byState[r.st]?.length || 0).toLocaleString()}</td></tr>`)
        .join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">Stamp duty ${buyer === 'fhb' ? 'includes first home buyer concessions for established homes' : buyer === 'owner' ? 'uses owner-occupier concessions where they exist' : 'at investor rates'}. ${guarantee ? `5% Deposit Scheme: 5% deposit, no LMI, no income cap, up to the price cap for each area (capital-city caps shown here, e.g. ${aud(HOME_GUARANTEE.caps.WA[0], { compact: true })} in Perth, ${aud(HOME_GUARANTEE.caps.WA[1], { compact: true })} in regional WA). Above the cap Keyzing uses a 10% deposit with LMI.` : ''}${f.lvr === 'htb' ? (htb ? ` Help to Buy: the government pays 30% of an existing home (40% of a new one), you need 2% plus duty and costs, no LMI, and you buy its share back over time or repay it on sale (it takes the same share of any gain). Price caps apply (${aud(HELP_TO_BUY.caps.WA[0], { compact: true })} in Perth); above them Keyzing uses a 10% deposit with LMI.` : ` Help to Buy isn't available at this income (limit ${aud(couple ? HELP_TO_BUY.income.joint : HELP_TO_BUY.income.single)} ${couple ? 'for couples' : 'for singles'}), so these figures use a 10% deposit with LMI.`) : ''} Includes ${aud(OTHER_COSTS)} for conveyancing, inspections and fees. Take-home pay about ${aud(takeHome)}/wk.</p>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-head"><h3>Your best options</h3><span class="note">${live ? `Ranked for living in: ${work ? `distance to ${esc(cleanName(work.n))}, ` : ''}local economy and stability, town size and services, and price growth` : `Ranked by ${esc(form.profile.selectedOptions[0].text.toLowerCase())} score`}</span> ${live && !work ? `<span class="callout" style="display:block;margin:8px 0 0">Without a workplace this ranks only on local economy, services and price trend, so it can suggest places that don't suit you. <b>Add where you work</b> (left) to rank by commute${f.where ? '' : `, or pick a city: ${capitals.map(([c, r]) => `<button type="button" class="pill" data-where="r:${c}">${esc(r.name)}</button>`).join(' ')}`}.</span>` : ''}<span class="fine" style="display:block"><span class="area-tag">area</span> = city or regional 12-month figure where there's no suburb-level sales data.</span></div>
      ${top.length ? `<div class="pick-grid" id="pick-photos">${top.slice(0, 3).map((m, i) => `<div data-pick="${i}">${photoCard(null, `<b>${i + 1}. ${esc(cleanName(m.s.n))} ${m.s.s}</b><span class="pc-stats">${m.t === 'u' ? 'Unit' : 'House'} about ${aud(m.price, { compact: true })}</span>`, { href: suburbUrl(m.s) })}</div>`).join('')}</div>` : ''}
      ${top.length ? `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Suburb</th><th class="n">${live ? 'Fit for you' : 'Score'}</th><th class="n">Typical price</th><th class="n">You'd need</th><th class="n">Left over</th><th class="n">${investor ? 'Weekly after tax' : 'Repayment / wk'}</th>${investor ? '<th class="n">Rent / wk</th><th class="n">Yield</th>' : `<th class="n">Loan</th>${work ? '<th class="n">To work</th>' : ''}`}<th class="n">12m</th>${investor ? '<th class="n">10-yr return</th>' : ''}<th></th></tr></thead><tbody>
      ${top
        .map((m, i) => `<tr><td class="faint mono">${i + 1}</td><td><a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a> <span class="muted">${m.s.s} ${m.s.pc || ''}</span><div class="fine">${esc(market.regions[m.s.rg]?.name || '')} · ${m.t === 'u' ? 'unit' : 'house'}${m.highRise ? ' · <span class="down">high-rise market</span>' : ''} ${srcBadge(m.t === 'u' ? m.s.us : m.s.hs)}</div></td><td class="n">${scoreBadge(m.score)}</td><td class="n">${aud(m.price, { compact: true })}</td><td class="n">${aud(m.st.cash, { compact: true })}</td><td class="n up">${aud(m.st.spare, { compact: true })}</td><td class="n ${investor ? (m.weekly < 0 ? 'down' : 'up') : ''}">${aud(Math.round(investor ? m.weekly : -m.weekly))}</td>${investor ? `<td class="n">${aud(m.rent)}</td><td class="n">${pct(m.yld, 1)}</td>` : `<td class="n"><span class="fine">${m.st.htb ? `Help to Buy (govt ${aud(m.st.govShare, { compact: true })})` : m.st.guarantee ? '5% scheme' : m.st.lmi ? `LMI ${aud(m.st.lmi, { compact: true })}` : 'no LMI'}</span></td>${work ? `<td class="n">${m.km.toFixed(0)} km</td>` : ''}`}<td class="n">${growth12(m.s, { suffix: '', short: true })}</td>${investor ? `<td class="n">${pct(m.irr, 1)}</td>` : ''}<td><a class="btn sm" href="/analyse?suburb=${m.s.id}&price=${m.price}&rent=${m.rent || ''}&type=${m.t}&dep=${Math.round((m.st.deposit / m.price) * 100)}&rate=${rate}&income=${income}&buyer=${buyer}" data-link>Analyse</a> <a class="btn sm ghost" href="${listingLinks(m.s).reaBuy}" target="_blank" rel="noopener">Listings</a></td></tr>`)
        .join('')}
      </tbody></table></div>` : '<p class="empty">No suburbs fit this budget and area. Try widening the area, including units, or lowering the minimum population.</p>'}
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card"><h3>Best option in each state</h3><div class="kv">${Object.keys(STATES)
        .map((st) => {
          const b = (byState[st] || [])[0];
          return `<span>${STATES[st]}</span><span>${b ? `<a href="${suburbUrl(b.s)}" data-link>${esc(cleanName(b.s.n))}</a> · ${b.t === 'u' ? 'unit' : 'house'} ${aud(b.price, { compact: true })} · ${scoreBadge(b.score)}` : '<span class="faint">none in budget</span>'}</span>`;
        })
        .join('')}</div></div>
      <div class="card"><h3>Just out of reach</h3><p class="note">Strong suburbs within about 12% of your ceiling. A bit more saved, a partner's income, or a lower rate could open these up.</p>
      <div class="kv">${stretchOnly.slice(0, 8).map((m) => `<span><a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a> <span class="muted">${m.s.s}</span></span><span>${m.t === 'u' ? 'unit' : 'house'} ${aud(m.price, { compact: true })} · short ${aud(-m.st.spare, { compact: true })}</span>`).join('') || '<span class="faint">—</span><span></span>'}</div></div>
    </div>

    <div class="card" style="margin-top:16px"><h3>Where your top options are</h3><div id="amap" class="map short"></div></div>

    <div class="card" style="margin-top:16px"><h3>Ways to stretch your budget</h3>
      <ul class="pros">${levers({ savings, income, couple, deps: +f.deps || 0, debts: +f.debts || 0, rate, maxLvr, buyer, guarantee, loanCapFor, bestState }).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    ${buyer === 'fhb' ? schemesCard({ income, couple, kind, code, bestState, market }) : ''}
    ${investor ? '' : `<div style="margin-top:16px">${nextStepsCard({ fhb: buyer === 'fhb' })}</div>`}
    ${investor ? '' : `<div class="row no-print" style="margin-top:12px"><button class="btn" type="button" id="print-plan">Print or save my plan as PDF</button><span class="fine">Your inputs are also in the page link, so you can bookmark or email it to yourself.</span></div>`}`;

    top.slice(0, 3).forEach((m, i) => suburbPhotos(m.s, 1).then(([ph]) => {
      const el = out.querySelector(`#pick-photos [data-pick="${i}"]`);
      if (ph && el) el.innerHTML = photoCard(ph, `<b>${i + 1}. ${esc(cleanName(m.s.n))} ${m.s.s}</b><span class="pc-stats">${m.t === 'u' ? 'Unit' : 'House'} about ${aud(m.price, { compact: true })}</span>`, { href: suburbUrl(m.s), alt: `${ph.title}, ${cleanName(m.s.n)}` });
    }));
    if (map) {
      map.remove();
      map = null;
    }
    if (window.L && top.length) {
      map = L.map('amap', { scrollWheelZoom: false });
      baseTiles().addTo(map);
      const css = getComputedStyle(document.documentElement);
      const col = (v) => css.getPropertyValue(v >= 75 ? '--sc-a' : v >= 60 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
      top.forEach((m, i) => L.circleMarker([m.s.lat, m.s.lng], { radius: 7, weight: 1, color: '#0008', fillColor: col(m.score), fillOpacity: 0.95 }).addTo(map).bindPopup(`<b>${i + 1}. <a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a></b> ${m.s.s}<br>${aud(m.price, { compact: true })} · score ${m.score}`));
      map.fitBounds(L.latLngBounds(top.map((m) => [m.s.lat, m.s.lng])).pad(0.1), { maxZoom: 11 });
    }
  }

  main.querySelector('#go').addEventListener('click', run);
  main.addEventListener('click', (e) => {
    if (e.target.closest('#print-plan')) window.print();
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

function verdictText({ matches, stateRows, capitals, savings, income, buyer, takeHome, rate, guarantee, maxLvr, live }) {
  const can = capitals.filter(([code, r]) => {
    const row = stateRows.find((x) => x.st === r.state);
    return row && row.max >= (r.medianHouse || r.medianDwelling);
  }).map(([, r]) => r.name);
  const canUnit = capitals.filter(([, r]) => {
    const row = stateRows.find((x) => x.st === r.state);
    return row && r.medianUnit && row.max >= r.medianUnit;
  }).map(([, r]) => r.name);
  const top = matches[0];
  let s = '';
  if (can.length) s += `Your budget covers a median-priced house in ${can.join(', ')}. `;
  else if (canUnit.length) s += `A median house is out of reach in every capital, but a median unit is within budget in ${canUnit.join(', ')}. `;
  else s += 'Median capital-city prices are above your current ceiling, so the best options are in regional centres and outer suburbs. ';
  if (top) s += `The strongest suburb you can afford ${live ? 'to live in' : 'on this strategy'} is ${cleanName(top.s.n)} (${top.s.s}), a ${top.t === 'u' ? 'unit' : 'house'} at about ${aud(top.price, { compact: true })}${live ? `, the best match for living in on commute, local economy, services and growth (${top.score}/100)` : ` with a Keyzing Score of ${top.score}`}. `;
  const top1 = [...stateRows].sort((a, b) => b.max - a.max)[0];
  const rep = top1?.s ? (repayment(top1.s.loan, rate, 30) * 12) / 52 : 0;
  if (buyer !== 'investor' && rep > takeHome * 0.4) s += `At your ceiling, repayments of about ${aud(rep)}/wk would be over 40% of your take-home pay, which is mortgage stress. Aim lower for breathing room. `;
  if (maxLvr > 0.8 && !guarantee) s += 'Borrowing above 80% adds lenders mortgage insurance; it is included in these figures. ';
  return s.trim();
}

function levers({ savings, income, couple, deps, debts, rate, maxLvr, buyer, guarantee, loanCapFor, bestState }) {
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
  if (buyer === 'fhb') out.push('New homes are duty-free for first home buyers in Queensland and South Australia regardless of price.');
  out.push('Units and townhouses often cost 25-40% less than houses in the same suburb, which can put a better location within reach.');
  return out;
}

/** Yes/no view of the first home schemes for the numbers entered. General rules only: each has more conditions. */
function schemesCard({ income, couple, kind, code, bestState, market }) {
  const st = kind === 's' ? code : kind === 'r' ? market.regions[code]?.state : bestState?.st;
  const htbLimit = couple ? HELP_TO_BUY.income.joint : HELP_TO_BUY.income.single;
  const htbOk = income <= htbLimit;
  const g = FHOG[st];
  const row = (ok, name, text) => `<li><b class="${ok === true ? 'up' : ok === false ? 'down' : ''}">${ok === true ? '✓' : ok === false ? '✗' : '•'} ${name}:</b> ${text}</li>`;
  return `<div class="card" style="margin-top:16px"><h3>First home schemes, for the numbers you entered</h3><ul class="plain-list" style="line-height:1.65;padding-left:0;list-style:none;margin:6px 0 0">
    ${row(true, '5% Deposit Scheme', `no income limit since October 2025. You need to be 18+, an Australian citizen or permanent resident, and buying your first home to live in, under the price cap for the area (${aud(HOME_GUARANTEE.caps.WA[0], { compact: true })} in Perth, for example).`)}
    ${row(htbOk, 'Help to Buy', htbOk ? `your ${couple ? 'combined' : ''} income of ${aud(income)} is under the ${aud(htbLimit)} limit${couple ? ' for couples' : ' for singles'}. Places are limited and price caps apply.` : `your ${couple ? 'combined' : ''} income of ${aud(income)} is over the ${aud(htbLimit)} limit${couple ? ' for couples' : ' for singles'}.`)}
    ${row(true, 'First Home Super Saver', 'open to first home buyers for voluntary super contributions made from now on: up to $15,000 a year and $50,000 in total. Request the release before you sign a contract.')}
    ${g ? row(g[0] > 0 ? null : false, `First Home Owner Grant (${st})`, g[0] > 0 ? `${aud(g[0])} for ${g[1]}. Established homes don't qualify${st === 'NT' ? ' except in the NT' : ''}.` : g[1]) : ''}
  </ul><p class="fine" style="margin-top:8px">A quick check against the main rules only; each scheme has more conditions. Confirm with a participating lender, your state revenue office or <a href="https://www.housingaustralia.gov.au/" target="_blank" rel="noopener">Housing Australia ↗</a>. Details and state duty concessions are in the <a href="/guide#fhb" data-link>first home guide</a>.</p></div>`;
}
