import { esc, aud, pct, scoreBadge, setMeta, growth12, confBadge } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, MIN_POP, fairOrder } from '../data.js';
import { suburbScore, PROFILES, PROFILE_FILTERS, valueEstimate } from '../engine.js';
import { liveFactor } from '../live.js';
import { baseTiles } from '../map.js';
import { listingLinks } from '../insights.js';
import { liveListings } from './listings.js';
import { reaSearch } from './find.js';

const STRATS = { balanced: 'Balanced', growth: 'Capital growth', cashflow: 'Cash flow', firsthome: 'First home', newbuild: 'New builds' };
const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

export default async function topMap(main, _p, query) {
  setMeta({ title: 'Highest-scoring suburbs in Australia: map', description: 'A live map of the highest-rated suburbs in Australia for growth, cash flow and first home buyers, with typical prices, yields and graded listings.' });
  const [{ list }, market, index] = await Promise.all([suburbs(), load('market'), Promise.resolve(null)]);
  const st = {
    strategy: STRATS[query.strategy] ? query.strategy : 'balanced',
    area: query.area || 'AU',
    type: ['h', 'u'].includes(query.type) ? query.type : '',
    max: +query.max || '',
    pop: +query.pop || MIN_POP,
    n: [50, 100, 250].includes(+query.n) ? +query.n : 100,
  };
  const regionOpts = Object.entries(market.regions).map(([c, r]) => `<option value="${c}">${esc(r.name)}</option>`).join('');

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Suburb scores map</div><h1>Highest-scoring suburbs, on one map</h1>
  <p>Every suburb and locality with Census data is scored on yield, growth drivers, rental demand, affordability and stability. This map shows the highest-rated for your strategy and budget, ranked within each state (states publish different amounts of sales data, so raw scores aren't comparable across them), priced for the kind of home you want as at the latest month-end. Select any suburb for its numbers and current listings. A suburb score ranks the area, not a particular purchase: the <a href="/property" data-link>price range tool</a> and <a href="/analyse" data-link>tax-change calculator</a> test the numbers of buying a specific home, which at today's rates often cost their owner money each week even in high-scoring suburbs. The <b>New builds</b> strategy only includes council areas approving at least one new home a year per 100 existing, since new builds keep negative gearing and the CGT discount under the 2026 rules.</p></div>
  <form class="card flat tint" id="mf" data-nosubmit>
    <div class="fields" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">
      <label class="field">Strategy<select name="strategy">${Object.entries(STRATS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
      <label class="field">Area<select name="area"><option value="AU">All of Australia</option><optgroup label="States">${STATES.map((x) => `<option value="${x}">${x}</option>`).join('')}</optgroup><optgroup label="Markets">${regionOpts}</optgroup></select></label>
      <label class="field">Property<select name="type"><option value="">Most common type</option><option value="h">Houses</option><option value="u">Units</option></select></label>
      <label class="field">Max typical price<input name="max" type="number" step="1" placeholder="Any" value="${st.max}"></label>
      <label class="field">Min population<select name="pop"><option value="500">500+</option><option value="2000">2,000+</option><option value="3000">3,000+</option><option value="5000">5,000+</option><option value="10000">10,000+</option></select></label>
      <label class="field">Show<select name="n"><option value="50">Top 50</option><option value="100">Top 100</option><option value="250">Top 250</option></select></label>
    </div>
  </form>
  <div class="split-map section" style="margin-top:16px">
    <div class="card" style="padding:6px 0 0"><div class="spread" style="padding:8px 16px 6px"><b id="mcount"></b><a class="fine" id="mcsv" href="#">Download CSV</a></div><div id="mlist" style="max-height:640px;overflow:auto;border-top:1px solid var(--line)"></div></div>
    <div><div class="card" style="padding:10px"><div id="bmap" class="map tall"></div>
      <div class="map-legend"><span><i style="background:var(--sc-a)"></i>65+ top 1%</span><span><i style="background:var(--sc-b)"></i>55–64 top 10%</span><span><i style="background:var(--sc-c)"></i>45–54 above median</span><span><i style="background:var(--sc-d)"></i>under 45</span><span>Larger dot = higher rank</span></div><p class="fine" style="margin-top:6px">Badges show how much of each ranking rests on official sales: <b>Measured</b>, <b>Partly measured</b> or <b>Modelled</b>. Outside NSW, Victoria and SA, most suburbs share their city's growth figure, so rankings there lean on yield, affordability, population trend and stability.</p></div></div>
  </div>
  <section class="section card" id="msel" hidden></section>`;

  const form = main.querySelector('#mf');
  for (const k of ['strategy', 'area', 'type', 'pop', 'n']) form[k].value = String(st[k]);
  let map = null;
  let layer = null;
  let rows = [];
  const markers = new Map();

  const compute = () => {
    const f = Object.fromEntries(new FormData(form));
    Object.assign(st, { strategy: f.strategy, area: f.area, type: f.type, max: +f.max || '', pop: +f.pop, n: +f.n });
    const q = new URLSearchParams(Object.entries(st).filter(([k, v]) => v !== '' && !(k === 'area' && v === 'AU') && !(k === 'strategy' && v === 'balanced') && !(k === 'pop' && v === MIN_POP) && !(k === 'n' && v === 100)));
    history.replaceState(null, '', `/map${q.toString() ? `?${q}` : ''}`);
    const inArea = (s) => st.area === 'AU' || s.s === st.area || s.rg === st.area;
    const out = [];
    for (const s of list) {
      if (s.pop < st.pop || !inArea(s) || !s.lat) continue;
      if (PROFILE_FILTERS[st.strategy] && !PROFILE_FILTERS[st.strategy](s)) continue;
      const t = st.type || s.pt;
      const e = valueEstimate(s, { type: t, liveFactor: liveFactor(s.rg, index) });
      if (!e) continue;
      if (st.max && e.value > st.max) continue;
      out.push({ s, t, e, v: suburbScore(s.sc, PROFILES[st.strategy]) });
    }
    out.sort((a, b) => b.v - a.v);
    if (st.area === 'AU') fairOrder(out, (r) => r.v);
    rows = out.slice(0, st.n);
    main.querySelector('#mcount').textContent = `Top ${rows.length} of ${out.length.toLocaleString()} matching suburbs · ${STRATS[st.strategy]}${st.area === 'AU' ? ' · ranked within each state' : ''}`;
    main.querySelector('#mlist').innerHTML = rows.length
      ? rows
          .map(
            (r, i) => `<button class="mrow" data-i="${i}"><span class="faint mono">${i + 1}</span><span style="min-width:0"><b>${esc(cleanName(r.s.n))}</b> <span class="muted">${r.s.s} ${r.s.pc || ''}</span>${st.area === 'AU' ? ` <span class="fine">#${r.stateRank} in ${r.s.s}</span>` : ''}${confBadge(r.s)}<span class="note" style="display:block">${r.t === 'u' ? 'Unit' : 'House'} ~${aud(r.e.value, { compact: true })} · ${pct(r.e.yield, 1)} yield · ${growth12(r.s)}</span></span>${scoreBadge(r.v)}</button>`,
          )
          .join('')
      : '<p class="note" style="padding:16px">No suburbs match. Raise the budget or widen the area.</p>';
    drawMarkers();
  };

  const col = (v) => getComputedStyle(document.documentElement).getPropertyValue(v >= 65 ? '--sc-a' : v >= 55 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
  const drawMarkers = () => {
    if (!map) return;
    if (layer) layer.remove();
    markers.clear();
    layer = L.layerGroup().addTo(map);
    [...rows].reverse().forEach((r) => {
      const i = rows.indexOf(r);
      const m = L.circleMarker([r.s.lat, r.s.lng], { radius: i < 10 ? 10 : i < 50 ? 7 : 5, weight: 1, color: '#0009', fillColor: col(r.v), fillOpacity: 0.92 })
        .addTo(layer)
        .bindPopup(`<b>${i + 1}. ${esc(cleanName(r.s.n))} ${r.s.s}</b><br>Score ${r.v} · ${r.t === 'u' ? 'unit' : 'house'} ~${aud(r.e.value, { compact: true })}<br>Rent ~${aud(r.e.rent)}/wk · yield ${pct(r.e.yield, 1)}<br><a href="${suburbUrl(r.s)}" data-link>Suburb report</a> · <a href="#" data-sel="${i}">Live listings</a>`);
      m.on('click', () => highlight(i, false));
      markers.set(i, m);
    });
    if (rows.length) map.fitBounds(L.latLngBounds(rows.map((r) => [r.s.lat, r.s.lng])).pad(0.08), { maxZoom: 11 });
  };

  const highlight = (i, fly = true) => {
    main.querySelectorAll('.mrow').forEach((b) => b.classList.toggle('on', +b.dataset.i === i));
    const m = markers.get(i);
    if (fly && m && map) {
      map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 12), { duration: 0.6 });
      m.openPopup();
    }
    main.querySelector(`.mrow[data-i="${i}"]`)?.scrollIntoView({ block: 'nearest' });
    select(i);
  };

  const select = (i) => {
    const r = rows[i];
    if (!r) return;
    const box = main.querySelector('#msel');
    box.hidden = false;
    const links = listingLinks(r.s);
    const R = market.regions[r.s.rg];
    box.innerHTML = `<div class="card-head"><h3>${esc(cleanName(r.s.n))} ${r.s.s} ${r.s.pc || ''} ${scoreBadge(r.v)}</h3><a href="${suburbUrl(r.s)}" data-link>Full suburb report →</a></div>
      <div class="stats">
        <div class="stat"><span class="k">Typical ${r.t === 'u' ? 'unit' : 'house'}</span><span class="v">${aud(r.e.value, { compact: true })}</span><span class="s">${r.e.beds}-bed · ${aud(r.e.low, { compact: true })}–${aud(r.e.high, { compact: true })}</span></div>
        <div class="stat"><span class="k">Rent</span><span class="v">${aud(r.e.rent)}</span><span class="s">per week, estimated</span></div>
        <div class="stat"><span class="k">Gross yield</span><span class="v">${pct(r.e.yield, 2)}</span><span class="s">${esc(R?.name || '')} ${pct(R?.yield, 1)}</span></div>
        <div class="stat"><span class="k">12-month change</span><span class="v">${growth12(r.s, { suffix: '', short: true })}</span><span class="s">5-yr ${pct(r.s.pg5, 1, true)} pop. growth</span></div>
        <div class="stat"><span class="k">Distance to CBD</span><span class="v">${r.s.cbd != null ? `${Math.round(r.s.cbd)} km` : '—'}</span><span class="s">${r.s.ocn != null ? `${r.s.ocn.toFixed(1)} km to the ocean` : ''}</span></div>
      </div>
      <div class="row" style="margin-top:14px"><a class="btn primary" href="/analyse?suburb=${r.s.id}&price=${r.e.value}&rent=${r.e.rent}&type=${r.t}" data-link>Analyse a typical purchase</a><a class="btn" href="${reaSearch(r.s, r.t)}" target="_blank" rel="noopener">realestate.com.au ↗</a><a class="btn ghost" href="${links.domainBuy}" target="_blank" rel="noopener">Domain ↗</a></div>
      <h3 style="margin-top:20px">For sale now</h3><div id="mselmap" class="map short" hidden style="margin-bottom:14px"></div><div id="msellist"></div>`;
    liveListings(box.querySelector('#msellist'), r.s, { compact: true, filters: r.t === 'u' ? { types: 'ApartmentUnitFlat,Townhouse' } : { types: 'House' }, mapEl: box.querySelector('#mselmap') });
  };

  main.querySelector('#mlist').addEventListener('click', (e) => {
    const b = e.target.closest('.mrow');
    if (b) highlight(+b.dataset.i);
  });
  main.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-sel]');
    if (!a) return;
    e.preventDefault();
    select(+a.dataset.sel);
    main.querySelector('#msel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  main.querySelector('#mcsv').addEventListener('click', (e) => {
    e.preventDefault();
    const head = ['rank', 'suburb', 'state', 'postcode', 'score', 'type', 'estimated_value', 'weekly_rent', 'gross_yield', 'change_12m'];
    const lines = rows.map((r, i) => [i + 1, `"${cleanName(r.s.n)}"`, r.s.s, r.s.pc, r.v, r.t === 'u' ? 'unit' : 'house', r.e.value, r.e.rent, r.e.yield?.toFixed(2), r.s.g1?.toFixed(1)].join(','));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], { type: 'text/csv' }));
    a.download = `ownaroo-top-suburbs-${st.strategy}.csv`;
    a.click();
  });
  form.addEventListener('change', compute);
  form.addEventListener('input', (e) => e.target.name === 'max' && (clearTimeout(compute.t), (compute.t = setTimeout(compute, 400))));

  const init = () => {
    if (!window.L) return setTimeout(init, 250);
    if (!document.getElementById('bmap')) return;
    map = L.map('bmap', { scrollWheelZoom: true });
    baseTiles().addTo(map);
    map.setView([-27, 134], 4);
    drawMarkers();
  };
  compute();
  init();
  return { destroy: () => map?.remove() };
}
