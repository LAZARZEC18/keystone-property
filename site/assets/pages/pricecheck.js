// Scheme-cap check for a listing price: which first home buyers a price keeps or loses, and a
// "Can you afford this home?" link and QR code for the listing.
import { esc, aud, date, setMeta, copyLinkButton, wireCopyLink } from '../ui.js';
import { suburbs, cleanName, suburbUrl } from '../data.js';
import { stampDuty } from '../engine.js';
import { guaranteeCap, helpToBuyCap, FHOG, FHOG_CAP, KEYSTART, STATES, RULES } from '../rules.js';
import { attachSearch, countEvent } from '../app.js';

const QR_LIB = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';

export const PRICE_CHECK_META = {
  title: 'Listing price check: which first home buyers a price shuts out',
  description: 'Enter a listing price and suburb. See which first home buyer schemes, grants and stamp duty concessions still apply at that price, and the nearest price that brings buyers back.',
};

/** Every scheme a first home buyer might use at this price, with its limit here. Pure, so it can be tested. */
export function schemeChecks(s, price, { newBuild = false } = {}) {
  const out = [];
  const gc = guaranteeCap(s);
  if (gc) out.push({ key: 'guarantee', name: '5% Deposit Scheme', who: 'first home buyers with a 5% deposit and no mortgage insurance', cap: gc, ok: price <= gc });
  const hc = helpToBuyCap(s);
  if (hc) out.push({ key: 'htb', name: 'Help to Buy', who: 'buyers on lower incomes using government shared equity', cap: hc, ok: price <= hc });
  if (s.s === 'WA') out.push({ key: 'keystart', name: 'Keystart low deposit loan', who: 'WA buyers with a 2% deposit', cap: KEYSTART.cap, ok: price <= KEYSTART.cap, note: 'Higher limits apply in some regional areas.' });
  const fc = FHOG_CAP[s.s];
  const grant = FHOG[s.s]?.[0] || 0;
  if (grant) {
    if (!newBuild && s.s !== 'NT') out.push({ key: 'fhog', name: 'First Home Owner Grant', who: 'first home buyers of a new home', cap: fc, ok: false, na: 'New homes only' });
    else out.push({ key: 'fhog', name: `First Home Owner Grant (${aud(s.s === 'NT' && !newBuild ? 10000 : grant)})`, who: 'first home buyers', cap: fc, ok: fc == null || price <= fc });
  }
  // stamp duty: compare the first home rate with the ordinary owner-occupier rate
  const fhb = stampDuty(s.s, price, { buyer: 'fhb', newBuild }).duty;
  const owner = stampDuty(s.s, price, { buyer: 'owner', newBuild }).duty;
  const dutyCap = dutyEdge(s.s, price, newBuild);
  out.push({ key: 'duty', name: 'First home stamp duty relief', who: 'first home buyers', cap: dutyCap, strict: !!dutyCap, ok: fhb < owner - 1, detail: fhb === 0 ? 'No stamp duty' : fhb < owner - 1 ? `${aud(fhb)} instead of ${aud(owner)}` : `Full duty of ${aud(owner)}` });
  return out;
}

/** The price (to the nearest $1,000, up to $3m) from which first home duty relief no longer applies. */
function dutyEdge(state, price, newBuild) {
  const saves = (p) => stampDuty(state, p, { buyer: 'fhb', newBuild }).duty < stampDuty(state, p, { buyer: 'owner', newBuild }).duty - 1;
  if (saves(3000000)) return null; // no cap
  if (!saves(100000)) return 0; // no relief at all
  let lo = 100000;
  let hi = 3000000;
  while (hi - lo > 1000) {
    const mid = Math.round((lo + hi) / 2000) * 1000;
    if (saves(mid)) lo = mid;
    else hi = mid;
  }
  return hi;
}

export default async function priceCheckPage(main, _p, query) {
  setMeta(PRICE_CHECK_META);
  const { list, byId } = await suburbs();
  let sub = query.suburb ? byId.get(String(query.suburb)) : null;
  const price0 = Math.round(+query.price || 0) || '';
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">For agents and sellers</div><h1>Which buyers does this price shut out?</h1>
  <p class="lede-short">Enter a listing price and suburb. See which first home buyer schemes still work at that price, and the price that brings buyers back.</p></div>
  <div class="grid" style="grid-template-columns:minmax(0,360px) minmax(0,1fr);gap:20px" id="pc-grid">
    <form class="card" id="pcf" data-nosubmit style="align-self:start">
      <div class="fields" style="grid-template-columns:1fr">
        <label class="field" style="position:relative">Suburb<input id="pc-sub" type="search" autocomplete="off" placeholder="Suburb or postcode" value="${sub ? esc(`${cleanName(sub.n)} ${sub.s} ${sub.pc || ''}`) : ''}"><div class="ac" id="pc-ac" hidden style="top:62px;left:0;right:auto"></div></label>
        <label class="field">Listing price ($)<input id="pc-price" type="number" step="1000" min="50000" value="${price0}" placeholder="e.g. 869000"></label>
        <label class="field">Home<select id="pc-new"><option value="0">Established</option><option value="1" ${query.new === '1' ? 'selected' : ''}>New (never lived in)</option></select></label>
      </div>
      <button class="btn primary" style="margin-top:14px;width:100%" id="pc-go" type="button">Check this price</button>
      <p class="fine" style="margin-top:10px">Price caps as at ${date(RULES.asOf)}. Buyers must also meet each scheme's own income and eligibility rules.</p>
    </form>
    <div id="pc-out"><div class="card"><h3 style="margin-top:0">Why price matters</h3><p class="note">Government schemes stop at a price cap. In Perth the 5% Deposit Scheme and Help to Buy both stop at $850,000, so a home listed at $869,000 loses every first home buyer relying on either one. Pick a suburb and a price to see the limits there.</p></div></div>
  </div>`;
  const $ = (x) => main.querySelector(x);
  let buyerUrl = '';
  wireCopyLink(main, () => buyerUrl);
  attachSearch($('#pc-sub'), $('#pc-ac'), (x) => {
    sub = x;
    $('#pc-sub').value = `${cleanName(x.n)} ${x.s} ${x.pc || ''}`;
    run();
  });
  const run = (asked) => {
    const price = Math.round(+$('#pc-price').value || 0);
    const newBuild = $('#pc-new').value === '1';
    const out = $('#pc-out');
    if (!sub || price < 50000) {
      if (asked) out.innerHTML = `<div class="callout">${!sub ? 'Choose the suburb from the list.' : 'Enter the listing price.'}</div>`;
      return;
    }
    history.replaceState(null, '', `/price-check?${new URLSearchParams({ suburb: sub.id, price, ...(newBuild ? { new: 1 } : {}) })}`);
    const checks = schemeChecks(sub, price, { newBuild });
    const lost = checks.filter((c) => !c.ok && !c.na);
    const kept = checks.filter((c) => c.ok);
    // price steps below the listing price, and which buyers each one brings back
    const capText = (c) => (c.strict ? `Under ${aud(c.cap)}` : `${aud(c.cap)} or less`);
    const steps = [];
    for (const c of lost.filter((x) => x.cap && x.cap <= price).sort((a, b) => b.cap - a.cap || a.strict - b.strict)) {
      const last = steps.at(-1);
      if (last && last.cap === c.cap && last.strict === !!c.strict) last.names.push(c.name);
      else steps.push({ cap: c.cap, strict: !!c.strict, text: capText(c), names: [c.name] });
    }
    buyerUrl = `/afford?${new URLSearchParams({ home: price, suburb: sub.id, buyer: 'fhb' })}`;
    const place = `${cleanName(sub.n)} ${sub.s}`;
    out.innerHTML = `
    <div class="card">
      <div class="eyebrow">${esc(place)} · ${aud(price)} · ${newBuild ? 'new home' : 'established home'}</div>
      <h2 style="margin:4px 0 8px">${lost.length ? `${lost.length} of ${checks.filter((c) => !c.na).length} first home buyer schemes are out at this price` : 'Every first home buyer scheme still works at this price'}</h2>
      ${steps.length ? `<div class="callout green" style="margin:0 0 12px"><b>Prices that bring buyers back</b><ul class="steps-list">${steps.map((st, i) => `<li><b>${st.text}</b> (${aud(price - st.cap + (st.strict ? 1000 : 0))} less): ${i ? 'also ' : ''}buyers using ${st.names.map(esc).join(' and ')}</li>`).join('')}</ul></div>` : ''}
      <div class="tbl-wrap"><table class="cards-sm name-first"><thead><tr><th>Scheme</th><th class="n">Limit in ${esc(cleanName(sub.n))}</th><th>At ${aud(price, { compact: true })}</th></tr></thead><tbody>
        ${checks.map((c) => `<tr><td><b>${esc(c.name)}</b><div class="fine">${esc(c.who)}${c.note ? `. ${esc(c.note)}` : ''}</div></td><td class="n">${c.cap == null ? 'No price cap' : c.cap === 0 ? 'Not available' : c.strict ? `Under ${aud(c.cap)}` : aud(c.cap)}</td><td><span>${c.na ? `<span class="muted">${esc(c.na)}</span>` : c.ok ? `<span class="up">✓ Can use it</span>${c.detail ? ` · ${esc(c.detail)}` : ''}` : `<span class="down">✗ Priced out</span>${c.detail ? ` · ${esc(c.detail)}` : c.cap ? ` by ${aud(price - c.cap + (c.strict ? 1000 : 0))}` : ''}`}</span></td></tr>`).join('')}
      </tbody></table></div>
      <p class="fine" style="margin-top:8px">${esc(STATES[sub.s])} limits, checked ${date(RULES.asOf)}. Caps change; confirm with Housing Australia, Keystart or the state revenue office before relying on them. General information, not advice.</p>
    </div>
    <div class="card" style="margin-top:16px" id="buyer-link">
      <div class="card-head"><h3>Can you afford this home? A link for buyers</h3></div>
      <p class="note">Put this on the listing, brochure or open-home sign. Buyers enter their own savings and income and see whether ${aud(price, { compact: true })} fits, the cash they'd need and the schemes that apply. Nothing they enter is sent to anyone.</p>
      <div class="row" style="align-items:flex-start;gap:20px">
        <div id="qr" class="qr" aria-label="QR code for the buyer link"></div>
        <div style="flex:1;min-width:220px"><p class="mono" style="word-break:break-all;font-size:13px">${esc(location.origin + buyerUrl)}</p>
          <div class="row">${copyLinkButton('Copy buyer link')}<button class="btn" type="button" id="qr-save">Download QR code</button><a class="btn ghost" href="${esc(buyerUrl)}" data-link>Try it</a></div></div>
      </div>
    </div>
    <p class="note" style="margin-top:12px"><a href="${suburbUrl(sub)}" data-link>${esc(place)} suburb profile →</a></p>`;
    drawQr(location.origin + buyerUrl);
    countEvent('price-check');
  };
  $('#pc-go').addEventListener('click', () => run(true));
  $('#pc-price').addEventListener('keydown', (e) => e.key === 'Enter' && run(true));
  $('#pc-new').addEventListener('change', () => run());
  main.addEventListener('click', (e) => {
    if (!e.target.closest('#qr-save')) return;
    const c = main.querySelector('#qr canvas');
    if (!c) return;
    const a = document.createElement('a');
    a.href = c.toDataURL('image/png');
    a.download = 'ownaroo-buyer-qr.png';
    a.click();
  });
  if (sub && price0) run();
  return { list };
}

let qrLoading = null;
function drawQr(text) {
  const box = document.getElementById('qr');
  if (!box) return;
  qrLoading ||= new Promise((res, rej) => {
    if (window.QRCode) return res();
    const s = document.createElement('script');
    s.src = QR_LIB;
    s.onload = res;
    s.onerror = rej;
    document.head.append(s);
  });
  qrLoading
    .then(() => {
      box.innerHTML = '';
      // eslint-disable-next-line no-new
      new window.QRCode(box, { text, width: 180, height: 180, colorDark: '#15181e', colorLight: '#ffffff', correctLevel: window.QRCode.CorrectLevel.M });
      box.querySelectorAll('img').forEach((i) => (i.alt = 'QR code that opens the buyer link'));
      setTimeout(() => box.querySelectorAll('img').forEach((i) => (i.alt = 'QR code that opens the buyer link')), 50);
    })
    .catch(() => {
      qrLoading = null;
      box.innerHTML = '<p class="fine">The QR code couldn’t load. Copy the link instead.</p>';
    });
}
