// Ownaroo investment engine. Pure functions, no DOM: runs in the browser and in Node tests.
import { RULES } from './rules.js';
import { DEAL_BANDS } from './deal-bands.js';
import { GROWTH, runningCosts } from './rules.js';

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
export function stampDuty(state, price, { buyer = 'investor', newBuild = false, notOwned5 = false } = {}) {
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
  if (buyer === 'owner' && R.fhbFull && notOwned5) {
    duty = 0;
    notes.push('ACT Home Buyer Concession Scheme: full concession for a home to live in when no buyer has owned property in the last five years (from 1 July 2026).');
  }
  if (buyer === 'fhb') {
    if (R.fhbFull) {
      duty = 0;
      notes.push('ACT Home Buyer Concession Scheme: full concession (price cap removed from 1 July 2026; also open to buyers who haven\'t owned property in the last five years).');
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
      } else notes.push(`Above the $${f.concessionTo.toLocaleString()} first home buyer cap, so no first home concession applies.`);
    } else if (R.note) notes.push(R.note);
    if (duty >= general && !notes.some((n) => /cap|concession|exempt/i.test(n))) notes.push('No first home concession applies at this price.');
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
/**
 * Monthly living costs a lender would assume. Like the Household Expenditure Measure, it rises with income:
 * a base for the household, plus about 10% of gross income above $80k (single) or $120k (couple). Conservative.
 */
export function livingBenchmark(grossIncome, { couple = false, dependants = 0 } = {}) {
  const base = (couple ? 3800 : 2400) + dependants * 700;
  const over = Math.max(0, grossIncome - (couple ? 120000 : 80000));
  return Math.round(base + (over * 0.1) / 12);
}

/**
 * Take-home pay for a household, a year. Each person is taxed on their own income (two incomes of $95k and $60k pay
 * far less tax than one of $155k). Rent counted by the lender is added to the higher earner.
 */
export function householdNet(incomes, extra = 0) {
  const list = (incomes && incomes.length ? incomes : [0]).map((x) => Math.max(0, +x || 0));
  const top = list.indexOf(Math.max(...list));
  return list.reduce((t, inc, i) => {
    const g = inc + (i === top ? extra : 0);
    return t + g - incomeTax(g);
  }, 0);
}

export function borrowingPower({ grossIncome, incomes, otherDebtMonthly = 0, dependants = 0, couple = false, existingRentIncome = 0, newRentWeekly = 0, ratePct, years = 30, livingCostsMonthly, declaredLivingMonthly }) {
  const assess = ratePct + RULES.serviceability.buffer;
  const shaded = (existingRentIncome + newRentWeekly * 52) * RULES.serviceability.rentShading;
  const net = incomes ? householdNet(incomes, shaded) : grossIncome + shaded - incomeTax(grossIncome + shaded);
  // lenders use the higher of what you declare and their benchmark for your income and household
  const bench = livingBenchmark(grossIncome, { couple, dependants });
  const living = livingCostsMonthly ?? Math.max(bench, declaredLivingMonthly || 0);
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
    buyer: 'investor', newBuild: false, buildYear: null, buildCost: null, plantValue: 0,
    purchaseDate: new Date().toISOString().slice(0, 10), income: 120000,
    growth: 3, rentGrowth: 3.5, cpi: 3, vacancyWeeks: 2, mgmtPct: 7.5, councilRates: 2200, water: 900, strata: 0,
    insurance: 1800, maintenancePct: 1.2, landValuePct: 0.55, otherCosts: 2500, lmiCapitalise: true,
    hold: 10, sellCostPct: 2.5, perth: false, ...input,
  };
  // running costs default to typical figures for the state and type, the same ones every calculator shows
  const rc = runningCosts(p.state, p.landValuePct <= 0.3 ? 'u' : 'h');
  if (input.councilRates === undefined) p.councilRates = rc.council;
  if (input.water === undefined && input.insurance === undefined) {
    p.water = 0;
    p.insurance = rc.waterIns;
  }
  // owners: [{share, income}]; default one owner on p.income. Shares are normalised to sum to 1.
  const owners0 = Array.isArray(p.owners) && p.owners.length ? p.owners : [{ share: 1, income: p.income }];
  const tot = owners0.reduce((t, o) => t + (o.share || 0), 0) || 1;
  const owners = owners0.map((o) => ({ share: (o.share || 0) / tot, income: o.income || 0 }));
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
  // borrowing expenses (LMI, loan establishment, mortgage registration) over $100 are deducted over 5 years (ATO)
  const borrowTotal = lmiCost + (p.loanFees ?? 800);
  const borrowPerYear = borrowTotal > 100 ? borrowTotal / 5 : 0;

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
    // land tax is assessed on total holdings in the state: charge the extra this property adds on top of land already owned
    const other = (p.otherLandValue || 0) * (value / p.price);
    const land = landTax(p.state, landValue0 * (value / p.price) + other, { perth: p.perth }).tax - (other ? landTax(p.state, other, { perth: p.perth }).tax : 0);
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
    const borrowDed = y <= 5 ? borrowPerYear : 0;
    const netRental = grossRent - holding - interest - dep - borrowDed; // taxable rental result
    const cashBeforeTax = grossRent - holding - interest - principal;

    // Negative gearing test for this year (share of the year that falls before 1 July 2027)
    let offsetShare = 1;
    if (!p.newBuild && !grandfathered) {
      const pre = Math.max(0, Math.min(Date.parse(end), Date.parse(reformStart)) - Date.parse(start));
      offsetShare = pre / (Date.parse(end) - Date.parse(start));
    }
    let taxEffect = 0; // positive = tax saved (refund), negative = extra tax
    let quarantined = 0;
    let incomeDelta = 0; // how this property changes the owners' taxable income this year
    if (netRental < 0) {
      const usable = -netRental * offsetShare;
      incomeDelta = -usable;
      quarantined = -netRental - usable;
      carried += quarantined;
      taxEffect = owners.reduce((t, o) => t + incomeTax(o.income) - incomeTax(Math.max(0, o.income - usable * o.share)), 0);
    } else {
      const useCarry = Math.min(carried, netRental);
      carried -= useCarry;
      const taxable = netRental - useCarry;
      incomeDelta = taxable;
      taxEffect = -owners.reduce((t, o) => t + incomeTax(o.income + taxable * o.share) - incomeTax(o.income), 0);
    }
    // 2026 rules: losses that can't reduce salary can still offset net rental profit from the owner's other properties
    const otherProfit = (p.otherRental || 0) * (1 + p.cpi / 100) ** (y - 1);
    let usedOther = 0;
    if (otherProfit > 0 && carried > 0) {
      usedOther = Math.min(carried, otherProfit);
      carried -= usedOther;
      taxEffect += owners.reduce((t, o) => t + incomeTax(Math.max(0, o.income + incomeDelta * o.share)) - incomeTax(Math.max(0, o.income + (incomeDelta - usedOther) * o.share)), 0);
    }
    const cashAfterTax = cashBeforeTax + taxEffect;
    cum += cashAfterTax;
    value *= 1 + p.growth / 100;
    rows.push({
      year: y, start, value: Math.round(value), weeklyRent: round(rent), grossRent: Math.round(grossRent),
      mgmt: Math.round(mgmt), maintenance: Math.round(maint), landTax: land, otherCosts: Math.round(costsBase),
      interest: Math.round(interest), principal: Math.round(principal), depreciation: Math.round(dep), borrowing: Math.round(borrowDed),
      netRental: Math.round(netRental), cashBeforeTax: Math.round(cashBeforeTax), taxEffect: Math.round(taxEffect),
      cashAfterTax: Math.round(cashAfterTax), quarantined: Math.round(quarantined), carried: Math.round(carried), usedOther: Math.round(usedOther),
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
  // each owner pays CGT on their share of the gain at their own tax rate
  const cgtParts = owners.map((o) =>
    capitalGainsTax({
      purchaseDate: p.purchaseDate, saleDate, price: p.price * o.share, salePrice: salePrice * o.share, sellCosts: sellCosts * o.share, costBase: costBase * o.share, growth: p.growth, cpi: p.cpi,
      income: o.income, carried: carried * o.share, newBuild: p.newBuild,
    }),
  );
  const cgt = owners.length === 1 ? cgtParts[0] : { ...capitalGainsTax({ purchaseDate: p.purchaseDate, saleDate, price: p.price, salePrice, sellCosts, costBase, growth: p.growth, cpi: p.cpi, income: owners[0].income, carried, newBuild: p.newBuild }), tax: Math.round(cgtParts.reduce((t, c) => t + c.tax, 0)), perOwner: cgtParts.map((c) => c.tax) };
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
    // principal repayments build equity, so they're not a cost: break-even covers interest and running costs only
    breakEvenRent: Math.round((y1.maintenance + y1.landTax + y1.otherCosts + y1.interest) / (52 - p.vacancyWeeks) / (1 - p.mgmtPct / 100)),
    breakEvenRentCash: Math.round((y1.maintenance + y1.landTax + y1.otherCosts + y1.interest + y1.principal) / (52 - p.vacancyWeeks) / (1 - p.mgmtPct / 100)),
    stressedWeekly: round((y1.cashBeforeTax - loan * 0.02) / 52), // rates +2 points
    irr: irr === null ? null : round(irr * 100, 2),
    saleProceeds: Math.round(saleProceeds),
    totalProfit: Math.round(equityFlows.reduce((a, b) => a + b, 0)),
    equityAtSale: Math.round(salePrice - balance),
    cashInvested: Math.round(upfront.total + rows.reduce((a, r) => a + Math.min(0, r.cashAfterTax), 0) * -1),
    marginalRate: round(owners.reduce((t, o) => t + marginalRate(o.income) * o.share, 0) * 100, 1),
    owners: owners.length,
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
 * Ownaroo verdict: turns the numbers into a plain-English call with the reasons behind it.
 * suburb: optional index row (scores, vacancy etc). Returns {grade, label, score, reasons[], risks[]}.
 */
export function verdict(result, suburb = null, market = null, { depositRate = 4.35 } = {}) {
  const s = result.summary;
  const p = result.input;
  const reasons = [];
  const risks = [];
  let pts = 50;

  // Absolute test: would the same cash have done better, risk-free, in a term deposit after tax?
  const mr = marginalRate(p.income || 0);
  const tdAfterTax = Math.round(depositRate * (1 - mr) * 10) / 10;
  // 1. Return on the cash you put in
  if (s.irr !== null) {
    if (s.irr >= 12) { pts += 20; reasons.push(`Projected after-tax return on your cash of ${s.irr.toFixed(1)}% a year beats shares' long-run ~9-10%.`); }
    else if (s.irr >= 9) { pts += 10; reasons.push(`Projected after-tax return of ${s.irr.toFixed(1)}% a year is in line with a diversified share portfolio, with leverage risk on top.`); }
    else if (s.irr >= 6) { pts -= 2; risks.push(`Projected after-tax return of ${s.irr.toFixed(1)}% a year is modest for the risk and effort of a leveraged property.`); }
    else { pts -= 15; risks.push(s.irr < tdAfterTax ? `Projected after-tax return of only ${s.irr.toFixed(1)}% a year: less than the ~${tdAfterTax.toFixed(1)}% a deposit at the cash rate would pay after tax, with no price risk.` : `Projected after-tax return of only ${s.irr.toFixed(1)}% a year: little more than the ~${tdAfterTax.toFixed(1)}% a deposit at the cash rate would pay after tax, with far more risk.`); }
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
  if (s.negativeGearing === 'new-build') reasons.push('New build: keeps negative gearing, and on sale you can choose the old 50% CGT discount or the new indexation method.');
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
      if (sc >= 70) { pts += 8; reasons.push(`${suburb.n} scores ${sc}/100 on Ownaroo's suburb fundamentals.`); }
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
  // The grade is RELATIVE: where this deal's numbers sit against the typical home in every Australian suburb,
  // run through the same model with the same assumptions today (scripts/deal_bands.mjs). With rates where they
  // are, almost every established property loses money week to week, so an absolute scale would give nearly
  // everything a D and carry no signal.
  const percentile = dealPercentile(score);
  const grade = percentile === null ? (score >= 72 ? 'A' : score >= 60 ? 'B' : score >= 45 ? 'C' : 'D') : percentile >= 85 ? 'A' : percentile >= 60 ? 'B' : percentile >= 30 ? 'C' : 'D';
  // Shown as a rank, never as a letter: an "A" read as "buy" when most deals lose money each week.
  const label = { A: 'Top 15%', B: 'Upper 40%', C: 'Middle 30%', D: 'Bottom 30%' }[grade];
  const absolute = s.weeklyCashAfterTax >= 0 ? `Pays its own way: about $${Math.round(s.weeklyCashAfterTax)} a week in your pocket after tax.` : `On its own numbers you pay about $${Math.abs(Math.round(s.weeklyCashAfterTax))} a week after tax to hold it.`;
  const beatsDeposit = s.irr !== null && s.irr > tdAfterTax;
  const vsDeposit = s.irr === null ? null : `A projected ${s.irr.toFixed(1)}% a year after tax on your cash, against about ${tdAfterTax}% from a ${depositRate}% deposit after tax at your ${Math.round(mr * 100)}% rate. Unlike the deposit, the property return depends on the growth assumption and isn't guaranteed.`;
  return { score, grade, label, percentile, absolute, beatsDeposit, tdAfterTax, depositRate, vsDeposit, reasons, risks };
}

/** Share (0-100) of benchmark deals this score beats, or null if no benchmark is loaded. */
export function dealPercentile(score, bands = DEAL_BANDS) {
  const q = bands?.q;
  if (!q?.length) return null;
  // mid-rank, so a score tied with many benchmark deals lands in the middle of the tie
  const below = q.filter((v) => v < score).length;
  const equal = q.filter((v) => v === score).length;
  return Math.round(((below + equal / 2) / q.length) * 100);
}

/** Weighted Ownaroo Score from a suburb's component percentiles. */
export const PROFILES = {
  // Momentum (the past 12 months' price change) carries no weight: it exists only where official suburb sales do
  // (NSW, VIC, SA), so weighting it made scores incomparable across states, and it rewards trailing growth just as
  // markets turn. It is still shown on each suburb page for information.
  balanced: { cash: 22, momentum: 0, growth: 25, demand: 23, afford: 12, stability: 18 },
  growth: { cash: 8, momentum: 0, growth: 45, demand: 25, afford: 5, stability: 17 },
  cashflow: { cash: 48, momentum: 0, growth: 12, demand: 20, afford: 10, stability: 10 },
  firsthome: { cash: 5, momentum: 0, growth: 22, demand: 10, afford: 40, stability: 23 },
  // New builds keep negative gearing and the CGT discount under the 2026 rules. Ranked among areas where new homes
  // are actually being approved, on rental demand, affordability, stability and yield; growth drivers carry less
  // weight because new supply is a given there.
  newbuild: { cash: 22, momentum: 0, growth: 10, demand: 31, afford: 21, stability: 16 },
};
/** Extra eligibility for a strategy: new-build rankings only include council areas approving 1+ new home a year per 100. */
export const PROFILE_FILTERS = { newbuild: (s) => (s.sup ?? 0) >= 1 && (s.pg5 ?? 0) > 0 };
export const PROFILE_NAMES = { balanced: 'Balanced', growth: 'Capital growth', cashflow: 'Cash flow', firsthome: 'First home', newbuild: 'New builds' };

export function suburbScore(sc, weights = PROFILES.balanced) {
  let t = 0;
  let w = 0;
  for (const [k, wt] of Object.entries(weights)) {
    const v = sc[k];
    if (v === null || v === undefined) continue;
    t += v * wt;
    w += wt;
  }
  if (!w) return null;
  // Concentration risk (mining dependence, one dominant employer, remoteness, shrinking population) costs up to 25 points:
  // high yields in single-industry towns come with price and vacancy swings the other components can't see.
  const risk = sc.risk ?? 0;
  const penalty = risk > 15 ? Math.min(30, Math.round((risk - 15) * 0.45)) : 0;
  // Modelled suburbs (no official sales series) are shrunk 15% toward the middle: less certain numbers
  // shouldn't outrank measured ones on the same inputs.
  const raw = t / w;
  const base = sc.modelled ? 50 + (raw - 50) * 0.85 : raw;
  return Math.max(0, Math.round(base) - penalty);
}

/** Plain-English reason for a suburb's concentration-risk penalty, or null. */
export function riskNote(s) {
  const r = s.rsk ?? s.sc?.risk ?? 0;
  if (r < 40) return null;
  const why = [];
  if ((s['min%'] ?? 0) >= 10) why.push(`${Math.round(s['min%'])}% of local workers are in mining`);
  if (/Remote/.test(s.ra || '')) why.push(`${(s.ra || '').toLowerCase()} location`);
  if ((s.pg5 ?? 0) < -3) why.push(`population fell ${Math.abs(s.pg5).toFixed(1)}% over 5 years`);
  return `Concentration risk${why.length ? `: ${why.join(', ')}` : ''}. Prices and rents in towns like this can swing sharply with one industry or employer.`;
}

/**
 * Ownaroo estimate for one specific home, built up from the suburb's typical price.
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

/** After-tax return on your cash (IRR) at the bear, base and bull growth rates, all else equal. */
export function scenarioReturns(input) {
  const out = {};
  for (const k of ['bear', 'base', 'bull']) out[k] = { growth: GROWTH[k], irr: analyse({ ...input, growth: GROWTH[k], rentGrowth: { bear: 2.5, base: 3.5, bull: 4.5 }[k] }).summary.irr };
  return out;
}

/** Gross household income a lender would want before lending this much (inverse of borrowingPower, couple, no dependants). */
export function incomeFor(loan, ratePct) {
  let lo = 20000;
  let hi = 3000000;
  if (borrowingPower({ grossIncome: hi, couple: true, ratePct }).amount < loan) return hi;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (borrowingPower({ grossIncome: mid, couple: true, ratePct }).amount >= loan) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi / 1000) * 1000;
}

/**
 * A comfortable monthly repayment for a home to live in: the lower of
 *  (a) 30% of before-tax household income, less the other loan repayments you already make (car, personal, HECS), and
 *  (b) what's left of take-home pay after household expenses, private insurance and those repayments, keeping 10% spare.
 * Returns the repayment, the loan it supports at the rate over 30 years, and which test set it.
 */
export function comfortableRepayment({ incomes, grossIncome, debtsMonthly = 0, expensesMonthly = null, insuranceMonthly = 0, dependants = 0, ratePct, years = 30 }) {
  const gross = grossIncome ?? (incomes || []).reduce((t, x) => t + (+x || 0), 0);
  const couple = (incomes || []).filter((x) => +x > 0).length > 1;
  const netMonthly = householdNet(incomes || [gross]) / 12;
  const expenses = expensesMonthly ?? livingBenchmark(gross, { couple, dependants });
  const stress = (gross * 0.3) / 12 - debtsMonthly;
  const budget = netMonthly * 0.9 - expenses - insuranceMonthly - debtsMonthly;
  const monthly = Math.max(0, Math.min(stress, budget));
  const r = ratePct / 1200;
  const loan = monthly > 0 ? (monthly * (1 - (1 + r) ** -(years * 12))) / r : 0;
  return { monthly: Math.round(monthly), loan: Math.round(loan), limit: budget < stress ? 'budget' : 'stress', stress: Math.round(stress), budget: Math.round(budget), netMonthly: Math.round(netMonthly), expenses: Math.round(expenses), declared: expensesMonthly != null };
}
