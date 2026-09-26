import { esc, aud, pct, setMeta, date } from '../ui.js';
import { suburbs, cleanName, suburbUrl, load } from '../data.js';
import { analyse, verdict, suburbScore, valueEstimate } from '../engine.js';
import { liveFactor } from '../live.js';
import { baseTiles } from '../map.js';
import { listingLinks } from '../insights.js';
import { attachSearch } from '../app.js';

const BED_FACTOR_H = { 1: 0.7, 2: 0.82, 3: 1, 4: 1.14, 5: 1.28, 6: 1.38 };
const BED_FACTOR_U = { 0: 0.62, 1: 0.78, 2: 1, 3: 1.22, 4: 1.4 };

/** Estimated weekly rent for a specific listing from its suburb's typical rents and bedroom count. */
export function estimateRent(s, item) {
  const unit = /Apartment|Unit|Flat|Studio/i.test(item.type || '');
  const base = unit ? s.ru : s.rh;
  if (!base) return null;
  const f = unit ? BED_FACTOR_U[Math.min(4, item.beds ?? 2)] : BED_FACTOR_H[Math.min(6, Math.max(1, item.beds ?? 3))];
  return Math.round((base * (f || 1)) / 5) * 5;
}

/** Keystone's read on a listing: estimated value for its features vs the asking price, plus an investment grade. */
export function rateListing(s, it, { market, index, rate }) {
  const unit = /Apartment|Unit|Flat|Studio|Townhouse|Villa|Terrace|Duplex|Semi/i.test(it.type || '');
  const t = unit ? 'u' : 'h';
  const est = valueEstimate(s, { type: t, beds: it.beds ?? undefined, baths: it.baths ?? undefined, cars: it.cars ?? undefined, land: t === 'h' && it.land > 50 ? it.land : null, condition: it.isNew ? 'new' : 'average', liveFactor: liveFactor(s.rg, index) });
  const rent = est?.rent || estimateRent(s, it);
  const gap = it.price && est ? (it.price / est.value - 1) * 100 : null;
  const value = valueCall(gap);
  let a = null;
  let v = null;
  if (it.price && rent) {
    a = analyse({ state: s.s, price: it.price, weeklyRent: rent, deposit: 0.2, ratePct: rate, income: 120000, hold: 10, growth: unit ? 3.5 : 5, newBuild: it.isNew, perth: s.rg === 'PER', strata: unit ? 3200 : 0, landValuePct: unit ? 0.25 : 0.55 });
    v = verdict(a, { ...s, score: suburbScore(s.sc) }, market);
  }
  return { t, est, rent, gap, value, a, v };
}

/** Value call from the gap between asking price and Keystone's estimate (percent). */
export function valueCall(gap) {
  if (gap === null || gap === undefined || !Number.isFinite(gap)) return null;
  if (gap <= -8) return { key: 'great', label: 'Great value', cls: 'up', note: 'Asking well below the estimate: check why (condition, position, a motivated seller).' };
  if (gap <= 3) return { key: 'fair', label: 'Fair price', cls: 'up', note: 'Asking in line with the estimate.' };
  if (gap <= 10) return { key: 'high', label: 'Slightly high', cls: 'warn', note: 'Above the estimate: room to negotiate.' };
  return { key: 'over', label: 'Overpriced', cls: 'down', note: 'Well above the estimate: check recent sales before offering near this figure.' };
}

export async function liveListings(el, s, { compact = false, mode = 'buy', filters = {}, mapEl = null } = {}) {
  el.innerHTML = '<p class="note">Checking live listings…</p>';
  const q = new URLSearchParams({ suburb: cleanName(s.n), state: s.s, postcode: s.pc || '', mode: mode === 'rent' ? 'rent' : 'sale', size: compact ? 8 : 24, ...filters });
  let res;
  try {
    const r = await fetch(`/api/listings?${q}`);
    res = await r.json().catch(() => ({ error: `HTTP ${r.status}` }));
    if (r.status === 404) res = { configured: false, message: 'The listings service isn\'t deployed on this preview.' };
  } catch (e) {
    res = { error: String(e.message || e) };
  }
  const links = listingLinks(s);
  if (res.configured === false) {
    el.innerHTML = `<div class="callout"><b>Live listings inside Keystone switch on with a Domain API key.</b> Domain's official API is the licensed way to show Australian listings, and once it's connected every listing here gets a Keystone value estimate, a value call against the asking price and an investment grade. Until then, the buttons above open the current listings for ${esc(cleanName(s.n))}; paste any asking price into the <a href="/property" data-link>valuation</a> or <a href="/analyse?suburb=${s.id}" data-link>analyser</a> to get the same rating.</div>`;
    return;
  }
  if (res.error) {
    el.innerHTML = `<p class="note">Live listings are unavailable right now (${esc(res.error)}). <a href="${links.domainBuy}" target="_blank" rel="noopener">See them on Domain</a>.</p>`;
    return;
  }
  if (!res.items?.length) {
    el.innerHTML = `<p class="note">No current listings found for ${esc(cleanName(s.n))} with these filters.</p>`;
    return;
  }
  const [market, rs, index] = await Promise.all([load('market'), load('rates-summary'), load('index')]);
  const rate = Math.max(rs.best.INV_PI_variable?.[0]?.rate || 6, (rs.medianInvestorVariable || 6.5) - 0.4);
  const rated = res.items.map((it) => ({ it, r: mode === 'rent' ? { rent: estimateRent(s, it) } : rateListing(s, it, { market, index, rate }) }));
  const rank = { A: 0, B: 1, C: 2, D: 3 };
  if (mode !== 'rent') rated.sort((x, y) => (rank[x.r.v?.grade] ?? 4) - (rank[y.r.v?.grade] ?? 4) || (x.r.gap ?? 99) - (y.r.gap ?? 99));
  const below = rated.filter((x) => x.r.gap !== null && x.r.gap !== undefined && x.r.gap <= 3).length;
  const priced = rated.filter((x) => x.r.gap !== null && x.r.gap !== undefined).length;
  const cards = rated.map(({ it, r }, i) => {
    const { rent, a, v, est, value, gap } = r;
    const aUrl = `/analyse?suburb=${s.id}&price=${it.price || ''}&rent=${rent || ''}&type=${r.t || 'h'}&new=${it.isNew ? 1 : 0}&addr=${encodeURIComponent(it.address)}`;
    const pUrl = `/property?q=${encodeURIComponent(`${it.address}${/\d{4}\s*$/.test(it.address) ? '' : ` ${s.s} ${it.postcode || s.pc || ''}`}`)}${it.price ? `&asking=${it.price}` : ''}`;
    return `<div class="listing" id="lst-${i}">
      ${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : '<div style="background:var(--surface-2);border-radius:9px;min-height:120px"></div>'}
      <div style="min-width:0">
        <a href="${esc(it.url)}" target="_blank" rel="noopener"><b>${esc(it.address)}</b></a>
        <div class="note">${esc(it.type || '')} · ${it.beds ?? '?'} bed · ${it.baths ?? '?'} bath · ${it.cars ?? 0} car${it.land ? ` · ${it.land} m²` : ''}${it.isNew ? ' · <b>New build</b>' : ''}</div>
        <div style="margin:4px 0"><b class="mono">${esc(it.displayPrice || 'Contact agent')}</b> ${it.agency ? `<span class="muted">· ${esc(it.agency)}</span>` : ''}</div>
        ${est ? `<div class="note">Keystone value <b>${aud(est.value, { compact: true })}</b> (${aud(est.low, { compact: true })}–${aud(est.high, { compact: true })})${value ? ` · <b class="${value.cls}">${value.label}</b> ${gap >= 0 ? '+' : ''}${gap.toFixed(1)}% vs asking` : ' · no price shown, compare the estimate with the guide'}</div>` : ''}
        ${a ? `<div class="note">Est. rent ${aud(rent)}/wk · yield ${pct(a.summary.grossYield, 2)} · ${aud(a.summary.weeklyCashAfterTax)}/wk after tax · 10-yr return ${pct(a.summary.irr, 1)}</div>` : rent ? `<div class="note">Est. rent ${aud(rent)}/wk.</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        ${v ? `<div class="grade grade-${v.grade}" style="width:48px;height:48px;font-size:24px;border-radius:12px" title="${esc(v.label)}">${v.grade}</div><span class="fine" style="text-align:right">${esc(v.label)}</span>` : ''}
        <a class="btn sm" href="${pUrl}" data-link>Value</a>
        <a class="btn sm ghost" href="${aUrl}" data-link>Analyse</a>
      </div>
    </div>`;
  });
  el.innerHTML = `<div class="spread" style="margin-bottom:10px"><span class="badge-live">Live listings${res.total ? ` · ${res.total.toLocaleString()} found` : ''}</span><span class="powered">Listings powered by <a href="https://www.domain.com.au" target="_blank" rel="noopener"><b>Domain</b></a></span></div>
  ${mode !== 'rent' && priced ? `<p class="note" style="margin:0 0 10px"><b>${below} of ${priced}</b> priced listings are at or below Keystone's estimate. Sorted best investment grade first, then best value.</p>` : ''}
  <div class="grid">${cards.join('')}</div><p class="fine" style="margin-top:8px">Value estimates use the suburb's sales data adjusted for each home's bedrooms, bathrooms, land and newness, moved forward with the daily index. Grades assume a 20% deposit, a $120k salary and estimated rent. Open a listing in Value or Analyse to use your own numbers.</p>`;

  if (mapEl) {
    const pts = rated.filter(({ it }) => it.lat && it.lng);
    if (!pts.length) {
      mapEl.hidden = true;
      return;
    }
    mapEl.hidden = false;
    const draw = () => {
      if (!window.L) return setTimeout(draw, 250);
      if (mapEl._map) mapEl._map.remove();
      const map = L.map(mapEl, { scrollWheelZoom: false });
      mapEl._map = map;
      baseTiles().addTo(map);
      const css = getComputedStyle(document.documentElement);
      const col = (g) => css.getPropertyValue({ A: '--sc-a', B: '--sc-b', C: '--sc-c', D: '--sc-d' }[g] || '--muted').trim();
      pts.forEach(({ it, r }) => {
        const i = rated.findIndex((x) => x.it === it);
        L.circleMarker([it.lat, it.lng], { radius: 8, weight: 1.5, color: '#0009', fillColor: col(r.v?.grade), fillOpacity: 0.95 })
          .addTo(map)
          .bindPopup(`<b>${esc(it.address)}</b><br>${esc(it.displayPrice || '')}<br>${r.est ? `Keystone value ${aud(r.est.value, { compact: true })}` : ''}${r.value ? ` · ${r.value.label}` : ''}${r.v ? `<br>Grade ${r.v.grade} · ${esc(r.v.label)}` : ''}<br><a href="#lst-${i}">Details ↓</a>`);
      });
      map.fitBounds(L.latLngBounds(pts.map(({ it }) => [it.lat, it.lng])).pad(0.15), { maxZoom: 15 });
    };
    draw();
  }
}

export default async function listingsPage(main, _p, query) {
  setMeta({ title: 'Live property listings, scored for investors', description: 'Search Australian property for sale and see estimated rent, yield, holding cost and an investment grade for every listing.' });
  const { byId } = await suburbs();
  let chosen = query.suburb ? byId.get(query.suburb) : null;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Listings</div><h1>Property for sale, valued and rated</h1>
  <p>Pick a suburb and Keystone rates every live listing: an independent value estimate for that home, whether the asking price is good value, estimated rent and yield, weekly holding cost after tax, a 10-year return and an investment grade. Listings come from Domain's official API.</p></div>
  <div class="card flat tint">
    <div class="fields">
      <label class="field" style="position:relative">Suburb or postcode<input id="ls" type="search" placeholder="e.g. Bayswater WA" value="${chosen ? esc(`${cleanName(chosen.n)} ${chosen.s} ${chosen.pc}`) : ''}"><div class="ac" id="lac" hidden style="top:62px;left:0;right:auto"></div></label>
      <label class="field">Type<select id="lt"><option value="">Any</option><option value="House">House</option><option value="ApartmentUnitFlat">Apartment / unit</option><option value="Townhouse">Townhouse</option></select></label>
      <label class="field">Min beds<select id="lb"><option value="">Any</option><option>1</option><option>2</option><option>3</option><option>4</option></select></label>
      <label class="field">Max price<input id="lm" type="number" step="50000" placeholder="Any"></label>
      <label class="field">Include surrounding<select id="lsur"><option value="0">This suburb only</option><option value="1">Plus surrounding suburbs</option></select></label>
    </div>
    <div class="row" style="margin-top:12px"><button class="btn primary" id="go">Search listings</button><span id="sel" class="note"></span></div>
  </div>
  <div id="res" class="section"></div>`;
  const $ = (x) => main.querySelector(x);
  attachSearch($('#ls'), $('#lac'), (s) => {
    chosen = s;
    $('#ls').value = `${cleanName(s.n)} ${s.s} ${s.pc}`;
    run();
  });
  const run = () => {
    if (!chosen) {
      $('#res').innerHTML = '<p class="note">Choose a suburb from the list first.</p>';
      return;
    }
    $('#sel').innerHTML = `<a href="${suburbUrl(chosen)}" data-link>${esc(cleanName(chosen.n))} suburb profile →</a>`;
    const f = {};
    if ($('#lt').value) f.types = $('#lt').value;
    if ($('#lb').value) f.beds = $('#lb').value;
    if ($('#lm').value) f.max = $('#lm').value;
    if ($('#lsur').value === '1') f.surrounding = '1';
    const links = listingLinks(chosen);
    $('#res').innerHTML = `<div class="row" style="margin-bottom:12px"><a class="btn sm" href="${links.reaBuy}" target="_blank" rel="noopener">realestate.com.au</a><a class="btn sm" href="${links.domainBuy}" target="_blank" rel="noopener">Domain</a><a class="btn sm" href="${links.reaSold}" target="_blank" rel="noopener">Sold</a></div><div id="lmap" class="map short" hidden style="margin-bottom:14px"></div><div id="lv"></div>`;
    liveListings($('#lv'), chosen, { filters: f, mapEl: $('#lmap') });
  };
  $('#go').addEventListener('click', run);
  if (chosen) run();
  main.insertAdjacentHTML('beforeend', `<p class="fine">Listing data © Domain Holdings Australia, shown under Domain's API terms. Rent estimates are Keystone's. Checked ${date(new Date().toISOString())}.</p>`);
}
