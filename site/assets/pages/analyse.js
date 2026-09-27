import { esc, aud, pct, num, setMeta, lineChart, wireCharts, stack, date } from '../ui.js';
import { suburbs, cleanName, suburbUrl, load } from '../data.js';
import { analyse, verdict, suburbScore, borrowingPower } from '../engine.js';
import { RULES, STATES } from '../rules.js';
import { attachSearch } from '../app.js';

const SCEN = { bear: { growth: 2, rentGrowth: 2.5 }, base: { growth: 5, rentGrowth: 4 }, bull: { growth: 7, rentGrowth: 5 } };

export default async function analysePage(main, _p, query) {
  setMeta({ title: 'Investment property analyser', description: 'Stamp duty, LMI, land tax, cash flow, after-tax return and an A–D rating of the numbers for any Australian property, with the 2026 negative gearing and CGT rules.' });
  const [idx, market, rs, rba] = await Promise.all([suburbs(), load('market'), load('rates-summary'), load('rba')]);
  let sub = query.suburb ? idx.byId.get(query.suburb) : null;
  const best = rs.best.INV_PI_variable?.[0];
  const typical = rba.actual.newInvVariable.at(-1)?.[1];
  const type = query.type || sub?.pt || 'h';
  const st = {
    addr: query.addr || '',
    state: sub?.s || query.state || 'NSW',
    price: +query.price || (sub ? (type === 'u' ? sub.u : sub.h) : 850000),
    weeklyRent: +query.rent || (sub ? (type === 'u' ? sub.ru : sub.rh) : 650),
    type,
    newBuild: query.new === '1',
    buildYear: +query.built || (query.new === '1' ? 2026 : 2005),
    deposit: query.dep ? +query.dep / 100 : 0.2,
    ratePct: +query.rate || +(best ? Math.max(best.rate, (rs.medianInvestorVariable || typical) - 0.4) : typical || 6.4).toFixed(2),
    years: 30,
    interestOnly: query.io === '1',
    income: +query.income || 120000,
    buyer: query.buyer || 'investor',
    growth: +query.growth || (type === 'u' ? 3.5 : 5),
    rentGrowth: +query.rg || 4,
    cpi: 3,
    vacancyWeeks: query.vac ? +query.vac : 2,
    mgmtPct: query.mgmt ? +query.mgmt : 7.5,
    councilRates: +query.council || 2200,
    water: 900,
    strata: query.strata ? +query.strata : type === 'u' ? 3200 : 0,
    insurance: type === 'u' ? 600 : 1800,
    maintenancePct: type === 'u' ? 1.5 : 1.2,
    landValuePct: type === 'u' ? 0.25 : 0.55,
    otherCosts: 2500,
    hold: +query.hold || 10,
    sellCostPct: 2.5,
    purchaseDate: query.date || new Date().toISOString().slice(0, 10),
    lmiCapitalise: true,
    perth: sub?.rg === 'PER',
  };

  const field = (id, label, value, attrs = '', help = '') => `<label class="field">${label}<input id="${id}" value="${value}" ${attrs}>${help ? `<span class="help">${help}</span>` : ''}</label>`;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Deal analyser</div><h1>Should you buy it?</h1>
  <p>Enter a property and Keystone works out every cost: stamp duty for your state, LMI, land tax, rates, strata and management. It projects 10 years of cash flow, tax, equity and sale, applies the 2026 negative gearing and CGT rules, and rates the numbers A to D with every reason listed. It is general information, not a recommendation to buy or not buy.</p></div>
  <div class="grid g-side" style="grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)">
    <div>
      <div class="card">
        <h3>Property</h3>
        <div class="fields">
          <label class="field" style="position:relative;grid-column:1/-1">Suburb (fills in prices and rents)<input id="a-sub" type="search" placeholder="Search suburb or postcode" value="${sub ? esc(`${cleanName(sub.n)} ${sub.s} ${sub.pc}`) : ''}"><div class="ac" id="a-ac" hidden style="top:62px;left:0;right:auto"></div><span class="help" id="a-subinfo"></span></label>
          ${field('a-addr', 'Address or label (optional)', esc(st.addr), 'type="text" style="grid-column:1/-1"')}
          <label class="field">State<select id="a-state">${Object.keys(STATES).map((s) => `<option ${s === st.state ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <label class="field">Type<select id="a-type"><option value="h">House</option><option value="u" ${st.type === 'u' ? 'selected' : ''}>Unit / apartment</option></select></label>
          ${field('a-price', 'Purchase price ($)', st.price, 'type="number" step="1"')}
          ${field('a-rent', 'Weekly rent ($)', st.weeklyRent, 'type="number" step="5"')}
          <label class="field">New build?<select id="a-new"><option value="0">Established</option><option value="1" ${st.newBuild ? 'selected' : ''}>New build (never lived in)</option></select><span class="help">Matters a lot under the 2026 rules</span></label>
          ${field('a-built', 'Year built', st.buildYear, 'type="number" min="1850" max="2030"', 'For 2.5% building depreciation')}
          ${field('a-strata', 'Strata levies ($/yr)', st.strata, 'type="number" step="1"')}
          ${field('a-council', 'Council rates ($/yr)', st.councilRates, 'type="number" step="1"')}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Loan</h3>
        <div class="fields">
          ${field('a-dep', 'Deposit (%)', st.deposit * 100, 'type="number" step="1" min="5" max="100"')}
          ${field('a-rate', 'Interest rate (% p.a.)', st.ratePct, 'type="number" step="0.01"')}
          <label class="field">Repayments<select id="a-io"><option value="0">Principal &amp; interest</option><option value="1" ${st.interestOnly ? 'selected' : ''}>Interest only</option></select></label>
          ${field('a-term', 'Loan term (years)', st.years, 'type="number" min="5" max="40"')}
        </div>
        <div class="row" style="margin-top:10px">
          ${best ? `<button class="btn sm" data-rate="${best.rate}">Lowest advertised ${pct(best.rate, 2)} (${esc(best.lender)})</button>` : ''}
          ${typical ? `<button class="btn sm" data-rate="${typical}">Typical new investor loan ${pct(typical, 2)} (RBA)</button>` : ''}
          <a class="note" href="/rates" data-link>Compare all rates →</a>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>You</h3>
        <div class="fields">
          ${field('a-income', 'Your taxable income ($/yr)', st.income, 'type="number" step="1"', 'Before this property')}
          <label class="field">Buyer<select id="a-buyer"><option value="investor">Investor</option><option value="owner" ${st.buyer === 'owner' ? 'selected' : ''}>Owner-occupier</option><option value="fhb" ${st.buyer === 'fhb' ? 'selected' : ''}>First home buyer</option></select><span class="help">Changes stamp duty only</span></label>
          ${field('a-date', 'Contract date', st.purchaseDate, 'type="date"')}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Assumptions</h3>
        <div class="seg" id="a-scen" style="margin-bottom:12px"><button data-s="bear">Bear 2%</button><button data-s="base" class="on">Base 5%</button><button data-s="bull">Bull 7%</button></div>
        <div class="fields">
          ${field('a-growth', 'Capital growth (%/yr)', st.growth, 'type="number" step="0.5"')}
          ${field('a-rg', 'Rent growth (%/yr)', st.rentGrowth, 'type="number" step="0.5"')}
          ${field('a-vac', 'Vacancy (weeks/yr)', st.vacancyWeeks, 'type="number" step="1" min="0" max="26"')}
          ${field('a-mgmt', 'Property management (%)', st.mgmtPct, 'type="number" step="0.5"')}
          ${field('a-hold', 'Years before selling', st.hold, 'type="number" min="1" max="30"')}
          ${field('a-cpi', 'Inflation (%/yr)', st.cpi, 'type="number" step="0.5"')}
        </div>
      </div>
    </div>
    <div id="out"></div>
  </div>`;

  const $ = (x) => main.querySelector(x);
  const read = () => {
    const v = (id) => $(id).value;
    Object.assign(st, {
      addr: v('#a-addr'), state: v('#a-state'), type: v('#a-type'), price: +v('#a-price'), weeklyRent: +v('#a-rent'),
      newBuild: v('#a-new') === '1', buildYear: +v('#a-built'), strata: +v('#a-strata'), councilRates: +v('#a-council'),
      deposit: +v('#a-dep') / 100, ratePct: +v('#a-rate'), interestOnly: v('#a-io') === '1', years: +v('#a-term'),
      income: +v('#a-income'), buyer: v('#a-buyer'), purchaseDate: v('#a-date'), growth: +v('#a-growth'), rentGrowth: +v('#a-rg'),
      vacancyWeeks: +v('#a-vac'), mgmtPct: +v('#a-mgmt'), hold: Math.max(1, Math.min(30, +v('#a-hold') || 10)), cpi: +v('#a-cpi'),
    });
    st.landValuePct = st.type === 'u' ? 0.25 : 0.55;
    st.maintenancePct = st.type === 'u' ? 1.5 : 1.2;
    st.insurance = st.type === 'u' ? 600 : 1800;
  };

  function run() {
    read();
    if (!(st.price > 10000)) {
      $('#out').innerHTML = '<div class="card"><p>Enter a purchase price to see the numbers.</p></div>';
      return;
    }
    const r = analyse(st);
    const v = verdict(r, sub ? { ...sub, score: suburbScore(sub.sc) } : null, market);
    const s = r.summary;
    const y1 = r.rows[0];
    const y3 = r.rows[Math.min(2, r.rows.length - 1)];
    const scen = Object.fromEntries(Object.entries(SCEN).map(([k, o]) => [k, analyse({ ...st, ...o }).summary]));
    const rateUp = [0, 1, 2].map((dd) => ({ dd, s: analyse({ ...st, ratePct: st.ratePct + dd }).summary }));
    const bp = borrowingPower({ grossIncome: st.income, ratePct: st.ratePct, newRentWeekly: st.weeklyRent });
    const ngText = {
      restricted: `Established property contracted on or after 12 May 2026. Losses offset your salary only for the part of the first year before 1 July 2027 (${Math.round(y1.offsetShare * 100)}% of year 1). After that they carry forward against rent profits and the capital gain when you sell. By the sale you'll have ${aud(r.rows.at(-1).carried)} of carried-forward losses.`,
      grandfathered: 'Contracted before 12 May 2026, so grandfathered: rental losses keep reducing your salary tax.',
      'new-build': 'New build: keeps negative gearing and can choose the 50% CGT discount or indexation when sold.',
    }[s.negativeGearing];
    const url = new URLSearchParams({ state: st.state, price: st.price, rent: st.weeklyRent, type: st.type, new: st.newBuild ? 1 : 0, dep: Math.round(st.deposit * 100), rate: st.ratePct, income: st.income, growth: st.growth, hold: st.hold, date: st.purchaseDate });
    if (sub) url.set('suburb', sub.id);
    if (st.addr) url.set('addr', st.addr);
    history.replaceState(null, '', `/analyse?${url}`);

    const cf = [
      ['Rent (after vacancy)', y1.grossRent],
      ['Property management', -y1.mgmt],
      ['Council, water, strata, insurance', -y1.otherCosts],
      ['Maintenance', -y1.maintenance],
      ['Land tax', -y1.landTax],
      ['Loan interest', -y1.interest],
      ['Loan principal', -y1.principal],
      ['Cash flow before tax', y1.cashBeforeTax, 'tot'],
      [y1.taxEffect >= 0 ? 'Tax refund (negative gearing)' : 'Extra tax on rental profit', y1.taxEffect],
      ['Cash flow after tax', y1.cashAfterTax, 'tot'],
    ];
    $('#out').innerHTML = `
      <div class="card">
        <div class="verdict"><div class="grade grade-${v.grade}">${v.grade}</div>
          <div><div class="eyebrow" style="margin:0">Keystone rating of the numbers · ${v.score}/100</div><h2 style="margin:2px 0 4px">${v.label}${st.addr ? ` <span class="muted" style="font-size:.6em">${esc(st.addr)}</span>` : ''}</h2>
          <div class="note">${sub ? `<a href="${suburbUrl(sub)}" data-link>${esc(cleanName(sub.n))}</a> · ` : ''}${aud(st.price)} · ${aud(st.weeklyRent)}/wk · ${Math.round(st.deposit * 100)}% deposit at ${pct(st.ratePct, 2)}</div></div></div>
        <div class="grid g2" style="margin-top:12px;gap:8px 20px">
          <div>${v.reasons.length ? `<ul class="pros">${v.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
          <div>${v.risks.length ? `<ul class="cons">${v.risks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</div>
        </div>
      </div>
      <div class="grid g4" style="margin-top:16px">
        <div class="card"><div class="stat"><span class="k">Cash needed up front</span><span class="v">${aud(r.upfront.total, { compact: true })}</span><span class="s">Loan ${aud(s.loan, { compact: true })} · LVR ${s.lvr}%</span></div></div>
        <div class="card"><div class="stat"><span class="k">Weekly, year 1 after tax</span><span class="v ${s.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${aud(s.weeklyCashAfterTax)}</span><span class="s">Year 3: ${aud(y3.cashAfterTax / 52)}/wk</span></div></div>
        <div class="card"><div class="stat"><span class="k">After-tax return (IRR)</span><span class="v">${pct(s.irr, 1)}</span><span class="s">on your cash, ${st.hold} years</span></div></div>
        <div class="card"><div class="stat"><span class="k">Profit after sale and tax</span><span class="v ${s.totalProfit >= 0 ? 'up' : 'down'}">${aud(s.totalProfit, { compact: true })}</span><span class="s">Equity ${aud(s.equityAtSale, { compact: true })}</span></div></div>
      </div>

      <div class="grid g2" style="margin-top:16px">
        <div class="card"><h3>Up-front costs</h3>
          ${stack([{ label: 'Deposit', value: r.upfront.deposit }, { label: 'Stamp duty', value: r.upfront.duty }, { label: 'Legal, inspections, fees', value: r.upfront.other }, { label: 'LMI (paid)', value: r.upfront.lmi }])}
          <div class="kv" style="margin-top:12px">
            <span>Deposit</span><span>${aud(r.upfront.deposit)}</span>
            <span>Stamp duty (${st.buyer === 'fhb' ? 'first home' : st.buyer === 'owner' ? 'owner-occupier' : 'investor'})</span><span>${aud(r.upfront.duty)}</span>
            <span>Conveyancing, building &amp; pest, registration</span><span>${aud(r.upfront.other)}</span>
            ${r.lmi.premium ? `<span>LMI ${pct(r.lmi.pct, 2)} (added to loan)</span><span>${aud(r.upfront.lmiCapitalised)}</span>` : ''}
            <span class="tot">Total cash</span><span class="tot">${aud(r.upfront.total)}</span>
          </div>
          <p class="fine" style="margin-top:8px">${esc(r.duty.label)}. ${r.duty.notes.map(esc).join(' ')} ${r.lmi.over1m ? 'LMI is estimated from the $1m band; loans above $1m are priced case by case.' : ''}</p>
        </div>
        <div class="card"><h3>Year 1 cash flow</h3>
          <div class="kv">${cf.map(([l, val, c]) => `<span class="${c || ''}">${l}</span><span class="${c || ''} ${val < 0 ? 'down' : ''}">${aud(val)}</span>`).join('')}</div>
          <p class="note" style="margin-top:8px">Loan repayment ${aud(s.monthlyRepayment)}/month. Gross yield ${pct(s.grossYield, 2)}, net yield ${pct(s.netYield, 2)}. Rent needed to break even before tax: <b>${aud(s.breakEvenRent)}/wk</b>. Marginal tax rate ${s.marginalRate}%.</p>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-head"><h3>Your equity over ${st.hold} years</h3><span class="note">Value vs loan balance</span></div>
        ${lineChart([{ name: 'Property value', points: [[0, st.price], ...r.rows.map((x) => [x.year, x.value])] }, { name: 'Loan balance', points: [[0, s.loan], ...r.rows.map((x) => [x.year, x.balance])], dash: true }], { height: 240, yFmt: (x) => aud(x, { compact: true }), xFmt: (x) => `Yr ${Math.round(x)}`, area: true })}
      </div>

      <div class="card" style="margin-top:16px"><h3>Negative gearing and tax</h3>
        <div class="callout ${s.negativeGearing === 'restricted' ? '' : 'green'}">${esc(ngText)}</div>
        <div class="tbl-wrap"><table><thead><tr><th>Year</th><th class="n">Rent</th><th class="n">Costs</th><th class="n">Interest</th><th class="n">Depreciation</th><th class="n">Taxable result</th><th class="n">Tax effect</th><th class="n">Cash after tax</th><th class="n">Losses carried</th><th class="n">Value</th><th class="n">Equity</th></tr></thead><tbody>
          ${r.rows.map((x) => `<tr><td>${x.year}</td><td class="n">${aud(x.grossRent, { compact: true })}</td><td class="n">${aud(x.mgmt + x.otherCosts + x.maintenance + x.landTax, { compact: true })}</td><td class="n">${aud(x.interest, { compact: true })}</td><td class="n">${aud(x.depreciation, { compact: true })}</td><td class="n ${x.netRental < 0 ? 'down' : 'up'}">${aud(x.netRental, { compact: true })}</td><td class="n">${aud(x.taxEffect, { compact: true })}</td><td class="n ${x.cashAfterTax < 0 ? 'down' : 'up'}">${aud(x.cashAfterTax, { compact: true })}</td><td class="n">${aud(x.carried, { compact: true })}</td><td class="n">${aud(x.value, { compact: true })}</td><td class="n">${aud(x.equity, { compact: true })}</td></tr>`).join('')}
        </tbody></table></div>
      </div>

      <div class="grid" style="margin-top:16px">
        <div class="card"><h3>Selling in ${new Date(r.sale.saleDate).getFullYear()}</h3>
          <div class="kv">
            <span>Sale price</span><span>${aud(r.sale.salePrice)}</span>
            <span>Agent and marketing (${pct(st.sellCostPct, 1)})</span><span>-${aud(r.sale.sellCosts)}</span>
            <span>Cost base (price + duty + costs − depreciation claimed)</span><span>${aud(r.sale.costBase)}</span>
            <span>Capital gain</span><span>${aud(r.sale.grossGain)}</span>
            ${r.sale.cgt.valueAtReform ? `<span>Value on 1 July 2027 (estimated)</span><span>${aud(r.sale.cgt.valueAtReform)}</span><span>Gain before July 2027 (50% discount)</span><span>${aud(r.sale.cgt.preGain)}</span><span>Real gain after July 2027 (CPI-indexed)</span><span>${aud(r.sale.cgt.postRealGain)}</span>` : ''}
            <span>Capital gains tax</span><span class="down">-${aud(r.sale.cgt.tax)}</span>
            <span>Loan repaid</span><span>-${aud(r.sale.balance)}</span>
            <span class="tot">Cash in hand at sale</span><span class="tot">${aud(s.saleProceeds)}</span>
          </div>
          <p class="fine" style="margin-top:8px">Method: ${esc(r.sale.cgt.method)}.${r.sale.cgt.minimumApplied ? ' The 30% minimum tax on post-2027 gains applied.' : ''} Losses carried forward are used against the gain first.</p>
        </div>
        <div class="card"><h3>Scenarios</h3>
          <div class="tbl-wrap"><table><thead><tr><th></th><th class="n">Bear</th><th class="n">Base</th><th class="n">Bull</th></tr></thead><tbody>
            <tr><td>Growth / rent growth</td>${Object.values(SCEN).map((o) => `<td class="n">${o.growth}% / ${o.rentGrowth}%</td>`).join('')}</tr>
            <tr><td>After-tax return (IRR)</td>${Object.values(scen).map((x) => `<td class="n">${pct(x.irr, 1)}</td>`).join('')}</tr>
            <tr><td>Profit after tax</td>${Object.values(scen).map((x) => `<td class="n ${x.totalProfit >= 0 ? 'up' : 'down'}">${aud(x.totalProfit, { compact: true })}</td>`).join('')}</tr>
            <tr><td>Equity at sale</td>${Object.values(scen).map((x) => `<td class="n">${aud(x.equityAtSale, { compact: true })}</td>`).join('')}</tr>
          </tbody></table></div>
          <h3 style="font-size:16px;margin-top:16px">If rates rise</h3>
          <div class="tbl-wrap"><table><thead><tr><th>Rate</th><th class="n">Monthly repayment</th><th class="n">Weekly after tax, yr 1</th><th class="n">IRR</th></tr></thead><tbody>
            ${rateUp.map((x) => `<tr><td>${pct(st.ratePct + x.dd, 2)}${x.dd ? ` (+${x.dd})` : ''}</td><td class="n">${aud(x.s.monthlyRepayment)}</td><td class="n ${x.s.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${aud(x.s.weeklyCashAfterTax)}</td><td class="n">${pct(x.s.irr, 1)}</td></tr>`).join('')}
          </tbody></table></div>
          <p class="note" style="margin-top:10px">Lenders test your repayments at ${pct(bp.assessRate, 2)} (rate + 3 points). On a ${aud(st.income, { compact: true })} income with this rent, a lender might lend up to about <b>${aud(bp.amount, { compact: true })}</b> in total. <a href="/borrowing" data-link>Borrowing power calculator →</a></p>
        </div>
      </div>
      <p class="fine" style="margin-top:14px">General information, not advice. Assumes a single owner who is an Australian tax resident, the 2026-27 tax rates, and building depreciation at 2.5% of an estimated construction cost${st.newBuild ? ' plus plant and equipment for a new build' : ''}. Rules checked ${date(RULES.asOf)}: <a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO</a>, <a href="${r.duty.source}" target="_blank" rel="noopener">${esc(st.state)} revenue office</a>.</p>`;
    $('#out').querySelectorAll('.chart').forEach((f) => (f.dataset.xfmt = 'year'));
    wireCharts($('#out'), (x) => aud(x, { compact: true }));
  }

  const applySuburb = (s) => {
    sub = s;
    st.perth = s.rg === 'PER';
    $('#a-sub').value = `${cleanName(s.n)} ${s.s} ${s.pc}`;
    $('#a-state').value = s.s;
    const t = $('#a-type').value;
    $('#a-price').value = t === 'u' ? s.u : s.h;
    $('#a-rent').value = t === 'u' ? s.ru : s.rh;
    info();
    run();
  };
  const info = () => {
    $('#a-subinfo').innerHTML = sub ? `Typical house ${aud(sub.h, { compact: true })} (rent ${aud(sub.rh)}), unit ${aud(sub.u, { compact: true })} (rent ${aud(sub.ru)}) · <a href="${suburbUrl(sub)}" data-link>suburb profile</a>` : '';
  };
  info();
  attachSearch($('#a-sub'), $('#a-ac'), applySuburb);
  $('#a-type').addEventListener('change', () => {
    const t = $('#a-type').value;
    $('#a-strata').value = t === 'u' ? 3200 : 0;
    if (sub) {
      $('#a-price').value = t === 'u' ? sub.u : sub.h;
      $('#a-rent').value = t === 'u' ? sub.ru : sub.rh;
    }
    $('#a-growth').value = t === 'u' ? 3.5 : 5;
  });
  $('#a-new').addEventListener('change', () => {
    if ($('#a-new').value === '1') $('#a-built').value = new Date().getFullYear();
  });
  main.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => {
    $('#a-rate').value = b.dataset.rate;
    run();
  }));
  $('#a-scen').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    $('#a-scen').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    $('#a-growth').value = SCEN[b.dataset.s].growth;
    $('#a-rg').value = SCEN[b.dataset.s].rentGrowth;
    run();
  });
  let t;
  main.querySelectorAll('input:not(#a-sub), select').forEach((el) => el.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(run, 250);
  }));
  run();
}

export { num };
