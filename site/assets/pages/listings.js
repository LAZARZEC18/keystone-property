import { esc, aud, pct, setMeta, date } from '../ui.js';
import { suburbs, cleanName, suburbUrl, load } from '../data.js';
import { analyse, verdict, suburbScore } from '../engine.js';
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

export async function liveListings(el, s, { compact = false, mode = 'buy', filters = {} } = {}) {
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
    el.innerHTML = `<div class="callout"><b>Live listings inside Keystone switch on with a Domain API key.</b> Domain's official API is the only licensed way to show Australian listings. Until the key is added, use the buttons above: they open the current listings for ${esc(cleanName(s.n))} directly. Paste any listing's price into the <a href="/analyse?suburb=${s.id}" data-link>analyser</a> for the full numbers.</div>`;
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
  const [market, rs] = await Promise.all([load('market'), load('rates-summary')]);
  const rate = Math.max(rs.best.INV_PI_variable?.[0]?.rate || 6, (rs.medianInvestorVariable || 6.5) - 0.4);
  const cards = res.items.map((it) => {
    const rent = estimateRent(s, it);
    let v = null;
    let a = null;
    if (it.price && rent && mode !== 'rent') {
      a = analyse({ state: s.s, price: it.price, weeklyRent: rent, deposit: 0.2, ratePct: rate, income: 120000, hold: 10, growth: /Apartment|Unit/i.test(it.type) ? 3.5 : 5, newBuild: it.isNew, perth: s.rg === 'PER', strata: /Apartment|Unit|Townhouse/i.test(it.type) ? 3200 : 0, landValuePct: /Apartment|Unit/i.test(it.type) ? 0.25 : 0.55 });
      v = verdict(a, { ...s, score: suburbScore(s.sc) }, market);
    }
    const aUrl = `/analyse?suburb=${s.id}&price=${it.price || ''}&rent=${rent || ''}&type=${/Apartment|Unit/i.test(it.type) ? 'u' : 'h'}&new=${it.isNew ? 1 : 0}&addr=${encodeURIComponent(it.address)}`;
    return `<div class="listing">
      ${it.image ? `<img src="${esc(it.image)}" alt="" loading="lazy">` : '<div style="background:var(--surface-2);border-radius:9px;min-height:120px"></div>'}
      <div>
        <a href="${esc(it.url)}" target="_blank" rel="noopener"><b>${esc(it.address)}</b></a>
        <div class="note">${esc(it.type || '')} · ${it.beds ?? '?'} bed · ${it.baths ?? '?'} bath · ${it.cars ?? 0} car${it.land ? ` · ${it.land} m²` : ''}${it.isNew ? ' · <b>New build</b>' : ''}</div>
        <div style="margin:4px 0"><b class="mono">${esc(it.displayPrice || 'Contact agent')}</b> ${it.agency ? `<span class="muted">· ${esc(it.agency)}</span>` : ''}</div>
        ${a ? `<div class="note">Est. rent ${aud(rent)}/wk · yield ${pct(a.summary.grossYield, 2)} · cost ${aud(a.summary.weeklyCashAfterTax)}/wk after tax · 10-yr return ${pct(a.summary.irr, 1)}</div>` : rent ? `<div class="note">Est. rent ${aud(rent)}/wk. Add the price in the analyser to see the full numbers.</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end">
        ${v ? `<div class="grade grade-${v.grade}" style="width:48px;height:48px;font-size:24px;border-radius:12px" title="${esc(v.label)}">${v.grade}</div>` : ''}
        <a class="btn sm" href="${aUrl}" data-link>Analyse</a>
      </div>
    </div>`;
  });
  el.innerHTML = `<div class="spread" style="margin-bottom:10px"><span class="badge-live">Live listings${res.total ? ` · ${res.total.toLocaleString()} found` : ''}</span><span class="powered">Listings powered by <a href="https://www.domain.com.au" target="_blank" rel="noopener"><b>Domain</b></a></span></div><div class="grid">${cards.join('')}</div><p class="fine" style="margin-top:8px">Grades assume a 20% deposit, a $120k salary and rent estimated from the suburb's typical rent adjusted for bedrooms. Open a listing in the analyser to use your own numbers.</p>`;
}

export default async function listingsPage(main, _p, query) {
  setMeta({ title: 'Live property listings, scored for investors', description: 'Search Australian property for sale and see estimated rent, yield, holding cost and an investment grade for every listing.' });
  const { byId } = await suburbs();
  let chosen = query.suburb ? byId.get(query.suburb) : null;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Listings</div><h1>Property for sale, scored</h1>
  <p>Pick a suburb and Keystone grades every live listing: estimated rent, yield, weekly holding cost after tax and a 10-year return. Listings come from Domain's official API.</p></div>
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
    $('#res').innerHTML = `<div class="row" style="margin-bottom:12px"><a class="btn sm" href="${links.reaBuy}" target="_blank" rel="noopener">realestate.com.au</a><a class="btn sm" href="${links.domainBuy}" target="_blank" rel="noopener">Domain</a><a class="btn sm" href="${links.reaSold}" target="_blank" rel="noopener">Sold</a></div><div id="lv"></div>`;
    liveListings($('#lv'), chosen, { filters: f });
  };
  $('#go').addEventListener('click', run);
  if (chosen) run();
  main.insertAdjacentHTML('beforeend', `<p class="fine">Listing data © Domain Holdings Australia, shown under Domain's API terms. Rent estimates are Keystone's. Checked ${date(new Date().toISOString())}.</p>`);
}
