// Hourly refresh: every live source, one run. Each collector is isolated so one failing feed
// never blocks the others, and a collector that returns junk never overwrites good data.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { collectRates, summarise } from './rates.mjs';
import { collectRba } from './rba.mjs';
import { collectNews } from './news.mjs';
import { collectIndex } from './cotality.mjs';

const SITE = new URL('../site/data/', import.meta.url);
const DATA = new URL('../data/', import.meta.url);
const HIST = new URL('../data/history/', import.meta.url);
const w = (dir, name, obj, pretty = false) => writeFile(new URL(name, dir), JSON.stringify(obj, null, pretty ? 1 : 0));
const r = async (dir, name, fallback = null) => {
  try {
    return JSON.parse(await readFile(new URL(name, dir), 'utf8'));
  } catch {
    return fallback;
  }
};
const status = { started: new Date().toISOString(), jobs: {} };

async function job(name, fn) {
  const t0 = Date.now();
  try {
    const note = await fn();
    status.jobs[name] = { ok: true, ms: Date.now() - t0, note: note || null };
    console.log(`✓ ${name} (${Date.now() - t0} ms) ${note || ''}`);
  } catch (e) {
    status.jobs[name] = { ok: false, ms: Date.now() - t0, error: String(e.message || e) };
    console.error(`✗ ${name}: ${e.message || e}`);
  }
}

await mkdir(SITE, { recursive: true });
await mkdir(HIST, { recursive: true });

await job('rates', async () => {
  const { rows, failed, brandsChecked } = await collectRates({ log: () => {} });
  if (rows.length < 1000) throw new Error(`only ${rows.length} rows, keeping previous data`);
  const updated = new Date().toISOString();
  const cols = ['lender', 'product', 'type', 'term', 'purpose', 'repay', 'rate', 'comparison', 'lvrMin', 'lvrMax', 'url', 'tailored', 'special'];
  const lenders = [...new Set(rows.map((x) => x.lender))].sort();
  const li = new Map(lenders.map((l, i) => [l, i]));
  await w(SITE, 'rates.json', { updated, source: 'Consumer Data Right product reference data (api.cdr.gov.au)', brandsChecked, failed, cols, lenders, rows: rows.map((x) => cols.map((c) => (c === 'lender' ? li.get(x.lender) : x[c]))) });
  const sum = summarise(rows);
  await w(SITE, 'rates-summary.json', { updated, lenders: lenders.length, rows: rows.length, ...sum }, true);
  // one history point per day: lowest rates by segment
  const hist = (await r(HIST, 'rates.json', [])) || [];
  const day = updated.slice(0, 10);
  const point = { d: day, ...Object.fromEntries(Object.entries(sum.best).map(([k, v]) => [k, v[0]?.rate ?? null])), median: sum.medianInvestorVariable };
  const i = hist.findIndex((x) => x.d === day);
  if (i >= 0) hist[i] = point;
  else hist.push(point);
  await w(HIST, 'rates.json', hist);
  await w(SITE, 'rates-history.json', hist.slice(-730));
  return `${rows.length} rates, ${lenders.length} lenders`;
});

await job('rba', async () => {
  const d = await collectRba();
  if (!d.cashRate.current) throw new Error('no cash rate');
  await w(SITE, 'rba.json', d);
  return `cash ${d.cashRate.current}`;
});

await job('news', async () => {
  const d = await collectNews();
  if (d.items.length < 10) throw new Error(`only ${d.items.length} headlines`);
  await w(SITE, 'news.json', d);
  return `${d.items.length} headlines`;
});

await job('index', async () => {
  const { out, hist } = await collectIndex();
  // Cotality's daily index is proprietary: it is kept in the private history only and never published on the site.
  // It is used solely to pick up each new month-end result, which Cotality releases publicly.
  await w(HIST, 'daily-index.json', hist);
  // Roll the monthly market figures forward when Cotality publishes a new month-end
  const market = await r(DATA, 'market.json');
  if (market) {
    const MAP = { SYD: 'SYD', MEL: 'MEL', BNE: 'BNE', ADL: 'ADL', PER: 'PER', HBA: 'HBA', DRW: 'DRW', CBR: 'CBR' };
    const monthEnd = out.monthEnd; // e.g. "31 August 2026"
    if (monthEnd && market.indexMonth !== monthEnd) {
      const first = !market.indexMonth;
      for (const [k, reg] of Object.entries(MAP)) {
        const m = out.monthly[k];
        const R = market.regions[reg];
        if (!m || !R) continue;
        if (!first) {
          const f = (x) => 1 + x / 100;
          R.medianDwelling = Math.round(R.medianDwelling * f(m.allMonth));
          if (R.medianHouse) R.medianHouse = Math.round(R.medianHouse * f(m.houseMonth));
          if (R.medianUnit) R.medianUnit = Math.round(R.medianUnit * f(m.unitMonth));
          R.derived = `Rolled forward to ${monthEnd} with the Cotality index`;
        }
        // one decimal place, as Cotality publishes them
        const r1 = (x) => (x == null ? x : Math.round(x * 10) / 10);
        R.monthPct = r1(m.allMonth);
        R.annualPct = r1(m.allYear);
        R.houseMonthPct = r1(m.houseMonth);
        R.houseAnnualPct = r1(m.houseYear);
        R.unitMonthPct = r1(m.unitMonth);
        R.unitAnnualPct = r1(m.unitYear);
      }
      market.indexMonth = monthEnd;
      await w(DATA, 'market.json', market, true);
    }
  }
  return `${out.generated}: month-end ${out.monthEnd}`;
});

await job('publish-market', async () => {
  await copyFile(new URL('market.json', DATA), new URL('market.json', SITE));
});

await job('weekly', async () => {
  // A dated weekly snapshot (Monday of the current week) so trends build up over time.
  const market = await r(SITE, 'market.json');
  const rs = await r(SITE, 'rates-summary.json');
  const rba = await r(SITE, 'rba.json');
  const news = await r(SITE, 'news.json');
  const now = new Date();
  // Key the snapshot by the Australian calendar week, not the UTC clock.
  const asOf = new Date(`${new Date(now.getTime() + 8 * 3600e3).toISOString().slice(0, 10)}T00:00:00Z`); // Australian (AWST) date
  const monday = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate() - ((asOf.getUTCDay() + 6) % 7))).toISOString().slice(0, 10);
  const weeks = (await r(HIST, 'weekly.json', [])) || [];
  const snap = {
    week: monday,
    indexMonth: market?.indexMonth || null,
    updated: now.toISOString(),
    cash: rba?.cashRate?.current ?? null,
    bestInv: rs?.best?.INV_PI_variable?.[0] ?? null,
    bestOO: rs?.best?.OO_PI_variable?.[0] ?? null,
    medianInv: rs?.medianInvestorVariable ?? null,
    headlines: (news?.items || []).slice(0, 8).map(({ title, link, source, date }) => ({ title, link, source, date })),
  };
  const i = weeks.findIndex((x) => x.week === monday);
  if (i >= 0) weeks[i] = snap;
  else weeks.push(snap);
  await w(HIST, 'weekly.json', weeks);
  await w(SITE, 'weekly.json', weeks.slice(-104));
  return monday;
});

status.finished = new Date().toISOString();
await w(SITE, 'status.json', status, true);
// consecutive failures per job, read by scripts/health.mjs (which fails the workflow, so GitHub emails the owner)
const health = (await r(HIST, 'health.json', {})) || {};
for (const [k, j] of Object.entries(status.jobs)) health[k] = j.ok ? 0 : (health[k] || 0) + 1;
await w(HIST, 'health.json', health, true);
const failed = Object.entries(status.jobs).filter(([, j]) => !j.ok);
if (failed.length === Object.keys(status.jobs).length) process.exit(1);
