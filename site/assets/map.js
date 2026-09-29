// Base map tiles, configured in site.js (one place to switch provider). Dark mode inverts the tiles with CSS.
// When a MapTiler key is set in Netlify's environment (MAPTILER_KEY), /api/config hands it over and the maps use
// MapTiler's tiles, which are built for production traffic; until then, OpenStreetMap's own servers (light use only).
import { SITE } from './site.js';

let keyed = null;
export const tilesReady = fetch('/api/config')
  .then((r) => (r.ok ? r.json() : null))
  .then((c) => {
    if (c?.maptilerKey) {
      keyed = {
        url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(c.maptilerKey)}`,
        attribution: '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">&copy; OpenStreetMap contributors</a>',
        maxZoom: 20,
      };
    }
  })
  .catch(() => {});

export function baseTiles() {
  const t = keyed || SITE.tiles;
  return L.tileLayer(t.url, { maxZoom: t.maxZoom || 19, attribution: t.attribution });
}
