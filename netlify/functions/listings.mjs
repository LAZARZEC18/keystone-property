// Live property listings through Domain's official API (https://developer.domain.com.au).
// Needs a Domain API key in the Netlify environment: DOMAIN_API_KEY.
// Every result keeps Domain's attribution and links back to the original listing, as Domain's terms require.

const API = 'https://api.domain.com.au/v1/listings/residential/_search';

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': status === 200 ? 'public, s-maxage=900, stale-while-revalidate=3600' : 'no-store',
      ...extra,
    },
  });

/** "$850,000 - $900,000" / "Offers over $700k" / "$1.2m" -> number (lower bound) or null. */
export function parsePrice(text) {
  if (!text) return null;
  const t = String(text).toLowerCase().replace(/,/g, '');
  const m = [...t.matchAll(/\$?\s*(\d+(?:\.\d+)?)\s*(m|mil|million|k|thousand)?/g)]
    .map((x) => {
      let v = Number(x[1]);
      if (x[2]?.startsWith('m')) v *= 1e6;
      else if (x[2] === 'k' || x[2] === 'thousand') v *= 1e3;
      return v;
    })
    .filter((v) => v >= 50000 && v <= 50e6);
  return m.length ? Math.min(...m) : null;
}

const STATES = new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT']);

export default async (req) => {
  const key = process.env.DOMAIN_API_KEY;
  if (!key) {
    return json({ configured: false, message: 'Live listings need a Domain API key. Add DOMAIN_API_KEY in Netlify > Site configuration > Environment variables.' }, 501);
  }
  const u = new URL(req.url);
  const suburb = (u.searchParams.get('suburb') || '').slice(0, 60);
  const state = (u.searchParams.get('state') || '').toUpperCase();
  const postcode = (u.searchParams.get('postcode') || '').replace(/\D/g, '').slice(0, 4);
  if (!suburb || !STATES.has(state)) return json({ error: 'suburb and state are required' }, 400);
  const types = (u.searchParams.get('types') || '').split(',').filter((x) => ['House', 'ApartmentUnitFlat', 'Townhouse', 'Villa', 'Duplex', 'SemiDetached', 'Terrace', 'NewApartments', 'NewHomeDesigns', 'NewLand', 'VacantLand'].includes(x));
  const listingType = u.searchParams.get('mode') === 'rent' ? 'Rent' : 'Sale';
  const body = {
    listingType,
    pageSize: Math.min(40, Number(u.searchParams.get('size')) || 20),
    pageNumber: Math.max(1, Number(u.searchParams.get('page')) || 1),
    sort: { sortKey: 'DateListed', direction: 'Descending' },
    locations: [{ state, suburb, postCode: postcode || undefined, includeSurroundingSuburbs: u.searchParams.get('surrounding') === '1' }],
  };
  if (types.length) body.propertyTypes = types;
  const minBeds = Number(u.searchParams.get('beds'));
  if (minBeds) body.minBedrooms = minBeds;
  const maxPrice = Number(u.searchParams.get('max'));
  if (maxPrice) body.maxPrice = maxPrice;
  const minPrice = Number(u.searchParams.get('min'));
  if (minPrice) body.minPrice = minPrice;

  let r;
  try {
    r = await fetch(API, {
      method: 'POST',
      headers: { 'X-Api-Key': key, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(12000),
    });
  } catch (e) {
    return json({ error: 'Domain API did not respond', detail: String(e.message || e) }, 502);
  }
  if (!r.ok) {
    const text = await r.text();
    return json({ error: `Domain API returned ${r.status}`, detail: text.slice(0, 300) }, r.status === 429 ? 429 : 502);
  }
  const data = await r.json();
  const total = Number(r.headers.get('x-total-count')) || null;
  const items = [];
  for (const it of Array.isArray(data) ? data : []) {
    const listings = it.type === 'Project' ? it.listings || [] : [it.listing];
    for (const l of listings) {
      if (!l) continue;
      const pd = l.propertyDetails || {};
      items.push({
        id: l.id,
        url: l.listingSlug ? `https://www.domain.com.au/${l.listingSlug}` : `https://www.domain.com.au/${l.id}`,
        address: pd.displayableAddress || [pd.unitNumber, pd.streetNumber, pd.street, pd.suburb].filter(Boolean).join(' '),
        suburb: pd.suburb,
        postcode: pd.postcode,
        type: pd.propertyType,
        beds: pd.bedrooms ?? null,
        baths: pd.bathrooms ?? null,
        cars: pd.carspaces ?? null,
        land: pd.landArea ?? null,
        lat: pd.latitude ?? null,
        lng: pd.longitude ?? null,
        displayPrice: l.priceDetails?.displayPrice || '',
        price: l.priceDetails?.price || parsePrice(l.priceDetails?.displayPrice),
        headline: l.headline || '',
        image: l.media?.find((m) => m.category === 'Image')?.url || l.media?.[0]?.url || null,
        agency: l.advertiser?.name || '',
        listed: l.dateListed || null,
        isNew: !!(l.isNewDevelopment || /^New/.test(pd.propertyType || '')),
      });
    }
  }
  return json({ configured: true, total, count: items.length, items, attribution: 'Listings powered by Domain' });
};

export const config = { path: '/api/listings' };
