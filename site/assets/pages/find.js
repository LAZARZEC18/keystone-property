import { esc, aud, pct, scoreBadge, setMeta, srcBadge, growth12, confBadge } from '../ui.js';
import { suburbs, suburbUrl, cleanName, load, haversine } from '../data.js';
import { suburbScore, PROFILES, valueEstimate } from '../engine.js';
import { parseQuery, looksLikeAddress, NOT_BEACH } from '../intent.js';
import { listingLinks } from '../insights.js';
import { liveFactor } from '../live.js';
import { baseTiles } from '../map.js';
import { navigate } from '../app.js';

const EXAMPLES = [
  '3 bed house under $800k near the beach in Perth with good yield',
  'Apartment within 8 km of Melbourne CBD under $600k',
  'First home in Brisbane between $500k and $700k',
  'Cash flow investment in regional WA with 6% yield',
  '4 bedroom family home near Morley',
  'Growth house near the city in Adelaide',
];

export default async function findPage(main, _p, query) {
  const q = (query.q || '').trim();
  setMeta({ title: q ? `${q}: property search` : 'Smart property search', description: 'Describe what you want in plain English. Keyzing understands bedrooms, budget, location, lifestyle and investment goals, and ranks every matching suburb.' });
  if (q && looksLikeAddress(q)) return navigate(`/property?q=${encodeURIComponent(q)}`, true);
  const [{ list }, market, index] = await Promise.all([suburbs(), load('market'), Promise.resolve(null)]);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Smart search</div><h1>Tell us what you're looking for</h1>
  <p>Search the way you'd describe it to an agent. Keyzing reads your budget, bedrooms, property type, location, lifestyle (beach, city, regional) and goal (yield, growth, first home), then ranks every matching suburb and prices the kind of home you described.</p></div>
  <form class="hero-search" id="fs" style="max-width:none" onsubmit="return false"><input id="fq" type="search" value="${esc(q)}" placeholder="e.g. 3 bed house under $800k near the beach in Perth with good yield" aria-label="Describe what you're looking for"></form>
  <div class="row" style="margin-bottom:8px">${EXAMPLES.map((e) => `<button class="pill" data-ex="${esc(e)}" style="cursor:pointer">${esc(e)}</button>`).join('')}</div>
  <div id="fout"></div>`;
  const input = main.querySelector('#fq');
  main.querySelector('#fs').addEventListener('submit', () => navigate(`/find?q=${encodeURIComponent(input.value)}`));
  input.addEventListener('keydown', (e) => e.key === 'Enter' && navigate(`/find?q=${encodeURIComponent(input.value)}`));
  main.querySelectorAll('[data-ex]').forEach((b) => b.addEventListener('click', () => navigate(`/find?q=${encodeURIComponent(b.dataset.ex)}`)));
  if (!q) return;

  const p = parseQuery(q, list);
  const profile = PROFILES[p.strategy || (p.stable ? 'balanced' : 'balanced')];
  const places = p.places;
  const inPlace = (s) => {
    if (!places.length) return true;
    return places.some((pl) => {
      if (pl.kind === 'region') return s.rg === pl.code;
      if (pl.kind === 'state') return s.s === pl.code;
      if (pl.kind === 'postcode') return s.pc === pl.code;
      if (pl.kind === 'lga') return (s.lga || '').toLowerCase().startsWith(pl.code.toLowerCase());
      if (pl.kind === 'suburb') return s.id === pl.code || (pl.s && haversine(s, pl.s) <= 3);
      if (pl.kind === 'near') return haversine(s, pl.s) <= 12;
      return true;
    });
  };
  const type = p.type || null;
  const rows = [];
  for (const s of list) {
    if (s.pop < (places.some((x) => ['suburb', 'near', 'postcode'].includes(x.kind)) ? 200 : 1500)) continue;
    if (!inPlace(s)) continue;
    if (p.coastKm && (!(s.ocn !== null && s.ocn !== undefined && s.ocn <= p.coastKm) || NOT_BEACH.has(`${s.s}|${cleanName(s.n)}`))) continue;
    if (p.waterKm && !(s.cst !== null && s.cst <= p.waterKm)) continue;
    if (p.cbdKm && !(s.cbd !== null && s.cbd <= p.cbdKm)) continue;
    if (p.regional && market.regions[s.rg]?.capital) continue;
    const t = type || s.pt;
    const est = valueEstimate(s, { type: t, beds: p.beds, liveFactor: liveFactor(s.rg, index) });
    if (!est) continue;
    if (p.maxPrice && est.value > p.maxPrice) continue;
    if (p.minPrice && est.value < p.minPrice) continue;
    if (p.minYield && (est.yield ?? 0) < p.minYield) continue;
    let score = suburbScore(s.sc, profile);
    if (p.stable) score = Math.round(score * 0.7 + (s.sc.stability ?? 50) * 0.3);
    // prefer suburbs where this kind of home is common
    const exact = places.some((pl) => pl.kind === 'suburb' && pl.code === s.id);
    rows.push({ s, t, est, score: score + (exact ? 100 : 0), display: score });
  }
  rows.sort((a, b) => b.score - a.score);
  const top = rows.slice(0, 60);
  const regionName = (code) => market.regions[code]?.name || code;
  const chips = p.chips.map((c) => (Object.prototype.hasOwnProperty.call(market.regions, c) ? regionName(c) : c));

  const out = main.querySelector('#fout');
  out.innerHTML = `
  <div class="card flat tint" style="margin-top:8px"><div class="row"><b>Keyzing understood:</b> ${chips.length ? chips.map((c) => `<span class="pill" style="background:var(--accent-soft);color:var(--accent);border-color:transparent">${esc(c)}</span>`).join('') : '<span class="muted">no specific filters, showing the best suburbs overall</span>'}</div>
  <p class="note" style="margin:8px 0 0">${rows.length.toLocaleString()} suburbs match. Prices are Keyzing estimates for ${p.beds ? `a ${p.beds}-bedroom ` : 'a typical '}${type === 'u' ? 'unit' : type === 'h' ? 'house' : 'home'} in each suburb, ranked by ${p.strategy === 'cashflow' ? 'cash flow' : p.strategy === 'growth' ? 'growth' : p.strategy === 'firsthome' ? 'affordability' : 'overall'} score.</p></div>
  ${top.length ? `
  <div class="grid split section" style="margin-top:16px">
    <div class="card" style="padding:8px 16px">${top
      .slice(0, 20)
      .map(
        (r, i) => `<div class="spread" style="padding:11px 0;border-bottom:1px solid var(--line);align-items:flex-start">
        <div><span class="faint mono">${i + 1}.</span> <a href="${suburbUrl(r.s)}" data-link><b>${esc(cleanName(r.s.n))}</b></a> <span class="muted">${r.s.s} ${r.s.pc || ''}</span>${confBadge(r.s)}
          <div class="note">${r.est.beds}-bed ${r.t === 'u' ? 'unit' : 'house'} about <b>${aud(r.est.value, { compact: true })}</b> · rent ${aud(r.est.rent)}/wk · ${pct(r.est.yield, 1)} yield · ${growth12(r.s)} ${srcBadge(r.t === 'u' ? r.s.us : r.s.hs)}</div>
          <div class="row" style="margin-top:6px"><a class="btn sm" href="/analyse?suburb=${r.s.id}&price=${r.est.value}&rent=${r.est.rent || ''}&type=${r.t}" data-link>Analyse</a><a class="btn sm ghost" href="${reaSearch(r.s, r.t, p)}" target="_blank" rel="noopener">Homes for sale ↗</a></div></div>
        ${scoreBadge(r.display)}</div>`,
      )
      .join('')}</div>
    <div><div class="card sticky-side"><div id="fmap" class="map tall"></div><p class="fine" style="margin-top:8px">Top ${top.length} matches, coloured by score. Click a dot for details.</p></div></div>
  </div>` : `<div class="empty">Nothing matches all of that. Try a higher budget, a wider area, or fewer conditions.</div>`}`;

  let map = null;
  if (top.length) {
    const draw = () => {
      if (!window.L) return setTimeout(draw, 250);
      if (!document.getElementById('fmap')) return;
      map = L.map('fmap', { scrollWheelZoom: false });
      baseTiles().addTo(map);
      const css = getComputedStyle(document.documentElement);
      const col = (v) => css.getPropertyValue(v >= 65 ? '--sc-a' : v >= 55 ? '--sc-b' : v >= 45 ? '--sc-c' : '--sc-d').trim();
      top.forEach((r, i) => L.circleMarker([r.s.lat, r.s.lng], { radius: i < 20 ? 8 : 5, weight: 1, color: '#0008', fillColor: col(r.display), fillOpacity: 0.95 }).addTo(map).bindPopup(`<b>${i + 1}. <a href="${suburbUrl(r.s)}" data-link>${esc(cleanName(r.s.n))}</a></b><br>${r.est.beds}-bed ${r.t === 'u' ? 'unit' : 'house'} ~${aud(r.est.value, { compact: true })}<br>Score ${r.display} · yield ${pct(r.est.yield, 1)}`));
      map.fitBounds(L.latLngBounds(top.map((r) => [r.s.lat, r.s.lng])).pad(0.1), { maxZoom: 12 });
    };
    draw();
  }
  return { destroy: () => map?.remove() };
}

/** realestate.com.au search URL with the person's type, bedrooms and budget pre-filled. */
export function reaSearch(s, t, p = {}) {
  const name = cleanName(s.n).toLowerCase();
  const parts = [];
  if (t === 'u') parts.push('property-unit+apartment+townhouse');
  else if (t === 'h') parts.push('property-house');
  if (p.beds) parts.push(`with-${p.beds}-bedrooms`);
  if (p.maxPrice || p.minPrice) parts.push(`between-${p.minPrice || 0}-${p.maxPrice || 'any'}`);
  const pre = parts.length ? `${parts.join('-')}-` : '';
  return `https://www.realestate.com.au/buy/${pre}in-${encodeURIComponent(name)},+${s.s.toLowerCase()}+${s.pc}/list-1`;
}

export { listingLinks };
