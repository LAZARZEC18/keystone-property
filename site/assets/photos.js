// Photos from Wikimedia Commons (via /api/photos), always shown with the photographer's credit and licence.
import { esc } from './ui.js';

const cache = new Map();
const get = (qs) => {
  if (!cache.has(qs)) cache.set(qs, fetch(`/api/photos?${qs}`).then((r) => (r.ok ? r.json() : { photos: [] })).then((d) => d.photos || []).catch(() => []));
  return cache.get(qs);
};

export const suburbPhotos = (s, n = 6) => get(new URLSearchParams({ lat: s.lat, lng: s.lng, name: String(s.n || '').replace(/\s*\(.*\)/, ''), state: s.s, n }).toString());
export const wikiPhoto = (title) => get(new URLSearchParams({ wiki: title }).toString()).then((p) => p[0] || null);

export function credit(p) {
  return `Photo: <a href="${esc(p.page)}" target="_blank" rel="noopener">${esc(p.artist)}</a>, ${p.licenseUrl ? `<a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener">${esc(p.license)}</a>` : esc(p.license)}, via Wikimedia Commons`;
}

/** A horizontal gallery of photos, each with its credit. */
export function gallery(photos, { place = '' } = {}) {
  if (!photos.length) return '';
  return `<div class="photo-strip" role="list">${photos
    .map((p, i) => `<figure class="photo${i === 0 ? ' lead' : ''}" role="listitem"><img src="${esc(p.thumb)}" alt="${esc(p.title)}${place ? `, ${esc(place)}` : ''}" loading="lazy" width="${p.width}" height="${p.height}"><figcaption>${esc(p.title)}<span>${credit(p)}</span></figcaption></figure>`)
    .join('')}</div>`;
}

/** Fill an element with a suburb's photos when they arrive; removes it if there are none. */
export async function fillSuburbPhotos(el, s, { n = 6, place = '' } = {}) {
  if (!el) return;
  const photos = await suburbPhotos(s, n);
  if (!photos.length) return el.remove();
  el.innerHTML = gallery(photos, { place }) + `<p class="fine photo-note">Photos taken in and around ${esc(place || 'this area')} by Wikimedia Commons contributors. They show the area, not a particular property.</p>`;
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
  return `<div class="see-area"><div><b>See the streets and homes${place ? ` in ${esc(place)}` : ''}</b><p class="note" style="margin:2px 0 0">Walk the streets or look from above before you inspect. Opens in a new tab.</p></div><div class="row"><a class="btn" href="${sv}" target="_blank" rel="noopener">Street View ↗</a><a class="btn" href="${sat}" target="_blank" rel="noopener">Satellite view ↗</a>${sold ? `<a class="btn" href="${esc(sold)}" target="_blank" rel="noopener">Photos of recently sold homes ↗</a>` : ''}</div></div>`;
}
