import { esc, aud, pct, setMeta, scoreBadge } from '../ui.js';
import { suburbs, cleanName, suburbUrl, load } from '../data.js';
import { analyse, verdict, suburbScore, valueEstimate } from '../engine.js';
import { reaSearch } from './find.js';
import { liveFactor } from '../live.js';
import { baseTiles } from '../map.js';
import { listingLinks } from '../insights.js';
import { attachSearch, navigate } from '../app.js';

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
  const value = valueCall(it.price, est);
  const gap = value ? value.gap : null;
  let a = null;
  let v = null;
  if (it.price && rent) {
    a = analyse({ state: s.s, price: it.price, weeklyRent: rent, deposit: 0.2, ratePct: rate, income: 120000, hold: 10, growth: unit ? 3.5 : 5, newBuild: it.isNew, perth: s.rg === 'PER', strata: unit ? 3200 : 0, landValuePct: unit ? 0.25 : 0.55 });
    v = verdict(a, { ...s, score: suburbScore(s.sc) }, market);
  }
  return { t, est, rent, gap, value, a, v };
}

/** Value call from the gap between asking price and Keystone's estimate (percent). */
export function valueCall(asking, est) {
  if (!asking || !est) return null;
  const gap = (asking / est.value - 1) * 100;
  // Only call a price high or low when it falls outside the estimate's likely range; inside it the estimate can't tell.
  if (asking < est.low) return { key: 'below', label: 'Below the likely range', cls: 'up', gap, note: 'The asking price is under Keystone\'s range for this home. Find out why before offering: condition, position, or a seller who needs to move.' };
  if (asking > est.high) return { key: 'above', label: 'Above the likely range', cls: 'down', gap, note: 'The asking price is over Keystone\'s range for this home. Check recent sales in the street before offering near it.' };
  return { key: 'within', label: 'Within the likely range', cls: '', gap, note: 'Inside the estimate\'s range, the estimate can\'t say whether it\'s cheap or dear. Recent sales in the same street will.' };
}

/** "Rate a listing you've found": address + asking price -> full valuation and grade. */
export function rateBox(s) {
  return `<div class="card flat tint rate-box"><b>Check a listing's asking price</b><p class="note" style="margin:4px 0 10px">${s ? `Open the current listings for ${esc(cleanName(s.n))} above, then paste` : 'Copy'} the address and asking price from any listing on realestate.com.au or Domain. Keystone shows where the price sits against its estimated range for that home, plus the cash and repayments to buy it. Where there's no official suburb sales data (most of WA, QLD, TAS, NT and the ACT) the estimate is modelled: use it as a sense-check alongside recent sales, not a verdict.</p>
    <form class="fields rb-form" style="grid-template-columns:minmax(0,2fr) minmax(0,1fr) auto;align-items:end" onsubmit="return false">
      <label class="field">Address<input name="addr" type="search" placeholder="${s ? `e.g. 12 Example Street, ${esc(cleanName(s.n))} ${s.s} ${s.pc || ''}` : 'e.g. 12 Example Street, Morley WA 6062'}" required></label>
      <label class="field">Asking price<input name="price" type="number" step="1" placeholder="e.g. 850000"></label>
      <button class="btn primary" type="submit">Check the price</button>
    </form></div>`;
}
export function wireRateBox(el, s) {
  const f = el.querySelector('.rb-form');
  f?.addEventListener('submit', () => {
    let a = f.addr.value.trim();
    if (!a) return f.addr.focus();
    if (s && !new RegExp(cleanName(s.n), 'i').test(a)) a += `, ${cleanName(s.n)} ${s.s} ${s.pc || ''}`;
    navigate(`/property?q=${encodeURIComponent(a.trim())}${+f.price.value ? `&asking=${+f.price.value}` : ''}`);
  });
}

export async function liveListings(el, s, { compact = false, mode = 'buy', filters = {}, mapEl = null } = {}) {
  el.innerHTML = '<p class="note">Checking live listings…</p>';
  const q = new URLSearchParams({ suburb: cleanName(s.n), state: s.s, postcode: s.pc || '', mode: mode === 'rent' ? 'rent' : 'sale', size: compact ? 10 : 24, ...filters });
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
    el.innerHTML = rateBox(s);
    wireRateBox(el, s);
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
  const below = rated.filter((x) => x.r.value?.key === 'below').length;
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
  ${mode !== 'rent' && priced ? `<p class="note" style="margin:0 0 10px"><b>${below} of ${priced}</b> priced listings are below Keystone's likely range. Sorted best investment grade first, then best value.</p>` : ''}
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
  setMeta({ title: 'Rate any property for sale: value, rent and investment grade', description: 'Paste the address and asking price of any Australian listing to see its estimated value, whether the price is good value, rent, yield, holding cost and an investment grade.' });
  const { byId } = await suburbs();
  let chosen = query.suburb ? byId.get(query.suburb) : null;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Listings</div><h1>Listings, valued and rated</h1>
  <p>Found a property for sale? Paste its address and asking price and Keystone gives you an independent value estimate for that home, whether the price is good value, estimated rent and yield, weekly holding cost after tax, a 10-year return and an A–D investment grade.</p></div>
  <div id="rb"></div>
  <section class="section">
    <h2>Browse what's for sale</h2>
    <div class="card flat tint">
      <div class="fields">
        <label class="field" style="position:relative">Suburb or postcode<input id="ls" type="search" placeholder="e.g. Bayswater WA" value="${chosen ? esc(`${cleanName(chosen.n)} ${chosen.s} ${chosen.pc}`) : ''}"><div class="ac" id="lac" hidden style="top:62px;left:0;right:auto"></div></label>
        <label class="field">Type<select id="lt"><option value="">Any</option><option value="h">House</option><option value="u">Unit / apartment / townhouse</option></select></label>
        <label class="field">Min beds<select id="lb"><option value="">Any</option><option>1</option><option>2</option><option>3</option><option>4</option><option>5</option></select></label>
        <label class="field">Max price<input id="lm" type="number" step="1" placeholder="Any"></label>
      </div>
      <p class="fine" style="margin-top:10px">Opens the matching listings on realestate.com.au and Domain in a new tab, with your filters applied. Bring any address back here to rate it.</p>
      <div id="res" style="margin-top:12px"></div>
    </div>
  </section>`;
  const $ = (x) => main.querySelector(x);
  $('#rb').innerHTML = rateBox(null);
  wireRateBox($('#rb'), null);
  attachSearch($('#ls'), $('#lac'), (s) => {
    chosen = s;
    $('#ls').value = `${cleanName(s.n)} ${s.s} ${s.pc}`;
    run();
  });
  const run = () => {
    if (!chosen) {
      $('#res').innerHTML = '<p class="note">Choose a suburb from the list.</p>';
      return;
    }
    const t = $('#lt').value;
    const p = { beds: +$('#lb').value || undefined, maxPrice: +$('#lm').value || undefined };
    const links = listingLinks(chosen);
    const e = valueEstimate(chosen, { type: t || chosen.pt, beds: p.beds });
    $('#res').innerHTML = `<div class="spread"><div><b>${esc(cleanName(chosen.n))} ${chosen.s} ${chosen.pc || ''}</b> ${scoreBadge(suburbScore(chosen.sc))}<div class="note">${e ? `Typical ${e.beds}-bed ${e.type === 'u' ? 'unit' : 'house'} about <b>${aud(e.value, { compact: true })}</b> · rent ${aud(e.rent)}/wk · ${pct(e.yield, 1)} yield` : ''} · <a href="${suburbUrl(chosen)}" data-link>suburb report</a></div></div>
      <div class="row"><a class="btn primary sm" href="${reaSearch(chosen, t, p)}" target="_blank" rel="noopener">realestate.com.au ↗</a><a class="btn sm" href="${links.domainBuy}" target="_blank" rel="noopener">Domain ↗</a><a class="btn sm ghost" href="${links.reaSold}" target="_blank" rel="noopener">Recently sold ↗</a></div></div>`;
  };
  ['#lt', '#lb', '#lm'].forEach((x) => $(x).addEventListener('change', run));
  if (chosen) run();
}
