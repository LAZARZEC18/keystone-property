// Cotality daily Home Value Index (public feed used for the ASX daily indices) → live market moves.
// Gives day / week / month / quarter / YTD / year changes for Sydney, Melbourne, Brisbane, Adelaide, Perth
// and the 5-capital aggregate, plus month-end house and unit indices for all 8 capitals.
// History is merged into data/history/daily-index.json so the series keeps growing past 365 days.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { getJson } from './lib/http.mjs';

const FEED = 'https://au-indices.cotality.com/asx.json';
const HIST = new URL('../data/history/daily-index.json', import.meta.url);
const OUT = new URL('../site/data/index.json', import.meta.url);

export const CODE_TO_REGION = { 105: 'SYD', 205: 'MEL', 305: 'BNEGC', 905: 'BNE', 405: 'ADL', 505: 'PER', 605: 'HBA', 705: 'DRW', 805: 'CBR', 999: 'CAP5' };
const ymd = (n) => `${String(n).slice(0, 4)}-${String(n).slice(4, 6)}-${String(n).slice(6, 8)}`;

/** Value on or before a date in a sorted [[iso, v]] series. */
export function valueAt(series, iso) {
  // allow a few days' slack at the start of the series (the feed holds exactly 365 days)
  if (series.length && iso < series[0][0] && (Date.parse(series[0][0]) - Date.parse(iso)) / 864e5 <= 4) return series[0][1];
  let v = null;
  for (const [d, x] of series) {
    if (d <= iso) v = x;
    else break;
  }
  return v;
}

export function changes(series) {
  if (!series.length) return {};
  const [lastD, last] = series.at(-1);
  const d = new Date(`${lastD}T00:00:00Z`);
  const back = (days) => new Date(+d - days * 864e5).toISOString().slice(0, 10);
  const pctFrom = (v) => (v ? Math.round((last / v - 1) * 10000) / 100 : null);
  return {
    date: lastD,
    value: last,
    day: pctFrom(series.at(-2)?.[1]),
    week: pctFrom(valueAt(series, back(7))),
    month: pctFrom(valueAt(series, back(30))),
    quarter: pctFrom(valueAt(series, back(91))),
    ytd: pctFrom(valueAt(series, `${lastD.slice(0, 4)}-01-01`) ?? series[0][1]),
    year: pctFrom(valueAt(series, back(365))),
  };
}

export async function collectIndex() {
  const r = await getJson(FEED);
  if (!r?.ok) throw new Error(`Cotality feed ${r?.status}`);
  const feed = r.json;
  let hist = {};
  try {
    hist = JSON.parse(await readFile(HIST, 'utf8'));
  } catch {
    /* first run */
  }
  for (const w of feed.worm || []) {
    const key = CODE_TO_REGION[w.code] || w.code;
    const m = new Map((hist[key] || []).map(([dd, v]) => [dd, v]));
    for (const [n, v] of w.data) m.set(ymd(n), v);
    hist[key] = [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
  const daily = {};
  for (const [key, series] of Object.entries(hist)) daily[key] = { ...changes(series), series: series.slice(-400) };
  const monthly = {};
  for (const m of feed.monthly || []) {
    const key = CODE_TO_REGION[m.code] || m.code;
    monthly[key] = {
      name: m.location,
      all: +m.allValue, allMonth: +m.allPercentChangeMonth, allYear: +m.allPercentChangeYear,
      house: +m.houseValue, houseMonth: +m.housePercentChangeMonth, houseYear: +m.housePercentChangeYear,
      unit: +m.unitValue, unitMonth: +m.unitPercentChangeMonth, unitYear: +m.unitPercentChangeYear,
    };
  }
  return {
    out: {
      updated: new Date().toISOString(),
      generated: ymd(feed.generatedDate),
      monthEnd: feed.monthName,
      source: 'Cotality Daily Home Value Index (public ASX index feed)',
      sourceUrl: 'https://www.cotality.com/au/our-data/indices',
      daily,
      monthly,
    },
    hist,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { out, hist } = await collectIndex();
  await mkdir(new URL('../data/history/', import.meta.url), { recursive: true });
  await writeFile(HIST, JSON.stringify(hist));
  await writeFile(OUT, JSON.stringify(out));
  for (const [k, v] of Object.entries(out.daily)) console.log(k, v.date, v.value, 'wk', v.week, 'mo', v.month, 'ytd', v.ytd, 'yr', v.year);
}
