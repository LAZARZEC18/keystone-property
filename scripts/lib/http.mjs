// Small HTTP helpers shared by the data scripts: timeouts, retries and a concurrency pool.

export const UA =
  'OwnarooBot/1.0 (+https://github.com/LAZARZEC18/keystone-property; public data refresh)';

export async function fetchWithTimeout(url, opts = {}, ms = 20000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      ...opts,
      headers: { 'user-agent': UA, ...(opts.headers || {}) },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

/** GET JSON with retries on network errors / 5xx / 429. Returns {ok, status, json}. */
export async function getJson(url, headers = {}, { retries = 2, timeout = 20000 } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetchWithTimeout(url, { headers: { accept: 'application/json', ...headers } }, timeout);
      if (r.status === 429 || r.status >= 500) {
        last = { ok: false, status: r.status };
        await sleep(800 * (i + 1));
        continue;
      }
      const text = await r.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* not json */
      }
      return { ok: r.ok && json !== null, status: r.status, json };
    } catch (e) {
      last = { ok: false, status: 0, error: String(e.message || e) };
      await sleep(500 * (i + 1));
    }
  }
  return last;
}

export async function getText(url, headers = {}, { retries = 2, timeout = 20000 } = {}) {
  let last;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetchWithTimeout(url, { headers }, timeout);
      if (r.status === 429 || r.status >= 500) {
        last = { ok: false, status: r.status, text: '' };
        await sleep(800 * (i + 1));
        continue;
      }
      return { ok: r.ok, status: r.status, text: await r.text() };
    } catch (e) {
      last = { ok: false, status: 0, text: '', error: String(e.message || e) };
      await sleep(500 * (i + 1));
    }
  }
  return last;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Run async fn over items with at most `n` in flight. Preserves order. */
export async function pool(items, n, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        out[i] = await fn(items[i], i);
      } catch (e) {
        out[i] = { error: String(e.message || e) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}
