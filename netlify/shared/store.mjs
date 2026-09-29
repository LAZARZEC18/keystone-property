// Small key-value store that works on both hosts:
//  - Cloudflare Pages: a KV namespace bound as STORE (the Cloudflare wrapper sets globalThis.__OWN_KV)
//  - Netlify: Netlify Blobs
// If neither is available (local dev, or no KV bound yet) it keeps values in memory for the life of the process.
const memory = new Map();

function kvStore(kv, name) {
  const k = (key) => `${name}/${key}`;
  return {
    get: async (key, { type } = {}) => (type === 'json' ? kv.get(k(key), 'json') : kv.get(k(key))),
    set: (key, value) => kv.put(k(key), String(value)),
    setJSON: (key, value) => kv.put(k(key), JSON.stringify(value)),
  };
}

function memStore(name) {
  const k = (key) => `${name}/${key}`;
  return {
    get: async (key, { type } = {}) => {
      const v = memory.get(k(key));
      return v === undefined ? null : type === 'json' ? JSON.parse(v) : v;
    },
    set: async (key, value) => void memory.set(k(key), String(value)),
    setJSON: async (key, value) => void memory.set(k(key), JSON.stringify(value)),
  };
}

export async function getStore(name) {
  if (globalThis.__OWN_KV) return kvStore(globalThis.__OWN_KV, name);
  if (globalThis.__OWN_CF) return memStore(name);
  try {
    const { getStore: netlifyStore } = await import('@netlify/blobs');
    return netlifyStore(name);
  } catch {
    return memStore(name);
  }
}

/** Hex SHA-256 with the Web Crypto API (Node 20+, Cloudflare, browsers). */
export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
