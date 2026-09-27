import { esc, aud, pct, num, scoreBadge, setMeta, sortable, srcBadge, growth12 } from '../ui.js';
import { baseTiles } from '../map.js';
import { suburbs, suburbUrl, cleanName, load } from '../data.js';
import { suburbScore, PROFILES } from '../engine.js';
import { navigate } from '../app.js';

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];
const PAGE = 50;

export default async function explorer(main, _p, query) {
  setMeta({ title: 'Suburb explorer: rank every Australian suburb', description: 'Filter and rank 11,000+ Australian suburbs by price, yield, growth, demand and the Keyzing investment score.' });
  const [{ list }, market] = await Promise.all([suburbs(), load('market')]);
  const st = {
    state: query.state || '',
    region: query.region || '',
    lga: query.lga || '',
    type: query.type || 'auto',
    max: query.max ? +query.max : '',
    min: query.min ? +query.min : '',
    yieldMin: query.yield ? +query.yield : '',
    popMin: query.pop ? +query.pop : 1000,
    profile: query.profile || 'balanced',
    officialOnly: query.official === '1',
    q: query.q || '',
    sort: query.sort || 'score',
    asc: false,
    page: 0,
    view: query.view || 'table',
  };
  const regions = Object.entries(market.regions);

  main.innerHTML = `
  <div class="page-head">
    <div class="eyebrow">Suburb explorer</div>
    <h1>Rank every suburb in Australia</h1>
    <p>Set your budget and strategy. Keyzing ranks all ${list.length.toLocaleString()} suburbs on yield, momentum, growth drivers, rental demand, affordability and stability, and explains every number on the suburb's page.</p>
  </div>
  <div class="card flat tint">
    <div class="fields">
      <label class="field">State<select id="f-state"><option value="">All of Australia</option>${STATES.map((s) => `<option ${st.state === s ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
      <label class="field">Market<select id="f-region"><option value="">All markets</option>${regions.map(([c, r]) => `<option value="${c}" ${st.region === c ? 'selected' : ''}>${r.name}</option>`).join('')}</select></label>
      <label class="field">Property type<select id="f-type"><option value="auto">Main type in suburb</option><option value="h" ${st.type === 'h' ? 'selected' : ''}>Houses</option><option value="u" ${st.type === 'u' ? 'selected' : ''}>Units</option></select></label>
      <label class="field">Max price<input id="f-max" type="number" step="1" placeholder="Any" value="${st.max}"></label>
      <label class="field">Min price<input id="f-min" type="number" step="1" placeholder="Any" value="${st.min}"></label>
      <label class="field">Min gross yield %<input id="f-yield" type="number" step="0.1" placeholder="Any" value="${st.yieldMin}"></label>
      <label class="field">Min population<input id="f-pop" type="number" step="1" value="${st.popMin}"></label>
      <label class="field">Strategy<select id="f-profile">
        <option value="balanced">Balanced</option><option value="growth">Capital growth</option><option value="cashflow">Cash flow / yield</option><option value="firsthome">First home / affordability</option>
      </select></label>
      <label class="field">Name, council or postcode<input id="f-q" type="search" placeholder="e.g. Stirling or 6062" value="${esc(st.q || st.lga)}"></label>
    </div>
    <div class="row" style="margin-top:12px;justify-content:space-between">
      <label class="check"><input type="checkbox" id="f-official" ${st.officialOnly ? 'checked' : ''}> Official sales data only (VIC, SA, NSW)</label>
      <div class="row">
        <div class="seg" id="view"><button data-v="table" class="${st.view === 'table' ? 'on' : ''}">Table</button><button data-v="map" class="${st.view === 'map' ? 'on' : ''}">Map</button></div>
        <button class="btn sm" id="csv">Download CSV</button>
      </div>
    </div>
  </div>
  <div class="spread" style="margin:16px 0 8px"><div id="count" class="muted"></div><div id="cmp" class="row"></div></div>
  <div id="out"></div>`;
  main.querySelector('#f-profile').value = st.profile;

  const $f = (id) => main.querySelector(id);
  const compareSet = new Set();
  let rows = [];

  function compute() {
    const w = PROFILES[st.profile];
    const q = st.q.trim().toLowerCase();
    rows = [];
    for (const s of list) {
      if (st.state && s.s !== st.state) continue;
      if (st.region && s.rg !== st.region) continue;
      if (s.pop < (st.popMin || 0)) continue;
      if (st.officialOnly && (s.hs === 'model' || !s.hs)) continue;
      if (q && !(cleanName(s.n).toLowerCase().includes(q) || (s.lga || '').toLowerCase().includes(q) || (s.pc || '') === q)) continue;
      const type = st.type === 'auto' ? s.pt : st.type;
      const price = type === 'u' ? s.u : s.h;
      if (!price) continue;
      if (st.max && price > st.max) continue;
      if (st.min && price < st.min) continue;
      const rent = type === 'u' ? s.ru : s.rh;
      const yld = rent ? (rent * 52 * 100) / price : null;
      if (st.yieldMin && (yld ?? 0) < st.yieldMin) continue;
      rows.push({ s, type, price, rent, yld, score: suburbScore(s.sc, w) });
    }
    const key = { score: (r) => r.score, price: (r) => r.price, yld: (r) => r.yld, g1: (r) => r.s.g1, pop: (r) => r.s.pop, pg5: (r) => r.s.pg5, name: (r) => cleanName(r.s.n), rent: (r) => r.rent, pti: (r) => r.s.pti }[st.sort] || ((r) => r.score);
    rows.sort((a, b) => {
      const x = key(a);
      const y = key(b);
      if (x === y) return 0;
      if (x === null || x === undefined) return 1;
      if (y === null || y === undefined) return -1;
      return (x < y ? -1 : 1) * (st.asc ? 1 : -1);
    });
  }

  function syncUrl() {
    const p = new URLSearchParams();
    if (st.state) p.set('state', st.state);
    if (st.region) p.set('region', st.region);
    if (st.type !== 'auto') p.set('type', st.type);
    if (st.max) p.set('max', st.max);
    if (st.min) p.set('min', st.min);
    if (st.yieldMin) p.set('yield', st.yieldMin);
    if (st.popMin !== 1000) p.set('pop', st.popMin);
    if (st.profile !== 'balanced') p.set('profile', st.profile);
    if (st.officialOnly) p.set('official', '1');
    if (st.q) p.set('q', st.q);
    if (st.view !== 'table') p.set('view', st.view);
    history.replaceState(null, '', `/suburbs${p.toString() ? `?${p}` : ''}`);
  }

  function table() {
    const slice = rows.slice(st.page * PAGE, (st.page + 1) * PAGE);
    const pages = Math.ceil(rows.length / PAGE);
    return `<div class="tbl-wrap"><table id="tbl"><thead><tr>
      <th></th><th>#</th><th data-k="name">Suburb</th><th>Council</th><th data-k="score" class="n">Score</th><th data-k="price" class="n">Price</th><th data-k="rent" class="n">Rent / wk</th><th data-k="yld" class="n">Yield</th><th data-k="g1" class="n">12m growth</th><th data-k="pg5" class="n">Pop. growth 16-21</th><th data-k="pti" class="n">Price / income</th><th data-k="pop" class="n">Population</th><th>Data</th></tr></thead><tbody>
      ${slice
        .map(
          (r, i) => `<tr><td><input type="checkbox" data-cmp="${r.s.id}" ${compareSet.has(r.s.id) ? 'checked' : ''} aria-label="Compare ${esc(r.s.n)}"></td><td class="faint mono">${st.page * PAGE + i + 1}</td>
          <td><a href="${suburbUrl(r.s)}" data-link>${esc(cleanName(r.s.n))}</a> <span class="muted">${r.s.s} ${r.s.pc || ''}</span></td>
          <td class="muted">${esc(r.s.lga || '')}</td><td class="n">${scoreBadge(r.score)}</td>
          <td class="n">${aud(r.price, { compact: true })} <span class="faint">${r.type === 'u' ? 'unit' : 'house'}</span></td><td class="n">${aud(r.rent)}</td>
          <td class="n">${pct(r.yld, 2)}</td><td class="n ${r.s.g1 >= 0 ? 'up' : 'down'}">${growth12(r.s, { suffix: '', short: true })}</td>
          <td class="n">${pct(r.s.pg5, 1, true)}</td><td class="n">${r.s.pti ?? '—'}×</td><td class="n">${num(r.s.pop)}</td><td>${srcBadge(r.type === 'u' ? r.s.us : r.s.hs)}</td></tr>`,
        )
        .join('')}
      </tbody></table></div>
      <div class="pager"><span>Page ${st.page + 1} of ${Math.max(1, pages)}</span><button class="btn sm" id="prev" ${st.page ? '' : 'disabled'}>Previous</button><button class="btn sm" id="next" ${st.page + 1 < pages ? '' : 'disabled'}>Next</button></div>
      <p class="fine">ʳ Regional 12-month change where the suburb has no official sales series. "Estimate" prices come from Keyzing's model, calibrated on official medians; "Official" figures are state government sales data rolled forward to today with the regional index.</p>`;
  }

  let map = null;
  let layer = null;
  function drawMap() {
    const out = $f('#out');
    out.innerHTML = `<div id="map" class="map"></div><div class="map-legend"><span><i style="background:var(--sc-a)"></i>75+</span><span><i style="background:var(--sc-b)"></i>60-74</span><span><i style="background:var(--sc-c)"></i>45-59</span><span><i style="background:var(--sc-d)"></i>under 45</span><span>Showing the top ${Math.min(rows.length, 3000).toLocaleString()} matches. Click a dot for details.</span></div>`;
    if (!window.L) {
      out.insertAdjacentHTML('beforeend', '<p class="note">The map library is still loading, or it was blocked. Try again in a moment.</p>');
      return;
    }
    const css = getComputedStyle(document.documentElement);
    const col = (v) => css.getPropertyValue(v >= 75 ? '--sc-a' : v >= 60 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
    map = L.map('map', { preferCanvas: true, scrollWheelZoom: true }).setView([-28, 134], 4);
    baseTiles().addTo(map);
    layer = L.layerGroup().addTo(map);
    const pts = rows.slice(0, 3000);
    for (const r of pts) {
      L.circleMarker([r.s.lat, r.s.lng], { radius: 5.5, weight: 1, color: '#0008', fillColor: col(r.score), fillOpacity: 0.9 })
        .bindPopup(`<b><a href="${suburbUrl(r.s)}" data-link>${esc(cleanName(r.s.n))}</a></b> ${r.s.s} ${r.s.pc || ''}<br>Score <b>${r.score}</b> · ${aud(r.price, { compact: true })} ${r.type === 'u' ? 'unit' : 'house'}<br>Rent ${aud(r.rent)}/wk · yield ${pct(r.yld, 2)} · 12m ${growth12(r.s)}`)
        .addTo(layer);
    }
    if (pts.length) {
      const b = L.latLngBounds(pts.map((r) => [r.s.lat, r.s.lng]));
      map.fitBounds(b.pad(0.05), { maxZoom: 12 });
    }
  }

  function draw() {
    compute();
    syncUrl();
    $f('#count').innerHTML = `<b>${rows.length.toLocaleString()}</b> of ${list.length.toLocaleString()} suburbs match your filters${st.popMin ? ` (including ${st.popMin.toLocaleString()}+ residents)` : ''} · <span class="area-tag">area</span> = city or regional 12-month figure (no suburb sales data) · ranked by ${st.sort === 'score' ? `${$f('#f-profile').selectedOptions[0].text.toLowerCase()} score` : st.sort}`;
    if (map) {
      map.remove();
      map = null;
    }
    if (st.view === 'map') drawMap();
    else {
      $f('#out').innerHTML = table();
      const t = $f('#tbl');
      t.querySelector(`th[data-k="${st.sort}"]`)?.classList.add(st.asc ? 'asc' : 'desc');
      sortable(t, (k, asc) => {
        st.sort = k;
        st.asc = asc;
        st.page = 0;
        draw();
      });
      $f('#prev').onclick = () => {
        st.page--;
        draw();
        window.scrollTo({ top: $f('#count').offsetTop - 120 });
      };
      $f('#next').onclick = () => {
        st.page++;
        draw();
        window.scrollTo({ top: $f('#count').offsetTop - 120 });
      };
      t.addEventListener('change', (e) => {
        const id = e.target.dataset.cmp;
        if (!id) return;
        if (e.target.checked) compareSet.add(id);
        else compareSet.delete(id);
        cmpBar();
      });
    }
  }
  function cmpBar() {
    $f('#cmp').innerHTML = compareSet.size
      ? `<span class="muted">${compareSet.size} selected</span><button class="btn sm primary" id="go-cmp">Compare</button><button class="btn sm" id="clr-cmp">Clear</button>`
      : '<span class="note">Tick suburbs to compare them side by side</span>';
    $f('#go-cmp')?.addEventListener('click', () => navigate(`/compare?ids=${[...compareSet].slice(0, 4).join(',')}`));
    $f('#clr-cmp')?.addEventListener('click', () => {
      compareSet.clear();
      draw();
      cmpBar();
    });
  }

  const bind = (id, key, conv = (v) => v) =>
    $f(id).addEventListener('input', (e) => {
      st[key] = conv(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
      st.page = 0;
      clearTimeout(bind.t);
      bind.t = setTimeout(draw, 180);
    });
  bind('#f-state', 'state');
  bind('#f-region', 'region');
  bind('#f-type', 'type');
  bind('#f-max', 'max', (v) => (v ? +v : ''));
  bind('#f-min', 'min', (v) => (v ? +v : ''));
  bind('#f-yield', 'yieldMin', (v) => (v ? +v : ''));
  bind('#f-pop', 'popMin', (v) => +v || 0);
  bind('#f-profile', 'profile');
  bind('#f-q', 'q');
  bind('#f-official', 'officialOnly');
  $f('#view').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    st.view = b.dataset.v;
    $f('#view').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });
  $f('#csv').addEventListener('click', () => {
    const head = ['suburb', 'state', 'postcode', 'council', 'score', 'type', 'price', 'price_source', 'weekly_rent', 'gross_yield', 'growth_12m', 'pop_growth_2016_21', 'price_to_income', 'population', 'lat', 'lng'];
    const lines = rows.map((r) => [cleanName(r.s.n), r.s.s, r.s.pc, r.s.lga, r.score, r.type === 'u' ? 'unit' : 'house', r.price, r.type === 'u' ? r.s.us : r.s.hs, r.rent, r.yld?.toFixed(2), r.s.g1, r.s.pg5, r.s.pti, r.s.pop, r.s.lat, r.s.lng].map((v) => (v === null || v === undefined ? '' : /[",]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v)).join(','));
    const blob = new Blob([`${head.join(',')}\n${lines.join('\n')}`], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'keyzing-suburbs.csv';
    a.click();
  });
  cmpBar();
  draw();
  return { destroy: () => map?.remove() };
}
