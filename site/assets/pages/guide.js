import { esc, aud, pct, setMeta } from '../ui.js';
import { load, typicalRate } from '../data.js';
import { stampDuty, landTax, lmi, repayment } from '../engine.js';
import { RULES, STATES } from '../rules.js';
import { HOME_GUARANTEE, STATE_SCHEMES } from '../rules.js';

// one page per section (keep in step with netlify/shared/seo-core.js GUIDE): [id, page title, description]
export const GUIDE = [["before", "Before you buy: goals, budget and timing", "What to decide before you look at a single property: why you are buying, what you can hold through a rate rise, and your timeline."], ["fhb", "Buying your first home in Australia (2026)", "The 5% Deposit Scheme, Help to Buy, first home grants, stamp duty concessions and state home lenders like Keystart, and each step to settlement."], ["strategy", "Property investment strategies: growth, yield or new builds", "Capital growth, cash flow and new builds under the 2026 tax rules: what each strategy needs and who it suits."], ["finance", "Getting your home loan ready", "Pre-approval, deposit, lenders mortgage insurance, the 3-point serviceability buffer and the documents lenders ask for."], ["research", "How to research a suburb before you buy", "Prices, rents, vacancy, supply, local economy and hazards: what to check about a suburb and where to find it."], ["buy", "Finding, inspecting and buying a property", "Inspections, building and pest reports, making an offer, auctions and exchanging contracts."], ["settle", "Property settlement in Australia", "What happens between exchange and settlement, and what to check on the day."], ["own", "Owning an investment property", "Tenants, property managers, insurance, depreciation and records for tax time."], ["costs", "Every cost of buying property, in one place", "Deposit, stamp duty, LMI, legal and inspection fees, and the ongoing costs of owning."], ["duty", "Stamp duty in every state and territory (2026)", "Stamp duty at common prices in each state and territory, with first home and owner-occupier concessions."], ["landtax", "Land tax by state (2026)", "Land tax thresholds and rates for investors in each state and territory."], ["tax-2026", "The 2026 negative gearing and CGT changes, explained", "Who keeps negative gearing, how capital gains are taxed from 1 July 2027, and what it means for your weekly cost and return."], ["mistakes", "Common property buying mistakes", "The mistakes that cost buyers most, and how to avoid them."], ["glossary", "Property and home loan glossary", "Plain-English definitions of LVR, LMI, comparison rates, offset accounts and more."], ["faq", "Property buying questions, answered", "Short answers to the questions buyers ask most."]];

export default async function guidePage(main, params = {}) {
  const section = params.section || '';
  // old single-page links (/guide/fhb, /guide/fhb#state-schemes) open the section's own page
  if (!section && location.hash) {
    const target = location.hash.slice(1);
    const owner = GUIDE.find(([id]) => id === target) ? target : SUB_ANCHORS[target];
    if (owner) {
      const { navigate } = await import('../app.js');
      navigate(`/guide/${owner}${owner === target ? '' : `#${target}`}`, true);
      return;
    }
  }
  setMeta({ title: 'How to buy property in Australia: first home and investment (2026 guide)', description: 'Step-by-step guide to buying an investment or first home in Australia: costs, stamp duty by state, loans, inspections, settlement, tax, and the 2026 negative gearing and CGT reforms.' });
  const [rs, market, rba] = await Promise.all([load('rates-summary'), load('market'), load('rba').catch(() => null)]);
  const prices = [500000, 750000, 1000000, 1500000];
  const sts = Object.keys(STATES);
  const inv = rs.best.INV_PI_variable?.[0];
  const rate = typicalRate(rba, 'INV').rate;

  const toc = [
    ['before', 'Before you start'],
    ['fhb', 'Buying your first home'],
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
    ['mistakes', 'Common mistakes'],
    ['glossary', 'Glossary'],
    ['faq', 'Questions'],
  ];
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">Guide</div><h1>How to buy property in Australia</h1>
  <p>The whole process in order, what each step costs, and the numbers to check before you sign, for first home buyers and investors. Updated for the 2026-27 tax year, the 5% Deposit Scheme and the negative gearing and capital gains tax changes.</p>
  <div class="grid g2" style="margin-top:16px;max-width:820px"><a class="card product" href="#fhb"><h3>Buying your first home</h3><p class="muted">The 5% Deposit Scheme, duty concessions, choosing where to live, and each step to settlement.</p></a><a class="card product" href="#strategy"><h3>Buying an investment</h3><p class="muted">Strategy, finance, cash flow, tax (including the 2026 changes), and owning a rental.</p></a></div></div>
  <div class="grid guide-grid">
    <nav class="toc" aria-label="Guide contents">${toc.map(([id, t]) => `<a href="#${id}">${t}</a>`).join('')}</nav>
    <article>
      <section id="before" class="section" style="margin-top:0"><h2>1. Before you start</h2>
        <p>Property is the biggest purchase most people make, it's expensive to buy and sell, and it's usually bought with borrowed money. Whether it's a home to live in or an investment, be clear on three things before you look at listings.</p>
        <div class="grid g3">
          <div class="card flat tint"><h3>Your buffer</h3><p class="note">Keep 3–6 months of repayments in an offset or savings account for rate rises, repairs and, for investors, vacancies. Test your repayments at 2 points above today's rate.</p></div>
          <div class="card flat tint"><h3>Your horizon</h3><p class="note">Buying and selling costs 6–8% of the price. Plan to stay or hold for 7–10 years or more, or the costs eat any gain.</p></div>
          <div class="card flat tint"><h3>Your goal</h3><p class="note">A home: commute, space, schools and the street. An investment: cash flow now or growth later, rarely both. The goal decides the suburb.</p></div>
        </div>
      </section>

      <section id="fhb" class="section"><h2>2. Buying your first home</h2>
        <p>Buying a home to live in is a different decision from buying an investment. Location, commute and the kind of street you want matter more than yield, and first home buyers get help that investors don't.</p>
        <h3>The 5% Deposit Scheme</h3>
        <p>Since 1 October 2025 the federal 5% Deposit Scheme has no income caps and no limit on places. Eligible first home buyers can buy with a 5% deposit and pay no lenders mortgage insurance, which saves roughly $10,000 to $30,000 on a typical loan. The home must be under the price cap for its area:</p>
        <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Capital city and regional centres</th><th class="n">Rest of state</th></tr></thead><tbody>
          ${Object.entries(HOME_GUARANTEE.caps).map(([st, [a, b]]) => `<tr><td>${st}</td><td class="n">${aud(a)}</td><td class="n">${st === 'ACT' || st === 'NT' ? '—' : aud(b)}</td></tr>`).join('')}
        </tbody></table></div>
        <p class="fine">Regional centres on the capital-city cap: Newcastle and Lake Macquarie, the Illawarra, Geelong, the Gold Coast and the Sunshine Coast. Confirm the cap for a specific postcode with a participating lender.</p>
        <h3>Stamp duty concessions</h3>
        <ul class="pros">
          <li><b>NSW</b>: no duty up to $800,000 and a concession to $1,000,000 (new and existing homes).</li>
          <li><b>VIC</b>: no duty up to $600,000 and a concession to $750,000.</li>
          <li><b>QLD</b>: no duty on new homes of any value (contracts from 1 May 2025); no duty on established homes to $700,000, phasing out by $800,000.</li>
          <li><b>WA</b>: from 7 May 2026, no duty up to $600,000 and a concessional rate to $800,000.</li>
          <li><b>SA</b>: no duty on new homes, off-the-plan and vacant land of any value; no relief on established homes.</li>
          <li><b>ACT</b>: from 1 July 2026 the Home Buyer Concession Scheme removes stamp duty at any price for first home buyers and for anyone who hasn't owned property in the last five years, if they live in the home for at least 12 months.</li>
          <li><b>TAS</b>: the 100% established-home exemption ended for settlements after 30 June 2026.</li>
        </ul>
        <h3>First Home Owner Grant (new homes)</h3>
        <div class="tbl-wrap"><table><thead><tr><th>State</th><th class="n">Grant</th><th>Applies to</th><th>Value cap</th></tr></thead><tbody>
          <tr><td>NSW</td><td class="n">$10,000</td><td>New homes</td><td>$600,000 (house and land $750,000)</td></tr>
          <tr><td>VIC</td><td class="n">$10,000</td><td>New homes</td><td>$750,000</td></tr>
          <tr><td>QLD</td><td class="n">$15,000</td><td>New homes</td><td>$750,000 ($30,000 for contracts to 30 June 2026)</td></tr>
          <tr><td>WA</td><td class="n">$10,000</td><td>New homes</td><td>$800,000 south of the 26th parallel, $1,000,000 north</td></tr>
          <tr><td>SA</td><td class="n">$15,000</td><td>New homes</td><td>No cap</td></tr>
          <tr><td>TAS</td><td class="n">$10,000</td><td>New homes</td><td>No cap</td></tr>
          <tr><td>NT</td><td class="n">$50,000 new / $10,000 established</td><td>New and established</td><td>No cap</td></tr>
          <tr><td>ACT</td><td class="n">—</td><td colspan="2">No grant; the Home Buyer Concession Scheme removes stamp duty instead</td></tr>
        </tbody></table></div>
        <p class="fine">Amounts as published in September 2026. Grants change often: confirm with your state revenue office before you sign.</p>
        <h3>First Home Super Saver scheme</h3>
        <p>You can make voluntary contributions to your super of up to $15,000 a year and later withdraw up to $50,000 of them, plus deemed earnings, for a first home deposit. Before-tax (salary sacrifice) contributions are taxed at 15% going in instead of your marginal rate, which can grow a deposit faster. You must request a release from the ATO before you sign a contract (or within 14 days of signing).</p>
        <h3>Help to Buy (shared equity)</h3>
        <p>The federal Help to Buy scheme contributes up to 40% of the price of a new home or 30% of an existing one, so you need a deposit of just 2% and a much smaller loan. The government owns that share and you buy it back over time or when you sell. It has income limits ($103,000 single, $165,000 for couples and single parents), price caps by area and 10,000 places a year. Weigh it carefully: you give up part of any capital gain.</p>
        <h3 id="state-schemes">State home lenders and shared equity (including Keystart)</h3>
        <p>Some states run their own low-deposit lenders or shared-equity programs on top of the federal schemes. In WA, <b>Keystart</b> is the big one: it lends from a 2% deposit with no lenders mortgage insurance. Compare its rate and total cost with a bank loan under the 5% Deposit Scheme before choosing.</p>
        <div class="grid g2" style="gap:12px">${Object.entries(STATE_SCHEMES).filter(([, l]) => l.length).map(([st, l]) => `<div class="card flat tint"><h4 style="margin:0 0 6px">${STATES[st]}</h4>${l.map((x) => `<p class="note" style="margin:0 0 8px"><b>${esc(x.name)}.</b> ${esc(x.text)} <a href="${x.url}" target="_blank" rel="noopener">Official site ↗</a></p>`).join('')}</div>`).join('')}</div>
        <p class="fine">New South Wales has no state low-deposit lender; buyers there use the federal schemes and the state's first home duty exemption. Limits change often, so check each program's site. Checked September 2026.</p>
        <h3>First home, step by step</h3>
        <ol>
          <li><b>Set a budget you can live with.</b> Keep repayments under 30% of your before-tax household income (above that is commonly called mortgage stress), and test them at 2 points above today's rate. The <a href="/afford?buyer=fhb" data-link>affordability analyst</a> does this for every state, using the 5% Deposit Scheme and your state's duty concessions.</li>
          <li><b>Choose where to live.</b> Start from where you work and how far you're willing to travel, then look at the local economy, services and price trend. Enter your workplace in the affordability analyst to rank suburbs within your commute.</li>
          <li><b>Get pre-approval.</b> A broker or lender confirms what you can borrow and whether you qualify for the 5% Deposit Scheme.</li>
          <li><b>Check value before you offer.</b> Recent sales in the same street are the real guide. Ownaroo's <a href="/property" data-link>price range tool</a> gives a price range for a typical home like it as a sense-check, not a valuation.</li>
          <li><b>Inspect properly.</b> Building and pest inspection for houses; strata report for units and townhouses.</li>
          <li><b>Exchange and settle.</b> Your conveyancer handles contracts, duty and settlement (sections 6 and 7 below apply to you too).</li>
        </ol>
        <p class="note">Live, then invest: if you buy a home to live in first, you get the owner-occupier concessions and rates. If you later rent it out, check the six-year main-residence CGT rule with your accountant.</p>
      </section>

      <section id="strategy" class="section"><h2>3. Pick a strategy</h2>
        <div class="tbl-wrap"><table><thead><tr><th>Strategy</th><th>Looks like</th><th>Pros</th><th>Cons</th></tr></thead><tbody>
          <tr><td><b>Capital growth</b></td><td>Houses on land in established, supply-constrained suburbs near jobs</td><td>Land drives long-run growth; easier to sell</td><td>Low yields (3-4%), negative cash flow, bigger deposit</td></tr>
          <tr><td><b>Cash flow</b></td><td>Regional towns and outer suburbs, yields 5%+</td><td>Rent covers more of the loan; lower entry price</td><td>Slower or patchier growth; mining-town and single-employer risk</td></tr>
          <tr><td><b>New build</b></td><td>House and land, or a new townhouse</td><td>Keeps negative gearing and CGT choice after 2027; high depreciation; low maintenance</td><td>Premium price, off-the-plan valuation risk, suburbs with heavy supply</td></tr>
          <tr><td><b>Rent-vest</b></td><td>Rent where you live, buy where you can afford</td><td>Get into the market sooner</td><td>No first home concessions on an investment; you pay rent and a mortgage</td></tr>
          <tr><td><b>Value-add</b></td><td>Renovate, subdivide or add a granny flat</td><td>Can create equity quickly</td><td>Building costs and approvals risk; needs skills or trades</td></tr>
        </tbody></table></div>
        <p class="note" style="margin-top:10px">Ownaroo's <a href="/suburbs" data-link>suburb explorer</a> has a strategy switch that re-ranks all 11,000+ suburbs for growth, cash flow or first-home affordability.</p>
      </section>

      <section id="finance" class="section"><h2>4. Get your finance ready</h2>
        <div class="steps">
          <div class="card step"><h3>Check your borrowing power</h3><p>Lenders test your repayments at the loan rate plus 3 percentage points and usually count only about 80% of rent. Use the <a href="/borrowing" data-link>borrowing power calculator</a> to get a realistic ceiling.</p></div>
          <div class="card step"><h3>Save the deposit and costs</h3><p>At 20% deposit you avoid lenders mortgage insurance (LMI). At 10% you'll pay LMI: on a ${aud(630000)} loan for a ${aud(700000)} property in Victoria that's about <b>${aud(lmi(630000, 700000, 'VIC').premium)}</b>. On top of the deposit, budget for stamp duty (see below) and about $2,000-3,500 of legal, inspection and government fees.</p></div>
          <div class="card step"><h3>Choose the loan</h3><p>Investor rates are higher than owner-occupier rates. The lowest advertised investor variable rate today is <b>${pct(inv?.rate, 2)}</b> (${esc(inv?.lender || '')}), and the average rate on new investor variable loans (RBA) is ${pct(rate, 2)}. Decide between principal and interest (lower rate, builds equity) and interest-only (higher rate, lower repayments, often used to keep cash flow). An offset account lets your savings cut interest while staying available. <a href="/rates" data-link>Compare 90+ lenders →</a></p></div>
          <div class="card step"><h3>Get pre-approval</h3><p>Pre-approval (conditional approval) tells you what a lender will likely lend and lets you bid with confidence. It usually lasts 90 days. A mortgage broker is paid by the lender and can compare dozens of banks at no cost to you.</p></div>
        </div>
      </section>

      <section id="research" class="section"><h2>5. Research the market</h2>
        <p>The biggest decision is <i>where</i>. Check these for every suburb on your shortlist (each Ownaroo suburb page shows all of them):</p>
        <ul class="pros">
          <li><b>Yield</b>: annual rent ÷ price. Above your region's average means lower holding costs.</li>
          <li><b>Vacancy rate</b>: under 1.5% means tenants compete for rentals. ${(() => { const caps = Object.values(market.regions).filter((r) => r.capital && r.vacancy != null).sort((a, b) => a.vacancy - b.vacancy); const lo = caps.slice(0, 3); const same = lo.every((r) => r.vacancy === lo[0].vacancy); return `Right now the tightest capitals are ${lo.map((r) => r.name).join(', ').replace(/, ([^,]*)$/, ' and $1')}${same ? `, all at ${pct(lo[0].vacancy, 1)}` : ` (${lo.map((r) => pct(r.vacancy, 1)).join(', ')})`} (SQM Research, city-wide).`; })()}</li>
          <li><b>Population and income growth</b>: more people with more money means more demand for homes.</li>
          <li><b>Supply pipeline</b>: lots of new apartments being approved nearby caps rents and resale prices. See <a href="/new-builds" data-link>new builds by council</a>.</li>
          <li><b>Days on market and the price trend</b>: rising days on market means buyers have more bargaining power. See the <a href="/markets" data-link>market dashboard</a>.</li>
          <li><b>Affordability</b>: price relative to local incomes. Very high ratios depend on outside buyers.</li>
          <li><b>Risk</b>: flood and bushfire overlays (check the council and your insurer), heavy reliance on one employer, and high social-housing concentration.</li>
        </ul>
      </section>

      <section id="buy" class="section"><h2>6. Find, inspect and buy</h2>
        <div class="steps">
          <div class="card step"><h3>Shortlist properties</h3><p>Use listing sites, and pull each suburb's recent sales to know what things really sell for. Ownaroo's <a href="/property" data-link>price range tool</a> gives a price range for a typical home like the one you're looking at (not a valuation), the cash and repayments to buy it, and the investment numbers.</p></div>
          <div class="card step"><h3>Run the numbers</h3><p>Put each serious contender through the <a href="/analyse" data-link>2026 tax-change calculator</a>: all costs, the weekly shortfall after tax, a rate-rise stress test and the 10-year return. Walk away if it only works in the high-growth case.</p></div>
          <div class="card step"><h3>Check the property</h3><p>Get a building and pest inspection (about $400-800). For strata, get a strata report (about $250-400) covering levies, the sinking fund, defects and disputes. Ask a property manager for a rental appraisal before you buy.</p></div>
          <div class="card step"><h3>Have the contract reviewed</h3><p>A conveyancer or solicitor ($1,000-2,500) checks the title, zoning, easements, special conditions and the vendor statement. In most states you can make the offer "subject to finance" and "subject to building and pest".</p></div>
          <div class="card step"><h3>Negotiate or bid</h3><p>Private sale: offer below your walk-away price and negotiate. Auction: sales are unconditional, with no cooling-off period, so finance and inspections must be done beforehand. You'll usually pay a 10% deposit on the day. In NSW and QLD you must register to bid.</p></div>
          <div class="card step"><h3>Exchange and cooling off</h3><p>Once contracts are signed, cooling-off periods for private sales vary by state: NSW 5 business days, VIC 3, QLD 5, SA 2, ACT 5, NT 4. WA and TAS have none unless written into the contract. Pulling out usually costs 0.2-0.25% of the price.</p></div>
        </div>
      </section>

      <section id="settle" class="section"><h2>7. Settlement</h2>
        <p>Settlement usually happens 30-90 days after exchange. Before it: lock in the loan, arrange building insurance from exchange (or the date risk passes in your state), and do a pre-settlement inspection. Stamp duty is generally due at or before settlement. On the day, the lender pays the balance, the title transfers electronically (PEXA), and you get the keys. Appoint a property manager before settlement so a tenant can move in straight away. Management fees run about 5.5-9% of rent, plus letting fees.</p>
      </section>

      <section id="own" class="section"><h2>8. Owning an investment property</h2>
        <div class="grid g2">
          <div class="card flat tint"><h3>Tax deductions</h3><p class="note">Interest, council rates, water, strata, insurance, management fees, repairs, land tax and depreciation are deductible. Building depreciation is 2.5% a year of construction cost for buildings built after September 1987. Plant and equipment is only deductible if the property is new. Get a quantity surveyor's depreciation schedule (about $600-800). Improvements are capital, not repairs.</p></div>
          <div class="card flat tint"><h3>Ongoing costs</h3><p class="note">Budget for council rates, water, landlord insurance, strata if applicable, maintenance (about 0.5-1% of the value a year), property management, land tax above your state's threshold, and a few weeks of vacancy each year.</p></div>
        </div>
      </section>

      <section id="costs" class="section"><h2>9. Every cost, in one place</h2>
        <p>Using a ${aud(750000)} house bought by an investor with 20% down, a ${pct(rate, 2)} loan (the RBA average rate on new investor variable loans) and ${aud(620)}/wk rent:</p>
        <div class="tbl-wrap"><table><thead><tr><th>Cost</th>${sts.map((s) => `<th class="n">${s}</th>`).join('')}</tr></thead><tbody>
          <tr><td>Deposit (20%)</td>${sts.map(() => `<td class="n">${aud(150000)}</td>`).join('')}</tr>
          <tr><td>Stamp duty (investor)</td>${sts.map((s) => `<td class="n">${aud(stampDuty(s, 750000).duty)}</td>`).join('')}</tr>
          <tr><td>Legal, inspections, fees</td>${sts.map(() => `<td class="n">${aud(2500)}</td>`).join('')}</tr>
          <tr><td><b>Cash to buy</b></td>${sts.map((s) => `<td class="n"><b>${aud(152500 + stampDuty(s, 750000).duty)}</b></td>`).join('')}</tr>
          <tr><td>Monthly repayment (P&amp;I, 30 yrs)</td>${sts.map(() => `<td class="n">${aud(repayment(600000, rate, 30))}</td>`).join('')}</tr>
          <tr><td>Land tax a year (land ≈ 55%)</td>${sts.map((s) => `<td class="n">${aud(landTax(s, 412500, { perth: s === 'WA' }).tax)}</td>`).join('')}</tr>
        </tbody></table></div>
      </section>

      <section id="duty" class="section"><h2>10. Stamp duty by state</h2>
        <p>Stamp (transfer) duty is the biggest up-front cost after the deposit. Investors pay general rates; owner-occupiers and first home buyers may get concessions.</p>
        <div class="tbl-wrap"><table><thead><tr><th>Price</th>${sts.map((s) => `<th class="n">${s}</th>`).join('')}</tr></thead><tbody>
        ${prices.map((p) => `<tr><td>${aud(p)} investor</td>${sts.map((s) => `<td class="n">${aud(stampDuty(s, p).duty)}</td>`).join('')}</tr><tr><td class="muted">${aud(p)} first home (established)</td>${sts.map((s) => `<td class="n muted">${aud(stampDuty(s, p, { buyer: 'fhb' }).duty)}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
        <p class="fine" style="margin-top:8px">Sources: ${sts.map((s) => `<a href="${RULES.duty[s].source}" target="_blank" rel="noopener">${s}</a>`).join(' · ')}. Rules checked ${esc(RULES.asOf)}. Eligibility conditions apply to every concession. Foreign buyer surcharges are extra.</p>
      </section>

      <section id="landtax" class="section"><h2>11. Land tax by state</h2>
        <p>Land tax is charged every year on the land value of investment properties (your home is exempt). It's based on the total land you hold in each state, so a second or third property in the same state can push you into higher brackets.</p>
        <div class="tbl-wrap"><table><thead><tr><th>Land value</th>${sts.map((s) => `<th class="n">${s}</th>`).join('')}</tr></thead><tbody>
        ${[300000, 500000, 800000, 1200000, 2000000].map((v) => `<tr><td>${aud(v)}</td>${sts.map((s) => `<td class="n">${aud(landTax(s, v).tax)}</td>`).join('')}</tr>`).join('')}
        </tbody></table></div>
        <p class="fine" style="margin-top:8px">Individual owners, general rates. Tax-free thresholds: NSW $1,075,000, VIC $50,000, QLD $600,000, WA $300,000, SA $936,000, TAS $125,000, ACT none (every rented property pays), NT no land tax. WA metro adds the Metropolitan Region Improvement Tax. ACT figures are approximate.</p>
      </section>

      <section id="tax-2026" class="section"><h2>12. The 2026 tax changes: what they mean for you</h2>
        <div class="callout"><b>In force from 1 July 2027 (Treasury Laws Amendment (Tax Reform No. 1) Act 2026).</b> ${esc(RULES.reform.summary)}</div>
        <div class="tbl-wrap"><table><thead><tr><th>You bought…</th><th>Negative gearing</th><th>Capital gains tax on sale</th></tr></thead><tbody>
          <tr><td>Before 7:30pm AEST 12 May 2026</td><td>Continues, grandfathered</td><td>50% discount on gains to 30 June 2027; indexation + 30% minimum on gains after</td></tr>
          <tr><td>An established home, 12 May 2026 – 30 June 2027</td><td>Only until 30 June 2027, then losses carry forward against property income and gains</td><td>Same split as above</td></tr>
          <tr><td>An established home, from 1 July 2027</td><td>Losses quarantined from the start</td><td>Indexation + 30% minimum tax</td></tr>
          <tr><td>A new build (first owner)</td><td>Continues</td><td>Your choice: 50% discount or indexation</td></tr>
        </tbody></table></div>
        <p style="margin-top:12px"><b>What it means in practice:</b> for an established property the weekly cost you feel is now closer to the <i>before-tax</i> shortfall, because the salary tax refund stops after June 2027. The losses aren't wasted: they reduce tax on future rental profits and on the gain when you sell. They just arrive years later. That favours higher-yield properties, bigger deposits and new builds. Ownaroo's analyser applies all of this automatically.</p>
        <p class="fine">Sources: <a href="${RULES.reform.source}" target="_blank" rel="noopener">ATO</a> · <a href="${RULES.reform.factsheet}" target="_blank" rel="noopener">Budget factsheet</a>. General information only. See a registered tax agent about your situation.</p>
              <h3>Self-managed super funds</h3>
        <p>From 10 August 2026 (45 days after Royal Assent on 26 June), an SMSF can no longer enter a new limited recourse borrowing arrangement to buy residential property. Arrangements (including signed contracts) made before then are unaffected, and business real property can still be bought with borrowing.</p>
        <p class="note"><b>Details still being settled.</b> Treasury is still consulting on parts of the new rules, including exactly how gains either side of 1 July 2027 are measured, trusts, and part-year residents. Ownaroo models the law as passed and will update as the detail is finalised. Get tax advice for your own situation.</p>
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

      <section id="glossary" class="section"><h2>Glossary</h2><dl class="glossary"><dt>LVR (loan-to-value ratio)</dt><dd>The loan as a share of the property value. A $540,000 loan on a $600,000 home is a 90% LVR. Above 80%, lenders usually charge lenders mortgage insurance.</dd><dt>LMI (lenders mortgage insurance)</dt><dd>A one-off premium that protects the lender (not you) when you borrow more than 80%. It is usually added to the loan. The 5% Deposit Scheme and Help to Buy avoid it.</dd><dt>Gross yield</dt><dd>A year’s rent as a percentage of the price, before any costs. $600 a week on a $780,000 home is 4%.</dd><dt>IRR (internal rate of return)</dt><dd>The average yearly return on the cash you put in, after all costs, tax and the eventual sale. It lets you compare a property with other investments.</dd><dt>Negative gearing</dt><dd>When an investment property’s costs exceed its rent, the loss reduces tax on your other income. For established homes bought after 12 May 2026 this ends on 1 July 2027; losses then carry forward instead.</dd><dt>Serviceability buffer</dt><dd>Lenders check you could still repay at about 3 percentage points above the actual rate. It is why borrowing power is lower than repayments alone suggest.</dd><dt>Suburb score</dt><dd>Ownaroo’s 0–100 ranking of a suburb against every other suburb on yield, growth drivers, rental demand, affordability and stability. Recent price change is shown beside it but isn't scored. It rates the area, not a particular purchase.</dd><dt>Relative rank (deals)</dt><dd>How one purchase’s numbers compare with the typical home in every other suburb, run with the same deposit, rate and income. It is relative: a “top 15%” deal can still cost you money every week, so the weekly cost after tax and the term-deposit test are always shown first. It describes the numbers, not whether you should buy.</dd><dt>Percentile</dt><dd>Where a suburb sits against all others: the 80th percentile on yield means it beats 80% of suburbs.</dd><dt>SA2</dt><dd>An ABS statistical area of roughly 3,000 to 25,000 people, usually a group of neighbouring suburbs. Ownaroo uses SA2 population estimates for recent growth.</dd><dt>Price trend (momentum)</dt><dd>How much values changed over the past 12 months. Shown for information only: it is not part of the score, because suburb-level figures exist only in NSW, Victoria and SA, and past growth says little about the next year.</dd><dt>Vacancy rate</dt><dd>The share of rental homes empty and available. Under about 1.5% means tenants compete for homes and rents tend to rise.</dd></dl></section>

      <section id="faq" class="section"><h2>Questions</h2>
        ${[
          ["Is now a good time to buy?", "Nobody can time the market reliably. What you can control is buying well: a property that you can afford to hold through a rate rise, in a suburb with strong demand, at a price backed by recent sales. Check the live market page for current momentum in your city."],
          ["How much deposit do I need?", "Most lenders want 10-20% for investors, plus stamp duty and costs. Below 20% you pay LMI, which can be added to the loan."],
          ["Should I buy in my own name, jointly or in a trust?", "It depends on incomes, other assets and plans. Negative gearing benefits the higher earner; land tax thresholds differ for trusts. Get advice from an accountant before you sign, because changing names later triggers duty and CGT."],
          ["House or apartment?", "Land drives long-run growth, so houses have usually grown faster. Apartments have higher yields and lower entry prices but carry strata costs and supply risk. Townhouses and villas sit in between."],
          ["How accurate are Ownaroo's prices?", "Where a state publishes official suburb sales (VIC, SA, NSW), Ownaroo uses them. Elsewhere it's a calibrated model, typically within about 12-20% of the true median. Always check recent sales for the specific street and property."],
        ]
          .map(([q, a]) => `<details class="faq"><summary>${q}</summary><p class="note" style="margin-top:8px">${esc(a)}</p></details>`)
          .join('')}
      </section>
      <p class="fine section">General information only, not financial, tax or legal advice.</p>
    </article>
  </div>`;
  const art = main.querySelector('article');
  const toc_ = main.querySelector('.toc');
  toc_.innerHTML = `<a href="/guide" data-link class="${section ? '' : 'on'}">All topics</a>${GUIDE.map(([id, t]) => `<a href="/guide/${id}" data-link class="${id === section ? 'on' : ''}">${esc(toc.find(([x]) => x === id)?.[1] || t)}</a>`).join('')}`;
  if (!section) {
    // the guide's front page: every topic as a short card
    art.innerHTML = `<div class="grid g2 guide-index">${GUIDE.map(([id, t, d], i) => `<a class="card product" href="/guide/${id}" data-link><span class="faint mono">${String(i + 1).padStart(2, '0')}</span><h3>${esc(toc.find(([x]) => x === id)?.[1] || t)}</h3><p class="muted">${esc(d)}</p></a>`).join('')}</div><p class="fine section">General information only, not financial, tax or legal advice.</p>`;
    main.querySelectorAll('a[href^="#"]:not(.skip)').forEach((a) => { a.setAttribute('href', `/guide/${a.getAttribute('href').slice(1)}`); a.setAttribute('data-link', ''); });
    return;
  }
  const i = GUIDE.findIndex(([id]) => id === section);
  if (i < 0) {
    main.innerHTML = '<div class="empty"><h1>Guide page not found</h1><p><a href="/guide" data-link>All guide topics</a></p></div>';
    return;
  }
  const [, title, description] = GUIDE[i];
  setMeta({ title, description });
  art.querySelectorAll(':scope > section').forEach((x) => { if (x.id !== section) x.remove(); });
  const sec = art.querySelector(`#${CSS.escape(section)}`);
  sec?.querySelector('h2')?.remove();
  sec?.style.setProperty('margin-top', '0');
  art.querySelector(':scope > p.fine')?.remove();
  const prev = GUIDE[i - 1];
  const next = GUIDE[i + 1];
  art.insertAdjacentHTML('beforeend', `<nav class="guide-pager section" aria-label="More of the guide">${prev ? `<a class="btn" href="/guide/${prev[0]}" data-link>← ${esc(toc.find(([x]) => x === prev[0])?.[1] || prev[1])}</a>` : '<span></span>'}${next ? `<a class="btn" href="/guide/${next[0]}" data-link>${esc(toc.find(([x]) => x === next[0])?.[1] || next[1])} →</a>` : ''}</nav><p class="fine section">General information only, not financial, tax or legal advice.</p>`);
  const head = main.querySelector('.page-head');
  head.innerHTML = `<div class="eyebrow"><a href="/guide" data-link>Guide</a> · ${i + 1} of ${GUIDE.length}</div><h1>${esc(title)}</h1><p>${esc(description)}</p>`;
  // in-page links to other sections go to their pages
  art.querySelectorAll('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (sec?.querySelector(`#${CSS.escape(id)}`)) return;
    const owner = GUIDE.find(([g]) => g === id) ? id : SUB_ANCHORS[id];
    if (owner) { a.setAttribute('href', `/guide/${owner}`); a.setAttribute('data-link', ''); }
  });
  if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 60);
}

// anchors inside a section, for old links
const SUB_ANCHORS = { 'state-schemes': 'fhb' };
