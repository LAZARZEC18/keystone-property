// Public, browser-side settings that live in Netlify's environment variables rather than the code.
// MAPTILER_KEY is a browser key (restrict it to your domain in the MapTiler dashboard).
export default async () =>
  new Response(JSON.stringify({ maptilerKey: process.env.MAPTILER_KEY || null }), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=300', 'netlify-cdn-cache-control': 'public, s-maxage=300' },
  });

export const config = { path: '/api/config' };
