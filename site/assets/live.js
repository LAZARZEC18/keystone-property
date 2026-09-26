// Shared helpers for live index-based moves.
export const DAILY = { SYD: 'SYD', MEL: 'MEL', BNE: 'BNEGC', ADL: 'ADL', PER: 'PER' };

/** Index change for a Keystone region: daily feed for 5 capitals, monthly for the other 3, Cotality monthly for regions. */
export function regionMoves(rg, idx, market) {
  const d = DAILY[rg] ? idx.daily[DAILY[rg]] : null;
  const R = market.regions[rg] || {};
  if (d) return { kind: 'daily', date: d.date, day: d.day, week: d.week, month: d.month, quarter: d.quarter, ytd: d.ytd, year: d.year, series: d.series };
  const m = idx.monthly[rg];
  return { kind: 'monthly', date: idx.monthEnd, day: null, week: null, month: m?.allMonth ?? R.monthPct, quarter: R.quarterPct, ytd: null, year: m?.allYear ?? R.annualPct, series: null };
}

/** Factor to roll an end-of-August estimate to today using the daily index. */
export function liveFactor(rg, idx, anchor = '2026-08-31') {
  const d = DAILY[rg] ? idx.daily[DAILY[rg]] : null;
  if (!d?.series?.length) return 1;
  let base = null;
  for (const [dt, v] of d.series) if (dt <= anchor) base = v;
  return base ? d.value / base : 1;
}
