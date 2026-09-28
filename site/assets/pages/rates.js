import { demo } from '../demo.js';
import { esc, aud, pct, ago, setMeta, sortable } from '../ui.js';
import { rateRows, load } from '../data.js';
import { repayment } from '../engine.js';
import { rateWatchCard } from '../ratewatch.js';
import { membersOnly, notPurchase } from '../rate-rules.js';

const tidy = (n = '') => (n === n.toUpperCase() && /[A-Z]{4}/.test(n) ? n.toLowerCase().replace(/\b([a-z])([a-z]{3,})/g, (_, a, b) => a.toUpperCase() + b).replace(/\b(lvr|p&i|io|smsf|abn)\b/g, (x) => x.toUpperCase()) : n);
const okUrl = (u) => u && /^https?:/i.test(u) && !/\.pdf(\?|#|$)/i.test(u);

export default async function ratesPage(main, _p, query) {
  setMeta({ title: 'Home loan rates in Australia, updated several times a day', description: 'Every advertised home loan rate from 90+ Australian lenders, straight from their Open Banking feeds and checked several times a day. Investor and owner-occupier, variable and fixed.' });
  const [R, rba, rs] = await Promise.all([rateRows(), load('rba'), load('rates-summary')]);
  const st = {
    purpose: query.purpose || 'INV',
    repay: query.repay || 'PI',
    type: query.type || 'variable',
    term: query.term || '3',
    lvr: +query.lvr || 80,
    loan: +query.loan || 600000,
    q: '',
    showSpecial: false,
    showMembers: false,
    showTailored: false,
    sort: 'rate',
    asc: true,
    bestOnly: true,
  };
  const failed = R.failed.map((f) => f.lender);

  main.innerHTML = `
  <div class="page-head with-demo"><div><div class="eyebrow">Rates</div><h1>Every home loan rate in Australia</h1>
  <p>${R.rows.length.toLocaleString()} advertised rates from ${R.lenders.length} lenders, read directly from each bank's public Consumer Data Right (Open Banking) product feed, checked several times a day. Last check ${ago(R.updated)}.</p></div>${demo('rates')}</div>
  <div style="margin-bottom:16px">${rateWatchCard(rba, { compact: true })}</div>
  <div class="grid g4">
    ${[['INV_PI_variable', 'Investor variable P&I'], ['INV_PI_fixed3', 'Investor 3-yr fixed'], ['OO_PI_variable', 'Owner-occupier variable'], ['OO_PI_fixed2', 'Owner-occupier 2-yr fixed']]
      .map(([k, l]) => {
        const b = rs.best[k]?.[0];
        return `<div class="card"><div class="stat"><span class="k">Lowest ${l}</span><span class="v">${b ? pct(b.rate, 2) : '—'}</span><span class="s">${b ? `${esc(b.lender)} · comparison ${pct(b.comparison, 2)}` : ''}</span></div></div>`;
      })
      .join('')}
  </div>
  <div class="card flat tint section" style="margin-top:16px">
    <div class="fields">
      <label class="field">Loan purpose<select id="r-purpose"><option value="INV">Investment</option><option value="OO">Owner-occupied</option></select></label>
      <label class="field">Repayments<select id="r-repay"><option value="PI">Principal &amp; interest</option><option value="IO">Interest only</option></select></label>
      <label class="field">Rate type<select id="r-type"><option value="variable">Variable</option><option value="fixed">Fixed</option></select></label>
      <label class="field">Fixed term<select id="r-term"><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5 years</option></select></label>
      <label class="field">Your LVR (%)<input id="r-lvr" type="number" min="10" max="100" step="5" value="${st.lvr}"></label>
      <label class="field">Loan amount ($)<input id="r-loan" type="number" step="1" value="${st.loan}"></label>
      <label class="field">Lender<input id="r-q" type="search" placeholder="e.g. ING"></label>
    </div>
    <div class="row" style="margin-top:12px">
      <label class="check"><input type="checkbox" id="r-best" checked> Best rate per lender only</label>
      <label class="check"><input type="checkbox" id="r-special"> Include green, staff and niche loans</label>
      <label class="check"><input type="checkbox" id="r-members"> Include members-only lenders (police, teachers, health, emergency services)</label>
      <label class="check"><input type="checkbox" id="r-tailored"> Include products the lender flags as tailored (rate set case by case)</label>
    </div>
  </div>
  <div id="r-out" class="section"></div>
  <div class="grid g2 section">
    <div class="card"><h3>Advertised vs what people pay</h3><p class="note">The RBA says the average new investor variable loan in ${new Date(rba.actual.newInvVariable.at(-1)[0]).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} was written at <b>${pct(rba.actual.newInvVariable.at(-1)[1], 2)}</b>, and owner-occupiers paid <b>${pct(rba.actual.newOOVariable.at(-1)[1], 2)}</b>. The banks' "standard variable" headline rates are ${pct(rba.indicator.invStandardVariable.at(-1)[1], 2)} for investors. If your rate is well above the lowest advertised rate at your LVR, refinance or ask your bank to match it.</p></div>
    <div class="card"><h3>About this data</h3><p class="note">Under the Consumer Data Right every Australian bank must publish its products and rates in a standard format at a public address. Keyzing checks all ${R.brandsChecked} registered banking brands several times a day; ${R.lenders.length} of them currently publish home loan rates. Where a product's name gives a fixed term, interest-only repayments or an LVR limit that its feed leaves out, Keyzing goes by the name. Advertised rates exclude discretionary discounts, and eligibility, fees and features vary, so read the comparison rate and the lender's terms.${failed.length ? ` Feeds unavailable at the last check: ${failed.map(esc).join(', ')}.` : ''}</p></div>
  </div>`;
  const $ = (x) => main.querySelector(x);
  $('#r-purpose').value = st.purpose;
  $('#r-repay').value = st.repay;
  $('#r-type').value = st.type;
  $('#r-term').value = st.term;

  function draw() {
    const q = st.q.toLowerCase();
    let rows = R.rows.filter(
      (r) =>
        (r.purpose === st.purpose || r.purpose === 'ANY') &&
        r.repay === st.repay &&
        r.type === st.type &&
        (st.type !== 'fixed' || Math.abs(r.term - +st.term) < 0.01) &&
        (st.showSpecial || !r.special) &&
        (st.showMembers || !membersOnly(r)) &&
        !notPurchase(r) &&
        (st.showTailored || !r.tailored) &&
        (r.lvrMax === null || r.lvrMax + 1e-9 >= st.lvr) &&
        (r.lvrMin === null || r.lvrMin <= st.lvr + 1e-9) &&
        (!q || r.lender.toLowerCase().includes(q) || r.product.toLowerCase().includes(q)),
    );
    rows.sort((a, b) => a.rate - b.rate);
    if (st.bestOnly) {
      const seen = new Set();
      rows = rows.filter((r) => (seen.has(r.lender) ? false : seen.add(r.lender)));
    }
    const key = { rate: (r) => r.rate, comparison: (r) => r.comparison ?? 99, lender: (r) => r.lender, repay: (r) => r.rate }[st.sort];
    rows.sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0) * (st.asc ? 1 : -1));
    const years = 30;
    const cheapest = rows.length ? Math.min(...rows.map((r) => r.rate)) : null;
    $('#r-out').innerHTML = `<div class="spread" style="margin-bottom:8px"><span class="muted"><b>${rows.length}</b> ${st.bestOnly ? 'lenders' : 'rates'} match · repayments on ${aud(st.loan)} over ${years} years${st.repay === 'IO' ? ' (interest only)' : ''}</span></div>
    <div class="tbl-wrap"><table id="rt"><thead><tr><th>#</th><th data-k="lender">Lender</th><th>Product</th><th data-k="rate" class="n">Rate</th><th data-k="comparison" class="n">Comparison</th><th class="n">LVR range</th><th data-k="repay" class="n">Monthly</th><th class="n">vs cheapest / yr</th><th></th></tr></thead><tbody>
    ${rows
      .slice(0, 300)
      .map((r, i) => {
        const m = repayment(st.loan, r.rate, years, st.repay === 'IO');
        const extra = cheapest !== null ? (m - repayment(st.loan, cheapest, years, st.repay === 'IO')) * 12 : 0;
        return `<tr class="${i === 0 ? 'hl' : ''}"><td class="faint mono">${i + 1}</td><td><b>${esc(r.lender)}</b></td><td class="muted" style="white-space:normal;min-width:200px">${esc(tidy(r.product))}${r.tailored ? ' <span class="tag tag-model">Tailored</span>' : ''}${r.special ? ' <span class="tag tag-news">Niche</span>' : ''}${membersOnly(r) ? ' <span class="tag tag-news">Members only</span>' : ''}</td><td class="n"><b>${pct(r.rate, 2)}</b></td><td class="n">${pct(r.comparison, 2)}${r.comparison != null && r.comparison < r.rate - 0.001 ? '<sup title="Comparison rate below the advertised rate: see the note under the table">*</sup>' : ''}</td><td class="n">${r.lvrMin ?? 0}–${r.lvrMax ?? 100}%</td><td class="n">${aud(m)}</td><td class="n ${extra > 0 ? 'down' : ''}">${extra > 0 ? `+${aud(extra)}` : '—'}</td><td>${okUrl(r.url) ? `<a href="${esc(r.url)}" target="_blank" rel="noopener nofollow">Lender ↗</a>` : `<a href="https://www.google.com/search?q=${encodeURIComponent(`${r.lender} ${tidy(r.product)}`)}" target="_blank" rel="noopener nofollow" title="This lender's feed has no product page link">Find ↗</a>`}</td></tr>`;
      })
      .join('')}</tbody></table></div>
    ${rows.length > 300 ? '<p class="note">Showing the first 300. Narrow the filters to see more.</p>' : ''}
    ${!rows.length ? '<p class="empty">No advertised rates match. Try a lower LVR or another rate type.</p>' : ''}
    <p class="fine" style="margin-top:8px">Headline figures and this table leave out members-only lenders and products (tick the box to show them), home equity loans, lines of credit and refinance-only offers. *A comparison rate can sit below the advertised rate when the lender's rate falls later in the loan (for example, Unloan cuts its rate each year you stay) or a package fee is waived; comparison rates are for a $150,000 loan over 25 years and may not reflect your loan. "Find ↗" means the lender's feed didn't include a product page, so the link searches for it. Some products are called "Tailored" (for example NAB's standard loan); that is a name, not the lender's negotiated-rate flag. First home buyers using the 5% Deposit Scheme or Help to Buy need a participating lender: see <a href="https://www.housingaustralia.gov.au/" target="_blank" rel="noopener">Housing Australia's lender list ↗</a>.</p>`;
    const t = $('#rt');
    t.querySelector(`th[data-k="${st.sort}"]`)?.classList.add(st.asc ? 'asc' : 'desc');
    sortable(t, (k, asc) => {
      st.sort = k;
      st.asc = asc;
      draw();
    });
  }
  const bind = (id, k, conv = (v) => v) =>
    $(id).addEventListener('input', (e) => {
      st[k] = conv(e.target.type === 'checkbox' ? e.target.checked : e.target.value);
      draw();
    });
  bind('#r-purpose', 'purpose');
  bind('#r-repay', 'repay');
  bind('#r-type', 'type');
  bind('#r-term', 'term');
  bind('#r-lvr', 'lvr', Number);
  bind('#r-loan', 'loan', Number);
  bind('#r-q', 'q');
  bind('#r-best', 'bestOnly');
  bind('#r-special', 'showSpecial');
  bind('#r-members', 'showMembers');
  bind('#r-tailored', 'showTailored');
  draw();
}
