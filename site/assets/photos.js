// Photos from Wikimedia Commons (via /api/photos), always shown with the photographer's credit and licence.
import { esc } from './ui.js';
import { PHOTOS } from './photos-data.js';

const cache = new Map();
const get = (qs) => {
  if (!cache.has(qs)) cache.set(qs, fetch(`/api/photos?${qs}`).then((r) => (r.ok ? r.json() : { photos: [] })).then((d) => d.photos || []).catch(() => []));
  return cache.get(qs);
};

export const wikiPhoto = (title) => get(new URLSearchParams({ wiki: title }).toString()).then((p) => p[0] || null);

export function credit(p) {
  return `Photo: <a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.artist)}</a>, ${p.licenseUrl ? `<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>` : esc(p.license)}, via Wikimedia Commons`;
}

/** Background photo for a card (e.g. a city), with its credit. */
export function photoCard(p, inner, { href = '', alt = '' } = {}) {
  const img = p ? `<img src="${esc(p.thumb)}" alt="${esc(alt || p.title)}" loading="lazy">` : '<div class="photo-ph" aria-hidden="true"></div>';
  const tag = href ? 'a' : 'div';
  return `<${tag} class="photo-card"${href ? ` href="${href}" data-link` : ''}>${img}<div class="photo-card-body">${inner}</div>${p ? `<small class="photo-credit">${esc(p.artist)} · ${esc(p.license)}</small>` : ''}</${tag}>`;
}

/** Links that show a place's actual streets and homes (Google Street View and satellite, recent sold listings). */
export function seeTheArea(lat, lng, { place = '', sold = '' } = {}) {
  const sv = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
  const sat = `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=16&basemap=satellite`;
  return `<div class="see-area"><div><b>${place && /^\d|\b(street|st|road|rd|avenue|ave|drive|dr|place|pl|court|ct|crescent|cres|way|lane|parade|terrace|close)\b/i.test(place) ? `See the street around ${esc(place)}` : `See the streets and homes${place ? ` in ${esc(place)}` : ''}`}</b><p class="note" style="margin:2px 0 0">Walk the streets or look from above before you inspect. Opens in a new tab.</p></div><div class="row"><a class="btn" href="${sv}" target="_blank" rel="noopener">Street View ↗</a><a class="btn" href="${sat}" target="_blank" rel="noopener">Satellite view ↗</a>${sold ? `<a class="btn" href="${esc(sold)}" target="_blank" rel="noopener">Photos of recently sold homes ↗</a>` : ''}</div></div>`;
}

// ---- Curated photos: responsive images, a swipeable strip and a full-screen viewer with zoom

const byId = new Map(PHOTOS.map((p) => [p.id, p]));
export const photo = (id) => byId.get(id);
export const photosWhere = (f) => PHOTOS.filter(f);
const src = (p, w) => `/assets/media/photos/${p.id}-${w}.webp`;
const srcset = (p) => `${src(p, 480)} 480w, ${src(p, 960)} 960w, ${src(p, 1920)} 1920w`;
export const curatedCredit = (p) => `Photo: <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)}</a>, <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>, Wikimedia Commons`;

/** A responsive <img> for a curated photo. */
export function img(id, { sizes = '(max-width: 700px) 100vw, 50vw', cls = '', eager = false, alt } = {}) {
  const p = byId.get(id);
  if (!p) return '';
  return `<img class="${cls}" src="${src(p, 960)}" srcset="${srcset(p)}" sizes="${sizes}" alt="${esc(alt ?? `${p.caption}, ${p.city}`)}" width="960" height="640" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

/** A card image that opens the viewer, with a small credit. */
export function figure(id, { sizes, cls = '' } = {}) {
  const p = byId.get(id);
  if (!p) return '';
  return `<figure class="cphoto ${cls}"><button type="button" class="cphoto-btn" data-photo="${p.id}" data-set="${p.id}" aria-label="View larger: ${esc(p.caption)}">${img(id, { sizes })}<span class="cphoto-zoom" aria-hidden="true">⤢</span></button><figcaption>${esc(p.caption)}, ${esc(p.city)} <span>${curatedCredit(p)}</span></figcaption></figure>`;
}

/** A horizontal, swipeable strip of photos with arrows; every photo opens the viewer. */
export function strip(ids, { title = '', note = '' } = {}) {
  const list = ids.map((id) => byId.get(id)).filter(Boolean);
  const set = list.map((p) => p.id).join(',');
  return `<div class="pstrip" data-pstrip>
    ${title ? `<div class="spread pstrip-head"><h2>${esc(title)}</h2><div class="row"><button type="button" class="btn sm pstrip-nav" data-dir="-1" aria-label="Previous photos">←</button><button type="button" class="btn sm pstrip-nav" data-dir="1" aria-label="More photos">→</button></div></div>` : ''}
    <div class="pstrip-track" tabindex="0" aria-label="${esc(title || 'Photos')}">${list
      .map((p) => `<button type="button" class="pstrip-item" data-photo="${p.id}" data-set="${set}" aria-label="View larger: ${esc(p.caption)}, ${esc(p.city)}">${img(p.id, { sizes: '(max-width: 700px) 80vw, 340px' })}<span class="pstrip-cap"><b>${esc(p.city)}</b> ${esc(p.caption)}</span></button>`)
      .join('')}</div>
    ${note ? `<p class="fine" style="margin-top:6px">${note}</p>` : ''}
    <details class="fine pstrip-credits"><summary>Photo credits</summary>${list.map((p) => `${esc(p.caption)}, ${esc(p.city)}: <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)}</a>, <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>`).join(' · ')}</details>
  </div>`;
}

let viewer = null;
function openViewer(ids, start) {
  const list = ids.map((id) => byId.get(id)).filter(Boolean);
  let i = Math.max(0, list.findIndex((p) => p.id === start));
  let zoom = 1;
  let pan = [0, 0];
  const el = document.createElement('div');
  el.className = 'pviewer';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="pv-stage"><img alt=""></div>
    <button type="button" class="pv-btn pv-close" aria-label="Close">×</button>
    <button type="button" class="pv-btn pv-prev" aria-label="Previous photo">‹</button>
    <button type="button" class="pv-btn pv-next" aria-label="Next photo">›</button>
    <div class="pv-bar"><div class="pv-cap"></div><div class="pv-tools"><span class="pv-count"></span><button type="button" class="pv-zoom btn sm">Zoom</button></div><div class="pv-thumbs">${list.map((p, k) => `<button type="button" data-k="${k}" aria-label="${esc(p.caption)}"><img src="${src(p, 480)}" alt="" loading="lazy"></button>`).join('')}</div></div>`;
  const im = el.querySelector('.pv-stage img');
  const apply = () => {
    im.style.transform = `translate(${pan[0]}px, ${pan[1]}px) scale(${zoom})`;
    el.classList.toggle('zoomed', zoom > 1);
    el.querySelector('.pv-zoom').textContent = zoom > 1 ? 'Fit' : 'Zoom';
  };
  const show = (k) => {
    i = (k + list.length) % list.length;
    const p = list[i];
    zoom = 1;
    pan = [0, 0];
    apply();
    im.src = src(p, 1920);
    im.alt = `${p.caption}, ${p.city}`;
    el.querySelector('.pv-cap').innerHTML = `<b>${esc(p.caption)}</b>, ${esc(p.city)} ${esc(p.state)}<small>${curatedCredit(p)}</small>`;
    el.querySelector('.pv-count').textContent = `${i + 1} / ${list.length}`;
    el.querySelectorAll('.pv-thumbs button').forEach((b, k2) => b.classList.toggle('on', k2 === i));
    el.querySelector(`.pv-thumbs button[data-k="${i}"]`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
    new Image().src = src(list[(i + 1) % list.length], 1920);
  };
  const close = () => {
    document.removeEventListener('keydown', key);
    el.remove();
    document.body.style.overflow = '';
    viewer?.focus?.();
    viewer = null;
  };
  const key = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === '+' || e.key === '=') { zoom = Math.min(4, zoom * 1.5); apply(); }
    else if (e.key === '-') { zoom = Math.max(1, zoom / 1.5); if (zoom === 1) pan = [0, 0]; apply(); }
  };
  el.addEventListener('click', (e) => {
    if (e.target.closest('.pv-close') || e.target === el) close();
    else if (e.target.closest('.pv-prev')) show(i - 1);
    else if (e.target.closest('.pv-next')) show(i + 1);
    else if (e.target.closest('.pv-zoom')) { zoom = zoom > 1 ? 1 : 2.2; pan = [0, 0]; apply(); }
    else if (e.target.closest('.pv-thumbs button')) show(+e.target.closest('button').dataset.k);
  });
  // double-click / double-tap to zoom, wheel to zoom, drag to pan or swipe
  const stage = el.querySelector('.pv-stage');
  stage.addEventListener('dblclick', () => { zoom = zoom > 1 ? 1 : 2.2; pan = [0, 0]; apply(); });
  stage.addEventListener('wheel', (e) => { e.preventDefault(); zoom = Math.max(1, Math.min(4, zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); if (zoom === 1) pan = [0, 0]; apply(); }, { passive: false });
  let start0 = null;
  let lastTap = 0;
  stage.addEventListener('pointerdown', (e) => {
    start0 = { x: e.clientX, y: e.clientY, pan: [...pan], t: Date.now() };
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!start0 || zoom === 1) return;
    pan = [start0.pan[0] + (e.clientX - start0.x), start0.pan[1] + (e.clientY - start0.y)];
    apply();
  });
  stage.addEventListener('pointerup', (e) => {
    if (!start0) return;
    const dx = e.clientX - start0.x;
    const dy = e.clientY - start0.y;
    if (zoom === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
    else if (zoom === 1 && Math.abs(dx) < 6 && Math.abs(dy) < 6 && e.pointerType !== 'mouse') {
      if (Date.now() - lastTap < 300) { zoom = 2.2; apply(); }
      lastTap = Date.now();
    }
    start0 = null;
  });
  document.addEventListener('keydown', key);
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  show(i);
  el.querySelector('.pv-close').focus();
}

/** One listener for every photo on the page. */
export function wirePhotos(root = document) {
  if (root.__photos) return;
  root.__photos = true;
  root.addEventListener('click', (e) => {
    const b = e.target.closest('[data-photo]');
    if (b) {
      viewer = b;
      openViewer(b.dataset.set.split(','), b.dataset.photo);
      return;
    }
    const nav = e.target.closest('.pstrip-nav');
    if (nav) {
      const t = nav.closest('[data-pstrip]').querySelector('.pstrip-track');
      t.scrollBy({ left: +nav.dataset.dir * t.clientWidth * 0.85, behavior: 'smooth' });
    }
  });
}

/** A one-line credit list for several curated photos (for cards that are links themselves). */
export function photoCredits(ids) {
  const list = ids.map((id) => byId.get(id)).filter(Boolean);
  if (!list.length) return '';
  return `<p class="fine photo-credits">Photos: ${list.map((p) => `${esc(p.city)} by <a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.author)}</a> (<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>)`).join('; ')}, via Wikimedia Commons.</p>`;
}
