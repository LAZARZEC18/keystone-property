// Base map tiles: OpenStreetMap standard tiles (light traffic, attributed per the OSM tile policy).
// Dark mode inverts the tiles with CSS rather than loading a second tile set.
export function baseTiles() {
  return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });
}
