import { registerForm, wireRegister } from './home.js';
import { esc, aud, pct, date, ago, setMeta } from '../ui.js';
import { load } from '../data.js';
import { commentary } from './markets.js';
import { rateWatchCard } from '../ratewatch.js';

export default async function weeklyPage(main) {
  setMeta({ title: 'Weekly property market report', description: 'What moved in the Australian property market this week: values, rates and the headlines, plus a free weekly update.' });
  const [weekly, market, rba, idx] = await Promise.all([load('weekly').catch(() => []), load('market'), load('rba'), load('index')]);
  const cur = weekly.at(-1);
  const prev = weekly.at(-2);
  const names = { CAP5: '5 capitals', SYD: 'Sydney', MEL: 'Melbourne', BNEGC: 'Brisbane + Gold Coast', ADL: 'Adelaide', PER: 'Perth' };
  const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Weekly report</div><h1>This week in property</h1>
  <p>Week of ${date(cur?.week)} · updated ${ago(cur?.updated)}. A new snapshot is saved every week, so the archive below grows over time.</p></div>
  <div class="grid g-side">
    <div>
      <div class="card"><h3>The short version</h3><p>${esc(commentary(market, rba))}</p>
      <div class="tbl-wrap"><table><thead><tr><th>Market</th><th class="n">Week</th><th class="n">Month</th><th class="n">Year to date</th><th class="n">12 months†</th></tr></thead><tbody>
      ${Object.entries(cur?.index || {}).map(([k, v]) => { const y = k === 'CAP5' ? null : market.regions[k === 'BNEGC' ? 'BNE' : k]?.annualPct; return `<tr><td>${names[k] || k}</td><td class="n ${cls(v.week)}">${pct(v.week, 2, true)}</td><td class="n ${cls(v.month)}">${pct(v.month, 2, true)}</td><td class="n ${cls(v.ytd)}">${pct(v.ytd, 1, true)}</td><td class="n ${cls(y)}">${y == null ? '—' : pct(y, 1, true)}</td></tr>`; }).join('')}
      </tbody></table></div>
      <div class="kv" style="margin-top:14px"><span>RBA cash rate</span><span>${pct(cur?.cash, 2)}</span>
      <span>Lowest investor variable</span><span>${pct(cur?.bestInv?.rate, 2)} (${esc(cur?.bestInv?.lender || '')})${prev?.bestInv ? ` · last week ${pct(prev.bestInv.rate, 2)}` : ''}</span>
      <span>Median advertised investor variable</span><span>${pct(cur?.medianInv, 2)}</span></div>
      <p class="fine" style="margin-top:8px">Week, month and year to date: Cotality Daily Home Value Index, ${date(idx.generated)}. †12 months: Cotality monthly index to ${esc(idx.monthEnd || '')} (for Brisbane + Gold Coast, the Brisbane figure), the same figure used across Keyzing. This report describes what moved; it isn’t a recommendation to buy, sell or wait.</p></div>
      <div style="margin-top:16px">${rateWatchCard(rba)}</div>
      <div class="card" style="margin-top:16px"><h3>Headlines this week</h3><div class="news-list">${(cur?.headlines || []).map((x) => `<div class="news-item"><div><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta">${esc(x.source)} · ${ago(x.date)}</div></div></div>`).join('')}</div></div>
      <div class="card" style="margin-top:16px"><h3>Archive</h3>${weekly.length > 1 ? `<div class="tbl-wrap"><table><thead><tr><th>Week of</th><th class="n">5 capitals</th><th class="n">Sydney</th><th class="n">Melbourne</th><th class="n">Brisbane + GC</th><th class="n">Adelaide</th><th class="n">Perth</th><th class="n">Lowest rate</th></tr></thead><tbody>${[...weekly].reverse().map((x) => `<tr><td>${date(x.week)}${x === weekly.at(-1) ? ' <span class="fine">(so far)</span>' : ''}</td>${['CAP5', 'SYD', 'MEL', 'BNEGC', 'ADL', 'PER'].map((k) => `<td class="n ${cls(x.index[k]?.week)}">${pct(x.index[k]?.week, 2, true)}</td>`).join('')}<td class="n">${pct(x.bestInv?.rate, 2)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">The first weekly snapshot was saved this week. Next week\'s will appear here too.</p>'}</div>
    </div>
    <div>
      <div class="card" id="reg">
        <h3>Register for updates</h3>
        <p class="note">Register for the weekly email edition (launching soon) and tell us which suburbs you're watching so we can flag big moves.</p>
        ${registerForm('reg-form')}
        <p class="fine">Your details are stored by Netlify for Keyzing only and never sold. <a href="/privacy" data-link>Privacy</a>.</p>
      </div>
    </div>
  </div>`;
  wireRegister(main.querySelector('#reg-form'));
}
