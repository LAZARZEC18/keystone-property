import { esc, aud, pct, num, scoreBadge, setMeta, srcBadge } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load } from '../data.js';
import { stampDuty, lmi, borrowingPower, repayment, analyse, suburbScore, PROFILES, incomeTax } from '../engine.js';
import { STATES } from '../rules.js';
import { listingLinks } from '../insights.js';
import { baseTiles } from '../map.js';

const OTHER_COSTS = 3000; // conveyancing, inspections, registration, loan fees

/**
 * Can this buyer afford this price in this state? Returns the cheapest-cash structure:
 * the largest loan allowed by the lender's LVR cap and the buyer's borrowing power.
 */
export function structure({ price, state, savings, loanCap, maxLvr, buyer, newBuild = false, guarantee = false }) {
  const loan = Math.max(0, Math.min(price * maxLvr, loanCap));
  const lvr = loan / price;
  const lm = guarantee ? { premium: 0 } : lmi(loan, price, state);
  if (lm.premium === null) return { ok: false, reason: 'LVR too high' };
  const duty = stampDuty(state, price, { buyer, newBuild }).duty;
  const deposit = price - loan;
  const cash = deposit + duty + OTHER_COSTS; // LMI is added to the loan
  return { ok: cash <= savings, loan: loan + (lm.premium || 0), lvr, deposit, duty, lmi: lm.premium || 0, cash, spare: savings - cash };
}

/** Highest price affordable in a state (binary search on the structure above). */
export function maxPrice(opts) {
  let lo = 50000;
  let hi = 6000000;
  if (!structure({ ...opts, price: lo }).ok) return 0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (structure({ ...opts, price: mid }).ok) lo = mid;
    else hi = mid;
  }
  return Math.floor(lo / 5000) * 5000;
}

export default async function affordPage(main, _p, query) {
  setMeta({ title: 'What can I afford? Find the best property you can buy', description: 'Enter your deposit and income. Keystone works out your maximum price in every state (stamp duty, LMI, lender buffers) and ranks the best suburbs you can afford.' });
  const [{ list }, rs, market] = await Promise.all([suburbs(), load('rates-summary'), load('market')]);
  const bestOO = rs.best.OO_PI_variable?.[0]?.rate || 6;
  const bestInv = rs.best.INV_PI_variable?.[0]?.rate || 6.3;
  const q = (k, d) => (query[k] !== undefined ? query[k] : d);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Affordability analyst</div><h1>What can I afford, and where should I buy?</h1>
  <p>Tell Keystone what you have saved and what you earn. It calculates the most you can pay in every state, including stamp duty, LMI and the 3-point lender buffer. Then it searches all ${list.length.toLocaleString()} suburbs for the best places you can actually afford and explains why.</p></div>
  <div class="grid" style="grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:20px" id="aff-grid">
    <form class="card" id="af" onsubmit="return false" style="align-self:start;position:sticky;top:110px">
      <h3>Your situation</h3>
      <div class="fields" style="grid-template-columns:1fr 1fr">
        <label class="field" style="grid-column:1/-1">I'm buying as<select name="buyer"><option value="fhb">First home buyer (to live in)</option><option value="owner">Owner-occupier (not first home)</option><option value="investor">Investor</option></select></label>
        <label class="field" style="grid-column:1/-1">Savings for deposit + costs ($)<input name="savings" type="number" step="5000" value="${esc(q('savings', 120000))}"></label>
        <label class="field">Gross income ($/yr)<input name="income" type="number" step="5000" value="${esc(q('income', 110000))}"></label>
        <label class="field">Partner income<input name="income2" type="number" step="5000" value="${esc(q('income2', 0))}"></label>
        <label class="field">Dependants<input name="deps" type="number" min="0" max="8" value="${esc(q('deps', 0))}"></label>
        <label class="field">Other debts ($/mth)<input name="debts" type="number" step="50" value="${esc(q('debts', 0))}"></label>
        <label class="field" style="grid-column:1/-1">Deposit strategy<select name="lvr"><option value="0.8">20% deposit (no LMI)</option><option value="0.9" selected>As low as 10% (LMI added to loan)</option><option value="0.95">As low as 5% (LMI)</option><option value="0.95g">5% deposit, no LMI (Home Guarantee Scheme, first home buyers)</option></select></label>
        <label class="field">Interest rate (%)<input name="rate" type="number" step="0.05" value="${esc(q('rate', bestOO))}"></label>
        <label class="field">Max weekly repayment ($)<input name="maxWeekly" type="number" step="50" placeholder="Lender limit"></label>
        <label class="field">Property type<select name="type"><option value="any">House or unit</option><option value="h">House</option><option value="u">Unit / apartment</option></select></label>
        <label class="field">Strategy<select name="profile"><option value="balanced">Balanced</option><option value="growth">Capital growth</option><option value="cashflow">Cash flow</option><option value="firsthome">Affordability / first home</option></select></label>
        <label class="field">Where<select name="where"><option value="">Anywhere in Australia</option>${Object.keys(STATES).map((s) => `<option value="s:${s}">${STATES[s]}</option>`).join('')}${Object.entries(market.regions).map(([c, r]) => `<option value="r:${c}">${r.name}</option>`).join('')}</select></label>
        <label class="field">Min population<input name="pop" type="number" step="1000" value="${esc(q('pop', 3000))}"></label>
      </div>
      <button class="btn primary" style="margin-top:14px;width:100%" id="go">Find what I can afford</button>
      <p class="fine" style="margin-top:8px">Rates: lowest advertised owner-occupier variable ${pct(bestOO, 2)}, investor ${pct(bestInv, 2)} (updated hourly). Estimates only: a lender or broker will assess you properly.</p>
    </form>
    <div id="out"></div>
  </div>`;

  const form = main.querySelector('#af');
  if (query.buyer) form.buyer.value = query.buyer;
  if (query.where) form.where.value = query.where;
  if (query.type) form.type.value = query.type;
  if (query.profile) form.profile.value = query.profile;
  else if (form.buyer.value === 'fhb') form.profile.value = 'firsthome';
  if (!query.rate && form.buyer.value === 'investor') form.rate.value = bestInv;
  form.buyer.addEventListener('change', () => {
    form.rate.value = form.buyer.value === 'investor' ? bestInv : bestOO;
    if (form.buyer.value === 'investor' && form.profile.value === 'firsthome') form.profile.value = 'balanced';
    if (form.buyer.value === 'fhb') form.profile.value = 'firsthome';
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
    const maxLvr = f.lvr === '0.95g' ? 0.95 : +f.lvr;
    const maxWeekly = +f.maxWeekly || null;
    // Borrowing power without rent (owner-occupier); investors get rent added per suburb.
    const bpBase = borrowingPower({ grossIncome: income, couple, dependants: +f.deps || 0, otherDebtMonthly: +f.debts || 0, ratePct: rate });
    const capFromWeekly = maxWeekly ? ((maxWeekly * 52) / 12) * (1 - (1 + rate / 1200) ** -360) / (rate / 1200) : Infinity;
    const loanCapFor = (weeklyRent) => {
      let cap = bpBase.amount;
      if (investor && weeklyRent) cap = borrowingPower({ grossIncome: income, couple, dependants: +f.deps || 0, otherDebtMonthly: +f.debts || 0, ratePct: rate, newRentWeekly: weeklyRent }).amount;
      return Math.min(cap, capFromWeekly);
    };
    const params = new URLSearchParams({ buyer, savings, income: +f.income || 0, income2: +f.income2 || 0, type: f.type, profile: f.profile, pop: f.pop, rate });
    if (f.where) params.set('where', f.where);
    history.replaceState(null, '', `/afford?${params}`);

    // --- per-state ceilings (owner: no rent; investor: assume a 4.2% yield property)
    const stateRows = Object.keys(STATES).map((st) => {
      const p0 = maxPrice({ state: st, savings, loanCap: loanCapFor(investor ? 700 : 0), maxLvr, buyer, guarantee });
      const s = p0 ? structure({ price: p0, state: st, savings, loanCap: loanCapFor(investor ? (p0 * 0.042) / 52 : 0), maxLvr, buyer, guarantee }) : null;
      return { st, max: p0, s };
    });

    // --- every suburb
    const w = PROFILES[f.profile] || PROFILES.balanced;
    const [kind, code] = (f.where || ':').split(':');
    const minPop = +f.pop || 0;
    const matches = [];
    const stretch = [];
    for (const s of list) {
      if (s.pop < minPop) continue;
      if (kind === 's' && s.s !== code) continue;
      if (kind === 'r' && s.rg !== code) continue;
      const types = f.type === 'any' ? ['h', 'u'] : [f.type];
      let best = null;
      for (const t of types) {
        const price = t === 'u' ? s.u : s.h;
        const rent = t === 'u' ? s.ru : s.rh;
        if (!price) continue;
        const st = structure({ price, state: s.s, savings, loanCap: loanCapFor(rent), maxLvr, buyer, guarantee });
        const score = suburbScore(s.sc, w);
        const rec = { s, t, price, rent, st, score, yld: rent ? (rent * 52 * 100) / price : null };
        if (st.ok) {
          if (!best || (t === 'h' && f.type === 'any') || rec.score > best.score) best = rec; // prefer a house when both fit
        } else if (price <= (stateRows.find((r) => r.st === s.s)?.max || 0) * 1.12 && t === (f.type === 'any' ? s.pt : f.type)) stretch.push(rec);
      }
      if (best) matches.push(best);
    }
    matches.sort((a, b) => b.score - a.score || b.price - a.price);
    stretch.sort((a, b) => b.score - a.score);

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
        <div class="stat"><span class="k">Highest price you could buy</span><span class="v xl">${aud(bestState.max, { compact: true })}</span><span class="s">in ${STATES[bestState.st]} with ${aud(savings, { compact: true })} saved</span></div>
        <div class="stat"><span class="k">Suburbs you can afford</span><span class="v xl">${matches.length.toLocaleString()}</span><span class="s">${f.where ? 'in your chosen area' : 'across Australia'} with ${minPop.toLocaleString()}+ residents</span></div>
      </div>
      <p class="note" style="margin-top:12px">${esc(verdictText({ matches, stateRows, capitals, savings, income, buyer, takeHome, rate, guarantee, maxLvr }))}</p>
    </div>

    <div class="card" style="margin-top:16px"><h3>Your ceiling in each state</h3>
      <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Max price</th><th class="n">Loan</th><th class="n">Deposit</th><th class="n">Stamp duty</th><th class="n">LMI (on loan)</th><th class="n">Cash used</th><th class="n">Repayment / wk</th><th class="n">Suburbs</th></tr></thead><tbody>
      ${stateRows
        .map((r) => `<tr><td>${STATES[r.st]}</td><td class="n"><b>${aud(r.max, { compact: true })}</b></td>${r.s ? `<td class="n">${aud(r.s.loan, { compact: true })}</td><td class="n">${aud(r.s.deposit, { compact: true })}</td><td class="n">${aud(r.s.duty)}</td><td class="n">${aud(r.s.lmi)}</td><td class="n">${aud(r.s.cash, { compact: true })}</td><td class="n">${aud((repayment(r.s.loan, rate, 30) * 12) / 52)}</td>` : '<td colspan="6" class="muted">Not enough for costs</td>'}<td class="n">${(byState[r.st]?.length || 0).toLocaleString()}</td></tr>`)
        .join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">Stamp duty ${buyer === 'fhb' ? 'includes first home buyer concessions for established homes' : buyer === 'owner' ? 'uses owner-occupier concessions where they exist' : 'at investor rates'}. ${guarantee ? 'Home Guarantee Scheme: no LMI; price caps and eligibility apply.' : ''} Includes ${aud(OTHER_COSTS)} for conveyancing, inspections and fees. Take-home pay about ${aud(takeHome)}/wk.</p>
    </div>

    <div class="card" style="margin-top:16px">
      <div class="card-head"><h3>Your best options</h3><span class="note">Ranked by ${esc(form.profile.selectedOptions[0].text.toLowerCase())} score</span></div>
      ${top.length ? `<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Suburb</th><th class="n">Score</th><th class="n">Typical price</th><th class="n">You'd need</th><th class="n">Left over</th><th class="n">${investor ? 'Weekly after tax' : 'Repayment / wk'}</th><th class="n">Rent / wk</th><th class="n">Yield</th><th class="n">12m</th>${investor ? '<th class="n">10-yr return</th>' : ''}<th></th></tr></thead><tbody>
      ${top
        .map((m, i) => `<tr><td class="faint mono">${i + 1}</td><td><a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a> <span class="muted">${m.s.s} ${m.s.pc || ''}</span><div class="fine">${esc(market.regions[m.s.rg]?.name || '')} · ${m.t === 'u' ? 'unit' : 'house'} ${srcBadge(m.t === 'u' ? m.s.us : m.s.hs)}</div></td><td class="n">${scoreBadge(m.score)}</td><td class="n">${aud(m.price, { compact: true })}</td><td class="n">${aud(m.st.cash, { compact: true })}</td><td class="n up">${aud(m.st.spare, { compact: true })}</td><td class="n ${m.weekly < 0 ? 'down' : 'up'}">${aud(Math.round(m.weekly))}</td><td class="n">${aud(m.rent)}</td><td class="n">${pct(m.yld, 1)}</td><td class="n ${m.s.g1 >= 0 ? 'up' : 'down'}">${pct(m.s.g1, 1, true)}</td>${investor ? `<td class="n">${pct(m.irr, 1)}</td>` : ''}<td><a class="btn sm" href="/analyse?suburb=${m.s.id}&price=${m.price}&rent=${m.rent || ''}&type=${m.t}&dep=${Math.round((m.st.deposit / m.price) * 100)}&rate=${rate}&income=${income}&buyer=${buyer}" data-link>Analyse</a> <a class="btn sm ghost" href="${listingLinks(m.s).reaBuy}" target="_blank" rel="noopener">Listings</a></td></tr>`)
        .join('')}
      </tbody></table></div>` : '<p class="empty">No suburbs fit this budget and area. Try widening the area, including units, or lowering the minimum population.</p>'}
    </div>

    <div class="grid g2" style="margin-top:16px">
      <div class="card"><h3>Best option in each state</h3><div class="kv">${Object.keys(STATES)
        .map((st) => {
          const b = (byState[st] || [])[0];
          return `<span>${STATES[st]}</span><span>${b ? `<a href="${suburbUrl(b.s)}" data-link>${esc(cleanName(b.s.n))}</a> · ${aud(b.price, { compact: true })} · ${scoreBadge(b.score)}` : '<span class="faint">none in budget</span>'}</span>`;
        })
        .join('')}</div></div>
      <div class="card"><h3>Just out of reach</h3><p class="note">Strong suburbs within about 12% of your ceiling. A bit more saved, a partner's income, or a lower rate could open these up.</p>
      <div class="kv">${stretch.slice(0, 8).map((m) => `<span><a href="${suburbUrl(m.s)}" data-link>${esc(cleanName(m.s.n))}</a> <span class="muted">${m.s.s}</span></span><span>${aud(m.price, { compact: true })} · short ${aud(-m.st.spare, { compact: true })}</span>`).join('') || '<span class="faint">—</span><span></span>'}</div></div>
    </div>

    <div class="card" style="margin-top:16px"><h3>Where your top options are</h3><div id="amap" class="map short"></div></div>

    <div class="card" style="margin-top:16px"><h3>Ways to stretch your budget</h3>
      <ul class="pros">${levers({ savings, income, couple, deps: +f.deps || 0, debts: +f.debts || 0, rate, maxLvr, buyer, guarantee, loanCapFor, bestState }).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>`;

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
  form.addEventListener('change', run);
  run();
  return { destroy: () => map?.remove() };
}

function verdictText({ matches, stateRows, capitals, savings, income, buyer, takeHome, rate, guarantee, maxLvr }) {
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
  if (top) s += `The strongest suburb you can afford on this strategy is ${cleanName(top.s.n)} (${top.s.s}), a ${top.t === 'u' ? 'unit' : 'house'} at about ${aud(top.price, { compact: true })} with a Keystone Score of ${top.score}. `;
  const cap = stateRows.reduce((a, r) => Math.max(a, r.max), 0);
  const rep = (repayment(cap * maxLvr, rate, 30) * 12) / 52;
  if (buyer !== 'investor' && rep > takeHome * 0.4) s += `At your ceiling, repayments of about ${aud(rep)}/wk would be over 40% of your take-home pay, which is mortgage stress. Aim lower for breathing room. `;
  if (maxLvr > 0.8 && !guarantee) s += 'Borrowing above 80% adds lenders mortgage insurance; it is included in these figures. ';
  return s.trim();
}

function levers({ savings, income, couple, deps, debts, rate, maxLvr, buyer, guarantee, loanCapFor, bestState }) {
  const out = [];
  const base = bestState.max;
  const alt = (o) => maxPrice({ state: bestState.st, savings, loanCap: loanCapFor(0), maxLvr, buyer, guarantee, ...o });
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
