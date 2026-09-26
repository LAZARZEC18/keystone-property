// Keystone investment engine. Pure functions, no DOM: runs in the browser and in Node tests.
import { RULES } from './rules.js';

const ceil100 = (x) => Math.ceil(x / 100) * 100;
export const round = (x, d = 0) => {
  const f = 10 ** d;
  return Math.round(x * f) / f;
};

/** Apply a bracket table [[from, base, rate, mode?], ...] to a value. */
export function bracket(table, value, per100 = false) {
  let row = table[0];
  for (const r of table) if (value > r[0] || (r[0] === 0 && value >= 0)) row = r;
  const [from, base, rate, mode] = row;
  if (mode === 'flat') return value * rate;
  const excess = Math.max(0, value - from);
  return base + rate * (per100 ? ceil100(excess) : excess);
}

/**
 * Stamp (transfer) duty.
 * buyer: 'investor' | 'owner' (owner-occupier) | 'fhb' (first home buyer, owner-occupier)
 */
export function stampDuty(state, price, { buyer = 'investor', newBuild = false } = {}) {
  const R = RULES.duty[state];
  if (!R) throw new Error(`Unknown state ${state}`);
  const notes = [];
  let general;
  if (R.formula) {
    general = ntDuty(price);
  } else {
    general = bracket(R.investor, price, R.per100);
    if (R.min) general = Math.max(R.min, general);
  }
  let duty = general;
  if (buyer === 'owner' || buyer === 'fhb') {
    if (R.owner && (!R.ownerTo || price <= R.ownerTo)) {
      duty = bracket(R.owner, price, R.per100);
      notes.push(state === 'VIC' ? 'Principal place of residence concession applied.' : state === 'QLD' ? 'Home concession rate applied.' : 'Owner-occupier rates applied.');
    }
  }
  if (buyer === 'fhb') {
    if (R.fhbFull) {
      duty = 0;
      notes.push('ACT Home Buyer Concession Scheme: full concession (price and income caps removed from 1 July 2026, eligibility rules apply).');
    } else if (R.fhbNewNoCap && newBuild) {
      duty = 0;
      notes.push('First home buyer buying a new home: no duty, no value cap.');
    } else if (state === 'QLD') {
      const homeConcession = bracket(R.owner, price, R.per100);
      if (price < 700000) duty = 0;
      else {
        const step = R.fhbSteps.find(([to]) => price < to);
        duty = step ? Math.max(0, homeConcession - step[1]) : homeConcession;
      }
      notes.push('Queensland first home concession (nil duty to $700,000, phasing out by $800,000).');
    } else if (R.fhb) {
      const f = R.fhb;
      if (price <= f.exemptTo) {
        duty = 0;
        notes.push(`First home buyer exemption up to $${f.exemptTo.toLocaleString()}.`);
      } else if (price < f.concessionTo) {
        if (f.concessionRate) duty = Math.min(general, f.concessionRate * ceil100(price - f.exemptTo));
        else duty = (general * (price - f.exemptTo)) / (f.concessionTo - f.exemptTo);
        notes.push(`First home buyer concession between $${f.exemptTo.toLocaleString()} and $${f.concessionTo.toLocaleString()}.`);
      }
    } else if (R.note) notes.push(R.note);
  }
  return { duty: Math.round(duty), general: Math.round(general), notes, source: R.source, label: R.label };
}

export function ntDuty(price) {
  if (price <= 525000) {
    const V = price / 1000;
    return 0.06571441 * V * V + 15 * V;
  }
  if (price < 3000000) return price * 0.0495;
  if (price < 5000000) return price * 0.0575;
  return price * 0.0595;
}

/** Annual land tax for a single investment holding owned by an individual. */
export function landTax(state, landValue, { perth = false } = {}) {
  const R = RULES.landTax[state];
  if (!R || R.none) return { tax: 0, note: R?.note };
  let tax = bracket(R.brackets, landValue);
  if (R.fixed) tax += R.fixed;
  if (R.mrit && perth && landValue > R.mrit.from) tax += (landValue - R.mrit.from) * R.mrit.rate;
  return { tax: Math.round(tax), approx: !!R.approx, note: R.note, source: R.source };
}

/** Indicative lenders mortgage insurance, including state stamp duty on the premium. */
export function lmi(loan, value, state) {
  const lvr = (loan / value) * 100;
  if (lvr <= 80) return { premium: 0, lvr };
  if (lvr > 95) return { premium: null, lvr, note: 'Above 95% LVR: most lenders will not lend.' };
  const L = RULES.lmi;
  const row = L.rows.find(([upTo]) => lvr <= upTo + 1e-9) || L.rows[L.rows.length - 1];
  let band = L.loanBands.findIndex((b) => loan <= b);
  if (band === -1) band = L.loanBands.length - 1;
  const pct = row[1][band];
  const base = (loan * pct) / 100;
  const duty = base * (L.stampDuty[state] || 0);
  return { premium: Math.round(base + duty), pct, lvr, over1m: loan > 1000000 };
}

/** Resident individual income tax incl. Medicare levy, less the low income tax offset. */
export function incomeTax(taxable) {
  const T = RULES.incomeTax;
  if (taxable <= 0) return 0;
  let tax = bracket(T.brackets, taxable);
  const l = T.lito;
  let lito = 0;
  if (taxable <= l.fullTo) lito = l.max;
  else if (taxable <= l.step1To) lito = l.max - (taxable - l.fullTo) * l.step1Rate;
  else if (taxable <= l.step2To) lito = Math.max(0, 325 - (taxable - l.step1To) * l.step2Rate);
  tax = Math.max(0, tax - lito);
  return tax + taxable * T.medicare;
}

export function marginalRate(taxable) {
  return (incomeTax(taxable + 1000) - incomeTax(taxable)) / 1000;
}

/** Monthly repayment. rate in % p.a. */
export function repayment(principal, ratePct, years, interestOnly = false) {
  const r = ratePct / 100 / 12;
  if (interestOnly) return principal * r;
  const n = years * 12;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - (1 + r) ** -n);
}

/** How much a lender might lend: APRA 3% buffer, 80% of rent counted, HEM-style living costs. */
export function borrowingPower({ grossIncome, otherDebtMonthly = 0, dependants = 0, couple = false, existingRentIncome = 0, newRentWeekly = 0, ratePct, years = 30, livingCostsMonthly }) {
  const assess = ratePct + RULES.serviceability.buffer;
  const shaded = (existingRentIncome + newRentWeekly * 52) * RULES.serviceability.rentShading;
  const net = grossIncome + shaded - incomeTax(grossIncome + shaded);
  const living = livingCostsMonthly ?? (couple ? 3800 : 2400) + dependants * 700; // conservative HEM-style benchmark
  const surplus = net / 12 - living - otherDebtMonthly;
  if (surplus <= 0) return { amount: 0, assessRate: assess, surplus };
  const r = assess / 100 / 12;
  const n = years * 12;
  const amount = (surplus * (1 - (1 + r) ** -n)) / r;
  return { amount: Math.round(amount / 1000) * 1000, assessRate: assess, surplus: Math.round(surplus) };
}

const DAY = 864e5;
const yearsBetween = (a, b) => (Date.parse(b) - Date.parse(a)) / (365.25 * DAY);
const addYears = (iso, n) => {
  const d = new Date(iso);
  d.setUTCFullYear(d.getUTCFullYear() + Math.floor(n));
  const frac = n - Math.floor(n);
  return new Date(+d + frac * 365.25 * DAY).toISOString().slice(0, 10);
};

/**
 * Full holding-period model for one property.
 * Returns year-by-year rows, upfront costs, tax, sale and summary returns.
 */
export function analyse(input) {
  const p = {
    state: 'NSW', price: 800000, weeklyRent: 650, deposit: 0.2, ratePct: 6.2, years: 30, interestOnly: false,
    buyer: 'investor', newBuild: false, buildYear: 2000, buildCost: null, plantValue: 0,
    purchaseDate: new Date().toISOString().slice(0, 10), income: 120000,
    growth: 5, rentGrowth: 4, cpi: 3, vacancyWeeks: 2, mgmtPct: 7.5, councilRates: 2200, water: 900, strata: 0,
    insurance: 1800, maintenancePct: 1.2, landValuePct: 0.55, otherCosts: 2500, lmiCapitalise: true,
    hold: 10, sellCostPct: 2.5, perth: false, ...input,
  };
  const loan0 = p.price * (1 - p.deposit);
  const duty = stampDuty(p.state, p.price, { buyer: p.buyer, newBuild: p.newBuild });
  const lmiRes = lmi(loan0, p.price, p.state);
  const lmiCost = lmiRes.premium || 0;
  const loan = loan0 + (p.lmiCapitalise ? lmiCost : 0);
  const upfront = {
    deposit: Math.round(p.price * p.deposit),
    duty: duty.duty,
    lmi: p.lmiCapitalise ? 0 : lmiCost,
    lmiCapitalised: p.lmiCapitalise ? lmiCost : 0,
    other: p.otherCosts,
  };
  upfront.total = upfront.deposit + upfront.duty + upfront.lmi + upfront.other;

  const monthly = repayment(loan, p.ratePct, p.years, p.interestOnly);
  const buildCost = p.buildCost ?? (p.buildYear >= 1987 ? p.price * (1 - p.landValuePct) * 0.6 : 0);
  const div43 = p.buildYear >= 1987 ? buildCost * RULES.depreciation.capitalWorks : 0;
  const plant = p.newBuild ? p.plantValue || p.price * 0.02 : 0;

  const reformStart = RULES.reform.start;
  const announced = RULES.reform.announced;
  const grandfathered = !p.newBuild && p.purchaseDate < announced;
  const rows = [];
  let balance = loan;
  let value = p.price;
  let rent = p.weeklyRent;
  let costsBase = p.councilRates + p.water + p.strata + p.insurance;
  let carried = 0; // quarantined rental losses carried forward
  let div43Claimed = 0;
  let cum = -upfront.total;
  const equityFlows = [-upfront.total];
  const landValue0 = p.price * p.landValuePct;

  for (let y = 1; y <= p.hold; y++) {
    const start = addYears(p.purchaseDate, y - 1);
    const end = addYears(p.purchaseDate, y);
    const occupied = Math.max(0, 52 - p.vacancyWeeks);
    const grossRent = rent * occupied;
    const mgmt = (grossRent * p.mgmtPct) / 100;
    // maintenance as a % of the building (not land) value: land doesn't need repairs
    const maint = (value * (1 - p.landValuePct) * p.maintenancePct) / 100;
    const land = landTax(p.state, landValue0 * (value / p.price), { perth: p.perth }).tax;
    const holding = costsBase + mgmt + maint + land;
    // loan year
    let interest = 0;
    let principal = 0;
    const r = p.ratePct / 100 / 12;
    for (let m = 0; m < 12; m++) {
      const i = balance * r;
      interest += i;
      const pr = p.interestOnly ? 0 : Math.max(0, monthly - i);
      principal += pr;
      balance -= pr;
    }
    const dep = (y <= 40 ? div43 : 0) + (p.newBuild && y <= 8 ? plant * (y === 1 ? 0.3 : 0.15) : 0);
    div43Claimed += y <= 40 ? div43 : 0;
    const netRental = grossRent - holding - interest - dep; // taxable rental result
    const cashBeforeTax = grossRent - holding - interest - principal;

    // Negative gearing test for this year (share of the year that falls before 1 July 2027)
    let offsetShare = 1;
    if (!p.newBuild && !grandfathered) {
      const pre = Math.max(0, Math.min(Date.parse(end), Date.parse(reformStart)) - Date.parse(start));
      offsetShare = pre / (Date.parse(end) - Date.parse(start));
    }
    let taxEffect = 0; // positive = tax saved (refund), negative = extra tax
    let quarantined = 0;
    if (netRental < 0) {
      const usable = -netRental * offsetShare;
      quarantined = -netRental - usable;
      carried += quarantined;
      taxEffect = incomeTax(p.income) - incomeTax(Math.max(0, p.income - usable));
    } else {
      const useCarry = Math.min(carried, netRental);
      carried -= useCarry;
      const taxable = netRental - useCarry;
      taxEffect = -(incomeTax(p.income + taxable) - incomeTax(p.income));
    }
    const cashAfterTax = cashBeforeTax + taxEffect;
    cum += cashAfterTax;
    value *= 1 + p.growth / 100;
    rows.push({
      year: y, start, value: Math.round(value), weeklyRent: round(rent), grossRent: Math.round(grossRent),
      mgmt: Math.round(mgmt), maintenance: Math.round(maint), landTax: land, otherCosts: Math.round(costsBase),
      interest: Math.round(interest), principal: Math.round(principal), depreciation: Math.round(dep),
      netRental: Math.round(netRental), cashBeforeTax: Math.round(cashBeforeTax), taxEffect: Math.round(taxEffect),
      cashAfterTax: Math.round(cashAfterTax), quarantined: Math.round(quarantined), carried: Math.round(carried),
      balance: Math.round(balance), equity: Math.round(value - balance), offsetShare: round(offsetShare, 2),
    });
    equityFlows.push(cashAfterTax);
    rent *= 1 + p.rentGrowth / 100;
    costsBase *= 1 + p.cpi / 100;
  }

  // ---- sale at end of holding period
  const saleDate = addYears(p.purchaseDate, p.hold);
  const salePrice = value;
  const sellCosts = (salePrice * p.sellCostPct) / 100;
  const costBase = p.price + duty.duty + p.otherCosts - div43Claimed;
  const gross = salePrice - sellCosts - costBase;
  const cgt = capitalGainsTax({
    purchaseDate: p.purchaseDate, saleDate, price: p.price, salePrice, sellCosts, costBase, growth: p.growth, cpi: p.cpi,
    income: p.income, carried, newBuild: p.newBuild,
  });
  const saleProceeds = salePrice - sellCosts - balance - cgt.tax;
  equityFlows[equityFlows.length - 1] += saleProceeds;
  const irr = IRR(equityFlows);

  const y1 = rows[0];
  const summary = {
    loan: Math.round(loan),
    lvr: round((loan0 / p.price) * 100, 1),
    monthlyRepayment: Math.round(monthly),
    grossYield: round(((p.weeklyRent * 52) / p.price) * 100, 2),
    netYield: round(((y1.grossRent - (y1.mgmt + y1.maintenance + y1.landTax + y1.otherCosts)) / p.price) * 100, 2),
    weeklyCashBeforeTax: round(y1.cashBeforeTax / 52),
    weeklyCashAfterTax: round(y1.cashAfterTax / 52),
    breakEvenRent: Math.round((y1.maintenance + y1.landTax + y1.otherCosts + y1.interest + y1.principal) / (52 - p.vacancyWeeks) / (1 - p.mgmtPct / 100)),
    stressedWeekly: round((y1.cashBeforeTax - loan * 0.02) / 52), // rates +2 points
    irr: irr === null ? null : round(irr * 100, 2),
    saleProceeds: Math.round(saleProceeds),
    totalProfit: Math.round(equityFlows.reduce((a, b) => a + b, 0)),
    equityAtSale: Math.round(salePrice - balance),
    cashInvested: Math.round(upfront.total + rows.reduce((a, r) => a + Math.min(0, r.cashAfterTax), 0) * -1),
    marginalRate: round(marginalRate(p.income) * 100, 1),
    negativeGearing: p.newBuild ? 'new-build' : grandfathered ? 'grandfathered' : 'restricted',
  };
  return { input: p, upfront, duty, lmi: lmiRes, rows, sale: { saleDate, salePrice: Math.round(salePrice), sellCosts: Math.round(sellCosts), costBase: Math.round(costBase), grossGain: Math.round(gross), balance: Math.round(balance), cgt }, summary };
}

/**
 * CGT under the 2026 reform. Gain is split at 1 July 2027: the part accrued before keeps the 50% discount,
 * the part after is indexed by CPI and taxed at no less than 30%. New builds may choose the old method on the whole gain.
 */
export function capitalGainsTax({ purchaseDate, saleDate, salePrice, sellCosts, costBase, growth, cpi, income, carried = 0, newBuild = false }) {
  const reform = RULES.reform.start;
  const held = yearsBetween(purchaseDate, saleDate);
  const net = salePrice - sellCosts - costBase;
  if (net <= 0) return { tax: 0, gain: Math.round(net), method: 'loss', note: 'Capital loss: carried forward against future capital gains.' };

  // Old method on the whole gain (available for pre-2027 accruals, and to new builds for everything)
  const oldTaxable = Math.max(0, (held >= 1 ? net * 0.5 : net) - carried);
  const oldTax = incomeTax(income + oldTaxable) - incomeTax(income);

  let split = null;
  if (saleDate > reform) {
    // value on 1 July 2027 by interpolating the growth path
    const tPre = Math.max(0, yearsBetween(purchaseDate, reform));
    const valueAtReform = purchaseDate >= reform ? null : (salePrice / (1 + growth / 100) ** held) * (1 + growth / 100) ** tPre;
    const base2027 = valueAtReform ?? costBase;
    const preGain = valueAtReform ? Math.max(0, valueAtReform - costBase) : 0;
    const yearsPost = yearsBetween(purchaseDate >= reform ? purchaseDate : reform, saleDate);
    const indexed = base2027 * (1 + cpi / 100) ** yearsPost;
    const postReal = Math.max(0, salePrice - sellCosts - indexed);
    let preTaxable = held >= 1 ? preGain * 0.5 : preGain;
    let postTaxable = postReal;
    let c = carried;
    const usePost = Math.min(c, postTaxable);
    postTaxable -= usePost;
    c -= usePost;
    preTaxable = Math.max(0, preTaxable - c);
    const total = incomeTax(income + preTaxable + postTaxable) - incomeTax(income);
    const share = preTaxable + postTaxable > 0 ? postTaxable / (preTaxable + postTaxable) : 0;
    const postTax = Math.max(total * share, postTaxable * RULES.reform.minCgtRate);
    const splitTax = total * (1 - share) + postTax;
    split = { tax: Math.round(splitTax), preGain: Math.round(preGain), postRealGain: Math.round(postReal), indexedBase: Math.round(indexed), valueAtReform: valueAtReform && Math.round(valueAtReform), minimumApplied: postTax > total * share + 1 };
  }
  if (!split) return { tax: Math.round(oldTax), gain: Math.round(net), method: '50% discount', held: round(held, 1) };
  if (newBuild && oldTax < split.tax) return { tax: Math.round(oldTax), gain: Math.round(net), method: '50% discount (new build choice)', alternative: split, held: round(held, 1) };
  return { ...split, gain: Math.round(net), method: 'Split at 1 July 2027: 50% discount before, indexation + 30% minimum after', held: round(held, 1) };
}

/** Internal rate of return on annual cash flows (bisection; robust for one sign change). */
export function IRR(flows) {
  const npv = (r) => flows.reduce((a, f, i) => a + f / (1 + r) ** i, 0);
  let lo = -0.99;
  let hi = 1.5;
  const a = npv(lo);
  const b = npv(hi);
  if (Number.isNaN(a) || Number.isNaN(b) || a * b > 0) return null;
  for (let k = 0; k < 200; k++) {
    const mid = (lo + hi) / 2;
    const v = npv(mid);
    if (Math.abs(v) < 1e-6) return mid;
    if (npv(lo) * v < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Keystone verdict: turns the numbers into a plain-English call with the reasons behind it.
 * suburb: optional index row (scores, vacancy etc). Returns {grade, label, score, reasons[], risks[]}.
 */
export function verdict(result, suburb = null, market = null) {
  const s = result.summary;
  const p = result.input;
  const reasons = [];
  const risks = [];
  let pts = 50;

  // 1. Return on the cash you put in
  if (s.irr !== null) {
    if (s.irr >= 12) { pts += 20; reasons.push(`Projected after-tax return on your cash of ${s.irr}% a year beats shares' long-run ~9-10%.`); }
    else if (s.irr >= 9) { pts += 10; reasons.push(`Projected after-tax return of ${s.irr}% a year is in line with a diversified share portfolio, with leverage risk on top.`); }
    else if (s.irr >= 6) { pts -= 2; risks.push(`Projected after-tax return of ${s.irr}% a year is modest for the risk and effort of a leveraged property.`); }
    else { pts -= 15; risks.push(`Projected after-tax return of only ${s.irr}% a year: you could do about as well in an offset account or term deposit.`); }
  }
  // 2. Cash flow
  const wk = s.weeklyCashAfterTax;
  if (wk >= 0) { pts += 10; reasons.push(`Positively geared from day one: about $${Math.round(wk)} a week in your pocket after tax.`); }
  else if (wk > -150) { pts += 2; reasons.push(`Manageable holding cost of about $${Math.abs(Math.round(wk))} a week after tax.`); }
  else if (wk > -350) { pts -= 6; risks.push(`Costs you about $${Math.abs(Math.round(wk))} a week after tax to hold, so you need a buffer.`); }
  else { pts -= 14; risks.push(`Heavy holding cost of about $${Math.abs(Math.round(wk))} a week after tax.`); }
  if (s.negativeGearing === 'restricted' && s.weeklyCashBeforeTax < 0) {
    pts -= 6;
    risks.push('Established property bought after 12 May 2026: from 1 July 2027 rental losses can no longer reduce your salary tax (they carry forward instead), so the real weekly cost rises.');
  }
  if (s.negativeGearing === 'new-build') reasons.push('New build: keeps negative gearing and the option of the 50% CGT discount under the 2026 reforms.');
  // 3. Yield
  if (s.grossYield >= 5.5) { pts += 8; reasons.push(`High gross yield of ${s.grossYield}%.`); }
  else if (s.grossYield >= 4.2) { pts += 3; reasons.push(`Solid gross yield of ${s.grossYield}%.`); }
  else if (s.grossYield < 3.2) { pts -= 6; risks.push(`Low gross yield of ${s.grossYield}%: returns depend almost entirely on capital growth.`); }
  // 4. Stress test
  if (s.stressedWeekly < -500) { pts -= 6; risks.push(`If rates rise 2 points the property would cost about $${Math.abs(Math.round(s.stressedWeekly))} a week before tax.`); }
  // 5. Leverage
  if (s.lvr > 90) { pts -= 6; risks.push(`High ${s.lvr}% loan-to-value ratio: LMI of $${(result.lmi.premium || 0).toLocaleString()} and little room if prices fall.`); }
  // 6. Suburb fundamentals
  if (suburb) {
    const sc = suburb.score ?? null;
    if (sc !== null) {
      if (sc >= 70) { pts += 8; reasons.push(`${suburb.n} scores ${sc}/100 on Keystone's suburb fundamentals.`); }
      else if (sc < 40) { pts -= 6; risks.push(`${suburb.n} scores only ${sc}/100 on suburb fundamentals.`); }
    }
    const reg = market?.regions?.[suburb.rg];
    if (reg?.vacancy !== undefined) {
      if (reg.vacancy <= 1) reasons.push(`${reg.name} rental vacancy is just ${reg.vacancy}%: tenants are easy to find.`);
      else if (reg.vacancy >= 2) risks.push(`${reg.name} rental vacancy is ${reg.vacancy}%, higher than the tight capitals.`);
    }
    if (reg?.annualPct !== undefined) {
      if (reg.annualPct < 0) risks.push(`${reg.name} values fell ${Math.abs(reg.annualPct)}% over the last year; timing risk in the short term.`);
      else if (reg.annualPct > 8) reasons.push(`${reg.name} values rose ${reg.annualPct}% over the last year.`);
    }
    if (suburb.conf === 'low') risks.push('Few sales and a small population here, so the price estimate is less certain. Get a local appraisal.');
  }
  const score = Math.max(0, Math.min(100, Math.round(pts)));
  const grade = score >= 72 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D';
  const label = { A: 'Strong buy', B: 'Buy', C: 'Consider carefully', D: 'Pass' }[grade];
  return { score, grade, label, reasons, risks };
}

/** Weighted Keystone Score from a suburb's component percentiles. */
export const PROFILES = {
  balanced: { cash: 20, momentum: 15, growth: 20, demand: 20, afford: 10, stability: 15 },
  growth: { cash: 5, momentum: 25, growth: 30, demand: 20, afford: 5, stability: 15 },
  cashflow: { cash: 45, momentum: 5, growth: 10, demand: 20, afford: 10, stability: 10 },
  firsthome: { cash: 5, momentum: 10, growth: 20, demand: 10, afford: 35, stability: 20 },
};

export function suburbScore(sc, weights = PROFILES.balanced) {
  let t = 0;
  let w = 0;
  for (const [k, wt] of Object.entries(weights)) {
    const v = sc[k];
    if (v === null || v === undefined) continue;
    t += v * wt;
    w += wt;
  }
  return w ? Math.round(t / w) : null;
}

/**
 * Keystone estimate for one specific home, built up from the suburb's typical price.
 * s: suburb index row (h/u typical prices, bh/bu typical bedrooms, conf)
 * spec: {type:'h'|'u', beds, baths, land (m²), cars, condition:'new'|'renovated'|'average'|'original'|'needs-work', pool, liveFactor}
 * Returns {value, low, high, rent, adjustments:[{label, pct}], basis}
 */
export function valueEstimate(s, spec = {}) {
  const type = spec.type === 'u' ? 'u' : 'h';
  const base = (type === 'u' ? s.u : s.h) * (spec.liveFactor || 1);
  if (!base) return null;
  const adj = [];
  const typicalBeds = (type === 'u' ? s.bu : s.bh) || (type === 'u' ? 2 : 3.3);
  // no bedrooms given: price the suburb's typical home as-is and label it with its usual bedroom count
  const beds = spec.beds ?? Math.floor(typicalBeds + 0.4);
  // bedrooms: ~11% per bedroom for houses, ~17% for units (studio to 1 bed to 2 bed are big steps)
  const perBed = type === 'u' ? 0.17 : 0.11;
  const bedAdj = spec.beds == null ? 0 : Math.max(-0.45, Math.min(0.5, (beds - typicalBeds) * perBed));
  if (Math.abs(bedAdj) > 0.005) adj.push({ label: `${beds} bedrooms vs ${typicalBeds.toFixed(1)} typical here`, pct: bedAdj });
  if (spec.baths) {
    const typicalBaths = type === 'u' ? (beds >= 2 ? 1.6 : 1) : beds >= 4 ? 2.1 : 1.6;
    const b = Math.max(-0.08, Math.min(0.12, (spec.baths - typicalBaths) * 0.045));
    if (Math.abs(b) > 0.005) adj.push({ label: `${spec.baths} bathroom${spec.baths > 1 ? 's' : ''}`, pct: b });
  }
  if (type === 'h' && spec.land) {
    const typicalLand = s.cbd === null || s.cbd === undefined ? 850 : s.cbd < 8 ? 380 : s.cbd < 15 ? 560 : s.cbd < 30 ? 650 : 750;
    const l = Math.max(-0.3, Math.min(0.45, Math.log(spec.land / typicalLand) * 0.3));
    if (Math.abs(l) > 0.005) adj.push({ label: `${Math.round(spec.land)} m² land vs ~${typicalLand} m² typical`, pct: l });
  }
  if (type === 'u' && spec.cars !== undefined && spec.cars !== null) {
    const c = spec.cars === 0 ? -0.06 : spec.cars >= 2 ? 0.05 : 0;
    if (c) adj.push({ label: spec.cars === 0 ? 'No car space' : '2+ car spaces', pct: c });
  }
  const cond = { new: 0.1, renovated: 0.07, average: 0, original: -0.07, 'needs-work': -0.18 }[spec.condition || 'average'] || 0;
  if (cond) adj.push({ label: { new: 'Brand new', renovated: 'Renovated', original: 'Original condition', 'needs-work': 'Needs work' }[spec.condition], pct: cond });
  if (spec.pool && type === 'h') adj.push({ label: 'Pool', pct: 0.035 });
  const factor = adj.reduce((f, a) => f * (1 + a.pct), 1);
  const value = Math.round((base * factor) / 5000) * 5000;
  const band = { high: 0.1, medium: 0.13, 'medium-low': 0.16, low: 0.2 }[s.conf] ?? 0.15;
  const spread = band + (spec.land || spec.beds ? 0 : 0.03);
  const rentBase = type === 'u' ? s.ru : s.rh;
  const rent = rentBase ? Math.round((rentBase * (1 + bedAdj * 0.75) * (1 + cond * 0.4)) / 5) * 5 : null;
  return {
    value,
    low: Math.round((value * (1 - spread)) / 5000) * 5000,
    high: Math.round((value * (1 + spread)) / 5000) * 5000,
    rent,
    yield: rent ? (rent * 52 * 100) / value : null,
    adjustments: adj,
    basis: base,
    type,
    beds,
    spread,
  };
}
