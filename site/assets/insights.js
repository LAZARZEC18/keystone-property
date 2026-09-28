// Turns a suburb's numbers into a plain-English investment case: why buy, what to watch, who it suits.
import { aud, pct } from './ui.js';
import { cleanName } from './data.js';
import { riskNote } from './engine.js';

const med = (arr) => {
  const a = arr.filter((x) => x !== null && x !== undefined).sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)] : null;
};

/** Region medians used as the yardstick for "above/below average". */
export function regionStats(list, rg) {
  const r = list.filter((s) => s.rg === rg && s.pop >= 500);
  return {
    n: r.length,
    y: med(r.map((s) => s.y)),
    h: med(r.map((s) => s.h)),
    u: med(r.map((s) => s.u)),
    pg5: med(r.map((s) => s.pg5)),
    pti: med(r.map((s) => s.pti)),
    inc: null,
  };
}

export function investmentCase(s, d, region, rs, market) {
  const name = cleanName(s.n);
  const R = market.regions[s.rg] || {};
  const pros = [];
  const cons = [];
  const suits = [];
  // city- or region-wide conditions: shown separately and never counted as a reason about this suburb
  const wider = [];
  const type = s.pt === 'u' ? 'unit' : 'house';
  const price = s.pt === 'u' ? s.u : s.h;
  const rent = s.pt === 'u' ? s.ru : s.rh;
  const yld = rent && price ? (rent * 52 * 100) / price : null;

  // Yield vs region (the same regional yield the page shows)
  const ry = R.yield ?? rs.y;
  if (yld && ry) {
    const diff = yld - (s.pt === 'u' ? ry * 1.15 : ry);
    if (diff > 0.6) pros.push(`Rental yield of ${pct(yld, 2)} on a typical ${type} is well above the ${R.name} average (about ${pct(ry, 1)}), so rent covers more of the holding cost.`);
    else if (diff < -0.6) cons.push(`Yield of ${pct(yld, 2)} is below the ${R.name} average (about ${pct(ry, 1)}). Returns here lean on capital growth, and the cash shortfall each week is larger.`);
  }
  // Momentum: only the suburb's own sales count as a reason about the suburb
  if (s.g1 !== null && s.g1 !== undefined) {
    const regional = String(s.g1s).startsWith('region');
    if (String(s.g1s).includes('capped')) cons.push(`The suburb's own 12-month change was extreme and comes from few sales, so it is held close to ${R.name} (${pct(s.g1, 1, true)} shown). Treat it as unreliable.`);
    const per = !s.g1p ? 'the past year' : `the past year (${s.g1p})`;
    if (regional) {
      wider.push(`${R.name}-wide home values ${s.g1 >= 0 ? 'rose' : 'fell'} ${pct(Math.abs(s.g1), 1)} over the past year. There's no sales series for ${name} itself, so this says nothing specific about it.`);
    } else if (s.g1 >= 8) pros.push(`Values in ${name} rose ${pct(s.g1, 1)} over ${per}, from its own sales.`);
    else if (s.g1 < 0) cons.push(`Values in ${name} fell ${pct(Math.abs(s.g1), 1)} over ${per}, from its own sales. Softer prices can be a buying window, but they can also keep falling while rates are high.`);
  }
  const rn = riskNote({ ...s, ...d });
  if (rn) cons.unshift(rn);
  if (d.cagr !== undefined && d.cagr !== null) {
    if (d.cagr >= 6) pros.push(`Long-run house price growth of ${pct(d.cagr, 1)} a year (${d.cagrY}, Valuer-General Victoria).`);
    else if (d.cagr < 3) cons.push(`House prices grew only ${pct(d.cagr, 1)} a year over ${d.cagrY}, below inflation plus holding costs.`);
  }
  // Population and income
  if (s.pg5 !== null && s.pg5 !== undefined) {
    const per = /census/i.test(d?.pgS || '') ? 'between the 2016 and 2021 Censuses' : 'from 2020 to 2025 (ABS estimates)';
    if (s.pg5 > 12.5) cons.push(`Population grew ${pct(s.pg5, 1)} ${per}, faster than about 2.5% a year: that usually means a lot of new housing being built (a new estate or apartment towers), so new homes compete with resales and rentals. Ownaroo gives growth this fast less credit, not more.`);
    else if (s.pg5 >= 6) pros.push(`Population grew ${pct(s.pg5, 1)} ${per} without an estate-scale building boom: steady demand for homes and rentals.`);
    else if (s.pg5 < -2) cons.push(`Population shrank ${pct(Math.abs(s.pg5), 1)} ${per}. Falling demand is a long-term risk.`);
  }
  if (d.ig5 !== undefined && d.ig5 >= 20) pros.push(/SA2/.test(d.igS || '') ? `Median incomes in the surrounding area rose ${pct(d.ig5, 0)} from 2018-19 to 2022-23 (ABS), so locals can afford rising rents and prices.` : `Household incomes rose ${pct(d.ig5, 0)} from 2016 to 2021 (Census), so locals can afford rising rents and prices.`);
  if (d.rg5 !== undefined && d.rg5 >= 15) pros.push(`Census rents rose ${pct(d.rg5, 0)} between 2016 and 2021, before the recent rental boom.`);
  // Rental demand
  if (R.vacancy !== undefined && R.vacancy !== null) {
    if (R.vacancy <= 1) wider.push(`${R.name}-wide rental vacancy is ${pct(R.vacancy, 1)}, so rentals across the ${/^Regional/.test(R.name) ? 'region' : 'city'} are leasing quickly. Suburb-level vacancy isn't available here.`);
    else if (R.vacancy >= 2) wider.push(`${R.name}-wide vacancy is ${pct(R.vacancy, 1)}, so budget for a few weeks between tenants. Suburb-level vacancy isn't available here.`);
  }
  if (d['rent%'] >= 45) pros.push(`${pct(d['rent%'] ?? s['rent%'], 0)} of homes are rented: a deep tenant pool.`);
  // Affordability
  // price-to-income on the suburb's usual home type, as in the page header
  const ptiT = s.pti && s.h && price ? Math.round(((s.pti * price) / s.h) * 10) / 10 : s.pti;
  if (ptiT) {
    if (ptiT <= 6) pros.push(`A typical ${type} costs ${ptiT}× local household income, affordable by Australian standards, which supports resale demand.`);
    else if (ptiT >= 12) cons.push(`A typical ${type} costs ${ptiT}× local household income. Growth here depends on buyers from outside the area.`);
  }
  // Risk factors
  if (d.une >= 7) cons.push(`Unemployment is about ${pct(d.une, 1)} (the 2021 Census rate moved by the change in the region's rate since), well above the national average. Tenant arrears risk is higher.`);
  if (d['soc%'] >= 20) cons.push(`${pct(d['soc%'], 0)} of homes are social housing, which can cap price growth.`);
  if (s.isl) cons.push('No road bridge to the mainland: residents rely on a ferry or barge, which narrows the pool of buyers and tenants and adds to the cost of living and building here.');
  if (s.pop < 1500) cons.push(`Small market (${s.pop.toLocaleString()} residents), so there are fewer buyers and tenants and it's harder to sell quickly.`);
  if (['Remote', 'Very Remote'].includes(s.ra || d.ra)) cons.push(`${s.ra || d.ra} area. Remote markets swing with local industry (often mining) and can fall sharply.`);
  if (s.pt === 'u' && (d['fla%'] ?? 0) >= 60) cons.push('Unit-dominated market. Check apartment supply in the pipeline, strata levies and building defects before buying off the plan.');
  if (s.conf === 'low' || s.conf === 'medium-low') cons.push(`The price is a Ownaroo estimate (${s.conf === 'low' ? 'low' : 'moderate'} confidence). Check recent sales on the listings links below before you rely on it.`);
  if (R.dom && R.domYearAgo && R.dom - R.domYearAgo >= 10) wider.push(`Homes across ${R.name} now take ${R.dom} days to sell, up from ${R.domYearAgo} a year ago: the market is cooling.`);

  // Who it suits
  if (yld >= 5) suits.push('Cash-flow investors who want rent to cover most of the loan');
  if ((s.sc?.growth ?? 0) >= 65 || (s.sc?.momentum ?? 0) >= 70) suits.push('Growth investors with a long (7+ year) horizon');
  const regionHouse = R.medianHouse || R.medianDwelling;
  if ((s.sc?.afford ?? 0) >= 65 && price && regionHouse && price <= regionHouse * 0.85) suits.push('First-home buyers and rent-vestors on a budget');
  const newEstate = (s.pg5 ?? 0) >= 20;
  if ((s.sc?.stability ?? 0) >= 70 && !newEstate) suits.push('Conservative buyers who value a stable, established area');
  if (newEstate) suits.push(`Buyers comfortable with a fast-growing area (population up ${pct(s.pg5, 0)} in five years), where new supply can hold back price growth`);
  if (!suits.length) suits.push('Buyers with a specific reason to be here (work, family, lifestyle) rather than a pure investment play');

  const headline = pros.length > cons.length + 1 ? `${name} stacks up well for investors on the numbers.` : cons.length > pros.length + 1 ? `${name} has more red flags than green for investors right now.` : `${name} is a mixed picture: the right property at the right price matters more than the suburb.`;
  return { headline, pros, cons, suits, wider, price, rent, yld, type };
}

export const COMPONENT_HELP = {
  cash: 'Gross rental yield ranked against every Australian suburb. Higher means rent covers more of your costs.',
  momentum: 'Price change over the last 12 months: official suburb or postcode sales in VIC, SA and NSW, weighted toward the region when sales are few; elsewhere there is no suburb-level figure. Shown for information only: it no longer counts toward the score anywhere.',
  growth: 'Growth drivers: population growth of the surrounding area 2020-25 (ABS estimates) net of new supply. Very fast growth (usually a new estate being built out) earns less credit, and a high rate of new dwelling approvals in the council area counts against it. Census 2016-21 income and rent growth carry a small weight.',
  demand: 'Rental demand: the city-wide vacancy rate and days on market (not suburb-level), plus local unemployment.',
  afford: 'Price relative to local household income. Affordable areas have a deeper pool of future buyers.',
  stability: 'Low unemployment, low share of social housing, a large enough market to buy and sell easily, and low concentration risk (mining or single-industry dependence, remoteness, shrinking population).',
};

export const COMPONENT_NAMES = { cash: 'Yield', momentum: 'Price trend (not scored)', growth: 'Growth drivers', demand: 'Rental demand', afford: 'Affordability', stability: 'Stability' };

export function listingLinks(s) {
  const name = cleanName(s.n);
  const st = s.s.toLowerCase();
  const dslug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${st}-${s.pc}`;
  const rea = `in-${encodeURIComponent(name.toLowerCase())},+${st}+${s.pc}`;
  return {
    reaBuy: `https://www.realestate.com.au/buy/${rea}/list-1`,
    reaRent: `https://www.realestate.com.au/rent/${rea}/list-1`,
    reaSold: `https://www.realestate.com.au/sold/${rea}/list-1`,
    domainBuy: `https://www.domain.com.au/sale/${dslug}/`,
    domainRent: `https://www.domain.com.au/rent/${dslug}/`,
    domainSold: `https://www.domain.com.au/sold-listings/${dslug}/`,
    domainProfile: `https://www.domain.com.au/suburb-profile/${dslug}`,
  };
}

export function fmtPrice(s, type) {
  return aud(type === 'u' ? s.u : s.h, { compact: true });
}

/** Why a suburb can score highly while a purchase there rates poorly. Shown wherever both appear. */
export function scoreVsDeal(score, grade) {
  return `<details class="explain"><summary>Suburb score ${score ?? '—'}/100 and the deal's rank: why they can differ</summary><p>The <b>suburb score</b> ranks the area against every other suburb in Australia. The <b>deal's rank</b> tests one purchase: a typical home at today's price, a 20% deposit, the RBA's average investor rate and a $120k salary, over 10 years, compared with the typical home in every other suburb run the same way. It is relative: at current rates most established homes cost their owner money every week, so even a "top 15%" deal usually does, which is why the weekly cost and the term-deposit test are shown first. The 5% a year growth assumption is the same everywhere; change it in the deal analyser.</p></details>`;
}

/** The human next step after the numbers: pre-approval. Neutral: Ownaroo doesn't refer or earn from this. */
export function nextStepsCard({ fhb = false } = {}) {
  return `<div class="card next-steps"><div class="eyebrow">Your next step</div><h3 style="margin-top:4px">Get pre-approval before you make offers</h3>
    <ol class="note" style="padding-left:18px;margin:8px 0 0;line-height:1.6">
      <li><b>Pre-approval</b> is a lender's conditional yes to a loan amount, usually valid for about 90 days (some lenders allow up to 6 months). It turns these estimates into a real borrowing limit and makes your offers stronger.</li>
      <li><b>Talk to a mortgage broker or go direct to a lender.</b> A broker compares many lenders and must act in your best interests by law; they are usually paid by the lender. A bank quotes only its own loans.</li>
      <li><b>Have ready:</b> photo ID, your last two payslips (or two years of tax returns if self-employed), three months of bank and savings statements, and details of any debts, cards and buy-now-pay-later accounts.</li>
      ${fhb ? '<li><b>For the 5% Deposit Scheme or Help to Buy,</b> you apply through a participating lender, not the government. Ask the broker or bank whether they offer it.</li>' : ''}
    </ol>
    <p class="fine" style="margin-top:8px"><a href="https://moneysmart.gov.au/home-loans/choosing-a-mortgage-broker" target="_blank" rel="noopener">Moneysmart: choosing a mortgage broker ↗</a>${fhb ? ' · <a href="https://www.housingaustralia.gov.au/" target="_blank" rel="noopener">Housing Australia: schemes and participating lenders ↗</a>' : ''} · Ownaroo doesn't refer you to anyone or earn anything from this.</p></div>`;
}
