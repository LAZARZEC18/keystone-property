// Property facts for an exact address from Domain's Properties & Locations API (needs DOMAIN_API_KEY).
// Returns bedrooms, bathrooms, land size, property type, sale history and Domain's own price estimate when the plan allows it.
const API = 'https://api.domain.com.au/v1';

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': status === 200 ? 'public, s-maxage=86400' : 'no-store',
      ...extra,
    },
  });

export default async (req) => {
  const key = process.env.DOMAIN_API_KEY;
  // not set up yet: answer normally (no console error) and don't cache, so adding the key takes effect at once
  if (!key) return json({ configured: false }, 200, { 'netlify-cdn-cache-control': 'no-store' });
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 160);
  if (q.length < 5) return json({ error: 'address too short' }, 400);
  const h = { 'X-Api-Key': key, accept: 'application/json' };
  try {
    const s = await fetch(`${API}/properties/_suggest?${new URLSearchParams({ terms: q, pageSize: '1', channel: 'All' })}`, { headers: h, signal: AbortSignal.timeout(8000) });
    if (!s.ok) return json({ configured: true, error: `suggest ${s.status}` }, 502);
    const hit = (await s.json())?.[0];
    if (!hit) return json({ configured: true, found: false });
    const d = await fetch(`${API}/properties/${encodeURIComponent(hit.id)}`, { headers: h, signal: AbortSignal.timeout(8000) });
    const p = d.ok ? await d.json() : {};
    let estimate = null;
    try {
      const e = await fetch(`${API}/properties/${encodeURIComponent(hit.id)}/priceEstimate`, { headers: h, signal: AbortSignal.timeout(8000) });
      if (e.ok) {
        const x = await e.json();
        estimate = { low: x.lowerPrice ?? null, mid: x.midPrice ?? null, high: x.upperPrice ?? null, confidence: x.priceConfidence ?? null, date: x.date ?? null };
      }
    } catch {
      /* estimate not in this plan */
    }
    const sales = (p.history?.sales || []).map((x) => ({ date: x.date, price: x.price ?? x.apmPrice ?? null, type: x.type || null })).filter((x) => x.price);
    return json({
      configured: true,
      found: true,
      id: hit.id,
      address: hit.address,
      components: hit.addressComponents || null,
      type: p.propertyCategory || p.propertyType || null,
      beds: p.bedrooms ?? null,
      baths: p.bathrooms ?? null,
      cars: p.carSpaces ?? null,
      land: p.areaSize ?? p.landArea ?? null,
      built: p.yearBuilt ?? null,
      lat: p.addressCoordinate?.lat ?? null,
      lng: p.addressCoordinate?.lon ?? null,
      photo: p.photos?.[0]?.fullUrl || null,
      sales,
      estimate,
      url: `https://www.domain.com.au/property-profile/${encodeURIComponent(String(hit.address || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`,
      attribution: 'Property data powered by Domain',
    });
  } catch (e) {
    return json({ configured: true, error: String(e.message || e) }, 502);
  }
};

export const config = { path: '/api/property' };
