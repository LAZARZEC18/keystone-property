import { demo } from '../demo.js';
import { esc, aud, pct, ago, setMeta, sortable } from '../ui.js';
import { rateRows, load } from '../data.js';
import { repayment } from '../engine.js';
import { rateWatchCard } from '../ratewatch.js';
import { membersOnly, notPurchase, checkEligibility } from '../rate-rules.js';

const okUrl = (u) => u && /^https?:/i.test(u) && !/\.pdf(\?|#|$)/i.test(u);

export default async function ratesPage(main, _p, query) {
  setMeta({ title: 'Home loan rates in Australia, updated several times a day', description: 'Every advertised home loan rate from 90+ Australian lenders, straight from their Open Banking feeds and checked several times a day. Investor and owner-occupier, variable and fixed.' });
  // paint the page from the small summary first; the full list of every rate (about 1 MB) fills the table after
  const [rba, rs] = await Promise.all([load('rba'), load('rates-summary')]);
  const pending = rateRows();
  let R = { rows: [], updated: rs.updated };
  const hasExtras = true;
  const extrasKnown = () => R.rows.some((r) => r.offset != null || r.annualFee != null);
  const siteOf = new Map();
  const st = {
    purpose: query.purpose || 'OO',
    repay: query.repay || 'PI',
    type: query.type || 'variable',
    term: query.term || '3',
    lvr: +query.lvr || 80,
    loan: +query.loan || 600000,
    q: '',
    showSpecial: false,
    showMembers: false,
    showTailored: false,
    showOutliers: false,
    sort: 'rate',
    asc: true,
    bestOnly: true,
    showAll: false,
  };

  main.innerHTML = `
  <div class="page-head with-demo"><div><div class="eyebrow">Rates</div><h1>Home loan rates from ${rs.lenders} lenders</h1>
  <p>${rs.rows.toLocaleString()} advertised rates from ${rs.lenders} lenders, read directly from each lender's public Consumer Data Right (Open Banking) product feed, checked several times a day. Every bank must publish one; some non-bank lenders don't, so they aren't here. Last check ${ago(R.updated)}.</p></div>${demo('rates')}</div>
  <div style="margin-bottom:16px">${rateWatchCard(rba, { compact: true })}</div>
  <div class="grid g4">
    ${[['OO_PI_variable', 'owner-occupier variable'], ['OO_PI_fixed2', 'owner-occupier 2-year fixed'], ['INV_PI_variable', 'investor variable P&I'], ['INV_PI_fixed3', 'investor 3-year fixed']]
      .map(([k, l]) => {
        // lead with the best rate anyone can get; credit unions and regional lenders (often lower, with eligibility rules) second
        const all = rs.best[k]?.[0];
        const b = rs.best[`${k}_national`]?.[0] || all;
        return `<div class="card"><div class="stat"><span class="k">Best ${l}, open to anyone</span><span class="v">${b ? pct(b.rate, 2) : '—'}</span><span class="s">${b ? `${esc(b.lender)} · comparison ${b.comparison != null ? pct(b.comparison, 2) : 'not given'}` : ''}</span>${all && all.lender !== b?.lender && all.rate < b.rate ? `<span class="s" style="margin-top:4px">Lower with eligibility rules: <b>${pct(all.rate, 2)}</b> ${esc(all.lender)}</span>` : ''}</div></div>`;
      })
      .join('')}
  </div>
  <div class="card flat tint section" style="margin-top:16px">
    <div class="fields">
      <label class="field">Loan purpose<select id="r-purpose"><option value="OO">Owner-occupied (a home to live in)</option><option value="INV">Investment</option></select></label>
      <label class="field">Repayments<select id="r-repay"><option value="PI">Principal &amp; interest</option><option value="IO">Interest only</option></select></label>
      <label class="field">Rate type<select id="r-type"><option value="variable">Variable</option><option value="fixed">Fixed</option></select></label>
      <label class="field">Fixed term<select id="r-term"><option value="1">1 year</option><option value="2">2 years</option><option value="3">3 years</option><option value="4">4 years</option><option value="5">5 years</option></select></label>
      <label class="field">Your LVR (%)<input id="r-lvr" type="number" min="10" max="100" step="5" value="${st.lvr}"></label>
      <label class="field">Loan amount ($)<input id="r-loan" type="number" step="1" value="${st.loan}"></label>
      <label class="field">Lender<input id="r-q" type="search" placeholder="e.g. ING"></label>
    </div>
    <div class="row" style="margin-top:12px">
      <label class="check"><input type="checkbox" id="r-best" checked> Lowest rate per lender only</label>
      ${hasExtras ? '<label class="check"><input type="checkbox" id="r-offset"> With an offset account</label><label class="check"><input type="checkbox" id="r-nofee"> No ongoing fee</label>' : ''}
      <label class="check"><input type="checkbox" id="r-special"> Include green, staff and niche loans</label>
      <label class="check"><input type="checkbox" id="r-members"> Include members-only lenders (police, teachers, health, emergency services)</label>
      <label class="check"><input type="checkbox" id="r-tailored"> Include products the lender flags as tailored (rate set case by case)</label>
      <label class="check"><input type="checkbox" id="r-outliers"> Include rates far above the rest (likely a base rate before discounts)</label>
    </div>
  </div>
  <div id="r-out" class="section"></div>
  <div class="grid g2 section">
    <div class="card"><h3>Advertised vs what people pay</h3><p class="note">The RBA says the average new investor variable loan in ${new Date(rba.actual.newInvVariable.at(-1)[0]).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })} was written at <b>${pct(rba.actual.newInvVariable.at(-1)[1], 2)}</b>, and owner-occupiers paid <b>${pct(rba.actual.newOOVariable.at(-1)[1], 2)}</b>${(rba.cashRate?.lastChange || '') > rba.actual.newOOVariable.at(-1)[0] ? `, before the cash rate ${(rba.cashRate.decisions.at(-1)?.change || 0) > 0 ? 'rise' : 'cut'} that took effect ${new Date(`${rba.cashRate.lastChange}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}` : ''}. The banks' "standard variable" headline rates are ${pct(rba.indicator.invStandardVariable.at(-1)[1], 2)} for investors. If your rate is well above the lowest advertised rate at your LVR, refinance or ask your bank to match it.</p></div>
    <div class="card"><h3>About this data</h3><p class="note">Under the Consumer Data Right every Australian bank must publish its products and rates in a standard format at a public address. Ownaroo checks every registered banking brand several times a day; <span id="r-brands">${rs.lenders} of them currently publish</span> home loan rates. Where a product's name gives a fixed term, interest-only repayments or an LVR limit that its feed leaves out, Ownaroo goes by the name. Advertised rates exclude discretionary discounts, and eligibility, fees and features vary, so read the comparison rate and the lender's terms.<span id="r-failed"></span></p></div>
  </div>`;
  const $ = (x) => main.querySelector(x);
  $('#r-purpose').value = st.purpose;
  $('#r-repay').value = st.repay;
  $('#r-type').value = st.type;
  $('#r-term').value = st.term;

  function draw() {
    if (!R.rows.length) {
      $('#r-out').innerHTML = '<div class="card"><p class="note">Loading every rate…</p></div>';
      return;
    }
    const q = st.q.toLowerCase();
    const match = (r, outliersToo) =>
        (r.purpose === st.purpose || r.purpose === 'ANY') &&
        r.repay === st.repay &&
        r.type === st.type &&
        (st.type !== 'fixed' || Math.abs(r.term - +st.term) < 0.01) &&
        (st.showSpecial || !r.special) &&
        (st.showMembers || !membersOnly(r)) &&
        !notPurchase(r) &&
        !r.suspect &&
        (st.showTailored || !r.tailored) &&
        (!st.offsetOnly || r.offset === 1) &&
        (!st.noFee || r.annualFee === 0) &&
        (outliersToo || st.showOutliers || !r.outlier) &&
        (r.lvrMax === null || r.lvrMax + 1e-9 >= st.lvr) &&
        (r.lvrMin === null || r.lvrMin <= st.lvr + 1e-9) &&
        (!q || r.lender.toLowerCase().includes(q) || r.product.toLowerCase().includes(q));
    let rows = R.rows.filter((r) => match(r, false));
    const hiddenOutliers = st.showOutliers ? 0 : R.rows.filter((r) => r.outlier && match(r, true)).length;
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
    <div class="tbl-wrap"><table id="rt" class="cards-sm"><thead><tr><th>#</th><th data-k="lender">Lender</th><th>Product</th><th data-k="rate" class="n">Rate</th><th data-k="comparison" class="n">Comparison</th><th class="n">LVR range</th>${extrasKnown() ? '<th>Offset · redraw</th><th class="n">Fees: yearly / up front</th>' : ''}<th data-k="repay" class="n">Monthly</th><th class="n" title="Extra interest and ongoing fees a year compared with the cheapest rate shown">vs cheapest / yr</th><th></th></tr></thead><tbody>
    ${rows
      .slice(0, st.showAll ? 300 : 15)
      .map((r, i) => {
        const m = repayment(st.loan, r.rate, years, st.repay === 'IO');
        const extra = cheapest !== null ? (m - repayment(st.loan, cheapest, years, st.repay === 'IO')) * 12 + (r.annualFee || 0) : 0;
        return `<tr class="${i === 0 ? 'hl' : ''}"><td class="faint mono">${i + 1}</td><td><b>${esc(r.lender)}</b></td><td class="muted" style="white-space:normal;min-width:200px">${esc(r.product)}${r.tailored ? ' <span class="tag tag-model">Tailored</span>' : ''}${r.special ? ' <span class="tag tag-news">Niche</span>' : ''}${membersOnly(r) ? ' <span class="tag tag-news">Members only</span>' : checkEligibility(r) ? ' <span class="tag tag-model" title="Customer-owned or regional lender: you usually join as a member, and some lend only in their region">Check eligibility</span>' : ''}</td><td class="n"><b>${pct(r.rate, 2)}</b></td><td class="n">${r.cmpBad ? '<span class="faint" title="The lender\'s feed gives a comparison rate that can\'t belong to this rate, so it isn\'t shown">ask lender</span>' : r.comparison == null ? '<span class="faint" title="Not given in the lender\'s feed">not given</span>' : pct(r.comparison, 2)}${r.comparison != null && r.comparison < r.rate - 0.001 ? '<sup title="Comparison rate below the advertised rate: see the note under the table">*</sup>' : ''}</td><td class="n">${r.lvrMin == null && r.lvrMax == null ? '<span class="faint">not stated</span>' : `${Math.round(r.lvrMin ?? 0)}–${Math.round(r.lvrMax ?? 100)}%`}</td>${extrasKnown() ? `<td>${r.offset === 1 ? '<span class="tag tag-official">Offset</span>' : `<span class="faint" title="The lender's feed doesn't list an offset for this product. It may still offer one: check with the lender">Not in feed</span>`}${r.redraw === 1 ? ' <span class="tag">Redraw</span>' : ''}</td><td class="n">${r.annualFee == null ? `<span class="faint" title="The lender's feed doesn't list this product's fees">Not in feed</span>` : `${aud(r.annualFee)} / ${aud(r.upfrontFee || 0)}`}</td>` : ''}<td class="n">${aud(m)}</td><td class="n ${extra > 0 ? 'down' : ''}">${extra > 0 ? `+${aud(extra)}` : '—'}</td><td>${okUrl(r.url) ? `<a href="${esc(r.url)}" target="_blank" rel="noopener nofollow">Product ↗</a>` : siteOf.get(r.lender) ? `<a href="${esc(siteOf.get(r.lender))}" target="_blank" rel="noopener nofollow" title="The lender's feed has no page for this product, so this opens its website">Lender site ↗</a>` : '<span class="faint">—</span>'}</td></tr>`;
      })
      .join('')}</tbody></table></div>
    ${!st.showAll && rows.length > 15 ? `<button class="btn sm" type="button" id="r-all" style="margin-top:10px">Show all ${Math.min(rows.length, 300)} ${st.bestOnly ? 'lenders' : 'rates'}</button>` : ''}
    ${st.showAll && rows.length > 300 ? '<p class="note">Showing the first 300. Narrow the filters to see more.</p>' : ''}
    ${!st.showOutliers && hiddenOutliers ? `<p class="note">${hiddenOutliers} rate${hiddenOutliers === 1 ? '' : 's'} more than 1.5 points above the typical rate for this loan type ${hiddenOutliers === 1 ? 'is' : 'are'} hidden. They are usually a base rate published before the lender's discount (the comparison rate is often much lower), or a specialist loan. Tick "Include rates far above the rest" to see them.</p>` : ''}
    ${!rows.length ? '<p class="empty">No advertised rates match. Try a lower LVR or another rate type.</p>' : ''}
    <p class="fine" style="margin-top:8px">"Check eligibility" marks customer-owned and regional lenders (credit unions, mutuals, regional banks): you usually become a member, and some only lend in their region. "Open to anyone" means a lender anyone in Australia can apply to online, by phone or through a broker, with no job, employer or regional membership test: the big banks, online lenders, and customer-owned banks that lend Australia-wide (such as Greater Bank, Newcastle Permanent, Heritage, IMB and Bank Australia). "Not stated" means the lender's feed gives no LVR limit; check with the lender. Headline figures and this table leave out members-only lenders and products (tick the box to show them), home equity loans, lines of credit and refinance-only offers. *A comparison rate can sit below the advertised rate when the lender's rate falls later in the loan (for example, Unloan cuts its rate each year you stay) or a package fee is waived; comparison rates are for a $150,000 loan over 25 years and may not reflect your loan. "Product" opens the lender's page for that loan; "Lender site" opens the lender's website where its feed gives no product page. "Ask lender" means the feed's comparison rate can't belong to this rate, so it isn't shown. Some products are called "Tailored" (for example NAB's standard loan); that is a name, not the lender's negotiated-rate flag. First home buyers using the 5% Deposit Scheme or Help to Buy need a participating lender: see <a href="https://www.housingaustralia.gov.au/" target="_blank" rel="noopener">Housing Australia's lender list ↗</a>.</p>`;
    $('#r-all')?.addEventListener('click', () => {
      st.showAll = true;
      draw();
    });
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
  if (hasExtras) {
    bind('#r-offset', 'offsetOnly');
    bind('#r-nofee', 'noFee');
  }
  bind('#r-special', 'showSpecial');
  bind('#r-members', 'showMembers');
  bind('#r-tailored', 'showTailored');
  bind('#r-outliers', 'showOutliers');
  draw();
  R = await pending;
  // each lender's website, from the product pages its feed does give
  for (const r of R.rows) {
    if (!siteOf.has(r.lender) && okUrl(r.url)) {
      try {
        siteOf.set(r.lender, new URL(r.url).origin);
      } catch {
        // skip malformed links
      }
    }
  }
  // sanity check: a rate far above the median for its loan type is almost always a base rate before discounts
  const med = new Map();
  for (const r of R.rows) {
    if (r.special || r.tailored) continue;
    const k = `${r.purpose}|${r.repay}|${r.type}`;
    (med.get(k) || med.set(k, []).get(k)).push(r.rate);
  }
  for (const [k, v] of med) med.set(k, v.sort((a, b) => a - b)[Math.floor(v.length / 2)]);
  for (const r of R.rows) {
    const m = med.get(`${r.purpose}|${r.repay}|${r.type}`);
    r.outlier = m != null && r.rate > m + 1.5;
  }
  if (!extrasKnown()) main.querySelectorAll('#r-offset, #r-nofee').forEach((x) => x.closest('label').remove());
  const failed = (R.failed || []).map((f) => f.lender);
  if (R.brandsChecked) $('#r-brands').textContent = `${R.lenders.length} of the ${R.brandsChecked} registered brands currently publish`;
  if (failed.length) $('#r-failed').textContent = ` Feeds unavailable at the last check: ${failed.join(', ')}.`;
  if (main.isConnected) draw();
}
