// Live data that doesn't depend on the GitHub Actions schedule (which GitHub often delays by hours).
// /api/live-news:  housing headlines from the RSS feeds.
// Each response is cached on Netlify's CDN for an hour and refreshed in the background after that,
// so visitors always get a fast answer that is at most about an hour old.
import { collectNews } from '../../scripts/news.mjs';
import { collectRba } from '../../scripts/rba.mjs';


const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
      'netlify-cdn-cache-control': status === 200 ? 'public, s-maxage=3600, stale-while-revalidate=7200' : 'no-store',
    },
  });

export default async (req) => {
  const name = new URL(req.url).pathname.replace(/^\/api\/live-/, '');
  try {
    if (name === 'news') {
      const d = await collectNews({ timeout: 6000 });
      if (d.items.length < 10) throw new Error('too few headlines');
      return json({ ...d, live: true });
    }
    if (name === 'rba') {
      const d = await collectRba();
      if (!d?.cashRate?.current) throw new Error('no cash rate');
      return json({ ...d, live: true });
    }
    return json({ error: 'unknown feed' }, 404);
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
};

export const config = { path: ['/api/live-news', '/api/live-rba'] };
