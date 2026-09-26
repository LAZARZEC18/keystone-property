import { esc, pct, date, setMeta } from '../ui.js';
import { load } from '../data.js';
import { RULES } from '../rules.js';

export default async function methodologyPage(main) {
  setMeta({ title: 'Data sources and methodology', description: 'Where every Keystone number comes from, how often it updates, and how the suburb price model and investor score work.' });
  const [model, status, rs] = await Promise.all([load('model'), load('status').catch(() => null), load('rates-summary')]);
  const m = model.model;
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Methodology</div><h1>Where the numbers come from</h1>
  <p>Keystone only uses public, official or licensed sources, credits every one, and marks clearly which figures are official and which are Keystone estimates.</p></div>

  <section class="section"><h2>Update schedule</h2>
  <div class="tbl-wrap"><table><thead><tr><th>Data</th><th>Source</th><th>Keystone checks</th><th>Source publishes</th><th>Last run</th></tr></thead><tbody>
    <tr><td>Home loan rates (${rs.lenders} lenders)</td><td>Consumer Data Right product feeds, via the <a href="https://api.cdr.gov.au" target="_blank" rel="noopener">CDR register</a></td><td>Every hour</td><td>Whenever lenders change rates</td><td>${status?.jobs?.rates?.ok ? 'OK' : '—'}</td></tr>
    <tr><td>Daily home values (5 capitals)</td><td><a href="https://www.cotality.com/au/our-data/indices" target="_blank" rel="noopener">Cotality Daily Home Value Index</a></td><td>Every hour</td><td>Daily</td><td>${status?.jobs?.index?.ok ? 'OK' : '—'}</td></tr>
    <tr><td>Cash rate, lending rates, bank bills</td><td>RBA tables A2, F1.1, F5, F6</td><td>Every hour</td><td>After each RBA meeting; monthly</td><td>${status?.jobs?.rba?.ok ? 'OK' : '—'}</td></tr>
    <tr><td>News headlines</td><td>RBA, realestate.com.au, PropTrack, ABC, The Guardian, The Conversation, Broker News, SBS, Google News</td><td>Every hour</td><td>Continuous</td><td>${status?.jobs?.news?.ok ? 'OK' : '—'}</td></tr>
    <tr><td>Building approvals by council and SA2</td><td>ABS Building Approvals, Australia</td><td>Every hour (downloads on release)</td><td>Monthly</td><td>—</td></tr>
    <tr><td>Capital and regional medians, yields, days on market</td><td>Cotality Home Value Index, PropTrack, SQM Research</td><td>Rolled forward monthly with the index</td><td>Monthly</td><td>—</td></tr>
    <tr><td>Suburb sales medians</td><td>Valuer-General Victoria, Land Services SA, NSW DCJ Rent &amp; Sales Report</td><td>Quarterly rebuild</td><td>Quarterly</td><td>${date(model.built)}</td></tr>
    <tr><td>Demographics</td><td>ABS Census 2016 and 2021</td><td>Static</td><td>Every 5 years (2026 Census results due 2027)</td><td>—</td></tr>
    <tr><td>Stamp duty, land tax, income tax, CGT</td><td>State revenue offices and the ATO</td><td>Reviewed each July</td><td>Annually</td><td>${esc(RULES.asOf)}</td></tr>
  </tbody></table></div>
  ${status ? `<p class="fine" style="margin-top:8px">Last full refresh finished ${date(status.finished)} (${new Date(status.finished).toLocaleTimeString('en-AU')}).</p>` : ''}</section>

  <section class="section grid g2">
    <div class="card"><h3>Suburb prices</h3>
      <p class="note">Where a state publishes suburb sales medians openly (Victoria, South Australia metro, NSW by postcode), Keystone uses them, rolled forward to today with the regional index since the data period. These are marked <span class="tag tag-official">Official</span>.</p>
      <p class="note">Everywhere else, prices are a <span class="tag tag-model">Estimate</span> from a regression model trained on ${m.trainN.toLocaleString()} official suburb medians. It uses each suburb's Census mortgage repayments, rents and incomes relative to its region, home ownership, dwelling mix, density, distance to the CBD and the coast, and remoteness. It then anchors the result to Cotality's current median for the region. Fit: R² ${m.r2} (houses), ${m.unitR2} (units).</p>
      <p class="note">Tested on states it hadn't seen: median error ${Object.entries(m.holdout).map(([s, h]) => `${s} ${pct(h.medianAbsPctError, 1)} (${pct(h.within20pct, 0)} within 20%)`).join(', ')}. Estimates are least reliable in very small, remote or unusual suburbs, which carry a low-confidence flag.</p>
    </div>
    <div class="card"><h3>Rents</h3>
      <p class="note">NSW rents are median new bonds by postcode (DCJ). Everywhere else, a rent model fitted on those official bond medians (407 postcodes for houses, median error about 9%) sets each suburb's rent relative to its region from its 2021 Census rent and its current price, and each region is centred on its typical rent from Cotality's gross yields (typical rents, not asking rents, which skew high). A suburb's typical unit is never rented above its typical house.</p>
      <h3 style="margin-top:14px">Keystone Score</h3>
      <p class="note">Six components, each a percentile against every Australian suburb: yield, 12-month momentum, growth drivers (2016-21 population, income and rent growth), rental demand (vacancy, days on market, unemployment), affordability (price ÷ household income) and stability (employment, social-housing share, market size). Strategies weight them differently: balanced, growth, cash flow, first home. Stability now includes a concentration-risk index: the share of local workers in mining, the largest single industry's share of jobs (Census 2021), remoteness and population decline. High-risk towns lose up to 25 points from their score, and home buyers searching without a workplace don't see them at all. Where a suburb has no official sales series, its 12-month change is the city or regional index and is labelled that way; momentum then counts half. Suburb changes more than 12 points from their region's come from few sales and are held at that limit and marked with an asterisk.</p>
    </div>
  </section>

  <section class="section grid g2">
    <div class="card"><h3>Deal analyser</h3>
      <p class="note">Stamp duty uses each state's published schedule and concessions. LMI uses a published premium table plus state duty on LMI. Land tax is for an individual holding one property. Income tax is 2026-27 resident rates with the Medicare levy and the low income tax offset. Negative gearing and CGT follow the Tax Reform No. 1 Act 2026: offset share by date, carried-forward losses, value at 1 July 2027, CPI indexation and the 30% minimum. Depreciation is 2.5% of an estimated construction cost, plus plant for new builds. Return is the internal rate of return on your actual cash flows, including the sale.</p>
      <p class="fine">It assumes one Australian-resident individual owner and no other properties in the state. Trusts, companies, SMSFs and foreign buyers are treated differently.</p>
    </div>
    <div class="card" id="privacy"><h3>Privacy</h3><p class="note">Keystone doesn't use tracking cookies. Your watchlist and theme are stored only in your browser. If you register for updates, your name, email and interests are stored in Netlify Forms for Keystone's use only.</p>
    <h3 style="margin-top:14px">Not advice</h3><p class="note">Keystone is general information. It doesn't know your circumstances and isn't a licensed financial, credit, tax or legal adviser. Estimates and projections can be wrong. Check with independent professionals before you buy.</p></div>
  </section>

  <section class="section"><h3>All sources</h3><ul class="note">${model.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join('')}
  <li><a href="https://www.rba.gov.au/statistics/tables/" target="_blank" rel="noopener">Reserve Bank of Australia statistical tables</a></li>
  <li><a href="https://www.abs.gov.au/statistics/industry/building-and-construction/building-approvals-australia/latest-release" target="_blank" rel="noopener">ABS Building Approvals</a></li>
  <li><a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO: negative gearing and CGT reform</a></li>
  <li><a href="${RULES.incomeTax.source}" target="_blank" rel="noopener">ATO: individual income tax rates</a></li>
  <li><a href="https://developer.domain.com.au" target="_blank" rel="noopener">Domain API</a> (live listings)</li>
  <li>Map tiles © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors, © <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a></li></ul></section>`;
}
