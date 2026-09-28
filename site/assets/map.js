// Base map tiles, configured in site.js (one place to switch provider). Dark mode inverts the tiles with CSS.
import { SITE } from './site.js';
export function baseTiles() {
  const t = SITE.tiles;
  return L.tileLayer(t.url, { maxZoom: t.maxZoom || 19, attribution: t.attribution });
}
