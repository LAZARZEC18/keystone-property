// Minimal .xlsx reader: the first worksheet as rows of cell values. No dependencies; uses the
// DecompressionStream API, which Node 18+ and Cloudflare Workers both have. Enough for RBA tables.

const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

async function inflate(bytes) {
  const s = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(s).arrayBuffer());
}

/** Read the entries of a zip archive: {name: Uint8Array}. Only the names in `want` are decompressed. */
export async function unzip(buf, want) {
  const b = new Uint8Array(buf);
  let e = b.length - 22;
  while (e >= 0 && u32(b, e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('Not a zip file');
  const count = u16(b, e + 10);
  let p = u32(b, e + 16);
  const out = {};
  for (let i = 0; i < count; i++) {
    const method = u16(b, p + 10);
    const size = u32(b, p + 20);
    const nameLen = u16(b, p + 28);
    const extra = u16(b, p + 30);
    const comment = u16(b, p + 32);
    const local = u32(b, p + 42);
    const name = new TextDecoder().decode(b.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extra + comment;
    if (want && !want.includes(name)) continue;
    const start = local + 30 + u16(b, local + 26) + u16(b, local + 28);
    const data = b.subarray(start, start + size);
    out[name] = method === 0 ? data : await inflate(data);
  }
  return out;
}

const unescape = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const colIndex = (ref) => {
  let n = 0;
  for (const ch of ref.replace(/\d+$/, '')) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** First worksheet as an array of rows; numbers stay numbers, shared strings are resolved. */
export async function readXlsx(buf) {
  const files = await unzip(buf, ['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml']);
  const dec = new TextDecoder();
  const strings = [];
  if (files['xl/sharedStrings.xml']) {
    for (const m of dec.decode(files['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      strings.push(unescape([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join('')));
    }
  }
  const sheet = dec.decode(files['xl/worksheets/sheet1.xml'] || new Uint8Array());
  const rows = [];
  for (const r of sheet.matchAll(/<row [^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const c of r[1].matchAll(/<c r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const v = c[3]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (v === undefined) {
        const inline = c[3]?.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1];
        if (inline !== undefined) row[colIndex(c[1])] = unescape(inline);
        continue;
      }
      row[colIndex(c[1])] = /t="s"/.test(c[2]) ? strings[+v] : /t="(str|inlineStr)"/.test(c[2]) ? unescape(v) : Number(v);
    }
    rows.push(row);
  }
  return rows;
}

/** Excel serial day number -> "YYYY-MM-DD". */
export const excelDate = (n) => new Date(Math.round((n - 25569) * 86400000)).toISOString().slice(0, 10);
