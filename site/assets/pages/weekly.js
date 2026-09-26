import { esc, aud, pct, date, ago, setMeta } from '../ui.js';
import { load } from '../data.js';
import { commentary } from './markets.js';

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
      <div class="tbl-wrap"><table><thead><tr><th>Market</th><th class="n">Week</th><th class="n">Month</th><th class="n">YTD</th><th class="n">12 months</th></tr></thead><tbody>
      ${Object.entries(cur?.index || {}).map(([k, v]) => `<tr><td>${names[k] || k}</td><td class="n ${cls(v.week)}">${pct(v.week, 2, true)}</td><td class="n ${cls(v.month)}">${pct(v.month, 2, true)}</td><td class="n ${cls(v.ytd)}">${pct(v.ytd, 1, true)}</td><td class="n ${cls(v.year)}">${pct(v.year, 1, true)}</td></tr>`).join('')}
      </tbody></table></div>
      <div class="kv" style="margin-top:14px"><span>RBA cash rate</span><span>${pct(cur?.cash, 2)}</span>
      <span>Lowest investor variable</span><span>${pct(cur?.bestInv?.rate, 2)} (${esc(cur?.bestInv?.lender || '')})${prev?.bestInv ? ` · last week ${pct(prev.bestInv.rate, 2)}` : ''}</span>
      <span>Median advertised investor variable</span><span>${pct(cur?.medianInv, 2)}</span></div>
      <p class="fine" style="margin-top:8px">Index moves: Cotality Daily Home Value Index, ${date(idx.generated)}.</p></div>
      <div class="card" style="margin-top:16px"><h3>Headlines this week</h3><div class="news-list">${(cur?.headlines || []).map((x) => `<div class="news-item"><div><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta">${esc(x.source)} · ${ago(x.date)}</div></div></div>`).join('')}</div></div>
      <div class="card" style="margin-top:16px"><h3>Archive</h3>${weekly.length > 1 ? `<div class="tbl-wrap"><table><thead><tr><th>Week of</th><th class="n">5 capitals</th><th class="n">Sydney</th><th class="n">Melbourne</th><th class="n">Brisbane</th><th class="n">Adelaide</th><th class="n">Perth</th><th class="n">Lowest rate</th></tr></thead><tbody>${[...weekly].reverse().map((x) => `<tr><td>${date(x.week)}</td>${['CAP5', 'SYD', 'MEL', 'BNEGC', 'ADL', 'PER'].map((k) => `<td class="n ${cls(x.index[k]?.week)}">${pct(x.index[k]?.week, 2, true)}</td>`).join('')}<td class="n">${pct(x.bestInv?.rate, 2)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="note">The first weekly snapshot was saved this week. Next week\'s will appear here too.</p>'}</div>
    </div>
    <div>
      <div class="card" id="reg">
        <h3>Register for updates</h3>
        <p class="note">Get Keystone's weekly market update, and tell us which suburbs you're watching so we can flag big moves.</p>
        <form id="reg-form" name="register" method="POST" data-netlify="true" netlify-honeypot="company">
          <input type="hidden" name="form-name" value="register">
          <p hidden><label>Leave empty <input name="company"></label></p>
          <div class="fields" style="grid-template-columns:1fr">
            <label class="field">Name<input name="name" autocomplete="name"></label>
            <label class="field">Email<input name="email" type="email" required autocomplete="email"></label>
            <label class="field">I am a<select name="type"><option>First home buyer</option><option>Investor</option><option>Both</option><option>Industry</option></select></label>
            <label class="field">Suburbs or postcodes I'm watching<input name="suburbs" placeholder="e.g. Morley 6062, Bayswater"></label>
            <label class="field">Budget<input name="budget" placeholder="e.g. $700k"></label>
          </div>
          <label class="check" style="margin-top:10px"><input type="checkbox" name="consent" required> Email me Keystone updates. I can unsubscribe any time.</label>
          <button class="btn primary" style="margin-top:12px" type="submit">Register</button>
          <p class="note" id="reg-msg" style="margin-top:8px"></p>
        </form>
        <p class="fine">Your details are stored by Netlify for Keystone only and never sold. <a href="/methodology#privacy" data-link>Privacy</a>.</p>
      </div>
    </div>
  </div>`;
  const form = main.querySelector('#reg-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = main.querySelector('#reg-msg');
    msg.textContent = 'Sending…';
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() });
      if (!r.ok) throw new Error(r.status);
      form.reset();
      msg.innerHTML = '<span class="up">Thanks, you\'re registered.</span>';
    } catch (err) {
      msg.innerHTML = `<span class="down">Couldn't register right now (${esc(String(err.message || err))}). Please try again later.</span>`;
    }
  });
}
