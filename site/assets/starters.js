// Starting points for empty pages (compare, watchlist): a few ready-made sets and today's top-scoring suburbs.
import { cleanName, load, slug, suburbUrl } from './data.js';
import { esc, aud, scoreBadge } from './ui.js';

export const SETS = [
  ['Perth, middle ring', [['Morley', 'WA'], ['Bayswater (WA)', 'WA'], ['Nollamara', 'WA'], ['Midland', 'WA']]],
  ['Melbourne, west', [['Footscray', 'VIC'], ['Sunshine', 'VIC'], ['Werribee', 'VIC'], ['Tarneit', 'VIC']]],
  ['Brisbane, north', [['Chermside', 'QLD'], ['Aspley', 'QLD'], ['Strathpine', 'QLD'], ['North Lakes', 'QLD']]],
  ['Adelaide, north-east', [['Modbury', 'SA'], ['Paradise (SA)', 'SA'], ['Tea Tree Gully', 'SA'], ['Golden Grove', 'SA']]],
  ['Sydney, south-west', [['Liverpool', 'NSW'], ['Campbelltown (NSW)', 'NSW'], ['Casula', 'NSW'], ['Ingleburn', 'NSW']]],
];

/** Resolve a set's names to suburb ids using the loaded index. */
export function resolveSet(list, names) {
  return names.map(([n, st]) => list.find((s) => s.s === st && (s.n === n || cleanName(s.n) === cleanName(n)))).filter(Boolean);
}

/** HTML for "start here" suggestions: ready-made compare sets and the top first-home suburbs. */
export async function startersHtml(list, { variant = 'compare' } = {}) {
  const hd = await load('home').catch(() => null);
  const sets = SETS.map(([t, names]) => [t, resolveSet(list, names)]).filter(([, r]) => r.length >= 2);
  // the watchlist suggests a different list from the compare page, so the two empty pages don't repeat each other
  const key = variant === 'watch' ? 'cashflow' : 'under700';
  const top = hd ? (hd.lists[key] || hd.lists.under700).slice(0, 6).map((r) => { const o = Object.fromEntries(hd.cols.map((c, i) => [c, r[i]])); o.slug = slug(o); return o; }) : [];
  return `<div class="grid g2" style="margin-top:12px">
    <div class="card"><h3>Compare a ready-made set</h3><p class="note">Neighbouring suburbs people often weigh up against each other.</p>
      <div class="row">${sets.map(([t, r]) => `<a class="pill" href="/compare?ids=${r.map((s) => s.id).join(',')}" data-link>${esc(t)}</a>`).join('')}</div></div>
    ${top.length ? `<div class="card"><h3>${variant === 'watch' ? 'Highest-scoring suburbs for cash flow' : 'Highest-scoring suburbs under $700k'}</h3><div class="kv">${top.map((s) => `<span><a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))}</a> <span class="muted">${s.s}</span></span><span>${aud(s.pt === 'u' ? s.u : s.h, { compact: true })} ${scoreBadge(s.v)}</span>`).join('')}</div><p class="fine" style="margin-top:8px">Open one and press ☆ Watch to add it here. <a href="/map" data-link>See the map →</a></p></div>` : ''}
  </div>`;
}
