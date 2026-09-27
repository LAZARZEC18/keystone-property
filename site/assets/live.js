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

const shortDate = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
const NAMES = { SYD: 'Sydney', MEL: 'Melbourne', BNE: 'Brisbane', ADL: 'Adelaide', PER: 'Perth' };

/**
 * One 12-month figure per suburb, labelled with its period. Where the region has a daily index, the region base
 * is today's daily year-on-year change (so suburb, city and /live pages all agree); otherwise the monthly index.
 * Suburb-level figures keep their measured gap to the region on top of that base.
 */
export function applyLiveGrowth(s, idx, market) {
  if (s.g1 === null || s.g1 === undefined || s._g1live) return s;
  s._g1live = true;
  const src = String(s.g1s || '');
  const d = DAILY[s.rg] ? idx?.daily?.[DAILY[s.rg]] : null;
  const R = market?.regions?.[s.rg];
  if (d && d.year !== null && d.year !== undefined && R) {
    s.g1 = Math.round((s.g1 - R.annualPct + d.year) * 10) / 10;
    s.g1p = src.startsWith('region') ? `${NAMES[s.rg]} daily index, year to ${shortDate(d.date)}` : `year to ${shortDate(d.date)}: ${NAMES[s.rg]} daily index plus this ${src.includes('postcode') ? 'postcode' : 'suburb'}'s measured gap from official sales`;
  } else {
    const end = (idx?.monthEnd || market?.indexMonth || '').replace(/^\d+ /, '');
    s.g1p = src.startsWith('region') ? `regional monthly index, 12 months to ${end}` : `12 months to ${end}: regional index plus this ${src.includes('postcode') ? 'postcode' : 'suburb'}'s measured gap from official sales`;
  }
  return s;
}
