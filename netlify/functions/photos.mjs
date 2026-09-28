// Freely licensed photos from Wikimedia Commons, with the credit and licence each one requires.
//   /api/photos?lat=-31.89&lng=115.90&name=Morley&n=6   photos geotagged in and around a suburb
//   /api/photos?wiki=Perth                              the lead photo of a Wikipedia article (cities)
// Results are cached on Netlify's CDN for 30 days, so Wikimedia sees about one request per suburb a month.
const UA = 'KeyzingBot/1.0 (https://keystone-au.netlify.app; Keyzing18@gmail.com) property research site';
const API = 'https://commons.wikimedia.org/w/api.php';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=86400',
      'netlify-cdn-cache-control': status === 200 ? 'public, s-maxage=2592000, stale-while-revalidate=604800' : 'no-store',
    },
  });

const get = async (url) => {
  const r = await fetch(url, { headers: { 'user-agent': UA, 'api-user-agent': UA }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`wikimedia ${r.status}`);
  return r.json();
};
const text = (html = '') => String(html).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, ' ').trim();

// Things that are near a suburb but say nothing about living there.
const JUNK = /\b(ISS\d*|view of earth|astronaut|satellite|landsat|airport|aerodrome|helicopters?|hangars?|runway|aircraft|logo|map|locator|location map|diagram|chart|plaque|sign(age)?|phones?|aed|interior|toilet|menu|receipt|screenshot|mcdonald'?s|kfc|hungry jack'?s|realme|iphone|samsung|bus stop pole|timetable|graffiti|rubbish|bin|coat of arms|flag|seal)\b/i;
const GOOD = /\b(street|streetscape|house|houses|home|homes|residential|park|reserve|lake|beach|foreshore|river|view|panorama|skyline|aerial|jetty|pier|coast|bushland|lookout|sunset|garden|trees|village|town centre)\b/i;
const OK = /\b(road|avenue|oval|station|shops|church|school|library|hall|cafe|market)\b/i;
const BADCAT = /\b(animals?|insects?|birds?|species|taxa|fungi|plants? by|mobile phones|people|portraits|vehicles by|aircraft|logos)\b/i;

function toPhoto(p) {
  const ii = p.imageinfo?.[0];
  if (!ii || !/^image\/(jpeg|png|webp)$/.test(ii.mime || '')) return null;
  const m = ii.extmetadata || {};
  const license = text(m.LicenseShortName?.value);
  if (!license || /fair use|non-free/i.test(license)) return null;
  return {
    title: p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/_/g, ' '),
    thumb: ii.thumburl,
    width: ii.thumbwidth,
    height: ii.thumbheight,
    page: ii.descriptionurl,
    artist: text(m.Artist?.value).slice(0, 80) || 'Unknown',
    license,
    licenseUrl: m.LicenseUrl?.value || '',
    categories: m.Categories?.value || '',
    big: (ii.width || 0) * (ii.height || 0),
  };
}

async function nearby(lat, lng, name, n) {
  const q = new URLSearchParams({ action: 'query', generator: 'geosearch', ggscoord: `${lat}|${lng}`, ggsradius: '2500', ggsnamespace: '6', ggslimit: '50', prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '960', format: 'json', formatversion: '2' });
  const d = await get(`${API}?${q}`);
  const nm = String(name || '').toLowerCase().replace(/\s*\(.*\)/, '');
  const scored = (d.query?.pages || [])
    .map(toPhoto)
    .filter(Boolean)
    .filter((x) => !JUNK.test(x.title) && !BADCAT.test(x.categories) && x.width >= 600 && x.width / x.height >= 1 && x.width / x.height <= 2.6)
    .map((x) => {
      let s = 0;
      const hay = `${x.title} ${x.categories}`.toLowerCase();
      if (nm && hay.includes(nm)) s += 3;
      if (GOOD.test(x.title)) s += 3;
      else if (OK.test(x.title)) s += 1;
      if (GOOD.test(x.categories)) s += 1;
      if (/quality images|featured pictures|valued images/i.test(x.categories)) s += 2;
      if (x.big > 3e6) s += 1;
      return { ...x, s };
    })
    .filter((x) => x.s >= 2)
    .sort((a, b) => b.s - a.s || b.big - a.big);
  // keep variety: at most two photos with nearly the same title
  const seen = {};
  return scored.filter((x) => (seen[x.title.slice(0, 18)] = (seen[x.title.slice(0, 18)] || 0) + 1) <= 2).slice(0, n);
}

async function lead(title) {
  const w = await get(`https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', titles: title, prop: 'pageimages', piprop: 'name', format: 'json', formatversion: '2', redirects: '1' })}`);
  const file = w.query?.pages?.[0]?.pageimage;
  if (!file || /\.svg$/i.test(file) || JUNK.test(file)) return [];
  const d = await get(`${API}?${new URLSearchParams({ action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|size|mime', iiurlwidth: '960', format: 'json', formatversion: '2' })}`);
  return (d.query?.pages || []).map(toPhoto).filter(Boolean);
}

export default async (req) => {
  const u = new URL(req.url).searchParams;
  try {
    const n = Math.max(1, Math.min(8, +u.get('n') || 6));
    let photos = [];
    if (u.get('wiki')) photos = await lead(u.get('wiki').slice(0, 120));
    else {
      const lat = +u.get('lat');
      const lng = +u.get('lng');
      if (!(lat < -9 && lat > -45 && lng > 110 && lng < 155)) return json({ error: 'coordinates outside Australia' }, 400);
      photos = await nearby(lat.toFixed(4), lng.toFixed(4), u.get('name'), n);
      // few geotagged photos: fall back to the suburb's Wikipedia article photo ("Huntly, Victoria")
      const STATE = { NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', SA: 'South Australia', WA: 'Western Australia', TAS: 'Tasmania', NT: 'Northern Territory', ACT: 'Australian Capital Territory' }[u.get('state')];
      if (photos.length < 2 && u.get('name') && STATE) {
        const extra = await lead(`${u.get('name').replace(/\s*\(.*\)/, '')}, ${STATE}`).catch(() => []);
        photos = [...extra.filter((x) => !photos.some((p) => p.page === x.page)), ...photos].slice(0, n);
      }
    }
    return json({ photos: photos.map(({ categories, big, s, ...p }) => p), source: 'Wikimedia Commons' });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
};

export const config = { path: '/api/photos' };
