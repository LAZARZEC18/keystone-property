import { esc, aud, pct, num, scoreBadge, setMeta, srcBadge, growth12 } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, lgaSlug } from '../data.js';
import { suburbScore } from '../engine.js';
import { STATES } from '../rules.js';

/** Shared table of suburbs used by the postcode and council pages. */
export function suburbTable(rows) {
  return `<div class="tbl-wrap"><table><thead><tr><th>Suburb</th><th class="n">Score</th><th class="n">House</th><th class="n">Unit</th><th class="n">House rent</th><th class="n">Yield</th><th class="n">12m</th><th class="n">Population</th><th>Data</th></tr></thead><tbody>
  ${rows
    .map(
      (s) => `<tr><td><a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))}</a> <span class="muted">${s.pc || ''}</span></td><td class="n">${scoreBadge(suburbScore(s.sc))}</td><td class="n">${aud(s.h, { compact: true })}</td><td class="n">${aud(s.u, { compact: true })}</td><td class="n">${aud(s.rh)}</td><td class="n">${pct(s.y, 2)}</td><td class="n ${s.g1 >= 0 ? 'up' : 'down'}">${growth12(s, { suffix: '', short: true })}</td><td class="n">${num(s.pop)}</td><td>${srcBadge(s.hs)}</td></tr>`,
    )
    .join('')}</tbody></table></div>`;
}

export function summary(rows) {
  const pop = rows.reduce((a, s) => a + s.pop, 0);
  const w = (k) => {
    const v = rows.filter((s) => s[k]);
    const tp = v.reduce((a, s) => a + s.pop, 0);
    return tp ? v.reduce((a, s) => a + s[k] * s.pop, 0) / tp : null;
  };
  return { pop, h: w('h'), u: w('u'), rh: w('rh'), y: w('y'), g1: w('g1') };
}

export default async function postcodePage(main, params) {
  const pc = params.pc.padStart(4, '0');
  const [{ byPc }, market] = await Promise.all([suburbs(), load('market')]);
  const rows = (byPc.get(pc) || []).sort((a, b) => b.pop - a.pop);
  setMeta({ title: `Postcode ${pc} property: suburbs, prices, rents and yields`, description: `Every suburb in postcode ${pc} with typical prices, rents, yields and investor scores.` });
  if (!rows.length) {
    main.innerHTML = `<div class="empty"><h1>Postcode ${esc(pc)}</h1><p>No residential suburbs with 50+ residents found in this postcode.</p></div>`;
    return;
  }
  const s0 = rows[0];
  const sm = summary(rows);
  const R = market.regions[s0.rg];
  main.innerHTML = `
  <div class="crumbs"><a href="/suburbs?state=${s0.s}" data-link>${STATES[s0.s]}</a> › Postcode ${pc}</div>
  <div class="page-head"><h1>Postcode ${pc}</h1><p>${rows.length} suburb${rows.length > 1 ? 's' : ''} in ${esc(R?.name || s0.s)} · ${num(sm.pop)} residents · council${new Set(rows.map((r) => r.lga)).size > 1 ? 's' : ''}: ${[...new Set(rows.map((r) => r.lga))].map((l) => `<a href="/council/${s0.s.toLowerCase()}/${lgaSlug(l)}" data-link>${esc(l)}</a>`).join(', ')}</p></div>
  <div class="grid g4"><div class="card"><div class="stat"><span class="k">Typical house (population-weighted)</span><span class="v">${aud(sm.h, { compact: true })}</span></div></div><div class="card"><div class="stat"><span class="k">Typical unit</span><span class="v">${aud(sm.u, { compact: true })}</span></div></div><div class="card"><div class="stat"><span class="k">House rent</span><span class="v">${aud(sm.rh)}</span></div></div><div class="card"><div class="stat"><span class="k">Gross yield</span><span class="v">${pct(sm.y, 2)}</span></div></div></div>
  <section class="section">${suburbTable(rows)}</section>`;
}
