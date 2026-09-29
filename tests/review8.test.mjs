// Checks for the eighth review: data sanity rules, islands, lender names, HELP, living costs, ACT duty, CSP, guide pages.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { helpRepayment, KEYSTART } from '../site/assets/rules.js';
import { livingBenchmark, stampDuty, borrowingPower } from '../site/assets/engine.js';
import { lenderName, normaliseRate } from '../site/assets/rate-rules.js';
import { GUIDE as SEO_GUIDE } from '../netlify/shared/seo-core.js';

const d = JSON.parse(readFileSync(new URL('../site/data/suburbs.json', import.meta.url)));
const rows = d.rows.map((r) => Object.fromEntries(d.cols.map((c, i) => [c, r[i]])));
const find = (n, s) => rows.find((x) => x.n === n && x.s === s);

test('no official unit price above 1.5 times the house price is published', () => {
  const bad = rows.filter((x) => x.u && x.h && x.us !== 'model' && x.u > 1.5 * x.h);
  assert.deepEqual(bad.map((x) => x.n), []);
});

test('modelled unit prices sit below the house price', () => {
  assert.equal(rows.filter((x) => x.u && x.h && x.us === 'model' && x.u > x.h * 0.95 + 1000).length, 0);
});

test('Coogee NSW no longer shows an $8.7m unit', () => {
  const c = find('Coogee (NSW)', 'NSW');
  assert.ok(c.u === null || c.u < 3000000, `Coogee unit ${c.u}`);
});

test('yields outside 1% to 10% are held back', () => {
  assert.equal(rows.filter((x) => x.y !== null && (x.y < 1 || x.y > 10)).length, 0);
});

test('islands with no road bridge are flagged, bridged ones are not', () => {
  assert.equal(find('Russell Island', 'QLD').isl, 1);
  assert.equal(find('Macleay Island', 'QLD').isl, 1);
  const bongaree = find('Bongaree', 'QLD');
  if (bongaree) assert.equal(bongaree.isl, 0);
  const cowes = find('Cowes', 'VIC');
  if (cowes) assert.equal(cowes.isl, 0);
  assert.equal(find('Morley', 'WA').isl, 0);
});

test('HELP compulsory repayments follow the 2026-27 marginal scale', () => {
  assert.equal(helpRepayment(60000), 0);
  assert.equal(Math.round(helpRepayment(95000)), Math.round((95000 - 69528) * 0.15));
  assert.equal(Math.round(helpRepayment(150000)), Math.round(9028 + (150000 - 129717) * 0.17));
  assert.equal(helpRepayment(200000), 20000);
});

test('living-cost benchmark rises with income, so borrowing power does not scale linearly', () => {
  assert.ok(livingBenchmark(200000) > livingBenchmark(80000));
  const a = borrowingPower({ grossIncome: 100000, ratePct: 6 }).amount;
  const b = borrowingPower({ grossIncome: 200000, ratePct: 6 }).amount;
  assert.ok(b < a * 2.6);
});

test('ACT: no duty for an owner who has not owned property in five years', () => {
  assert.equal(stampDuty('ACT', 800000, { buyer: 'owner', notOwned5: true }).duty, 0);
  assert.ok(stampDuty('ACT', 800000, { buyer: 'owner' }).duty > 0);
});

test('Keystart limits are set', () => {
  assert.equal(KEYSTART.cap, 860000);
  assert.ok(KEYSTART.income.single > 100000 && KEYSTART.income.couple > KEYSTART.income.single);
});

test('lender names are the names people know', () => {
  assert.equal(lenderName('NRMA HOME LOANS'), 'NRMA Home Loans');
  assert.equal(lenderName('Tmcu'), 'TMCU');
  assert.equal(lenderName('gmcu'), 'GMCU');
  assert.equal(lenderName('Cairns bank'), 'Cairns Bank');
});

test('a variable comparison rate far below the rate is dropped as a feed error', () => {
  const r = normaliseRate({ lender: 'X', product: 'Variable', type: 'variable', rate: 7.87, comparison: 7.2 });
  assert.equal(r.comparison, null);
  assert.ok(r.cmpBad);
  const ok = normaliseRate({ lender: 'X', product: 'Variable', type: 'variable', rate: 6.04, comparison: 5.95 });
  assert.equal(ok.comparison, 5.95);
});

test('the content security policy allows the inline theme script', () => {
  const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
  const toml = readFileSync(new URL('../site/_headers', import.meta.url), 'utf8');
  const inline = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const hash = createHash('sha256').update(inline).digest('base64');
  assert.ok(toml.includes(`'sha256-${hash}'`), 'update the CSP hash in site/_headers after editing the inline script');
  assert.ok(/frame-ancestors 'none'/.test(toml));
});

test('guide pages are the same on the site and for search engines', async () => {
  const src = readFileSync(new URL('../site/assets/pages/guide.js', import.meta.url), 'utf8');
  const client = JSON.parse(src.match(/export const GUIDE = (\[.*?\]);/s)[1]);
  assert.deepEqual(client.map((x) => x[0]), SEO_GUIDE.map((x) => x[0]));
});

test('no page still uses the old names', () => {
  for (const f of ['../site/index.html', '../netlify/shared/seo-core.js', '../site/assets/pages/about.js']) {
    const t = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!/Market Lenz|Keyzing(?!18@gmail)/.test(t), f);
  }
});

test('no inline event handlers (the content security policy blocks them)', async () => {
  const { readdirSync } = await import('node:fs');
  const dir = new URL('../site/assets/pages/', import.meta.url);
  const files = [...readdirSync(dir).map((f) => new URL(f, dir)), new URL('../site/index.html', import.meta.url), new URL('../site/assets/app.js', import.meta.url)];
  for (const f of files) {
    const t = readFileSync(f, 'utf8');
    assert.ok(!/\son(submit|click|load|error|change|input)="/.test(t), `inline handler in ${f.pathname}`);
  }
});
