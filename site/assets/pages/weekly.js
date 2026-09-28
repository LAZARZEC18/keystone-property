import { registerForm, wireRegister } from './home.js';
import { esc, aud, pct, date, ago, setMeta } from '../ui.js';
import { load } from '../data.js';
import { commentary } from './markets.js';
import { rateWatchCard } from '../ratewatch.js';
import { trendWord } from '../live.js';
import { lenderName } from '../rate-rules.js';

export default async function weeklyPage(main) {
  setMeta({ title: 'Property market update: rates this week, prices at month-end', description: 'Home loan rates and the RBA outlook checked every week, capital-city values from the latest month-end index, and the week’s housing headlines.' });
  const [weekly, market, rba, idx] = await Promise.all([load('weekly').catch(() => []), load('market'), load('rba'), Promise.resolve(null)]);
  const cur = weekly.at(-1);
  const prev = weekly.at(-2);
  const names = { CAP5: '5 capitals', SYD: 'Sydney', MEL: 'Melbourne', BNEGC: 'Brisbane + Gold Coast', ADL: 'Adelaide', PER: 'Perth' };
  const cls = (v) => (v > 0 ? 'up' : v < 0 ? 'down' : '');
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Market update</div><h1>Rates this week, prices at month-end</h1>
  <p>Week of ${date(cur?.week)} · updated ${ago(cur?.updated)}. Lender rates and the RBA outlook change week to week and are checked every week. Home values come from Cotality's index, which is published monthly, so those figures change once a month (latest: ${esc(market.indexMonth || '')}). Market Lenz doesn't have weekly sales, clearance rates or listing volumes.</p></div>
  <div class="grid g-side">
    <div>
      <div class="card"><h3>Prices at month-end</h3><p>${esc(commentary(market, rba))}</p>
      <div class="tbl-wrap"><table><thead><tr><th>Market</th><th class="n">Month</th><th class="n">3 months</th><th class="n">12 months</th><th></th></tr></thead><tbody>
      ${Object.entries(market.regions).filter(([, r]) => r.capital).map(([k, r]) => `<tr><td>${esc(r.name)}</td><td class="n ${cls(r.monthPct)}">${pct(r.monthPct, 1, true)}</td><td class="n ${cls(r.quarterPct)}">${pct(r.quarterPct, 1, true)}</td><td class="n ${cls(r.annualPct)}">${pct(r.annualPct, 1, true)}</td><td class="muted">${trendWord(r.quarterPct)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="kv" style="margin-top:14px"><span>RBA cash rate</span><span>${pct(cur?.cash, 2)}</span>
      <span>Lowest investor variable</span><span>${pct(cur?.bestInv?.rate, 2)} (${esc(lenderName(cur?.bestInv?.lender || ''))})${prev?.bestInv ? ` · last week ${pct(prev.bestInv.rate, 2)}` : ''}</span>
      <span>Median advertised investor variable</span><span>${pct(cur?.medianInv, 2)}</span></div>
      <p class="fine" style="margin-top:8px">Cotality Home Value Index, month-end results to ${esc(market.indexMonth || '')} as published. This report describes what moved; it isn’t a recommendation to buy, sell or wait.</p></div>
      <div style="margin-top:16px">${rateWatchCard(rba)}</div>
      <div class="card" style="margin-top:16px"><h3>Headlines this week</h3><div class="news-list">${(cur?.headlines || []).map((x) => `<div class="news-item"><div><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta">${esc(x.source)} · ${ago(x.date)}</div></div></div>`).join('')}</div></div>
      <div class="card" style="margin-top:16px"><h3>Archive</h3>${weekly.length > 1 ? `<div class="tbl-wrap"><table><thead><tr><th>Week of</th><th class="n">Cash rate</th><th class="n">Lowest investor variable</th><th class="n">Lowest owner-occupier variable</th></tr></thead><tbody>${[...weekly].reverse().map((x) => `<tr><td>${date(x.week)}${x === weekly.at(-1) ? ' <span class="fine">(so far)</span>' : ''}</td><td class="n">${pct(x.cash, 2)}</td><td class="n">${pct(x.bestInv?.rate, 2)}</td><td class="n">${pct(x.bestOO?.rate, 2)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">The first weekly snapshot was saved this week. Next week\'s will appear here too.</p>'}</div>
    </div>
    <div>
      <div class="card" id="reg">
        <h3>Register for updates</h3>
        <p class="note">Register for the email edition (launching soon) and tell us which suburbs you're watching so we can flag big moves.</p>
        ${registerForm('reg-form')}
        <p class="fine">Your details are stored by Netlify for Market Lenz only and never sold. <a href="/privacy" data-link>Privacy</a>.</p>
      </div>
    </div>
  </div>`;
  wireRegister(main.querySelector('#reg-form'));
}
