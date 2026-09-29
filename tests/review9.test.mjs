// Checks for the ninth review: titles, price checks, borrowing costs, robots, indexing, schemes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PAGES, describe, buildIndex } from '../netlify/shared/seo-core.js';
import { analyse, stampDuty } from '../site/assets/engine.js';
import { guaranteeCap, helpToBuyCap, KEYSTART, FHOG_CAP } from '../site/assets/rules.js';

const ROUTE = { 'afford.js': '/afford', 'analyse.js': '/analyse', 'borrowing.js': '/borrowing', 'compare.js': '/compare', 'firsthome.js': '/first-home', 'guide.js': '/guide', 'home.js': '/', 'markets.js': '/markets', 'methodology.js': '/methodology', 'newbuilds.js': '/new-builds', 'property.js': '/property', 'rates.js': '/rates', 'suburbs.js': '/suburbs', 'topmap.js': '/map', 'watchlist.js': '/watchlist' };

test('page titles in the app match the ones search engines see', () => {
  const dir = new URL('../site/assets/pages/', import.meta.url);
  for (const f of readdirSync(dir)) {
    const m = readFileSync(new URL(f, dir), 'utf8').match(/setMeta\(\{ title: '([^']+)'/);
    if (!m || !ROUTE[f]) continue;
    assert.equal(m[1], PAGES[ROUTE[f]][0], `${f} vs ${ROUTE[f]}`);
  }
  const pc = readFileSync(new URL('../site/assets/pages/pricecheck.js', import.meta.url), 'utf8').match(/title: '([^']+)'/)[1];
  assert.equal(pc, PAGES['/price-check'][0]);
});

test('Perth scheme caps: $869k is over the 5% Deposit Scheme, Help to Buy and Keystart limits', () => {
  const morley = { s: 'WA', rg: 'PER', lga: 'Bayswater' };
  assert.equal(guaranteeCap(morley), 850000);
  assert.equal(helpToBuyCap(morley), 850000);
  assert.ok(869000 > KEYSTART.cap);
  assert.equal(FHOG_CAP.WA, 800000);
  assert.ok(stampDuty('WA', 700000, { buyer: 'fhb' }).duty < stampDuty('WA', 700000, { buyer: 'owner' }).duty);
});

test('borrowing costs, including LMI, are deducted over five years', () => {
  const r = analyse({ price: 800000, weeklyRent: 600, deposit: 0.1, purchaseDate: '2026-10-01' });
  assert.ok(r.rows[0].borrowing > 0);
  assert.equal(r.rows[4].borrowing, r.rows[0].borrowing);
  assert.equal(r.rows[5].borrowing, 0);
  const noLmi = analyse({ price: 800000, weeklyRent: 600, deposit: 0.2, purchaseDate: '2026-10-01' });
  assert.ok(r.rows[0].borrowing > noLmi.rows[0].borrowing);
});

test('new builds keep negative gearing where an established home does not', () => {
  const base = { price: 800000, weeklyRent: 600, purchaseDate: '2026-10-01', hold: 10 };
  const est = analyse({ ...base, newBuild: false });
  const nb = analyse({ ...base, newBuild: true, buildYear: 2026 });
  assert.equal(est.summary.negativeGearing, 'restricted');
  assert.equal(nb.summary.negativeGearing, 'new-build');
  assert.ok(nb.rows.reduce((t, y) => t + y.taxEffect, 0) > est.rows.reduce((t, y) => t + y.taxEffect, 0));
});

test('robots.txt blocks AI training crawlers but not search engines', () => {
  const r = readFileSync(new URL('../site/robots.txt', import.meta.url), 'utf8');
  for (const bot of ['GPTBot', 'CCBot', 'Google-Extended', 'Bytespider', 'ClaudeBot']) assert.match(r, new RegExp(`User-agent: ${bot}\\nDisallow: /`));
  assert.match(r, /User-agent: \*\nAllow: \//);
  assert.ok(!/User-agent: Googlebot/.test(r));
});

test('small modelled suburbs are kept out of search indexes', () => {
  const sub = JSON.parse(readFileSync(new URL('../site/data/suburbs.json', import.meta.url)));
  const market = JSON.parse(readFileSync(new URL('../site/data/market.json', import.meta.url)));
  const ix = buildIndex(sub, market);
  const small = ix.rows.find((x) => x.hs === 'model' && x.pop > 1000 && x.pop < 3000);
  const big = ix.rows.find((x) => x.hs === 'model' && x.pop > 5000);
  assert.equal(describe(`/suburb/${small.slug}`, '', ix, 'https://x').robots, 'noindex,follow');
  assert.equal(describe(`/suburb/${big.slug}`, '', ix, 'https://x').robots, 'index,follow');
  const sm = readFileSync(new URL('../site/sitemap.xml', import.meta.url), 'utf8');
  assert.ok(!sm.includes(`/suburb/${small.slug}<`));
  assert.ok(sm.includes('/price-check<'));
});

test('no Google News redirect links in the news feed list', async () => {
  const { FEEDS } = await import('../scripts/news.mjs').catch(() => ({ FEEDS: null }));
  const src = readFileSync(new URL('../scripts/news.mjs', import.meta.url), 'utf8');
  assert.ok(!/news\.google\.com\/rss/.test(src));
  if (FEEDS) assert.ok(!FEEDS.some((f) => /google/i.test(f.url)));
});
