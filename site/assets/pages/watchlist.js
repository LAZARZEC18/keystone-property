import { setMeta } from '../ui.js';
import { suburbs, watchlist } from '../data.js';
import { suburbScore } from '../engine.js';
import { suburbTable } from './postcode.js';

export default async function watchlistPage(main) {
  setMeta({ title: 'Your watchlist' });
  const { byId } = await suburbs();
  const rows = watchlist().map((id) => byId.get(id)).filter(Boolean).sort((a, b) => suburbScore(b.sc) - suburbScore(a.sc));
  main.innerHTML = `<div class="page-head"><div class="eyebrow">Watchlist</div><h1>Your watchlist</h1><p>Suburbs you've starred. They're saved in this browser only.</p></div>
  ${rows.length ? `<div class="row" style="margin-bottom:12px"><a class="btn" href="/compare?ids=${rows.slice(0, 4).map((s) => s.id).join(',')}" data-link>Compare the top ${Math.min(4, rows.length)}</a></div>${suburbTable(rows)}` : '<p class="empty">Nothing here yet. Open any suburb and press ☆ Watch.</p>'}`;
}
