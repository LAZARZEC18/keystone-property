import { demo } from '../demo.js';
import { printHeader, brandPanel, wireBrand } from '../brand.js';
import { esc, aud, pct, num, setMeta, lineChart, wireCharts, stack, date, cashWeek, dealContext, rankPill, returnsLine, copyLinkButton, wireCopyLink } from '../ui.js';
import { suburbs, cleanName, suburbUrl, load, saveDeal, savedDeals, openRate, tzState, typicalRate } from '../data.js';
import { analyse, verdict, suburbScore, borrowingPower } from '../engine.js';
import { RULES, STATES, GROWTH, runningCosts } from '../rules.js';
import { check, fromQuery, showErrors } from '../validate.js';
import { attachSearch, countEvent } from '../app.js';

const SCEN = { bear: { growth: GROWTH.bear, rentGrowth: 2.5 }, base: { growth: GROWTH.base, rentGrowth: 3.5 }, bull: { growth: GROWTH.bull, rentGrowth: 4.5 } };
// every numeric input, checked the same way whether it came from the form or the link
const SPEC = {
  price: 'price', weeklyRent: 'rent', deposit: 'deposit', ratePct: 'rate', years: 'term', income: 'income', growth: 'growth', rentGrowth: 'rentGrowth',
  vacancyWeeks: 'vacancy', mgmtPct: 'mgmt', hold: 'hold', cpi: 'cpi', councilRates: 'council', strata: 'strata', waterIns: 'council',
  buildYear: { field: 'built', optional: true }, otherLandValue: { field: 'otherland', optional: true }, otherRental: { field: 'otherRental', optional: true },
  share: { field: 'share', optional: true }, income2: { field: 'income2', optional: true },
};
const IDS = { price: '#a-price', weeklyRent: '#a-rent', deposit: '#a-dep', ratePct: '#a-rate', years: '#a-term', income: '#a-income', growth: '#a-growth', rentGrowth: '#a-rg', vacancyWeeks: '#a-vac', mgmtPct: '#a-mgmt', hold: '#a-hold', cpi: '#a-cpi', councilRates: '#a-council', strata: '#a-strata', waterIns: '#a-waterins', buildYear: '#a-built', otherLandValue: '#a-otherland', otherRental: '#a-otherrent', share: '#a-share', income2: '#a-income2' };

export default async function analysePage(main, _p, query) {
  setMeta({ title: '2026 tax-change investment property calculator', description: 'Stamp duty, LMI, land tax, the weekly cost after tax and a 10-year after-tax return for any Australian property, under the 2026 negative gearing and CGT rules.' });
  const [idx, market, rs, rba] = await Promise.all([suburbs(), load('market'), load('rates-summary'), load('rba')]);
  let sub = query.suburb ? idx.byId.get(query.suburb) : null;
  const best = openRate(rs, 'INV_PI_variable');
  const typical = typicalRate(rba, 'INV').rate;
  const type = query.type || sub?.pt || 'h';
  const q = (k, d) => fromQuery(query, k, d);
  // with no suburb chosen, start from the visitor's own state (device time zone) and its capital's typical price and rent
  const st0 = { state: sub?.s || query.state || tzState() || 'NSW' };
  const cap = Object.values(market.regions).find((r) => r.capital && r.state === st0.state);
  const capPrice = cap ? Math.round((type === 'u' ? cap.medianUnit : cap.medianHouse) / 10000) * 10000 : 850000;
  const capRent = cap ? Math.round((type === 'u' ? cap.rentUnit : cap.rentHouse) / 5) * 5 : 650;
  const rc = runningCosts(st0.state, type);
  const st = {
    addr: query.addr || '',
    state: st0.state,
    price: q('price', sub ? ((type === 'u' && sub.u ? sub.u : sub.h) || capPrice) : capPrice),
    weeklyRent: q('rent', sub ? (type === 'u' ? sub.ru : sub.rh) : capRent),
    type,
    newBuild: query.new === '1',
    buildYear: q('built', query.new === '1' ? new Date().getFullYear() : ''),
    deposit: q('dep', 20),
    ratePct: q('rate', typical || 6.4),
    years: q('term', 30),
    interestOnly: query.io === '1',
    income: q('income', 120000),
    buyer: query.buyer || 'investor',
    growth: q('growth', GROWTH.base),
    rentGrowth: q('rg', 3.5),
    cpi: q('cpi', 3),
    vacancyWeeks: q('vac', 2),
    mgmtPct: q('mgmt', 7.5),
    councilRates: q('council', rc.council),
    waterIns: q('wi', rc.waterIns),
    strata: q('strata', type === 'u' ? 3200 : 0),
    maintenancePct: type === 'u' ? 1.5 : 1.2,
    landValuePct: type === 'u' ? 0.25 : 0.55,
    otherCosts: 2500,
    hold: q('hold', 10),
    sellCostPct: 2.5,
    purchaseDate: query.date || new Date().toISOString().slice(0, 10),
    lmiCapitalise: true,
    perth: sub?.rg === 'PER',
  };
  const example = !Object.keys(query).some((k) => ['price', 'suburb', 'rent'].includes(k));

  const field = (id, label, value, attrs = '', help = '') => `<label class="field">${label}<input id="${id}" value="${esc(String(value ?? ''))}" ${attrs}>${help ? `<span class="help">${help}</span>` : ''}</label>`;
  main.innerHTML = `
  <div class="page-head with-demo"><div><div class="eyebrow">2026 tax-change calculator</div><h1>What would an investment property really cost you?</h1>
  <p class="lede-short">Enter a property. Ownaroo works out every cost, the weekly cost after tax and a 10-year return under the 2026 rules, for an established home and a new build. It describes the numbers; it doesn't tell you to buy.</p></div>${demo('calculator')}</div>
  <div class="grid g-side" style="grid-template-columns:minmax(0,1fr) minmax(0,1.35fr)">
    <div>
      <div class="card">
        <h3>Property</h3>
        <div class="fields">
          <label class="field" style="position:relative;grid-column:1/-1">Suburb (fills in prices and rents)<input id="a-sub" type="search" placeholder="Search suburb or postcode" value="${sub ? esc(`${cleanName(sub.n)} ${sub.s} ${sub.pc}`) : ''}"><div class="ac" id="a-ac" hidden style="top:62px;left:0;right:auto"></div><span class="help" id="a-subinfo"></span></label>
          ${field('a-addr', 'Address or label (optional)', st.addr, 'type="text" style="grid-column:1/-1"')}
          <label class="field">State<select id="a-state">${Object.keys(STATES).map((s) => `<option ${s === st.state ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
          <label class="field">Type<select id="a-type"><option value="h">House</option><option value="u" ${st.type === 'u' ? 'selected' : ''}>Unit / apartment</option></select></label>
          ${field('a-price', 'Purchase price ($)', st.price, 'type="number" step="1"')}
          ${field('a-rent', 'Weekly rent ($)', st.weeklyRent, 'type="number" step="5"')}
          <label class="field">New build?<select id="a-new"><option value="0">Established</option><option value="1" ${st.newBuild ? 'selected' : ''}>New build (never lived in)</option></select><span class="help">Matters a lot under the 2026 rules</span></label>
          ${field('a-built', 'Year built', st.buildYear, 'type="number" min="1800" max="2031" placeholder="Not sure"', 'Leave blank if unknown: no building depreciation is claimed. Homes started before 16 Sep 1987 get none.')}
          ${field('a-strata', 'Strata levies ($/yr)', st.strata, 'type="number" step="1"')}
          ${field('a-council', 'Council rates ($/yr)', st.councilRates, 'type="number" step="1"', 'Typical for the state; use the property’s bill')}
          ${field('a-waterins', 'Water charges + landlord insurance ($/yr)', st.waterIns, 'type="number" step="1"', 'Typical for the state and type')}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Loan</h3>
        <div class="fields">
          ${field('a-dep', 'Deposit (%)', st.deposit, 'type="number" step="1" min="2" max="100"')}
          ${field('a-rate', 'Interest rate (% p.a.)', st.ratePct, 'type="number" step="0.01"')}
          <label class="field">Repayments<select id="a-io"><option value="0">Principal &amp; interest</option><option value="1" ${st.interestOnly ? 'selected' : ''}>Interest only</option></select></label>
          ${field('a-term', 'Loan term (years)', st.years, 'type="number" min="5" max="40"')}
        </div>
        <div class="row" style="margin-top:10px">
          ${best ? `<button class="btn sm" data-rate="${best.rate}">Lowest open to anyone ${pct(best.rate, 2)} (${esc(best.lender)})</button>` : ''}
          ${typical ? `<button class="btn sm" data-rate="${typical}">Typical new investor loan ${pct(typical, 2)}</button>` : ''}
          <a class="note" href="/rates" data-link>Compare all rates →</a>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>You</h3>
        <div class="fields">
          ${field('a-income', 'Your taxable income ($/yr)', st.income, 'type="number" step="1"', 'Before this property')}
          <label class="field">Buyer<select id="a-buyer"><option value="investor">Investor</option><option value="owner" ${st.buyer === 'owner' ? 'selected' : ''}>Owner-occupier</option><option value="fhb" ${st.buyer === 'fhb' ? 'selected' : ''}>First home buyer</option></select><span class="help">Changes stamp duty only</span></label>
          ${field('a-date', 'Contract date', st.purchaseDate, 'type="date"')}
          <label class="field">Owners<select id="a-owners"><option value="1">Just me</option><option value="2" ${+query.owners === 2 ? 'selected' : ''}>Two people</option></select></label>
          ${field('a-share', 'Your share (%)', q('share', 50), 'type="number" min="1" max="99" step="1"', 'Two owners only')}
          ${field('a-income2', "Other owner's income ($/yr)", q('income2', 80000), 'type="number" step="1"', 'Two owners only')}
          ${field('a-otherland', 'Other investment land you own in this state ($ land value)', q('otherland', 0), 'type="number" step="1"', 'For land tax: holdings are added together')}
          ${field('a-otherrent', 'Net rental profit from your other properties ($/yr)', q('otherrent', 0), 'type="number" step="1"', 'Under the 2026 rules, losses on this property can offset it. Leave 0 if none')}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <h3>Assumptions</h3>
        <div class="seg" id="a-scen" style="margin-bottom:12px" role="group" aria-label="Growth scenario"><button type="button" data-s="bear">Low ${GROWTH.bear}%</button><button type="button" data-s="base" class="on">Cautious ${GROWTH.base}%</button><button type="button" data-s="bull">High ${GROWTH.bull}%</button></div>
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
  wireBrand(main, () => `Deal analysis: ${st.addr || 'property'}`);
  const read = () => {
    const v = (id) => $(id).value;
    const raw = Object.fromEntries(Object.entries(IDS).map(([k, id]) => [k, v(id)]));
    const res = check(raw, SPEC);
    const n = res.values;
    Object.assign(st, {
      addr: v('#a-addr'), state: v('#a-state'), type: v('#a-type'), price: n.price, weeklyRent: n.weeklyRent,
      newBuild: v('#a-new') === '1', buildYear: n.buildYear, strata: n.strata, councilRates: n.councilRates,
      deposit: n.deposit / 100, ratePct: n.ratePct, interestOnly: v('#a-io') === '1', years: n.years,
      income: n.income, buyer: v('#a-buyer'), purchaseDate: v('#a-date'), growth: n.growth, rentGrowth: n.rentGrowth,
      vacancyWeeks: n.vacancyWeeks, mgmtPct: n.mgmtPct, hold: n.hold, cpi: n.cpi,
      otherLandValue: n.otherLandValue || 0, otherRental: n.otherRental || 0,
      // council is its own field; water and insurance share one
      water: 0, insurance: n.waterIns,
    });
    const share = (n.share || 50) / 100;
    st.owners = v('#a-owners') === '2' ? [{ share, income: st.income }, { share: 1 - share, income: n.income2 || 0 }] : null;
    st.landValuePct = st.type === 'u' ? 0.25 : 0.55;
    st.maintenancePct = st.type === 'u' ? 1.5 : 1.2;
    return res;
  };

  let shareUrl = '';
  let counted = false;
  wireCopyLink(main, () => shareUrl);
  let nbDisc = 0;
  function run() {
    const res = read();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(st.purchaseDate) || Number.isNaN(Date.parse(st.purchaseDate))) res.errors.date = 'Contract date: pick a date.';
    if (showErrors(main, res.errors, { ...IDS, date: '#a-date' }, $('#out'))) return;
    const r = analyse(st);
    const v = verdict(r, sub ? { ...sub, score: suburbScore(sub.sc) } : null, market, { depositRate: rba.cashRate.current });
    const s = r.summary;
    const y1 = r.rows[0];
    const y3 = r.rows[Math.min(2, r.rows.length - 1)];
    const scen = { bear: analyse({ ...st, ...SCEN.bear }).summary, base: s, bull: analyse({ ...st, ...SCEN.bull }).summary };
    const rateUp = [0, 1, 2].map((dd) => ({ dd, s: analyse({ ...st, ratePct: st.ratePct + dd }).summary }));
    const bp = borrowingPower({ grossIncome: st.income, ratePct: st.ratePct, newRentWeekly: st.weeklyRent });
    if (!counted) {
      counted = true;
      countEvent('analyse-run');
    }
    // the same deal both ways: the defining question under the 2026 rules
    const yr = new Date().getFullYear();
    const disc = nbDisc / 100;
    const nbGrowth = disc ? (((1 + st.growth / 100) ** st.hold * (1 - disc)) ** (1 / st.hold) - 1) * 100 : st.growth;
    const nb = analyse({ ...st, newBuild: true, buildYear: yr, growth: nbGrowth });
    const est = analyse({ ...st, newBuild: false, buildYear: st.newBuild ? '' : st.buildYear });
    const sumTax = (x) => x.rows.reduce((t, y) => t + y.taxEffect, 0);
    // benchmarks: paying down your own home loan saves interest tax-free; a share index fund is a long-run assumption
    // what a typical owner-occupier actually pays (RBA average plus any move since), not the single lowest advertised rate
    const ooRate = typicalRate(rba, 'OO').rate;
    const deals = savedDeals().filter((d) => typeof d.irr === 'number' && d.url.split('?')[1] !== location.search.slice(1));
    const ranked = deals.length ? [...deals.map((d) => ({ name: d.name, irr: d.irr, url: d.url })), { name: 'This deal', irr: s.irr, me: true }].sort((a, b) => b.irr - a.irr) : [];
    const ngText = {
      restricted: `Established property contracted on or after 12 May 2026. Losses offset your salary only for the part of the first year before 1 July 2027 (${Math.round(y1.offsetShare * 100)}% of year 1). After that they carry forward against rental profits (from this or your other properties) and the capital gain when you sell.${st.otherRental ? ` ${aud(r.rows.reduce((t, x) => t + x.usedOther, 0))} of losses are used against your other properties' rental profit over ${st.hold} years.` : ' If you own other rental properties that make a profit, enter it under "You" to use the losses against it.'} By the sale you'll have ${aud(r.rows.at(-1).carried)} of carried-forward losses.`,
      grandfathered: 'Contracted before 12 May 2026, so grandfathered: rental losses keep reducing your salary tax.',
      'new-build': 'New build: keeps negative gearing and can choose the 50% CGT discount or indexation when sold.',
    }[s.negativeGearing];
    const url = new URLSearchParams({ state: st.state, price: st.price, rent: st.weeklyRent, type: st.type, new: st.newBuild ? 1 : 0, dep: Math.round(st.deposit * 100), rate: st.ratePct, growth: st.growth, rg: st.rentGrowth, hold: st.hold, date: st.purchaseDate, council: st.councilRates, wi: st.insurance, vac: st.vacancyWeeks, mgmt: st.mgmtPct });
    if (st.buildYear) url.set('built', st.buildYear);
    if (st.strata) url.set('strata', st.strata);
    if (st.buyer !== 'investor') url.set('buyer', st.buyer);
    if (st.owners) url.set('owners', 2);
    if (sub) url.set('suburb', sub.id);
    if (st.addr) url.set('addr', st.addr);
    // the page address keeps the property; your income and other holdings go in only when you copy a link yourself
    history.replaceState(null, '', `/analyse?${url}`);
    const personal = new URLSearchParams(url);
    personal.set('income', st.income);
    if (st.otherRental) personal.set('otherrent', st.otherRental);
    if (st.owners) {
      personal.set('share', Math.round(st.owners[0].share * 100));
      personal.set('income2', st.owners[1].income);
    }
    if (st.otherLandValue) personal.set('otherland', st.otherLandValue);
    shareUrl = `/analyse?${personal}`;

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
    $('#out').innerHTML = `${example ? `<div class="callout" style="margin:0 0 12px"><b>These are example numbers</b> for a ${aud(st.price, { compact: true })} ${st.type === 'u' ? 'unit' : 'house'} renting at ${aud(st.weeklyRent)} a week, about typical for ${esc(cap?.name || st.state)}. Search a suburb or type in the property you're looking at, and the results update as you type.</div>` : ''}
      <div class="card">
        <div><div class="eyebrow" style="margin:0">Each week in year 1, after tax${st.addr ? ` · ${esc(st.addr)}` : ''}</div>
          <div class="lead-nums"><div>${s.split2027 ? `<div class="split27"><div><span class="k">Until 30 June 2027</span><div class="cost-head ${s.split2027.before >= 0 ? 'up' : 'down'}">${cashWeek(s.split2027.before)}</div></div><div><span class="k">From 1 July 2027</span><div class="cost-head ${s.split2027.after >= 0 ? 'up' : 'down'}">${cashWeek(s.split2027.after)}</div></div></div><p class="fine" style="margin:4px 0 0">An established home bought after 12 May 2026 loses its salary tax refund (about ${aud(s.split2027.refundLost)} a year) from 1 July 2027; the losses carry forward instead.</p>` : `<div class="cost-head ${s.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${cashWeek(s.weeklyCashAfterTax)}</div>`}</div><div class="lead-cash"><span class="k">Cash needed up front</span><b>${aud(r.upfront.total, { compact: true })}</b><span class="s">deposit, stamp duty and fees · loan ${aud(s.loan, { compact: true })}</span></div></div>
          <div class="note">${sub ? `<a href="${suburbUrl(sub)}" data-link>${esc(cleanName(sub.n))}</a> · ` : ''}${aud(st.price)} · ${aud(st.weeklyRent)}/wk · ${Math.round(st.deposit * 100)}% deposit at ${pct(st.ratePct, 2)} · projections below use ${st.growth}% a year growth</div>
          ${returnsLine({ bear: { growth: GROWTH.bear, irr: scen.bear.irr }, base: { growth: st.growth, irr: s.irr, yours: true }, bull: { growth: GROWTH.bull, irr: scen.bull.irr } }, v)}
          <div class="bench"><span class="k">Compare with</span>
            ${ooRate ? `<span>Paying down your own home loan: <b>${pct(ooRate, 2)}</b> a year, tax-free (the interest you stop paying, at a typical new-loan rate; use your own rate if you know it)</span>` : ''}
            <span>A share index fund: about <b>7%</b> a year before tax (a long-run assumption, not a forecast)</span></div>
          ${ranked.length ? `<p class="note" style="margin:8px 0 0"><b>Against your saved deals:</b> this one ranks ${ranked.findIndex((x) => x.me) + 1} of ${ranked.length} by after-tax return. ${ranked.slice(0, 4).map((x) => (x.me ? `<b>This deal ${pct(x.irr, 1)}</b>` : `<a href="${esc(x.url)}" data-link>${esc(x.name)}</a> ${pct(x.irr, 1)}`)).join(' · ')}</p>` : `<p class="note" style="margin:8px 0 0">${rankPill(v)} ${dealContext(v)} Save a few deals and they'll be ranked against each other here.</p>`}</div>
        <div class="grid ${v.reasons.length && v.risks.length ? 'g2' : ''}" style="margin-top:12px;gap:8px 20px">
          ${v.reasons.length ? `<div><ul class="pros">${v.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
          ${v.risks.length ? `<div><ul class="cons">${v.risks.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
        </div>
      </div>
      <div class="card" id="newvsold" style="margin-top:16px"><div class="card-head"><h3>New build or established?</h3><span class="note">the same price, rent and loan, both ways</span></div>
        <div class="tbl-wrap"><table class="cards-sm name-first"><thead><tr><th></th><th class="n">Established</th><th class="n">New build <span class="tag tag-news" title="What counts as a new build is still in Treasury consultation (Tranche 2 proposes a 24-month test on whether anyone has lived in it), and only the first owner gets these rules. Treat this column as the likely case, not a certainty.">Rules not final</span></th></tr></thead><tbody>
          ${est.summary.split2027 ? `<tr><td>Each week until 30 June 2027, after tax</td><td class="n">${cashWeek(est.summary.split2027.before, { short: true })}</td><td class="n">${cashWeek(nb.summary.weeklyCashAfterTax, { short: true })}</td></tr>
          <tr><td>Each week from 1 July 2027, after tax</td><td class="n">${cashWeek(est.summary.split2027.after, { short: true })}</td><td class="n">${cashWeek(nb.summary.weeklyCashAfterTax, { short: true })}</td></tr>` : `<tr><td>Each week in year 1, after tax</td><td class="n">${cashWeek(est.summary.weeklyCashAfterTax, { short: true })}</td><td class="n">${cashWeek(nb.summary.weeklyCashAfterTax, { short: true })}</td></tr>`}
          <tr><td>Rental losses against your salary</td><td class="n">${est.summary.negativeGearing === 'restricted' ? 'Until 1 July 2027 only' : 'Yes (grandfathered)'}</td><td class="n">Yes, kept</td></tr>
          <tr><td>Tax refunds over ${st.hold} years</td><td class="n">${aud(sumTax(est))}</td><td class="n">${aud(sumTax(nb))}</td></tr>
          <tr><td>Stamp duty</td><td class="n">${aud(est.upfront.duty)}</td><td class="n">${aud(nb.upfront.duty)}</td></tr>
          <tr><td>Capital gains tax at sale</td><td class="n">${aud(est.sale.cgt.tax)}</td><td class="n">${aud(nb.sale.cgt.tax)}</td></tr>
          <tr><td>Annual after-tax return (IRR)</td><td class="n"><b>${pct(est.summary.irr, 1)}</b></td><td class="n"><b>${pct(nb.summary.irr, 1)}</b></td></tr>
        </tbody></table></div>
        <label class="field" style="max-width:340px;margin-top:10px">Resale discount for the new build<select id="nb-disc">${[[0, 'None'], [5, "5% (the next owner doesn't get the new-build tax rules)"], [10, '10%']].map(([v, l]) => `<option value="${v}" ${nbDisc === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <p class="fine" style="margin-top:8px">New builds keep negative gearing, claim depreciation on the building and fittings, and at sale can choose the 50% discount or the new indexation method. Only the first owner gets these rules, so a buyer at resale may pay less: the resale discount above lowers the new build's sale price to test that. The definition of a "new build" is still being finalised (Treasury Tranche 2). New builds often cost more for the same rent, so try the new-build price in the form above too.</p>
      </div>
      <details class="fold card" style="margin-top:16px" id="breakdown"><summary><h3 style="display:inline">The full breakdown</h3> <span class="note">up-front costs, year-1 cash flow, equity, tax year by year, the sale, scenarios and rate rises</span></summary>
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
          <p class="note" style="margin-top:8px">Loan repayment ${aud(s.monthlyRepayment)}/month${s.interestOnlyYears ? ` (interest only for ${s.interestOnlyYears} years, then about <b>${aud(s.monthlyAfterIo)}/month</b>, ${aud(s.monthlyAfterIo - s.monthlyRepayment)} more, as principal and interest over the remaining ${st.years - s.interestOnlyYears} years)` : ''}. Gross yield ${pct(s.grossYield, 2)}, net yield ${pct(s.netYield, 2)}. Rent needed to cover interest and running costs before tax: <b>${aud(s.breakEvenRent)}/wk</b> (${aud(s.breakEvenRentCash)}/wk to also cover principal repayments, which build your equity). Marginal tax rate ${s.marginalRate}%.</p>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-head"><h3>Your equity over ${st.hold} years</h3><span class="note">Value vs loan balance</span></div>
        ${lineChart([{ name: 'Property value', points: [[0, st.price], ...r.rows.map((x) => [x.year, x.value])] }, { name: 'Loan balance', points: [[0, s.loan], ...r.rows.map((x) => [x.year, x.balance])], dash: true }], { height: 240, yFmt: (x) => aud(x, { compact: true }), xFmt: (x) => `Yr ${Math.round(x)}`, area: true })}
      </div>

      <div class="card" style="margin-top:16px"><h3>Negative gearing and tax</h3>
        <div class="callout ${s.negativeGearing === 'restricted' ? '' : 'green'}">${esc(ngText)}</div>
        <div class="tbl-wrap"><table><thead><tr><th>Year</th><th class="n">Rent</th><th class="n">Costs</th><th class="n">Interest</th><th class="n"><abbr title="Building and fittings depreciation, plus borrowing costs such as LMI and loan fees, which are deducted over 5 years">Depreciation, borrowing</abbr></th><th class="n">Taxable result</th><th class="n">Tax effect</th><th class="n">Cash after tax</th><th class="n">Losses carried</th><th class="n">Value</th><th class="n">Equity</th></tr></thead><tbody>
          ${r.rows.map((x) => `<tr><td>${x.year}</td><td class="n">${aud(x.grossRent, { compact: true })}</td><td class="n">${aud(x.mgmt + x.otherCosts + x.maintenance + x.landTax, { compact: true })}</td><td class="n">${aud(x.interest, { compact: true })}</td><td class="n">${aud(x.depreciation + (x.borrowing || 0), { compact: true })}</td><td class="n ${x.netRental < 0 ? 'down' : 'up'}">${aud(x.netRental, { compact: true })}</td><td class="n">${aud(x.taxEffect, { compact: true })}</td><td class="n ${x.cashAfterTax < 0 ? 'down' : 'up'}">${aud(x.cashAfterTax, { compact: true })}</td><td class="n">${aud(x.carried, { compact: true })}</td><td class="n">${aud(x.value, { compact: true })}</td><td class="n">${aud(x.equity, { compact: true })}</td></tr>`).join('')}
        </tbody></table></div>
      </div>

      <div class="grid" style="margin-top:16px">
        <div class="card"><h3>Selling in ${new Date(r.sale.saleDate).getFullYear()}</h3>
          <div class="kv">
            <span>Sale price</span><span>${aud(r.sale.salePrice)}</span>
            <span>Agent and marketing (${pct(st.sellCostPct, 1)})</span><span>${aud(-r.sale.sellCosts)}</span>
            <span>Cost base (price + duty + costs − depreciation claimed)</span><span>${aud(r.sale.costBase)}</span>
            <span>Capital gain</span><span>${aud(r.sale.grossGain)}</span>
            ${r.sale.cgt.valueAtReform ? `<span>Value on 1 July 2027 (estimated)</span><span>${aud(r.sale.cgt.valueAtReform)}</span><span>Gain before July 2027 (50% discount)</span><span>${aud(r.sale.cgt.preGain)}</span><span>Real gain after July 2027 (CPI-indexed)</span><span>${aud(r.sale.cgt.postRealGain)}</span>` : ''}
            <span>Capital gains tax</span><span class="down">${aud(-r.sale.cgt.tax)}</span>
            <span>Loan repaid</span><span>${aud(-r.sale.balance)}</span>
            <span class="tot">Cash in hand at sale</span><span class="tot">${aud(s.saleProceeds)}</span>
          </div>
          ${r.sale.cgt.tax === 0 && r.sale.grossGain > 0 ? `<p class="note" style="margin-top:8px"><b>Why no capital gains tax?</b> ${r.sale.cgt.valueAtReform && st.growth <= st.cpi + 0.25 ? `After 1 July 2027 only the gain above inflation is taxed. With prices growing at ${st.growth}% and inflation at ${st.cpi}%, there is almost no real gain after that date, ` : 'The taxable gain is small, '}and the ${aud(r.rows.at(-1).carried)} of rental losses carried forward is used against it first.</p>` : ''}<p class="fine" style="margin-top:8px">Method: ${esc(r.sale.cgt.method)}.${r.sale.cgt.minimumApplied ? ' The 30% minimum tax on post-2027 gains applied.' : ''} Losses carried forward are used against the gain first.${r.sale.cgt.perOwner ? ` Split between owners: ${r.sale.cgt.perOwner.map((t) => aud(t)).join(' and ')}.` : ''} <b>Details still being settled:</b> Treasury is still consulting on how gains either side of 1 July 2027 are measured, and on trusts and part-year residents. Ownaroo models the law as passed and will update if the detail changes.</p>
        </div>
        <div class="card"><h3>Scenarios</h3>
          <div class="tbl-wrap"><table><thead><tr><th></th><th class="n">Low growth</th><th class="n">Your inputs</th><th class="n">High growth</th></tr></thead><tbody>
            <tr><td>Growth / rent growth</td>${[SCEN.bear, { growth: st.growth, rentGrowth: st.rentGrowth }, SCEN.bull].map((o) => `<td class="n">${o.growth}% / ${o.rentGrowth}%</td>`).join('')}</tr>
            <tr><td>After-tax return (<abbr title="Internal rate of return: the average yearly return on your cash after costs, tax and sale">IRR</abbr>)</td>${Object.values(scen).map((x) => `<td class="n">${pct(x.irr, 1)}</td>`).join('')}</tr>
            <tr><td>Profit after tax</td>${Object.values(scen).map((x) => `<td class="n ${x.totalProfit >= 0 ? 'up' : 'down'}">${aud(x.totalProfit, { compact: true })}</td>`).join('')}</tr>
            <tr><td>Equity at sale</td>${Object.values(scen).map((x) => `<td class="n">${aud(x.equityAtSale, { compact: true })}</td>`).join('')}</tr>
          </tbody></table></div>
          <h3 style="font-size:16px;margin-top:16px">If rates rise</h3>
          <div class="tbl-wrap"><table><thead><tr><th>Rate</th><th class="n">Monthly repayment</th><th class="n">Each week after tax, yr 1</th><th class="n">IRR</th></tr></thead><tbody>
            ${rateUp.map((x) => `<tr><td>${pct(st.ratePct + x.dd, 2)}${x.dd ? ` (+${x.dd})` : ''}</td><td class="n">${aud(x.s.monthlyRepayment)}</td><td class="n ${x.s.weeklyCashAfterTax >= 0 ? 'up' : 'down'}">${cashWeek(x.s.weeklyCashAfterTax, { short: true })}</td><td class="n">${pct(x.s.irr, 1)}</td></tr>`).join('')}
          </tbody></table></div>
          <p class="note" style="margin-top:10px">Lenders test your repayments at ${pct(bp.assessRate, 2)} (rate + 3 points). On a ${aud(st.income, { compact: true })} income with this rent, a lender might lend up to about <b>${aud(bp.amount, { compact: true })}</b> in total. <a href="/borrowing" data-link>Borrowing power calculator →</a></p>
        </div>
      </div>
      </details>
      <p class="fine" style="margin-top:14px">General information, not advice. Assumes ${st.owners ? `two individual owners (${Math.round(st.owners[0].share * 100)}/${Math.round(st.owners[1].share * 100)})` : 'one individual owner'} who ${st.owners ? 'are' : 'is an'} Australian tax resident${st.owners ? 's' : ''}; trusts, companies and self-managed super funds are taxed differently (and since 10 August 2026 an SMSF can't take out new borrowing to buy residential property). It uses the 2026-27 tax rates, and building depreciation at 2.5% of an estimated construction cost when a build year from 1987 is entered${st.newBuild ? ' plus plant and equipment for a new build' : ''}. Rules checked ${date(RULES.asOf)}: <a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO</a>, <a href="${r.duty.source}" target="_blank" rel="noopener">${esc(st.state)} revenue office</a>.</p>`;
    $('#out').insertAdjacentHTML('afterbegin', printHeader(`Deal analysis: ${st.addr || (sub ? `${cleanName(sub.n)} ${sub.s}` : `${st.state} property`)}`));
    $('#out').insertAdjacentHTML('beforeend', `<div class="card no-print" style="margin-top:16px"><div class="row"><button class="btn primary" type="button" id="save-deal">Save this deal</button><a class="btn" href="/watchlist#deals" data-link>Saved deals</a></div>${brandPanel('Print or save as PDF')}<div class="row" style="margin-top:8px">${copyLinkButton()}</div><p class="fine" style="margin-top:8px">Saved deals stay in this browser only, so they won't be on your other devices. The page address holds the property but not your income; "Copy link" includes everything, so only share it with people you'd tell your income to.</p></div>`);
    $('#save-deal').addEventListener('click', (e) => {
      const ok = saveDeal({ url: location.pathname + location.search, name: st.addr || (sub ? `${cleanName(sub.n)} ${sub.s} ${sub.pc || ''}` : `${st.state} property`), price: st.price, rent: st.weeklyRent, grade: v.grade, rank: v.label, beatsDeposit: v.beatsDeposit, weekly: s.weeklyCashAfterTax, irr: s.irr });
      e.currentTarget.textContent = ok ? 'Saved ✓' : 'Couldn’t save in this browser';
    });
    $('#out').querySelectorAll('.chart').forEach((f) => (f.dataset.xfmt = 'year'));
    wireCharts($('#out'), (x) => aud(x, { compact: true }));
  }

  const applySuburb = (s) => {
    sub = s;
    st.perth = s.rg === 'PER';
    $('#a-sub').value = `${cleanName(s.n)} ${s.s} ${s.pc}`;
    $('#a-state').value = s.s;
    const t = $('#a-type').value;
    const c = runningCosts(s.s, t);
    $('#a-council').value = c.council;
    $('#a-waterins').value = c.waterIns;
    $('#a-price').value = (t === 'u' && s.u ? s.u : s.h) || '';
    $('#a-rent').value = (t === 'u' && s.u ? s.ru : s.rh) || '';
    info();
    run();
  };
  const info = () => {
    $('#a-subinfo').innerHTML = sub ? `Typical house ${aud(sub.h, { compact: true })} (rent ${aud(sub.rh)}), ${sub.u ? `unit ${aud(sub.u, { compact: true })} (rent ${aud(sub.ru)})` : 'no unit price (few units here)'} · <a href="${suburbUrl(sub)}" data-link>suburb profile</a>` : '';
  };
  info();
  attachSearch($('#a-sub'), $('#a-ac'), applySuburb);
  // state and type set the typical running costs; the user can overwrite them
  const setCosts = () => {
    const c = runningCosts($('#a-state').value, $('#a-type').value);
    $('#a-council').value = c.council;
    $('#a-waterins').value = c.waterIns;
  };
  $('#a-state').addEventListener('change', setCosts);
  main.addEventListener('change', (e) => {
    if (e.target.id !== 'nb-disc') return;
    nbDisc = +e.target.value;
    run();
  });
  $('#a-type').addEventListener('change', () => {
    const t = $('#a-type').value;
    setCosts();
    $('#a-strata').value = t === 'u' ? 3200 : 0;
    if (sub) {
      $('#a-price').value = (t === 'u' && sub.u ? sub.u : sub.h) || '';
      $('#a-rent').value = (t === 'u' && sub.u ? sub.ru : sub.rh) || '';
    }
    $('#a-growth').value = GROWTH.base;
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
