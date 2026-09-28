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
