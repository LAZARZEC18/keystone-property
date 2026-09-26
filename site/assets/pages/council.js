import { esc, aud, pct, num, setMeta } from '../ui.js';
import { suburbs, load } from '../data.js';
import { suburbScore } from '../engine.js';
import { STATES } from '../rules.js';
import { suburbTable, summary } from './postcode.js';

export default async function councilPage(main, params) {
  const [{ list }, market] = await Promise.all([suburbs(), load('market')]);
  const st = params.state.toUpperCase();
  const slugOf = (l) => (l || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const rows = list.filter((s) => s.s === st && slugOf(s.lga) === params.lga).sort((a, b) => suburbScore(b.sc) - suburbScore(a.sc));
  if (!rows.length) {
    main.innerHTML = '<div class="empty"><h1>Council not found</h1></div>';
    return;
  }
  const name = rows[0].lga;
  setMeta({ title: `${name} council area (${st}): suburbs ranked for property investors`, description: `All suburbs in ${name}, ${STATES[st]}, ranked by Keystone investor score with prices, rents and yields.` });
  const sm = summary(rows);
  const R = market.regions[rows[0].rg];
  main.innerHTML = `
  <div class="crumbs"><a href="/suburbs?state=${st}" data-link>${STATES[st]}</a> › ${esc(name)}</div>
  <div class="page-head"><div class="eyebrow">Local government area</div><h1>${esc(name)}</h1><p>${rows.length} suburbs · ${num(sm.pop)} residents · ${esc(R?.name || '')}. Ranked by Keystone Score (balanced strategy).</p></div>
  <div class="grid g4"><div class="card"><div class="stat"><span class="k">Typical house</span><span class="v">${aud(sm.h, { compact: true })}</span></div></div><div class="card"><div class="stat"><span class="k">Typical unit</span><span class="v">${aud(sm.u, { compact: true })}</span></div></div><div class="card"><div class="stat"><span class="k">Gross yield</span><span class="v">${pct(sm.y, 2)}</span></div></div><div class="card"><div class="stat"><span class="k">12-month change</span><span class="v ${sm.g1 >= 0 ? 'up' : 'down'}">${pct(sm.g1, 1, true)}</span></div></div></div>
  <div class="row section" style="margin-top:16px"><a class="btn" href="/suburbs?state=${st}&q=${encodeURIComponent(name)}" data-link>Open in the explorer (map, filters)</a></div>
  <section class="section">${suburbTable(rows)}</section>`;
}
