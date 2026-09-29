// Contact form. Messages are kept in the site's key-value store under "contact/" (Cloudflare: the KV namespace
// bound as STORE, browsable in the dashboard; Netlify: the Blobs store "contact"). Nothing is sent anywhere else.
import { getStore } from '../shared/store.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, n);

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let b = {};
  try {
    const type = req.headers.get('content-type') || '';
    b = type.includes('json') ? await req.json() : Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return json({ error: 'bad request' }, 400);
  }
  if (b.company) return json({ ok: true }); // honeypot: bots fill the hidden field
  const msg = { name: clip(b.name, 120), email: clip(b.email, 200), topic: clip(b.topic, 60), message: clip(b.message, 5000), at: new Date().toISOString() };
  if (!msg.message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(msg.email)) return json({ error: 'Please add your email and a message.' }, 400);
  try {
    const store = await getStore('contact');
    await store.setJSON(`${msg.at.replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 8)}`, msg);
  } catch {
    return json({ error: 'The message could not be saved. Please email instead.' }, 500);
  }
  return json({ ok: true });
};

export const config = { path: '/api/contact' };
