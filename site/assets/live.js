// Market movement helpers. Market Lenz shows Cotality's public month-end results only (their daily index is
// proprietary and is not republished). Every price is "as at" the month-end; every change leads with the
// 3-month figure, because in a turning market the 12-month figure describes the past, not the direction.

/** Month-end moves for a region, from market.json. The first argument is unused (kept for call compatibility). */
export function regionMoves(rg, _idx, market) {
  const R = market?.regions?.[rg] || {};
  return { kind: 'monthly', date: market?.indexMonth, monthEnd: market?.indexMonth, day: null, week: null, month: R.monthPct ?? null, quarter: R.quarterPct ?? null, ytd: null, year: R.annualPct ?? null, series: null };
}

/** Prices are no longer rolled forward with a daily index: always 1. */
export function liveFactor() {
  return 1;
}

/** "Falling", "Rising" or "Flat" from a 3-month change. */
export function trendWord(q) {
  if (q === null || q === undefined) return '';
  return q <= -0.5 ? 'Falling' : q >= 0.5 ? 'Rising' : 'Flat';
}

/**
 * Label a suburb's 12-month figure with its period and attach its area's 3-month change (s.g3) and trend.
 * The 12-month base is the region's month-end index; suburb-level figures add their measured gap from official sales.
 */
export function applyLiveGrowth(s, _idx, market) {
  if (s._g1live) return s;
  s._g1live = true;
  const R = market?.regions?.[s.rg];
  const end = String(market?.indexMonth || '').replace(/^\d+ /, '');
  const rn = R?.name || 'regional';
  s.g3 = R?.quarterPct ?? null;
  s.g3p = `${rn}, 3 months to ${end}`;
  s.trend = trendWord(s.g3);
  if (s.g1 === null || s.g1 === undefined) return s;
  const src = String(s.g1s || '');
  s.g1p = src.startsWith('region') ? `${rn}-wide figure (no suburb sales data), 12 months to ${end}` : `12 months to ${end}: ${rn} index plus this ${src.includes('postcode') ? 'postcode' : 'suburb'}'s measured gap from official sales`;
  return s;
}
