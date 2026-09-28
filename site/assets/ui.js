// Formatting, small DOM helpers and dependency-free SVG charts.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

export const aud = (v, { compact = false, dp = 0 } = {}) => {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  if (compact) {
    const a = Math.abs(v);
    if (a >= 1e12) return `${v < 0 ? '-' : ''}$${(a / 1e12).toFixed(2)} trillion`;
    if (a >= 1e9) return `${v < 0 ? '-' : ''}$${(a / 1e9).toFixed(1)}b`;
    if (a >= 999500) return `${v < 0 ? "-" : ""}$${(a / 1e6).toFixed(a >= 9995000 ? 1 : 2)}m`;
    if (a >= 1e4) return `${v < 0 ? '-' : ''}$${Math.round(a / 1e3)}k`;
  }
  return `${v < 0 ? '-' : ''}$${Math.abs(v).toLocaleString('en-AU', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;
};
export const pct = (v, dp = 1, sign = false) =>
  v === null || v === undefined || Number.isNaN(v) ? '—' : `${sign && v > 0 ? '+' : ''}${Number(v).toFixed(dp)}%`;
export const num = (v, dp = 0) => (v === null || v === undefined ? '—' : Number(v).toLocaleString('en-AU', { maximumFractionDigits: dp, minimumFractionDigits: dp }));
export const signed = (v, fmt = aud) => (v > 0 ? `+${fmt(v)}` : fmt(v));
export const dir = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : 'flat');

export function ago(iso) {
  if (!iso) return '';
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (s < 90) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 14) return `${Math.round(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}
export const date = (iso) => (iso ? new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export function scoreClass(v) {
  if (v === null || v === undefined) return 'sc-na';
  if (v >= SCORE_BANDS[0]) return 'sc-a';
  if (v >= SCORE_BANDS[1]) return 'sc-b';
  if (v >= SCORE_BANDS[2]) return 'sc-c';
  return 'sc-d';
}
/** Score bands, set from the actual spread of scores: 65+ is about the top 1%, 55+ the top 10%, 45+ above the median. */
export const SCORE_BANDS = [65, 55, 45];
export const scoreVar = (v) => `--${scoreClass(v)}`;
export const scoreBadge = (v, big = false) => `<span class="score ${scoreClass(v)}${big ? ' big' : ''}">${v ?? '—'}</span>`;

export function srcBadge(src) {
  if (!src) return '';
  if (src === 'model') return '<span class="tag tag-model" title="Keyzing estimate: calibrated model anchored to current regional medians">Modelled</span>';
  if (src === 'region') return '<span class="tag tag-model" title="Regional figure (Cotality)">Region</span>';
  const pc = src.includes('postcode');
  return `<span class="tag tag-official" title="Official ${src.split(' ')[0]} government sales data${pc ? ' for the postcode' : ''}">Official${pc ? ' · postcode' : ''}</span>`;
}

/** How much of a suburb's ranking rests on measured data rather than the model. */
export function confBadge(s) {
  const priceOfficial = s.hs && s.hs !== 'model' && s.hs !== 'region';
  const growthLocal = s.g1s && !String(s.g1s).startsWith('region');
  if (priceOfficial && growthLocal && !String(s.hs).includes('postcode')) return '<span class="tag tag-conf tag-conf-h" title="Price and 12-month change come from official sales for this suburb">Measured</span>';
  if (priceOfficial || growthLocal) return `<span class="tag tag-conf tag-conf-m" title="${priceOfficial ? 'Price from official sales' : 'Price is modelled'}${String(s.hs).includes('postcode') ? ' for the postcode' : ''}; ${growthLocal ? '12-month change measured locally' : '12-month change is the city or regional index'}. Rent is modelled.">Partly measured</span>`;
  return '<span class="tag tag-conf tag-conf-l" title="No official suburb sales series here: price and rent are modelled and the 12-month change is the city or regional index. Treat the ranking as a guide.">Modelled</span>';
}

export function bar(v, max = 100) {
  const w = v === null || v === undefined ? 0 : Math.max(0, Math.min(100, (v / max) * 100));
  return `<span class="meter"><span class="${scoreClass(v)}" style="width:${w}%"></span></span>`;
}

// ---------------------------------------------------------------- charts
const nice = (min, max, n = 4) => {
  const span = max - min || Math.abs(max) || 1;
  const step0 = span / n;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0) || mag * 10;
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return { lo, hi, ticks };
};

/**
 * Line chart. series: [{name, points:[[x(Date|number), y]], color?, dash?}]
 * opts: {height, yFmt, xFmt, area, zero}
 */
export function lineChart(series, opts = {}) {
  const W = 720;
  const H = opts.height || 260;
  const m = { t: 14, r: 16, b: 28, l: 56 };
  const all = series.flatMap((s) => s.points);
  if (!all.length) return '<p class="muted">No data.</p>';
  const xs = all.map((p) => +p[0]);
  const ys = all.map((p) => p[1]);
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const yr = nice(opts.zero ? Math.min(0, ...ys) : Math.min(...ys), Math.max(...ys));
  const X = (x) => m.l + ((+x - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
  const Y = (y) => m.t + (1 - (y - yr.lo) / (yr.hi - yr.lo || 1)) * (H - m.t - m.b);
  const yFmt = opts.yFmt || ((v) => v);
  const xFmt = opts.xFmt || ((v) => new Date(v).getFullYear());
  const grid = yr.ticks.map((t) => `<g><line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${m.l - 8}" y="${Y(t) + 4}" class="axis" text-anchor="end">${yFmt(t)}</text></g>`).join('');
  const nx = Math.min(7, xs.length);
  const xt = Array.from({ length: nx }, (_, i) => x0 + ((x1 - x0) * i) / Math.max(1, nx - 1));
  const xticks = xt.map((t) => `<text x="${X(t)}" y="${H - 8}" class="axis" text-anchor="middle">${xFmt(t)}</text>`).join('');
  const paths = series
    .map((s, i) => {
      const c = s.color || `var(--c${(i % 5) + 1})`;
      const d = s.points.map((p, j) => `${j ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join('');
      const area = opts.area && i === 0 ? `<path d="${d}L${X(s.points.at(-1)[0])},${Y(yr.lo)}L${X(s.points[0][0])},${Y(yr.lo)}Z" fill="${c}" opacity=".10"/>` : '';
      return `${area}<path d="${d}" fill="none" stroke="${c}" stroke-width="${s.width || 2.2}" ${s.dash ? 'stroke-dasharray="5 4"' : ''} stroke-linejoin="round" stroke-linecap="round"/>`;
    })
    .join('');
  const legend = series.length > 1 ? `<div class="legend">${series.map((s, i) => `<span><i style="background:${s.color || `var(--c${(i % 5) + 1})`}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  const id = `lc${Math.random().toString(36).slice(2, 8)}`;
  const data = JSON.stringify(series.map((s) => ({ n: s.name, p: s.points.map((p) => [+p[0], p[1]]) })));
  return `<figure class="chart" id="${id}" data-series='${esc(data)}' data-x0="${x0}" data-x1="${x1}" data-m="${m.l},${m.r}" data-w="${W}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.label || 'chart')}">${grid}${xticks}${paths}<line class="hair" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" style="display:none"/></svg><div class="tip" hidden></div>${legend}</figure>`;
}

/** Hover read-out for line charts rendered with lineChart(). */
export function wireCharts(root, yFmt = (v) => v, xFmt = (v) => new Date(v).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })) {
  $$('.chart[data-series]', root).forEach((fig) => {
    if (fig.dataset.wired) return;
    fig.dataset.wired = 1;
    const svg = fig.querySelector('svg');
    const tip = fig.querySelector('.tip');
    const hair = fig.querySelector('.hair');
    const series = JSON.parse(fig.dataset.series);
    const x0 = +fig.dataset.x0;
    const x1 = +fig.dataset.x1;
    const [ml, mr] = fig.dataset.m.split(',').map(Number);
    const W = +fig.dataset.w;
    const fx = fig.dataset.xfmt === 'year' ? (v) => `Year ${Math.round(v)}` : xFmt;
    const fy = fig._yFmt || yFmt;
    svg.addEventListener('pointermove', (e) => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const xv = x0 + ((px - ml) / (W - ml - mr)) * (x1 - x0);
      let best = null;
      const lines = series.map((s) => {
        let pt = s.p[0];
        for (const p of s.p) if (Math.abs(p[0] - xv) < Math.abs(pt[0] - xv)) pt = p;
        best = best ?? pt[0];
        return `<div><b>${fy(pt[1])}</b> ${esc(s.n || '')}</div>`;
      });
      const hx = ml + ((best - x0) / (x1 - x0 || 1)) * (W - ml - mr);
      hair.setAttribute('x1', hx);
      hair.setAttribute('x2', hx);
      hair.style.display = '';
      tip.hidden = false;
      tip.innerHTML = `<div class="muted">${fx(best)}</div>${lines.join('')}`;
      const left = (hx / W) * r.width;
      tip.style.left = `${Math.min(r.width - 150, Math.max(0, left + 12))}px`;
    });
    svg.addEventListener('pointerleave', () => {
      tip.hidden = true;
      hair.style.display = 'none';
    });
  });
}

/** Horizontal bar chart: items [{label, value, note?, cls?}] */
export function hbars(items, { fmt = (v) => v, max, signedScale = false } = {}) {
  const vals = items.map((i) => i.value ?? 0);
  const mx = max ?? Math.max(...vals.map(Math.abs), 1e-9);
  return `<div class="hbars">${items
    .map((i) => {
      const v = i.value ?? 0;
      const w = (Math.abs(v) / mx) * (signedScale ? 50 : 100);
      const style = signedScale ? (v >= 0 ? `left:50%;width:${w}%` : `left:${50 - w}%;width:${w}%`) : `left:0;width:${w}%`;
      return `<div class="hb"><span class="hb-l">${i.label}</span><span class="hb-t${signedScale ? ' signed' : ''}"><span class="hb-f ${i.cls || (v < 0 ? 'neg' : 'pos')}" style="${style}"></span></span><span class="hb-v">${fmt(i.value)}</span></div>`;
    })
    .join('')}</div>`;
}

/** Stacked cost breakdown bar. parts: [{label, value, color}] */
export function stack(parts, fmt = aud) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0) || 1;
  return `<div class="stack">${parts
    .filter((p) => p.value > 0)
    .map((p, i) => `<span style="flex:${p.value / total};background:${p.color || `var(--c${(i % 5) + 1})`}" title="${esc(p.label)}: ${fmt(p.value)}"></span>`)
    .join('')}</div><div class="legend">${parts
    .filter((p) => p.value > 0)
    .map((p, i) => `<span><i style="background:${p.color || `var(--c${(i % 5) + 1})`}"></i>${esc(p.label)} <b>${fmt(p.value)}</b></span>`)
    .join('')}</div>`;
}

export function spark(points, { w = 110, h = 28 } = {}) {
  if (!points || points.length < 2) return '';
  const ys = points.map((p) => p[1]);
  const lo = Math.min(...ys);
  const hi = Math.max(...ys);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - ((p[1] - lo) / (hi - lo || 1)) * (h - 4)).toFixed(1)}`).join('');
  const up = ys.at(-1) >= ys[0];
  return `<svg class="spark ${up ? 'up' : 'down'}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><path d="${d}" fill="none" stroke-width="1.8"/></svg>`;
}

export function setMeta({ title, description }) {
  document.title = title ? `${title} · Keyzing` : 'Keyzing · Australian property values, suburbs and rates';
  const m = document.querySelector('meta[name="description"]');
  if (m && description) m.setAttribute('content', description);
}

export function sortable(table, onSort) {
  $$('th[data-k]', table).forEach((th) =>
    th.addEventListener('click', () => {
      const k = th.dataset.k;
      const asc = th.classList.contains('desc');
      $$('th', table).forEach((x) => x.classList.remove('asc', 'desc'));
      th.classList.add(asc ? 'asc' : 'desc');
      onSort(k, asc);
    }),
  );
}

const REGION_SHORT = { SYD: 'Sydney', MEL: 'Melbourne', BNE: 'Brisbane', PER: 'Perth', ADL: 'Adelaide', HBA: 'Hobart', DRW: 'Darwin', CBR: 'Canberra', RNSW: 'Regional NSW', RVIC: 'Regional Vic', RQLD: 'Regional Qld', RWA: 'Regional WA', RSA: 'Regional SA', RTAS: 'Regional Tas', RNT: 'Regional NT' };
/** 12-month change, honest about its source: suburb-level where official sales exist, otherwise labelled as the city/region index. */
export function growth12(s, { suffix = ' 12m', short = false, three = suffix !== '' } = {}) {
  // lead with the area's 3-month change (the direction now), then the 12-month figure (the past year)
  const g3 = three && s.g3 !== null && s.g3 !== undefined ? `<span class="${s.g3 < 0 ? 'down' : s.g3 > 0 ? 'up' : ''}" title="${esc(s.g3p || 'Area, 3 months')}">${s.trend ? `${s.trend} ` : ''}${pct(s.g3, 1, true)} 3m</span> · ` : '';
  if (s.g1 === null || s.g1 === undefined) return g3 ? g3.replace(/ · $/, '') : '—';
  const src = String(s.g1s || '');
  const cls = s.g1 >= 0 ? 'up' : 'down';
  const period = s.g1p ? ` (${s.g1p})` : '';
  if (src.startsWith('region')) {
    const name = REGION_SHORT[s.rg] || 'Region';
    return `${g3}<span class="muted" title="No suburb-level sales series here: this is the ${name}-wide figure${period}.">${pct(s.g1, 1, true)}${suffix}${short ? ' <span class="area-tag">city-wide</span>' : ` · ${name}-wide`}</span>`;
  }
  if (src.includes('postcode')) return `${g3}<span class="${cls}" title="Postcode-level figure from the NSW Rent and Sales Report${period}.">${pct(s.g1, 1, true)}${suffix}</span>`;
  return `${g3}<span class="${cls}" title="Suburb figure from official sales, weighted toward the region when sales are few${period}.">${pct(s.g1, 1, true)}${suffix}</span>`;
}

/** Weekly cash flow in words, avoiding a red double negative: "You pay $491/wk" or "You receive $120/wk". */
export function cashWeek(v, { short = false } = {}) {
  if (v === null || v === undefined || Number.isNaN(v)) return '—';
  const a = aud(Math.abs(v));
  if (Math.abs(v) < 0.5) return 'Breaks even';
  return v < 0 ? `${short ? 'Pay' : 'You pay'} ${a}/wk` : `${short ? 'Receive' : 'You receive'} ${a}/wk`;
}

/** Relative rank of a deal as a coloured pill (no letter grade). */
export function rankPill(v, { big = false } = {}) {
  if (!v) return '';
  return `<span class="rank rank-${v.grade}${big ? ' big' : ''}" title="Relative rank against the typical home in every suburb, same assumptions">${esc(v.label)}</span>`;
}

/** One line explaining a relative deal rank. */
export function dealContext(v) {
  if (!v) return '';
  const pc = v.percentile;
  return pc === null || pc === undefined ? esc(v.absolute || '') : `Relative rank: stronger numbers than about ${pc}% of typical homes across Australia, run with the same deposit, rate and income. A high rank does not mean the purchase makes money.`;
}

/**
 * Neutral line comparing the return at three growth rates with a deposit, with equal weight on each.
 * No verdict: whether it "beats" a deposit depends entirely on growth nobody can know.
 */
export function returnsLine(sc, v) {
  if (!sc) return '';
  const f = (x) => (x === null || x === undefined ? '—' : pct(x, 1));
  return `<div class="returns-line"><div class="rl-head">Return on your cash after tax, a year, if prices grow</div><div class="rl-grid">${['bear', 'base', 'bull'].map((k) => `<div${sc[k].yours ? ' class="rl-yours"' : ''}><span class="k">${sc[k].growth}% a year${sc[k].yours ? ' (your input)' : ''}</span><b class="${(sc[k].irr ?? 0) < 0 ? 'down' : ''}">${f(sc[k].irr)}</b></div>`).join('')}<div><span class="k">Deposit at the cash rate</span><b>${f(v?.tdAfterTax)}</b></div></div><p class="fine">${sc.base.yours ? 'The middle figure uses your own growth input and matches every other return on this page. ' : ''}3% is the major banks' forecast for 2026-27; nobody knows which path prices will take. The deposit figure is a ${pct(v?.depositRate ?? 4.35, 2)} cash-rate deposit after tax at your rate, with no price risk; most term deposits pay a little less.</p></div>`;
}
