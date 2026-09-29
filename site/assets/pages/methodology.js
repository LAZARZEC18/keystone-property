import { esc, pct, date, setMeta } from '../ui.js';
import { load } from '../data.js';
import { RULES } from '../rules.js';

export default async function methodologyPage(main) {
  setMeta({ title: 'Data sources and methodology', description: 'Where every Ownaroo number comes from, how often it updates, and how the suburb price model and investor score work.' });
    // the small files first so the page paints at once; the headline and approvals rows fill in after
  const [model, status, rs, market] = await Promise.all([load('model'), load('status').catch(() => null), load('rates-summary'), load('market').catch(() => null)]);
  const ran = (job) => (status?.jobs?.[job]?.ok ? `OK, ${date(status.finished)}` : status?.jobs?.[job] ? 'Failed on the last run; previous data kept' : 'Not yet run');
  const m = model.model;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Methodology</div><h1>Where the numbers come from</h1>
  <p>Ownaroo uses publicly released official and industry data, credits every source where it appears, and marks clearly which figures are official and which are Ownaroo estimates. Third-party figures belong to their owners; commercial use of some of them may need a licence, which Ownaroo will arrange before offering any paid service.</p></div>

  <section class="section"><h2>How sure each number is</h2>
  <div class="grid g3">
    <div class="card"><span class="tag tag-conf tag-conf-h">High confidence</span><h3 style="margin-top:8px">Rules and rates</h3><p class="note">Stamp duty, land tax, income tax, the 2026 negative gearing and CGT rules and every scheme cap are taken from the ATO, state revenue offices and Housing Australia, checked ${date(RULES.asOf)}. Loan rates come from ${rs.lenders} lenders' own product feeds.</p></div>
    <div class="card"><span class="tag tag-conf tag-conf-h">High confidence</span><h3 style="margin-top:8px">Prices in VIC, SA and NSW</h3><p class="note">Where a state publishes suburb sales, Ownaroo shows that official median, marked <b>Official</b>.</p></div>
    <div class="card"><span class="tag tag-conf tag-conf-l">Estimate</span><h3 style="margin-top:8px">Prices everywhere else</h3><p class="note">WA, QLD, TAS, ACT and NT don't publish suburb sales openly, so prices there are model estimates. Where the model could be tested it was typically ${pct(Math.min(...Object.values(m.holdout).map((h) => h.medianAbsPctError)), 0)} to ${pct(Math.max(...Object.values(m.holdout).map((h) => h.medianAbsPctError)), 0)} out. Use them as a guide to an area, not a value for a home.</p></div>
  </div></section>

  <section class="section"><h2>Update schedule</h2>
  <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Source</th><th>Ownaroo checks</th><th>Source publishes</th><th>Last run</th></tr></thead><tbody>
    <tr><td>Home loan rates (${rs.lenders} lenders)</td><td>Consumer Data Right product feeds, via the <a href="https://consumerdatastandards.gov.au/" target="_blank" rel="noopener">Consumer Data Right</a> register</td><td>Several times a day</td><td>Whenever lenders change rates</td><td>${ran('rates')}</td></tr>
    <tr><td>Home values, changes, yields, days on market (capitals and regions)</td><td><a href="https://www.cotality.com/au/our-data/indices" target="_blank" rel="noopener">Cotality Home Value Index</a>, SQM Research (vacancy)</td><td>After each month-end release</td><td>Monthly</td><td>Month-end ${esc(market?.indexMonth || '')}</td></tr>
    <tr><td>Cash rate, lending rates, bank bills</td><td>RBA tables A2, F1.1, F5, F6</td><td>Several times a day</td><td>After each RBA meeting; monthly</td><td>${ran('rba')}</td></tr>
    <tr><td>News headlines</td><td>RSS feeds (ABC, SBS, The Guardian, The Conversation, RBA, PropTrack and others) each linking straight to the publisher. <span id="m-pubs"></span></td><td>About every hour</td><td>Continuous</td><td>${ran('news')}</td></tr>
    <tr><td>Building approvals by council and SA2</td><td>ABS Building Approvals, Australia</td><td>Monthly, on release</td><td>Monthly</td><td id="m-appr">…</td></tr>
    <tr><td>Suburb sales medians</td><td>Valuer-General Victoria, Land Services SA, NSW DCJ Rent &amp; Sales Report</td><td>Quarterly rebuild</td><td>Quarterly</td><td>${date(model.built)}</td></tr>
    <tr><td>Demographics</td><td>ABS Census 2016 and 2021</td><td>Static</td><td>Every 5 years (2026 Census results due 2027)</td><td>2021 Census</td></tr>
    <tr><td>Household income and unemployment, brought up to date</td><td>ABS Personal Income in Australia (by SA2, to 2022-23), Wage Price Index (to ${esc(model.areaNow?.wpiTo || '')}), modelled labour force by SA4 (to ${esc(model.areaNow?.unemploymentTo || '')})</td><td>On each release</td><td>Annually; quarterly; monthly</td><td>${date(model.built)}</td></tr>
    <tr><td>Stamp duty, land tax, income tax, CGT</td><td>State revenue offices and the ATO</td><td>Reviewed each July</td><td>Annually</td><td>${date(RULES.asOf)}</td></tr>
  </tbody></table></div>
  ${status ? `<p class="fine" style="margin-top:8px">Last full refresh finished ${date(status.finished)} (${new Date(status.finished).toLocaleTimeString('en-AU')}).</p>` : ''}</section>

  <section class="section card" id="checks"><h2>How figures are checked before they're shown</h2>
    <p class="note">Every rebuild runs these checks. A figure that fails is held back (or replaced by the model and flagged on the suburb's page) and listed for a person to review.</p>
    <ul class="note">${(model.checks?.rules || []).map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    ${model.checks ? `<p class="fine">Latest build: unit prices not shown in ${model.checks.fewUnits.toLocaleString()} suburbs with few units; ${model.checks.unitCapped.toLocaleString()} modelled unit prices capped below the house price; ${model.checks.heldForReview} figures held back for review.</p>` : ''}
  </section>

  <section class="section card"><h2>How good is the price model? In plain words</h2>
    <p class="note">${Object.entries(m.holdout).map(([st, h]) => `<b>${st}</b>: typically ${pct(h.medianAbsPctError, 0)} out, with ${pct(h.within20pct, 0)} of suburbs within 20%`).join('; ')}. It was tested on suburbs whose official medians it hadn't seen.</p>
    <p class="note"><b>In NSW it does badly.</b> There, it predicts suburb prices worse than simply using each region's average (a negative R²). So in NSW, a suburb without its own official figure shows a <b>price range</b> on its page, not a single number, until the model improves. It has never been tested in WA, Queensland, Tasmania, the ACT or the NT, because they don't publish suburb sales openly; every suburb there is modelled. Spot checks against published medians (for example Morley, WA: modelled house $970k against a published $967k) are encouraging but don't prove it everywhere.</p>
    <p class="note"><b>Local income and unemployment</b> start from the 2021 Census and are carried forward: income by the ABS's newer income data for the surrounding area and national wage growth, unemployment by the change in the ABS's modelled rate for the region. Price-to-income uses the updated income.</p>
    <p class="fine">The unit model explains about ${pct((m.unitR2 || 0) * 100, 0)} of the differences in unit prices between suburbs. The house model was trained on ${m.trainN.toLocaleString()} suburbs and is applied to about ${(model.count - m.trainN).toLocaleString()} more.</p>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Suburb prices</h3>
      <p class="note">Where a state publishes suburb sales medians openly (Victoria, South Australia metro, NSW by postcode), Ownaroo uses them, rolled forward to the latest month-end with the regional index. These are marked <span class="tag tag-official">Official</span>.</p>
      <p class="note">Everywhere else, prices are Ownaroo <span class="tag tag-model">Estimate</span>s from a regression model trained on ${m.trainN.toLocaleString()} official suburb medians. It uses each suburb's Census mortgage repayments, rents and incomes relative to its region, home ownership, dwelling mix, density, distance to the CBD and the coast, and remoteness. It then anchors the result to Cotality's current median for the region. Fit: R² ${m.r2} (houses), ${m.unitR2} (units).</p>
      <p class="note">Tested on states it hadn't seen: median error ${Object.entries(m.holdout).map(([s, h]) => `${s} ${pct(h.medianAbsPctError, 1)} (${pct(h.within20pct, 0)} within 20%)`).join(', ')}. Estimates are least reliable in very small, remote or unusual suburbs, which carry a low-confidence flag.</p>
    </div>
    <div class="card"><h3>Rents</h3>
      <p class="note">NSW rents are median new bonds by postcode (DCJ). Everywhere else, a rent model fitted on those official bond medians (407 postcodes for houses, median error about 9%) sets each suburb's rent relative to its region from its 2021 Census rent and its current price, and each region is centred on its typical rent from Cotality's gross yields (typical rents, not asking rents, which skew high). A suburb's typical unit is never rented above its typical house.</p>
      <h3 style="margin-top:14px">Ownaroo Score</h3>
      <p class="note">Five scored components, each a percentile against every Australian suburb: rental yield, growth drivers, rental demand (vacancy, days on market, unemployment), affordability (price ÷ household income) and stability (employment, social-housing share, market size, concentration risk). Strategies weight them differently: balanced, growth, cash flow, first home, new builds. Scores are banded against their actual spread: 65+ is about the top 1% of suburbs, 55+ the top 10%, 45+ above the median.</p>
      <p class="note"><b>Past price growth is shown but not scored.</b> Suburb-level 12-month changes exist only where official sales are published (NSW, VIC, SA), so scoring them made suburbs in different states incomparable, and it rewarded trailing growth just as markets turned. Every price display leads with the area's 3-month change and says whether prices are rising, flat or falling.</p>
      <p class="note"><b>Growth drivers reward demand, not construction.</b> Population growth 2020-25 (ABS estimates for the surrounding SA2) is counted net of new supply: growth above about 2.5% a year, which usually means a new estate or apartment towers being built, earns less credit, and the council area's approvals rate (new dwellings a year per 100 existing) counts against it. Census 2016-21 income and rent growth keep a small weight until the 2026 Census is released.</p>
      <p class="note"><b>Modelled suburbs are shrunk toward the middle.</b> Where a suburb has no official sales series its score is pulled 15% toward 50, so less certain numbers can't outrank measured ones on the same inputs. Concentration risk takes up to 30 points off. Outside the capital cities it covers mining share, the largest industry's share of jobs, remoteness and population decline (the mining threshold is low because many mine and gas workers fly or drive in and aren't counted as residents). In the capitals only a shrinking population counts, because residents commute into a diverse job market. Every ranking carries a Measured, Partly measured or Modelled badge.</p>
      <p class="note"><b>Deals get a relative rank and an absolute test.</b> The rank ("better than 78%" means stronger numbers than 78% of the benchmark; the colour bands are top 15%, next 25%, middle 30% and bottom 30%) compares a purchase with the typical home in every Australian suburb of 1,000+ people, run through the same model with the same deposit, rate and income. It is relative, so at current rates even a top-ranked deal usually costs money each week. That's why the weekly cost after tax is the headline, and why each deal is also tested absolutely: does its projected after-tax return beat a term deposit at the cash rate, after tax at your marginal rate? Every analysis starts from the same assumptions on every page: 3% a year price growth (a cautious long-run assumption, close to the major banks' near-term forecasts and below the 30-year average), with 1% and 5% shown alongside, 3.5% rent growth and 3% inflation, unless you change them. Suburb data doesn't change those assumptions.</p>
      <p class="note"><b>Mortgage stress</b> means repayments above 30% of before-tax household income. Every page uses that one threshold, and the affordability tool leads with the comfortable price under it.</p>
    </div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>2026 tax-change calculator</h3>
      <p class="note">Stamp duty uses each state's published schedule and concessions. LMI uses a published premium table plus state duty on LMI. Land tax is for an individual holding one property. Income tax is 2026-27 resident rates with the Medicare levy and the low income tax offset. Negative gearing and CGT follow the Tax Reform No. 1 Act 2026: offset share by date, carried-forward losses, value at 1 July 2027, CPI indexation and the 30% minimum. Building depreciation is 2.5% a year of an estimated construction cost, only when you give a build year of 1987 or later (none if it's left blank), plus plant and equipment for new builds. Running costs start from typical figures for the state (council rates, water charges, landlord insurance) and should be replaced with the property's own. Losses the 2026 rules stop you offsetting against salary can be offset against net rental profit from your other properties, if you enter it. Return is the internal rate of return on your actual cash flows, including the sale.</p>
      <p class="fine">It handles one or two individual owners (each taxed on their share at their own rate) and adds any other investment land you own in the state for land tax. Trusts, companies, SMSFs and foreign buyers are treated differently and aren't modelled.</p>
    </div>
    <div class="card" id="privacy"><h3>Privacy</h3><p class="note">Ownaroo doesn't use tracking cookies. What you type into the calculators stays in your browser; saved suburbs and deals are kept only in your browser. Page views are counted without cookies or anything that identifies you. The full list of services your browser contacts is in the <a href="/privacy" data-link>privacy policy</a>.</p>
    <h3 style="margin-top:14px">Not advice</h3><p class="note">Ownaroo is general information. It doesn't know your circumstances and isn't a licensed financial, credit, tax or legal adviser. Estimates and projections can be wrong. Check with independent professionals before you buy.</p></div>
  </section>

  <section class="section"><h3>All sources</h3><ul class="note">${model.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}
  <li><a href="https://www.rba.gov.au/statistics/tables/" target="_blank" rel="noopener">Reserve Bank of Australia statistical tables</a></li>
  <li><a href="https://www.abs.gov.au/statistics/industry/building-and-construction/building-approvals-australia/latest-release" target="_blank" rel="noopener">ABS Building Approvals</a></li>
  <li><a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO: negative gearing and CGT reform</a></li>
  <li><a href="${RULES.incomeTax.source}" target="_blank" rel="noopener">ATO: individual income tax rates</a></li>
  <li>Maps and address search: <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener">MapTiler</a> when enabled, otherwise OpenStreetMap's Nominatim</li>
  <li>Map tiles © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a></li></ul></section>`;
  // fill in the rows that need bigger files, after the page is on screen
  load('news').then((news) => {
    const pubs = [...new Set((news?.items || []).map((x) => x.source))].sort();
    const el = main.querySelector('#m-pubs');
    if (el && pubs.length) el.textContent = `In the current feed: ${pubs.length} publishers (${pubs.join(', ')}).`;
  }).catch(() => {});
  load('approvals').then((a) => {
    const el = main.querySelector('#m-appr');
    if (el) el.textContent = a?.updated ? `${date(a.updated)} (data to ${new Date(`${a.latestMonth}-01T00:00:00`).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })})` : 'Not yet run';
  }).catch(() => {
    const el = main.querySelector('#m-appr');
    if (el) el.textContent = 'Not available';
  });
}
