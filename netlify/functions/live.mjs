// Live data that doesn't depend on the GitHub Actions schedule (which GitHub often delays by hours).
// /api/live-index: Cotality daily home value index, merged with the site's stored history.
// /api/live-news:  housing headlines from the RSS feeds.
// Each response is cached on Netlify's CDN for an hour and refreshed in the background after that,
// so visitors always get a fast answer that is at most about an hour old.
import { CODE_TO_REGION, changes } from '../../scripts/cotality.mjs';
import { collectNews } from '../../scripts/news.mjs';

const FEED = 'https://au-indices.cotality.com/asx.json';
const ymd = (n) => `${String(n).slice(0, 4)}-${String(n).slice(4, 6)}-${String(n).slice(6, 8)}`;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': status === 200 ? 'public, s-maxage=3600, stale-while-revalidate=7200' : 'no-store',
    },
  });

async function liveIndex(req) {
  const [feedRes, stored] = await Promise.all([
    fetch(FEED, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'KeystoneBot/1.0 (+https://keystone-au.netlify.app)' } }),
    fetch(new URL('/data/index.json', req.url), { signal: AbortSignal.timeout(5000) }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ]);
  if (!feedRes.ok) throw new Error(`index feed ${feedRes.status}`);
  const feed = await feedRes.json();
  const daily = {};
  const keys = new Set([...Object.keys(stored?.daily || {}), ...(feed.worm || []).map((w) => CODE_TO_REGION[w.code] || w.code)]);
  for (const key of keys) {
    const m = new Map(stored?.daily?.[key]?.series || []);
    const w = (feed.worm || []).find((x) => (CODE_TO_REGION[x.code] || x.code) === key);
    for (const [n, v] of w?.data || []) m.set(ymd(n), v);
    const series = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    daily[key] = { ...changes(series), series: series.slice(-400) };
  }
  return {
    ...(stored || {}),
    updated: new Date().toISOString(),
    generated: ymd(feed.generatedDate),
    monthEnd: feed.monthName || stored?.monthEnd,
    live: true,
    daily,
  };
}

export default async (req) => {
  const name = new URL(req.url).pathname.replace(/^\/api\/live-/, '');
  try {
    if (name === 'index') return json(await liveIndex(req));
    if (name === 'news') {
      const d = await collectNews({ timeout: 6000 });
      if (d.items.length < 10) throw new Error('too few headlines');
      return json({ ...d, live: true });
    }
    return json({ error: 'unknown feed' }, 404);
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
};

export const config = { path: ['/api/live-index', '/api/live-news'] };
