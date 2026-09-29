// Reserve Bank of Australia statistical tables: cash rate decisions, indicator and actual
// housing lending rates, and money-market pricing (OIS = what markets expect the cash rate to do).
import { getText } from './lib/http.mjs';

const BASE = 'https://www.rba.gov.au/statistics/tables/csv/';

/** Minimal RFC4180 CSV parser (handles quoted commas and quotes). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** RBA date strings: "31/07/2026" or "11-Aug-2026" -> "2026-07-31". */
export function rbaDate(s) {
  s = (s || '').trim();
  let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (m) {
    const mon = 'JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(m[2]) / 3 + 1;
    return `${m[3]}-${String(mon).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

/** Parse an RBA table into {titles: {id: title}, series: {id: [[date, value], ...]}, published}. */
export function parseRbaTable(text) {
  const rows = parseCsv(text.replace(/^﻿/, ''));
  const titleRow = rows.find((r) => r[0] === 'Title') || [];
  const idRow = rows.find((r) => r[0] === 'Series ID');
  const pubRow = rows.find((r) => r[0] === 'Publication date');
  if (!idRow) throw new Error('No Series ID row');
  const start = rows.indexOf(idRow) + 1;
  const titles = {};
  const series = {};
  idRow.slice(1).forEach((id, j) => {
    if (!id) return;
    titles[id] = titleRow[j + 1] || id;
    series[id] = [];
  });
  for (const r of rows.slice(start)) {
    const d = rbaDate(r[0]);
    if (!d) continue;
    idRow.slice(1).forEach((id, j) => {
      if (!id) return;
      const raw = (r[j + 1] || '').trim();
      if (raw === '') return;
      const v = Number(raw);
      series[id].push([d, Number.isFinite(v) ? v : raw]);
    });
  }
  return { titles, series, published: rbaDate(pubRow?.[1]) };
}

const last = (arr) => (arr && arr.length ? arr[arr.length - 1] : null);
const since = (arr, from) => (arr || []).filter(([d]) => d >= from);

export async function collectRba() {
  const tables = {};
  for (const t of ['a2', 'f5', 'f6', 'f1.1']) {
    const r = await getText(`${BASE}${t}-data.csv`);
    if (!r.ok) throw new Error(`RBA ${t} ${r.status}`);
    tables[t] = parseRbaTable(r.text);
  }
  const a2 = tables.a2.series;
  // Cash-rate changes: new target column is a number since 2000 (older rows are ranges).
  const decisions = (a2.ARBAMPCNCRT || [])
    .filter(([, v]) => typeof v === 'number')
    .map(([d, v]) => ({ date: d, rate: v }));
  const changes = decisions.map((x, i) => ({ ...x, change: i ? Math.round((x.rate - decisions[i - 1].rate) * 100) : null }));

  const f5 = tables.f5.series;
  const f6 = tables.f6;
  const pickF6 = (re) => Object.keys(f6.titles).find((id) => re.test(f6.titles[id]));
  const f6ids = {
    newOOVariable: pickF6(/New loans funded.*Owner-occupied; Variable-rate; All institutions/i) || pickF6(/New.*Owner-occupied; Variable-rate; All/i),
    newInvVariable: pickF6(/New loans funded.*Investment; Variable-rate; All institutions/i) || pickF6(/New.*Investment; Variable-rate; All/i),
    newOOFixed: pickF6(/New.*Owner-occupied; Fixed-rate; ≤ 3 years|New.*Owner-occupied; Fixed.*less than|New.*Owner-occupied; Fixed-rate.*All/i),
    newInvFixed: pickF6(/New.*Investment; Fixed-rate; ≤ 3 years|New.*Investment; Fixed.*less than|New.*Investment; Fixed-rate.*All/i),
    outInv: pickF6(/Outstanding; Investment; All loans; All institutions/i),
    outOO: pickF6(/Outstanding; Owner-occupied; All loans; All institutions/i),
  };
  const f1 = tables['f1.1'].series;

  const monthly = (id, s) => since(s[id], '2005-01-01');
  return {
    updated: new Date().toISOString(),
    source: 'Reserve Bank of Australia statistical tables A2, F1.1, F5, F6',
    cashRate: {
      current: last(changes)?.rate ?? null,
      lastChange: [...changes].reverse().find((c) => c.change)?.date ?? null,
      decisions: changes.filter((c) => c.date >= '2000-01-01'),
      published: tables.a2.published,
    },
    market: {
      // Bank bill rates run ahead of the cash rate: 6-month bills above the cash rate mean
      // markets are pricing a rise, below means a cut. (RBA stopped publishing OIS in 2022.)
      bab1m: last(f1.FIRMMBAB30)?.[1] ?? null,
      bab3m: last(f1.FIRMMBAB90)?.[1] ?? null,
      bab6m: last(f1.FIRMMBAB180)?.[1] ?? null,
      asAt: last(f1.FIRMMBAB90)?.[0] ?? null,
      published: tables['f1.1'].published,
    },
    indicator: {
      published: tables.f5.published,
      ooStandardVariable: monthly('FILRHLBVS', f5),
      ooDiscountedVariable: monthly('FILRHLBVD', f5),
      oo3yFixed: monthly('FILRHL3YF', f5),
      invStandardVariable: monthly('FILRHLBVSI', f5),
      invDiscountedVariable: monthly('FILRHLBVDI', f5),
      inv3yFixed: monthly('FILRHL3YFI', f5),
    },
    actual: {
      published: f6.published,
      titles: Object.fromEntries(Object.entries(f6ids).map(([k, id]) => [k, id ? f6.titles[id] : null])),
      ...Object.fromEntries(Object.entries(f6ids).map(([k, id]) => [k, id ? monthly(id, f6.series) : []])),
    },
  };
}

// run from the command line (the refresh job); on a server host this module only exports the collector
if (typeof process !== 'undefined' && process.argv && import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const { writeFile, mkdir } = await import('node:' + 'fs/promises');
    const d = await collectRba();
    await mkdir(new URL('../site/data/', import.meta.url), { recursive: true });
    await writeFile(new URL('../site/data/rba.json', import.meta.url), JSON.stringify(d));
    console.log('cash', d.cashRate.current, d.cashRate.lastChange, 'bab6m', d.market.bab6m, d.actual.titles);
  })();
}
