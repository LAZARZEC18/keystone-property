// Address lookup. With a MAPTILER_KEY set in Netlify's environment variables it uses MapTiler's geocoder (built for
// production traffic); otherwise OpenStreetMap Nominatim, server-side with an identifying User-Agent and a cache, as
// its usage policy requires. One lookup per search, never autocomplete. The address arrives in the request body, so
// it isn't written into request logs, and results are cached by a hash of the address, not the address itself.
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';
const UA = 'OwnarooAU/1.0 (+https://keystone-au.netlify.app; property research site)';

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

async function maptiler(q, key) {
  const r = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(q)}.json?${new URLSearchParams({ key, country: 'au', limit: '3', language: 'en' })}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`geocoder ${r.status}`);
  const d = await r.json();
  const ctx = (f, id) => (f.context || []).find((c) => String(c.id || '').startsWith(id))?.text || null;
  return (d.features || []).map((f) => ({
    label: f.place_name,
    lat: f.center[1],
    lng: f.center[0],
    precision: f.address ? 'address' : (f.place_type || []).includes('street') ? 'street' : 'area',
    number: f.address || null,
    street: (f.place_type || []).some((t) => t === 'address' || t === 'street') ? f.text : null,
    suburb: ctx(f, 'place') || ctx(f, 'locality') || ctx(f, 'municipal_district') || null,
    postcode: ctx(f, 'postal_code'),
    state: ctx(f, 'region'),
  }));
}

async function readQuery(req) {
  if (req.method === 'POST') {
    const b = await req.json().catch(() => ({}));
    return String(b.q || '');
  }
  return new URL(req.url).searchParams.get('q') || '';
}

export default async (req) => {
  const q = (await readQuery(req)).trim().slice(0, 160);
  if (q.length < 4) return json({ error: 'address too short' }, 400);
  const key = createHash('sha256').update(q.toLowerCase()).digest('hex').slice(0, 32);
  let store = null;
  try {
    store = getStore('geocode');
    const hit = await store.get(key, { type: 'json' });
    if (hit && Date.now() - hit.at < 30 * 864e5) return json(hit.body);
  } catch {
    store = null; // no cache available (local dev)
  }
  const mt = process.env.MAPTILER_KEY;
  try {
    if (mt) {
      const results = await maptiler(q, mt);
      const body = { results, attribution: '© MapTiler © OpenStreetMap contributors' };
      await store?.setJSON(key, { at: Date.now(), body }).catch(() => {});
      return json(body);
    }
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
    const body = { results: out, attribution: 'Address data © OpenStreetMap contributors (ODbL)' };
    await store?.setJSON(key, { at: Date.now(), body }).catch(() => {});
    return json(body);
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
};

export const config = { path: '/api/geocode' };
