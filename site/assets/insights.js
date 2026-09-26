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
  const type = s.pt === 'u' ? 'unit' : 'house';
  const price = s.pt === 'u' ? s.u : s.h;
  const rent = s.pt === 'u' ? s.ru : s.rh;
  const yld = rent && price ? (rent * 52 * 100) / price : null;

  // Yield vs region
  if (yld && rs.y) {
    const diff = yld - (s.pt === 'u' ? rs.y * 1.15 : rs.y);
    if (diff > 0.6) pros.push(`Rental yield of ${pct(yld, 2)} on a typical ${type} is well above the ${R.name} norm (about ${pct(rs.y, 1)}), so rent covers more of the holding cost.`);
    else if (diff < -0.6) cons.push(`Yield of ${pct(yld, 2)} is below the ${R.name} norm (about ${pct(rs.y, 1)}). Returns here lean on capital growth, and the cash shortfall each week is larger.`);
  }
  // Momentum
  if (s.g1 !== null && s.g1 !== undefined) {
    const src = String(s.g1s).startsWith('region') ? `${R.name} values (no suburb-level series here)` : 'Values here';
    if (String(s.g1s).includes('capped')) cons.push(`The suburb's own 12-month change was extreme and comes from few sales, so Keystone holds it to within 12 points of ${R.name} (${pct(s.g1, 1, true)} shown). Treat it as unreliable.`);
    const per = String(s.g1s).startsWith('region') && market.indexMonth ? `the 12 months to ${market.indexMonth.replace(/^\d+ /, '')}` : 'the last year';
    if (s.g1 >= 8) pros.push(`${src} rose ${pct(s.g1, 1)} over ${per}: strong buyer demand.`);
    else if (s.g1 < 0) cons.push(`${src} fell ${pct(Math.abs(s.g1), 1)} over ${per}. Softer prices can be a buying window, but they can also keep falling while rates are high.`);
  }
  const rn = riskNote({ ...s, ...d });
  if (rn) cons.unshift(rn);
  if (d.cagr !== undefined && d.cagr !== null) {
    if (d.cagr >= 6) pros.push(`Long-run house price growth of ${pct(d.cagr, 1)} a year (${d.cagrY}, Valuer-General Victoria).`);
    else if (d.cagr < 3) cons.push(`House prices grew only ${pct(d.cagr, 1)} a year over ${d.cagrY}, below inflation plus holding costs.`);
  }
  // Population and income
  if (s.pg5 !== null && s.pg5 !== undefined) {
    if (s.pg5 >= 10) pros.push(`Population grew ${pct(s.pg5, 1)} between the 2016 and 2021 Censuses: more people competing for homes and rentals.`);
    else if (s.pg5 < -2) cons.push(`Population shrank ${pct(Math.abs(s.pg5), 1)} between 2016 and 2021. Falling demand is a long-term risk.`);
  }
  if (d.ig5 !== undefined && d.ig5 >= 20) pros.push(`Household incomes rose ${pct(d.ig5, 0)} from 2016 to 2021, so locals can afford rising rents and prices.`);
  if (d.rg5 !== undefined && d.rg5 >= 15) pros.push(`Census rents rose ${pct(d.rg5, 0)} between 2016 and 2021, before the recent rental boom.`);
  // Rental demand
  if (R.vacancy !== undefined) {
    if (R.vacancy <= 1) pros.push(`${R.name} rental vacancy is only ${pct(R.vacancy, 1)}. Well-presented rentals lease quickly.`);
    else if (R.vacancy >= 2) cons.push(`${R.name} vacancy is ${pct(R.vacancy, 1)}, so budget for a few weeks between tenants.`);
  }
  if (d['rent%'] >= 45) pros.push(`${pct(d['rent%'] ?? s['rent%'], 0)} of homes are rented: a deep tenant pool.`);
  // Affordability
  if (s.pti) {
    if (s.pti <= 6) pros.push(`Prices are ${s.pti}× local household income, affordable by Australian standards, which supports resale demand.`);
    else if (s.pti >= 12) cons.push(`Prices are ${s.pti}× local household income. Growth here depends on buyers from outside the area.`);
  }
  // Risk factors
  if (d.une >= 8) cons.push(`Unemployment was ${pct(d.une, 1)} at the 2021 Census, well above the national average. Tenant arrears risk is higher.`);
  if (d['soc%'] >= 20) cons.push(`${pct(d['soc%'], 0)} of homes are social housing, which can cap price growth.`);
  if (s.pop < 1500) cons.push(`Small market (${s.pop.toLocaleString()} residents), so there are fewer buyers and tenants and it's harder to sell quickly.`);
  if (['Remote', 'Very Remote'].includes(d.ra)) cons.push(`${d.ra} area. Remote markets swing with local industry (often mining) and can fall sharply.`);
  if (s.pt === 'u' && (d['fla%'] ?? 0) >= 60) cons.push('Unit-dominated market. Check apartment supply in the pipeline, strata levies and building defects before buying off the plan.');
  if (s.conf === 'low' || s.conf === 'medium-low') cons.push(`The price is a Keystone estimate (${s.conf === 'low' ? 'low' : 'moderate'} confidence). Check recent sales on the listings links below before you rely on it.`);
  if (R.dom && R.domYearAgo && R.dom - R.domYearAgo >= 10) cons.push(`Homes in ${R.name} now take ${R.dom} days to sell, up from ${R.domYearAgo} a year ago: the market is cooling.`);

  // Who it suits
  if (yld >= 5) suits.push('Cash-flow investors who want rent to cover most of the loan');
  if ((s.sc?.growth ?? 0) >= 65 || (s.sc?.momentum ?? 0) >= 70) suits.push('Growth investors with a long (7+ year) horizon');
  if ((s.sc?.afford ?? 0) >= 65) suits.push('First-home buyers and rent-vestors on a budget');
  if ((s.sc?.stability ?? 0) >= 70) suits.push('Conservative buyers who value a stable, established area');
  if (!suits.length) suits.push('Buyers with a specific reason to be here (work, family, lifestyle) rather than a pure investment play');

  const headline = pros.length > cons.length + 1 ? `${name} stacks up well for investors on the numbers.` : cons.length > pros.length + 1 ? `${name} has more red flags than green for investors right now.` : `${name} is a mixed picture: the right property at the right price matters more than the suburb.`;
  return { headline, pros, cons, suits, price, rent, yld, type };
}

export const COMPONENT_HELP = {
  cash: 'Gross rental yield ranked against every Australian suburb. Higher means rent covers more of your costs.',
  momentum: 'Price change over the last 12 months (official sales where available, otherwise the regional index).',
  growth: 'Growth drivers: population, household income and rent growth between the 2016 and 2021 Censuses.',
  demand: 'Rental demand: market vacancy rate, days on market, and local unemployment.',
  afford: 'Price relative to local household income. Affordable areas have a deeper pool of future buyers.',
  stability: 'Low unemployment, low share of social housing, and a large enough market to buy and sell easily.',
};

export const COMPONENT_NAMES = { cash: 'Yield', momentum: 'Momentum', growth: 'Growth drivers', demand: 'Rental demand', afford: 'Affordability', stability: 'Stability' };

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
