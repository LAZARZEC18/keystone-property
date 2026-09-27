// Precomputes the home page's suburb figures (counts, top-ranked lists) into a small file,
// so the home page doesn't have to download all 11,000 suburbs before it can show anything.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { suburbScore, PROFILES } from '../site/assets/engine.js';

const dir = new URL('../site/data/', import.meta.url).pathname;
const d = JSON.parse(readFileSync(`${dir}suburbs.json`, 'utf8'));
const rows = d.rows.map((r) => {
  const o = Object.fromEntries(d.cols.map((k, i) => [k, r[i]]));
  o.sc = { cash: o.sc_cash, momentum: o.sc_momentum, growth: o.sc_growth, demand: o.sc_demand, afford: o.sc_afford, stability: o.sc_stability, risk: o.rsk ?? 0 };
  return o;
});
const keep = ['id', 'n', 's', 'pc', 'rg', 'lat', 'lng', 'pt', 'h', 'u', 'y', 'g1', 'g1s', 'hs', 'conf'];
const pool = rows.filter((s) => s.pop >= 3000 && s.h && s.lat);
const top = (profile, filt = () => true) =>
  pool
    .filter(filt)
    .map((s) => ({ s, v: suburbScore(s.sc, PROFILES[profile]) }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 100)
    .map(({ s, v }) => [...keep.map((k) => s[k]), v]);
let approvals = null;
if (existsSync(`${dir}approvals.json`)) {
  const a = JSON.parse(readFileSync(`${dir}approvals.json`, 'utf8'));
  const last = a.states?.AUS?.total?.at(-1);
  if (last) approvals = { month: last[0], total: last[1] };
}
const out = {
  built: new Date().toISOString(),
  counts: {
    suburbs: rows.length,
    postcodes: new Set(rows.map((s) => s.pc).filter(Boolean)).size,
    councils: new Set(rows.filter((s) => s.lga).map((s) => `${s.s}|${s.lga}`)).size,
  },
  approvals,
  cols: [...keep, 'v'],
  lists: {
    balanced: top('balanced'),
    growth: top('growth'),
    cashflow: top('cashflow'),
    under700: top('balanced', (s) => (s.pt === 'u' ? s.u : s.h) <= 700000),
  },
};
writeFileSync(`${dir}home.json`, JSON.stringify(out));
console.log(`home.json: ${rows.length} suburbs, ${JSON.stringify(out).length} bytes`);
