import { setMeta, esc, aud, pct, cashWeek, date } from '../ui.js';
import { suburbs, watchlist, savedDeals, removeDeal } from '../data.js';
import { suburbScore } from '../engine.js';
import { suburbTable } from './postcode.js';
import { startersHtml } from '../starters.js';

export default async function watchlistPage(main) {
  setMeta({ title: 'Your watchlist and saved deals' });
  const { byId, list } = await suburbs();
  const rows = watchlist().map((id) => byId.get(id)).filter(Boolean).sort((a, b) => suburbScore(b.sc) - suburbScore(a.sc));
  const draw = async () => {
    const deals = savedDeals();
    main.innerHTML = `<div class="page-head"><div class="eyebrow">Watchlist</div><h1>Your watchlist</h1><p>Suburbs you've starred and deals you've saved. They're kept in this browser only, so they won't appear on another device.</p></div>
    ${rows.length ? `<div class="row" style="margin-bottom:12px"><a class="btn" href="/compare?ids=${rows.slice(0, 4).map((s) => s.id).join(',')}" data-link>Compare the top ${Math.min(4, rows.length)}</a></div>${suburbTable(rows)}` : `<div class="card flat tint"><b>No suburbs yet.</b> Open any suburb and press ☆ Watch, or start from one of these.</div>${await startersHtml(list)}`}
    <section class="section" id="deals"><h2>Saved deals</h2>
    ${deals.length ? `<div class="tbl-wrap"><table><thead><tr><th>Property</th><th class="n">Price</th><th class="n">Rent</th><th>Relative rank</th><th class="n">Each week after tax</th><th class="n">10-yr return</th><th>Saved</th><th></th></tr></thead><tbody>${deals.map((d) => `<tr><td><a href="${esc(d.url)}" data-link>${esc(d.name)}</a></td><td class="n">${aud(d.price, { compact: true })}</td><td class="n">${aud(d.rent)}/wk</td><td><span class="rank rank-${esc(d.grade)}">${esc(d.rank || { A: 'Top 15%', B: 'Upper 40%', C: 'Middle 30%', D: 'Bottom 30%' }[d.grade] || '—')}</span></td><td class="n">${cashWeek(d.weekly, { short: true })}</td><td class="n">${pct(d.irr, 1)}</td><td>${date(d.saved)}</td><td><button class="btn sm ghost" data-rm="${esc(d.url)}">Remove</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="note">No saved deals yet. Run the numbers in the <a href="/analyse" data-link>deal analyser</a> and press <b>Save this deal</b>.</p>'}
    </section>`;
  };
  await draw();
  main.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-rm]');
    if (!b) return;
    removeDeal(b.dataset.rm);
    await draw();
  });
}
