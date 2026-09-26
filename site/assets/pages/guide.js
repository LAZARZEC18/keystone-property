import { esc, aud, pct, setMeta } from '../ui.js';
import { load } from '../data.js';
import { stampDuty, landTax, lmi, repayment } from '../engine.js';
import { RULES, STATES } from '../rules.js';

export default async function guidePage(main) {
  setMeta({ title: 'How to buy an investment property in Australia (2026 guide)', description: 'Step-by-step guide to buying an investment or first home in Australia: costs, stamp duty by state, loans, inspections, settlement, tax, and the 2026 negative gearing and CGT reforms.' });
  const [rs, market] = await Promise.all([load('rates-summary'), load('market')]);
  const prices = [500000, 750000, 1000000, 1500000];
  const sts = Object.keys(STATES);
  const inv = rs.best.INV_PI_variable?.[0];
  const rate = rs.medianInvestorVariable || 6.5;

  const toc = [
    ['before', 'Before you start'],
    ['strategy', 'Pick a strategy'],
    ['finance', 'Get your finance ready'],
    ['research', 'Research the market'],
    ['buy', 'Find, inspect and buy'],
    ['settle', 'Settlement'],
    ['own', 'Owning an investment property'],
    ['costs', 'Every cost, in one place'],
    ['duty', 'Stamp duty by state'],
    ['landtax', 'Land tax by state'],
    ['tax-2026', 'The 2026 tax changes'],
    ['fhb', 'First home buyers'],
    ['mistakes', 'Common mistakes'],
    ['faq', 'Questions'],
  ];
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Guide</div><h1>How to buy an investment property in Australia</h1>
  <p>The whole process in order, what each step costs, and the numbers to check before you sign. Updated for the 2026-27 tax year and the negative gearing and capital gains tax changes.</p></div>
  <div class="grid" style="grid-template-columns:220px minmax(0,1fr);gap:32px">
    <nav class="toc" aria-label="Guide contents">${toc.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav>
    <article>
      <section id="before" class="section" style="margin-top:0"><h2>1. Before you start</h2>
        <p>An investment property is a leveraged, illiquid, high-cost asset. Before looking at a single listing, be clear on three things.</p>
        <div class="grid g3">
          <div class="card flat tint"><h3>Your buffer</h3><p class="note">Most investment properties cost money to hold each week. Keep 3-6 months of repayments and costs in an offset account for vacancies, repairs and rate rises.</p></div>
          <div class="card flat tint"><h3>Your horizon</h3><p class="note">Buying and selling costs 6-8% of the price. Plan to hold for 7-10 years or more, or the costs eat the gain.</p></div>
          <div class="card flat tint"><h3>Your goal</h3><p class="note">Cash flow now, or growth later? You rarely get both in the same property. The strategy decides the suburb.</p></div>
        </div>
      </section>

      <section id="strategy" class="section"><h2>2. Pick a strategy</h2>
        <div class="tbl-wrap"><table><thead><tr><th>Strategy</th><th>Looks like</th><th>Pros</th><th>Cons</th></tr></thead><tbody>
          <tr><td><b>Capital growth</b></td><td>Houses on land in established, supply-constrained suburbs near jobs</td><td>Land drives long-run growth; easier to sell</td><td>Low yields (3-4%), negative cash flow, bigger deposit</td></tr>
          <tr><td><b>Cash flow</b></td><td>Regional towns and outer suburbs, yields 5%+</td><td>Rent covers more of the loan; lower entry price</td><td>Slower or patchier growth; mining-town and single-employer risk</td></tr>
          <tr><td><b>New build</b></td><td>House and land, or a new townhouse</td><td>Keeps negative gearing and CGT choice after 2027; high depreciation; low maintenance</td><td>Premium price, off-the-plan valuation risk, suburbs with heavy supply</td></tr>
          <tr><td><b>Rent-vest</b></td><td>Rent where you live, buy where you can afford</td><td>Get into the market sooner</td><td>No first home concessions on an investment; you pay rent and a mortgage</td></tr>
          <tr><td><b>Value-add</b></td><td>Renovate, subdivide or add a granny flat</td><td>Can create equity quickly</td><td>Building costs and approvals risk; needs skills or trades</td></tr>
        </tbody></table></div>
        <p class="note" style="margin-top:10px">Keystone's <a href="/suburbs" data-link>suburb explorer</a> has a strategy switch that re-ranks all 11,000+ suburbs for growth, cash flow or first-home affordability.</p>
      </section>

      <section id="finance" class="section"><h2>3. Get your finance ready</h2>
        <div class="steps">
          <div class="card step"><h3>Check your borrowing power</h3><p>Lenders test your repayments at the loan rate plus 3 percentage points and usually count only about 80% of rent. Use the <a href="/borrowing" data-link>borrowing power calculator</a> to get a realistic ceiling.</p></div>
          <div class="card step"><h3>Save the deposit and costs</h3><p>At 20% deposit you avoid lenders mortgage insurance (LMI). At 10% you'll pay LMI: on a ${aud(630000)} loan for a ${aud(700000)} property in Victoria that's about <b>${aud(lmi(630000, 700000, 'VIC').premium)}</b>. On top of the deposit, budget for stamp duty (see below) and about $2,000-3,500 of legal, inspection and government fees.</p></div>
          <div class="card step"><h3>Choose the loan</h3><p>Investor rates are higher than owner-occupier rates. The lowest advertised investor variable rate today is <b>${pct(inv?.rate, 2)}</b> (${esc(inv?.lender || '')}), and the median is ${pct(rate, 2)}. Decide between principal and interest (lower rate, builds equity) and interest-only (higher rate, lower repayments, often used to keep cash flow). An offset account lets your savings cut interest while staying available. <a href="/rates" data-link>Compare every lender →</a></p></div>
          <div class="card step"><h3>Get pre-approval</h3><p>Pre-approval (conditional approval) tells you what a lender will likely lend and lets you bid with confidence. It usually lasts 90 days. A mortgage broker is paid by the lender and can compare dozens of banks at no cost to you.</p></div>
        </div>
      </section>

      <section id="research" class="section"><h2>4. Research the market</h2>
        <p>The biggest decision is <i>where</i>. Check these for every suburb on your shortlist (each Keystone suburb page shows all of them):</p>
        <ul class="pros">
          <li><b>Yield</b>: annual rent ÷ price. Above your region's average means lower holding costs.</li>
          <li><b>Vacancy rate</b>: under 1.5% means tenants compete for rentals. Right now Perth, Adelaide and Hobart are at ${pct(market.regions.PER.vacancy, 1)}, ${pct(market.regions.ADL.vacancy, 1)} and ${pct(market.regions.HBA.vacancy, 1)}.</li>
          <li><b>Population and income growth</b>: more people with more money means more demand for homes.</li>
          <li><b>Supply pipeline</b>: lots of new apartments being approved nearby caps rents and resale prices. See <a href="/new-builds" data-link>new builds by council</a>.</li>
          <li><b>Days on market and price momentum</b>: rising days on market means buyers have more bargaining power. See <a href="/live" data-link>today's market</a>.</li>
          <li><b>Affordability</b>: price relative to local incomes. Very high ratios depend on outside buyers.</li>
          <li><b>Risk</b>: flood and bushfire overlays (check the council and your insurer), heavy reliance on one employer, and high social-housing concentration.</li>
        </ul>
      </section>

      <section id="buy" class="section"><h2>5. Find, inspect and buy</h2>
        <div class="steps">
          <div class="card step"><h3>Shortlist properties</h3><p>Use listing sites, and pull each suburb's recent sales to know what things really sell for. Keystone's <a href="/listings" data-link>listings page</a> grades every listing on yield, cash flow and return.</p></div>
          <div class="card step"><h3>Run the numbers</h3><p>Put each serious contender through the <a href="/analyse" data-link>deal analyser</a>: all costs, the weekly shortfall after tax, a rate-rise stress test and the 10-year return. Walk away if it only works in the bull case.</p></div>
          <div class="card step"><h3>Check the property</h3><p>Get a building and pest inspection (about $400-800). For strata, get a strata report (about $250-400) covering levies, the sinking fund, defects and disputes. Ask a property manager for a rental appraisal before you buy.</p></div>
          <div class="card step"><h3>Have the contract reviewed</h3><p>A conveyancer or solicitor ($1,000-2,500) checks the title, zoning, easements, special conditions and the vendor statement. In most states you can make the offer "subject to finance" and "subject to building and pest".</p></div>
          <div class="card step"><h3>Negotiate or bid</h3><p>Private sale: offer below your walk-away price and negotiate. Auction: sales are unconditional, with no cooling-off period, so finance and inspections must be done beforehand. You'll usually pay a 10% deposit on the day. In NSW and QLD you must register to bid.</p></div>
          <div class="card step"><h3>Exchange and cooling off</h3><p>Once contracts are signed, cooling-off periods for private sales vary by state: NSW 5 business days, VIC 3, QLD 5, SA 2, ACT 5. WA and TAS have none unless written into the contract. Pulling out usually costs 0.2-0.25% of the price.</p></div>
        </div>
      </section>

      <section id="settle" class="section"><h2>6. Settlement</h2>
        <p>Settlement usually happens 30-90 days after exchange. Before it: lock in the loan, arrange building insurance from exchange (or the date risk passes in your state), and do a pre-settlement inspection. Stamp duty is generally due at or before settlement. On the day, the lender pays the balance, the title transfers electronically (PEXA), and you get the keys. Appoint a property manager before settlement so a tenant can move in straight away. Management fees run about 5.5-9% of rent, plus letting fees.</p>
      </section>

      <section id="own" class="section"><h2>7. Owning an investment property</h2>
        <div class="grid g2">
          <div class="card flat tint"><h3>Tax deductions</h3><p class="note">Interest, council rates, water, strata, insurance, management fees, repairs, land tax and depreciation are deductible. Building depreciation is 2.5% a year of construction cost for buildings built after September 1987. Plant and equipment is only deductible if the property is new. Get a quantity surveyor's depreciation schedule (about $600-800). Improvements are capital, not repairs.</p></div>
          <div class="card flat tint"><h3>Ongoing costs</h3><p class="note">Budget for council rates, water, landlord insurance, strata if applicable, maintenance (about 0.5-1% of the value a year), property management, land tax above your state's threshold, and a few weeks of vacancy each year.</p></div>
        </div>
      </section>

      <section id="costs" class="section"><h2>8. Every cost, in one place</h2>
        <p>Using a ${aud(750000)} house bought by an investor with 20% down, a ${pct(rate, 2)} loan and ${aud(620)}/wk rent:</p>
        <div class="tbl-wrap"><table><thead><tr><th>Cost</th>${sts.map((s) => `<th class="n">${s}</th>`).join('')}</tr></thead><tbody>
          <tr><td>Deposit (20%)</td>${sts.map(() => `<td class="n">${aud(150000)}</td>`).join('')}</tr>
          <tr><td>Stamp duty (investor)</td>${sts.map((s) => `<td class="n">${aud(stampDuty(s, 750000).duty)}</td>`).join('')}</tr>
          <tr><td>Legal, inspections, fees</td>${sts.map(() => `<td class="n">${aud(2500)}</td>`).join('')}</tr>
          <tr><td><b>Cash to buy</b></td>${sts.map((s) => `<td class="n"><b>${aud(152500 + stampDuty(s, 750000).duty)}</b></td>`).join('')}</tr>
          <tr><td>Monthly repayment (P&amp;I, 30 yrs)</td>${sts.map(() => `<td class="n">${aud(repayment(600000, rate, 30))}</td>`).join('')}</tr>
          <tr><td>Land tax a year (land ≈ 55%)</td>${sts.map((s) => `<td class="n">${aud(landTax(s, 412500, { perth: s === 'WA' }).tax)}</td>`).join('')}</tr>
        </tbody></table></div>
      </section>

      <section id="duty" class="section"><h2>9. Stamp duty by state</h2>
        <p>Stamp (transfer) duty is the biggest up-front cost after the deposit. Investors pay general rates; owner-occupiers and first home buyers may get concessions.</p>
        <div class="tbl-wrap"><table><thead><tr><th>Price</th>${sts.map((s) => `<th class="n">${s}</th>`).join('')}</tr></thead><tbody>
        ${prices.map((p) => `<tr><td>${aud(p)} investor</td>${sts.map((s) => `<td class="n">${aud(stampDuty(s, p).duty)}</td>`).join('')}</tr><tr><td class="muted">${aud(p)} first home (established)</td>${sts.map((s) => `<td class="n muted">${aud(stampDuty(s, p, { buyer: 'fhb' }).duty)}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
        <p class="fine" style="margin-top:8px">Sources: ${sts.map((s) => `<a href="${RULES.duty[s].source}" target="_blank" rel="noopener">${s}</a>`).join(' · ')}. Rules checked ${esc(RULES.asOf)}. Eligibility conditions apply to every concession. Foreign buyer surcharges are extra.</p>
      </section>

      <section id="landtax" class="section"><h2>10. Land tax by state</h2>
        <p>Land tax is charged every year on the land value of investment properties (your home is exempt). It's based on the total land you hold in each state, so a second or third property in the same state can push you into higher brackets.</p>
        <div class="tbl-wrap"><table><thead><tr><th>Land value</th>${sts.map((s) => `<th class="n">${s}</th>`).join('')}</tr></thead><tbody>
        ${[300000, 500000, 800000, 1200000, 2000000].map((v) => `<tr><td>${aud(v)}</td>${sts.map((s) => `<td class="n">${aud(landTax(s, v).tax)}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
        <p class="fine" style="margin-top:8px">Individual owners, general rates. Tax-free thresholds: NSW $1,075,000, VIC $50,000, QLD $600,000, WA $300,000, SA $936,000, TAS $125,000, ACT none (every rented property pays), NT no land tax. WA metro adds the Metropolitan Region Improvement Tax. ACT figures are approximate.</p>
      </section>

      <section id="tax-2026" class="section"><h2>11. The 2026 tax changes: what they mean for you</h2>
        <div class="callout"><b>In force from 1 July 2027 (Treasury Laws Amendment (Tax Reform No. 1) Act 2026).</b> ${esc(RULES.reform.summary)}</div>
        <div class="tbl-wrap"><table><thead><tr><th>You bought…</th><th>Negative gearing</th><th>Capital gains tax on sale</th></tr></thead><tbody>
          <tr><td>Before 7:30pm AEST 12 May 2026</td><td>Continues, grandfathered</td><td>50% discount on gains to 30 June 2027; indexation + 30% minimum on gains after</td></tr>
          <tr><td>An established home, 12 May 2026 – 30 June 2027</td><td>Only until 30 June 2027, then losses carry forward against property income and gains</td><td>Same split as above</td></tr>
          <tr><td>An established home, from 1 July 2027</td><td>Losses quarantined from the start</td><td>Indexation + 30% minimum tax</td></tr>
          <tr><td>A new build (first owner)</td><td>Continues</td><td>Your choice: 50% discount or indexation</td></tr>
        </tbody></table></div>
        <p style="margin-top:12px"><b>What it means in practice:</b> for an established property the weekly cost you feel is now closer to the <i>before-tax</i> shortfall, because the salary tax refund stops after June 2027. The losses aren't wasted: they reduce tax on future rental profits and on the gain when you sell. They just arrive years later. That favours higher-yield properties, bigger deposits and new builds. Keystone's analyser applies all of this automatically.</p>
        <p class="fine">Sources: <a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO</a> · <a href="${RULES.reform.factsheet}" target="_blank" rel="noopener">Budget factsheet</a>. General information only. See a registered tax agent about your situation.</p>
      </section>

      <section id="fhb" class="section"><h2>12. First home buyers</h2>
        <ul class="pros">
          <li><b>NSW</b>: no duty up to $800,000 and a concession to $1,000,000 (new and existing homes).</li>
          <li><b>VIC</b>: no duty up to $600,000 and a concession to $750,000.</li>
          <li><b>QLD</b>: no duty on new homes of any value (contracts from 1 May 2025); no duty on established homes to $700,000, phasing out by $800,000.</li>
          <li><b>WA</b>: from 7 May 2026, no duty up to $600,000 and a concessional rate to $800,000.</li>
          <li><b>SA</b>: no duty on new homes, off-the-plan and vacant land of any value; no relief on established homes.</li>
          <li><b>ACT</b>: the Home Buyer Concession Scheme's price and income caps were removed from 1 July 2026 (other eligibility rules apply).</li>
          <li><b>TAS</b>: the 100% established-home exemption ended for settlements after 30 June 2026.</li>
          <li><b>Federal</b>: the 5% Deposit Scheme lets eligible first home buyers buy with a 5% deposit and no LMI.</li>
        </ul>
        <p class="note">Live, then invest: if you buy a home to live in first, you get the owner-occupier concessions and rates. If you later rent it out, check the six-year main-residence CGT rule with your accountant.</p>
      </section>

      <section id="mistakes" class="section"><h2>13. Common mistakes</h2>
        <ul class="cons">
          <li>Buying on emotion or a "hot tip" instead of the numbers.</li>
          <li>Ignoring the weekly holding cost, which is now bigger for established homes after July 2027.</li>
          <li>No buffer: one vacancy plus a rate rise forces a sale.</li>
          <li>Buying off-the-plan apartments in suburbs with heavy supply.</li>
          <li>Skipping building, pest or strata reports to save a few hundred dollars.</li>
          <li>Overpaying at auction by not knowing recent sales.</li>
          <li>Cross-collateralising loans: keep each property on its own loan.</li>
          <li>Not claiming depreciation, or claiming improvements as repairs.</li>
        </ul>
      </section>

      <section id="faq" class="section"><h2>Questions</h2>
        ${[
          ["Is now a good time to buy?", "Nobody can time the market reliably. What you can control is buying well: a property that you can afford to hold through a rate rise, in a suburb with strong demand, at a price backed by recent sales. Check the live market page for current momentum in your city."],
          ["How much deposit do I need?", "Most lenders want 10-20% for investors, plus stamp duty and costs. Below 20% you pay LMI, which can be added to the loan."],
          ["Should I buy in my own name, jointly or in a trust?", "It depends on incomes, other assets and plans. Negative gearing benefits the higher earner; land tax thresholds differ for trusts. Get advice from an accountant before you sign, because changing names later triggers duty and CGT."],
          ["House or apartment?", "Land drives long-run growth, so houses have usually grown faster. Apartments have higher yields and lower entry prices but carry strata costs and supply risk. Townhouses and villas sit in between."],
          ["How accurate are Keystone's prices?", "Where a state publishes official suburb sales (VIC, SA, NSW), Keystone uses them. Elsewhere it's a calibrated model, typically within about 12-20% of the true median. Always check recent sales for the specific street and property."],
        ]
          .map(([q, a]) => `<details class="faq"><summary>${q}</summary><p class="note" style="margin-top:8px">${esc(a)}</p></details>`)
          .join('')}
      </section>
      <p class="fine section">General information only, not financial, tax or legal advice.</p>
    </article>
  </div>`;
  if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 60);
  main.querySelectorAll('.toc a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  }));
}
