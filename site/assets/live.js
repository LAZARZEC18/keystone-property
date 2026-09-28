// Shared helpers for live index-based moves.
// One series per figure, everywhere on the site:
//  - every "past 12 months" figure is Cotality's monthly Home Value Index (all 8 capitals and the regions);
//  - the daily index is used only for movement since the last month-end (this week, this month, rolling prices to today).
// Brisbane's daily series covers Brisbane + Gold Coast, so it is always labelled that way.
export const DAILY = { SYD: 'SYD', MEL: 'MEL', BNE: 'BNEGC', ADL: 'ADL', PER: 'PER' };
export const DAILY_NAMES = { SYD: 'Sydney', MEL: 'Melbourne', BNE: 'Brisbane + Gold Coast', ADL: 'Adelaide', PER: 'Perth' };

/** Index change for a Keyzing region: daily feed for 5 capitals, monthly for the other 3, Cotality monthly for regions. */
export function regionMoves(rg, idx, market) {
  const d = DAILY[rg] ? idx.daily[DAILY[rg]] : null;
  const R = market.regions[rg] || {};
  const m = idx.monthly?.[rg];
  const year = R.annualPct ?? m?.allYear; // always the monthly index, so it matches tables, ticker and suburb pages
  if (d) return { kind: 'daily', dailyName: DAILY_NAMES[rg], date: d.date, day: d.day, week: d.week, month: d.month, quarter: d.quarter, ytd: d.ytd, year, dailyYear: d.year, monthEnd: idx.monthEnd, series: d.series };
  return { kind: 'monthly', date: idx.monthEnd, day: null, week: null, month: m?.allMonth ?? R.monthPct, quarter: R.quarterPct, ytd: null, year, monthEnd: idx.monthEnd, series: null };
}

/** Factor to roll an end-of-August estimate to today using the daily index. */
export function liveFactor(rg, idx, anchor = '2026-08-31') {
  const d = DAILY[rg] ? idx.daily[DAILY[rg]] : null;
  if (!d?.series?.length) return 1;
  let base = null;
  for (const [dt, v] of d.series) if (dt <= anchor) base = v;
  return base ? d.value / base : 1;
}


/**
 * One 12-month figure per suburb, labelled with its period. The base is always the region's monthly index
 * (the same figure as the ticker, market tables and suburb pages); suburb-level figures add their measured gap
 * to the region from official sales.
 */
export function applyLiveGrowth(s, idx, market) {
  if (s.g1 === null || s.g1 === undefined || s._g1live) return s;
  s._g1live = true;
  const src = String(s.g1s || '');
  const end = (idx?.monthEnd || market?.indexMonth || '').replace(/^\d+ /, '');
  const rn = market?.regions?.[s.rg]?.name || 'regional';
  s.g1p = src.startsWith('region') ? `${rn} monthly index, 12 months to ${end}` : `12 months to ${end}: ${rn} monthly index plus this ${src.includes('postcode') ? 'postcode' : 'suburb'}'s measured gap from official sales`;
  return s;
}
