import { esc, aud, pct, ago, date, setMeta, lineChart, wireCharts, hbars } from '../ui.js';
import { load } from '../data.js';
import { DAILY, DAILY_NAMES, regionMoves, liveFactor } from '../live.js';

export default async function livePage(main) {
  setMeta({ title: 'Live property market: daily, weekly, monthly and yearly moves', description: 'How Australian home values moved today, this week, this month, year to date and over 12 months, updated daily. Plus live mortgage rates.' });
  const [idx, market, rs, rh, weekly, rba] = await Promise.all([load('index'), load('market'), load('rates-summary'), load('rates-history').catch(() => []), load('weekly').catch(() => []), load('rba')]);
  const regions = Object.entries(market.regions);
  const cls = (v) => (v === null || v === undefined ? '' : v > 0 ? 'up' : v < 0 ? 'down' : '');
  const cell = (v, dp = 2) => `<td class="n ${cls(v)}">${v === null || v === undefined ? '<span class="faint">—</span>' : pct(v, dp, true)}</td>`;
  const rows = regions.map(([code, R]) => {
    const m = regionMoves(code, idx, market);
    const f = liveFactor(code, idx);
    return { code, R, m, live: R.medianDwelling ? Math.round((R.medianDwelling * f) / 1000) * 1000 : null };
  });
  const cap5 = idx.daily.CAP5;
  const norm = Object.entries(DAILY).map(([code, key]) => {
    const s = idx.daily[key].series.slice(-365);
    const b = s[0][1];
    return { name: DAILY_NAMES[code], points: s.map(([d, v]) => [Date.parse(d), (v / b) * 100]) };
  });
  const rateSeries = rh.length > 1 ? [{ name: 'Lowest investor variable', points: rh.map((x) => [Date.parse(x.d), x.INV_PI_variable]).filter((p) => p[1]) }, { name: 'Median investor variable', points: rh.map((x) => [Date.parse(x.d), x.median]).filter((p) => p[1]) }] : null;
  const wk = [...rows].filter((r) => r.m.week !== null).sort((a, b) => b.m.week - a.m.week);

  main.innerHTML = `
  <div class="page-head"><div class="eyebrow"><span class="badge-live">Live</span> · updated ${ago(idx.updated)}</div>
  <h1>The market, today</h1>
  <p>Daily home value moves from Cotality's Daily Home Value Index for Sydney, Melbourne, Brisbane, Adelaide and Perth, plus month-end figures for every other market. Index date: <b>${date(idx.generated)}</b>. Keyzing checks for new data about every hour.</p></div>

  <div class="grid g4">
    <div class="card"><div class="stat"><span class="k">5-capital index, this week</span><span class="v ${cls(cap5.week)}">${pct(cap5.week, 2, true)}</span><span class="s">Month ${pct(cap5.month, 2, true)} · year to date ${pct(cap5.ytd, 2, true)} (daily index)</span></div></div>
    <div class="card"><div class="stat"><span class="k">Strongest this week</span><span class="v ${cls(wk[0]?.m.week)}">${esc(wk[0]?.R.name || '—')}</span><span class="s">${pct(wk[0]?.m.week, 2, true)} in 7 days</span></div></div>
    <div class="card"><div class="stat"><span class="k">Weakest this week</span><span class="v ${cls(wk.at(-1)?.m.week)}">${esc(wk.at(-1)?.R.name || '—')}</span><span class="s">${pct(wk.at(-1)?.m.week, 2, true)} in 7 days</span></div></div>
    <div class="card"><div class="stat"><span class="k">Lowest investor rate right now</span><span class="v">${pct(rs.best.INV_PI_variable?.[0]?.rate, 2)}</span><span class="s">${esc(rs.best.INV_PI_variable?.[0]?.lender || '')} · RBA ${pct(rba.cashRate.current, 2)}</span></div></div>
  </div>

  <section class="section">
    <h2>How values have moved</h2>
    <div class="tbl-wrap"><table><thead><tr><th>Market</th><th class="n">Live median (est.)</th><th class="n">Day</th><th class="n">Week</th><th class="n">Month</th><th class="n">Year to date</th><th class="n">12 months</th><th class="n">Houses 12m</th><th class="n">Units 12m</th></tr></thead><tbody>
    ${rows
      .map(
        ({ code, R, m, live }) => `<tr><td><a href="/suburbs?region=${code}" data-link>${esc(R.name)}</a>${code === 'BNE' ? '<span class="fine" style="display:block">daily moves: incl. Gold Coast</span>' : ''}</td><td class="n">${aud(live, { compact: true })}</td>${cell(m.day)}${cell(m.week)}${cell(m.month)}${cell(m.ytd)}${cell(m.year, 1)}${cell(idx.monthly[code]?.houseYear ?? R.houseAnnualPct, 1)}${cell(idx.monthly[code]?.unitYear ?? R.unitAnnualPct, 1)}</tr>`,
      )
      .join('')}
    </tbody></table></div>
    <p class="fine" style="margin-top:8px"><b>Two series, each used for one job.</b> Day, week, month and year to date come from Cotality's Daily Home Value Index (Sydney, Melbourne, Brisbane + Gold Coast, Adelaide, Perth). Every 12-month figure on Keyzing, here and on the ticker, market tables and suburb pages, comes from Cotality's monthly Home Value Index to ${esc(idx.monthEnd)}, which covers all markets on one method. The two indices are calculated differently, so a daily-index year and a monthly-index year can differ by several points; Keyzing only shows the monthly one. Live median = the ${esc(String(idx.monthEnd || '').replace(/^\d+ /, ''))} median rolled forward with the daily index to ${date(idx.generated)}. Hobart, Darwin, Canberra and the regional markets are published monthly only.</p>
  </section>

  <section class="section grid g2">
    <div class="card"><div class="card-head"><h3>Last 12 months, day by day</h3><span class="note">Index, 12 months ago = 100</span></div>${lineChart(norm, { height: 280, yFmt: (v) => v.toFixed(0), xFmt: (v) => new Date(v).toLocaleDateString('en-AU', { month: 'short' }) })}</div>
    <div class="card"><h3>Change over the last 7 days</h3>${hbars(wk.map((r) => ({ label: DAILY_NAMES[r.code] || r.R.name, value: r.m.week })), { fmt: (v) => pct(v, 2, true), signedScale: true })}
      <h3 style="margin-top:18px">Year to date (daily index)</h3>${hbars(rows.filter((r) => r.m.ytd !== null).sort((a, b) => b.m.ytd - a.m.ytd).map((r) => ({ label: DAILY_NAMES[r.code] || r.R.name, value: r.m.ytd })), { fmt: (v) => pct(v, 1, true), signedScale: true })}</div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Mortgage rates, tracked daily</h3>${rateSeries ? lineChart(rateSeries, { height: 220, yFmt: (v) => `${v.toFixed(2)}%` }) : `<p class="note">Keyzing started logging the lowest advertised rate every day on ${date(rh[0]?.d || new Date().toISOString())}. The chart fills in as days pass. Right now: lowest investor variable <b>${pct(rs.best.INV_PI_variable?.[0]?.rate, 2)}</b>, median <b>${pct(rs.medianInvestorVariable, 2)}</b>.</p>`}
      <a href="/rates" data-link>Compare every rate →</a></div>
    <div class="card"><h3>Week by week</h3>
      ${weekly.length ? `<div class="tbl-wrap"><table><thead><tr><th>Week of</th><th class="n">5-capital week</th><th class="n">Perth</th><th class="n">Sydney</th><th class="n">Lowest inv. rate</th></tr></thead><tbody>${[...weekly].reverse().slice(0, 12).map((x) => `<tr><td>${date(x.week)}</td>${cell(x.index.CAP5?.week)}${cell(x.index.PER?.week)}${cell(x.index.SYD?.week)}<td class="n">${pct(x.bestInv?.rate, 2)}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <p class="note" style="margin-top:8px">Keyzing saves a snapshot every week so you can see the trend build up. <a href="/weekly" data-link>Weekly market report →</a></p></div>
  </section>`;
  wireCharts(main, (v) => v.toFixed(2));
}
