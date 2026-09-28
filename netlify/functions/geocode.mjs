// Address lookup via OpenStreetMap Nominatim (server-side so we can send an identifying
// User-Agent and cache results, as Nominatim's usage policy requires). One lookup per search, no autocomplete.
const UA = 'Market LenzAU/1.0 (+https://keystone-au.netlify.app; property research site)';

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': status === 200 ? 'public, s-maxage=604800' : 'no-store',
    },
  });

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, format: 'jsonv2', addressdetails: '1', countrycodes: 'au', limit: '3' })}`;
  // Nominatim allows about one request a second; if it's busy, wait and try once more before giving up
  for (let attempt = 0; attempt < 2; attempt++) {
    const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-AU' }, signal: AbortSignal.timeout(8000) });
    if (r.ok) return r.json();
    if (attempt === 0 && (r.status === 429 || r.status >= 500)) await new Promise((res) => setTimeout(res, 1300));
    else throw new Error(`geocoder ${r.status}`);
  }
  throw new Error('geocoder busy');
}

export default async (req) => {
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 160);
  if (q.length < 4) return json({ error: 'address too short' }, 400);
  try {
    let res = await nominatim(q);
    let fallback = false;
    if (!res.length) {
      // drop the house/unit number and try the street
      res = await nominatim(q.replace(/^\s*(unit\s*)?[\d/\-a-z]+\s*[,/]?\s*/i, ''));
      fallback = true;
    }
    const ROAD = new Set(['road', 'street', 'residential', 'tertiary', 'secondary', 'primary', 'unclassified', 'living_street', 'service', 'pedestrian', 'trunk']);
    const out = res.map((x) => ({
      label: x.display_name,
      lat: +x.lat,
      lng: +x.lon,
      // 'address' = house number found; 'street' = the street exists but not that number; 'area' = only a suburb/town matched
      precision: x.address?.house_number && !fallback ? 'address' : x.address?.road && (ROAD.has(x.addresstype) || x.addresstype === 'road' || x.address?.house_number) ? 'street' : 'area',
      number: x.address?.house_number || null,
      street: x.address?.road || null,
      suburb: x.address?.suburb || x.address?.town || x.address?.village || x.address?.city_district || x.address?.city || null,
      postcode: x.address?.postcode || null,
      state: x.address?.state || null,
    }));
    return json({ results: out, attribution: 'Address data © OpenStreetMap contributors (ODbL)' });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
};

export const config = { path: '/api/geocode' };
