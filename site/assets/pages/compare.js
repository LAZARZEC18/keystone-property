import { esc, aud, pct, num, scoreBadge, bar, setMeta, srcBadge } from '../ui.js';
import { suburbs, suburbDetail, suburbUrl, cleanName, load, watchlist } from '../data.js';
import { suburbScore, PROFILES, stampDuty } from '../engine.js';
import { COMPONENT_NAMES } from '../insights.js';
import { attachSearch, navigate } from '../app.js';
import { startersHtml } from '../starters.js';

export default async function comparePage(main, _p, query) {
  setMeta({ title: 'Compare suburbs side by side', description: 'Compare up to four Australian suburbs on price, rent, yield, growth, demographics and investor score.' });
  const [idx, market] = await Promise.all([suburbs(), load('market')]);
  const ids = (query.ids || '').split(',').filter(Boolean).slice(0, 4);
  const picks = ids.map((id) => idx.byId.get(id)).filter(Boolean);
  const details = await Promise.all(picks.map((s) => suburbDetail(s)));
  const go = (list) => navigate(`/compare?ids=${list.map((s) => s.id).join(',')}`, true);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Compare</div><h1>Compare suburbs</h1><p>Put up to four suburbs side by side. Add them here, or tick them in the <a href="/suburbs" data-link>explorer</a>.</p></div>
  <div class="card flat tint"><label class="field" style="position:relative;max-width:420px">Add a suburb<input id="c-add" type="search" placeholder="Suburb or postcode" ${picks.length >= 4 ? 'disabled' : ''}><div class="ac" id="c-ac" hidden style="top:62px;left:0;right:auto"></div></label></div>
  <div id="c-out" class="section"></div>`;
  attachSearch(main.querySelector('#c-add'), main.querySelector('#c-ac'), (s) => {
    if (!picks.find((x) => x.id === s.id)) go([...picks, s].slice(0, 4));
  });
  if (!picks.length) {
    const wl = watchlist().map((id) => idx.byId.get(id)).filter(Boolean).slice(0, 4);
    main.querySelector('#c-out').innerHTML = `<div class="card flat tint"><b>Add a suburb above to start comparing.</b>${wl.length >= 2 ? ` Or <a href="/compare?ids=${wl.map((s) => s.id).join(',')}" data-link>compare your watchlist</a>.` : ''}</div>${await startersHtml(idx.list)}`;
    return;
  }
  const best = (vals, higher = true) => {
    const nums = vals.filter((v) => v !== null && v !== undefined);
    if (nums.length < 2) return -1;
    const t = higher ? Math.max(...nums) : Math.min(...nums);
    return vals.indexOf(t);
  };
  const row = (label, vals, fmt, higher = true, noBest = false) => {
    const b = noBest ? -1 : best(vals, higher);
    return `<tr><td class="muted">${label}</td>${vals.map((v, i) => `<td class="n ${i === b ? 'up' : ''}">${i === b ? '<b>' : ''}${fmt(v)}${i === b ? '</b>' : ''}</td>`).join('')}</tr>`;
  };
  const P = (k) => picks.map((s) => s[k]);
  const D = (k) => details.map((d) => d[k]);
  const yH = picks.map((s) => (s.rh && s.h ? (s.rh * 52 * 100) / s.h : null));
  const yU = picks.map((s) => (s.ru && s.u ? (s.ru * 52 * 100) / s.u : null));
  main.querySelector('#c-out').innerHTML = `
  <div class="tbl-wrap"><table>
    <thead><tr><th></th>${picks.map((s, i) => `<th class="n" style="text-transform:none;font-size:14px;color:var(--ink)"><a href="${suburbUrl(s)}" data-link>${esc(cleanName(s.n))}</a> <span class="muted">${s.s} ${s.pc}</span><br><button class="btn sm ghost" data-rm="${i}">Remove</button></th>`).join('')}</tr></thead>
    <tbody>
      <tr><td class="muted">Keyzing Score</td>${picks.map((s) => `<td class="n">${scoreBadge(suburbScore(s.sc))}</td>`).join('')}</tr>
      ${Object.keys(PROFILES).filter((p) => p !== 'balanced').map((p) => row(`Score · ${p === 'firsthome' ? 'first home' : p}`, picks.map((s) => suburbScore(s.sc, PROFILES[p])), (v) => v ?? '—')).join('')}
      ${Object.keys(COMPONENT_NAMES).map((k) => `<tr><td class="muted">${COMPONENT_NAMES[k]}</td>${picks.map((s) => `<td class="n" style="min-width:140px">${bar(s.sc[k])} <span class="mono">${s.sc[k] ?? '—'}</span></td>`).join('')}</tr>`).join('')}
      <tr><td class="muted">Market</td>${picks.map((s) => `<td class="n">${esc(market.regions[s.rg]?.name || '')}</td>`).join('')}</tr>
      <tr><td class="muted">Council</td>${picks.map((s) => `<td class="n">${esc(s.lga || '')}</td>`).join('')}</tr>
      ${row('Typical house', P('h'), (v) => aud(v, { compact: true }), false)}
      <tr><td class="muted">House data</td>${picks.map((s) => `<td class="n">${srcBadge(s.hs)}</td>`).join('')}</tr>
      ${row('Typical unit', P('u'), (v) => aud(v, { compact: true }), false)}
      ${row('House rent / wk', P('rh'), aud)}
      ${row('Unit rent / wk', P('ru'), aud)}
      ${row('House yield', yH, (v) => pct(v, 2))}
      ${row('Unit yield', yU, (v) => pct(v, 2))}
      ${row('12-month change', P('g1'), (v) => pct(v, 1, true))}
      ${row('10-yr house growth p.a. (VIC)', D('cagr'), (v) => pct(v, 1, true))}
      ${row('Stamp duty on typical house (investor)', picks.map((s) => (s.h ? stampDuty(s.s, s.h).duty : null)), aud, false)}
      ${row('Price ÷ household income', P('pti'), (v) => (v ? `${v}×` : '—'), false)}
      ${row('Population', P('pop'), num, true, true)}
      ${row('Population growth 2020-25 (ABS estimates)', P('pg5'), (v) => pct(v, 1, true))}
      ${row('Household income / wk', D('inc'), aud)}
      ${row('Income growth 2016-21', D('ig5'), (v) => pct(v, 1, true))}
      ${row('Unemployment', D('une'), (v) => pct(v, 1), false)}
      ${row('Renters', D('rent%'), (v) => pct(v, 0), true, true)}
      ${row('Social housing', D('soc%'), (v) => pct(v, 0), false)}
      ${row('Median age', D('age'), (v) => v ?? '—', true, true)}
      ${row('Market vacancy', picks.map((s) => market.regions[s.rg]?.vacancy ?? null), (v) => pct(v, 1), false)}
    </tbody></table></div>
    <p class="fine" style="margin-top:8px">Bold green marks the best value in each row for an investor.</p>`;
  main.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => go(picks.filter((_, i) => i !== +b.dataset.rm))));
}
