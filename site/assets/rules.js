// Keyzing tax, duty and lending rules. Every figure is taken from the official source linked in
// `sources`, checked 26 September 2026. Brackets: [from, base, rate] where duty = base + rate x (value - from).
// `per100` means the state charges "per $100 or part", so the excess is rounded up to the next $100.

export const RULES = {
  asOf: '2026-09-26',

  duty: {
    NSW: {
      label: 'Transfer duty (Revenue NSW, 2026-27)',
      per100: true,
      investor: [
        [0, 0, 0.0125],
        [18000, 225, 0.015],
        [38000, 525, 0.0175],
        [103000, 1662, 0.035],
        [387000, 11602, 0.045],
        [1290000, 52237, 0.055],
        [3870000, 194137, 0.07],
      ],
      min: 20,
      fhb: { exemptTo: 800000, concessionTo: 1000000, landExemptTo: 350000, landConcessionTo: 450000 },
      source: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty',
    },
    VIC: {
      label: 'Land transfer duty (SRO Victoria)',
      investor: [
        [0, 0, 0.014],
        [25000, 350, 0.024],
        [130000, 2870, 0.06],
        [960000, 0, 0.055, 'flat'],
        [2000000, 110000, 0.065],
      ],
      owner: [
        [0, 0, 0.014],
        [25000, 350, 0.024],
        [130000, 2870, 0.05],
        [440000, 18370, 0.06],
      ],
      ownerTo: 550000, // PPR concession only up to $550,000; above that general rates apply
      fhb: { exemptTo: 600000, concessionTo: 750000 },
      source: 'https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-transfer-duty-non-principal-place-residence-current-rates',
    },
    QLD: {
      label: 'Transfer duty (Queensland Revenue Office)',
      per100: true,
      investor: [
        [0, 0, 0],
        [5000, 0, 0.015],
        [75000, 1050, 0.035],
        [540000, 17325, 0.045],
        [1000000, 38025, 0.0575],
      ],
      owner: [
        [0, 0, 0.01],
        [350000, 3500, 0.035],
        [540000, 10150, 0.045],
        [1000000, 30850, 0.0575],
      ],
      // First home concession (established): home concession duty minus a stepped amount; nil to $700k, nil benefit from $800k.
      fhbSteps: [
        [710000, 17350], [720000, 15615], [730000, 13880], [740000, 12145], [750000, 10410],
        [760000, 8675], [770000, 6940], [780000, 5205], [790000, 3470], [800000, 1735],
      ],
      fhbNewNoCap: true, // first home (new home) concession: nil duty, no value cap, contracts from 1 May 2025
      source: 'https://qro.qld.gov.au/duties/transfer-duty/calculate/rates/',
    },
    WA: {
      label: 'Transfer duty (RevenueWA)',
      per100: true,
      investor: [
        [0, 0, 0.019],
        [120000, 2280, 0.0285],
        [150000, 3135, 0.038],
        [360000, 11115, 0.0475],
        [725000, 28453, 0.0515],
      ],
      fhb: { exemptTo: 600000, concessionTo: 800000, concessionRate: 0.1615, landExemptTo: 450000, landConcessionTo: 550000, landRate: 0.2014 },
      source: 'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment',
    },
    SA: {
      label: 'Stamp duty on conveyances (RevenueSA)',
      per100: true,
      investor: [
        [0, 0, 0.01],
        [12000, 120, 0.02],
        [30000, 480, 0.03],
        [50000, 1080, 0.035],
        [100000, 2830, 0.04],
        [200000, 6830, 0.0425],
        [250000, 8955, 0.0475],
        [300000, 11330, 0.05],
        [500000, 21330, 0.055],
      ],
      fhbNewNoCap: true, // full relief for first home buyers of new homes / off-the-plan / vacant land, no cap (from 13 Feb 2025)
      source: 'https://www.revenuesa.sa.gov.au/stamp-duty-land/rate-of-stamp-duty',
    },
    TAS: {
      label: 'Property transfer duty (SRO Tasmania)',
      per100: true,
      investor: [
        [0, 50, 0],
        [3000, 50, 0.0175],
        [25000, 435, 0.0225],
        [75000, 1560, 0.035],
        [200000, 5935, 0.04],
        [375000, 12935, 0.0425],
        [725000, 27810, 0.045],
      ],
      note: 'The 100% first home buyer exemption for established homes ended for settlements after 30 June 2026.',
      source: 'https://www.sro.tas.gov.au/property-transfer-duties/rates-of-duty',
    },
    ACT: {
      label: 'Conveyance duty (ACT Revenue Office, rates from 1 July 2025)',
      per100: true,
      investor: [
        [0, 0, 0.012],
        [200000, 2400, 0.022],
        [300000, 4600, 0.034],
        [500000, 11400, 0.0432],
        [750000, 22200, 0.059],
        [1000000, 36950, 0.064],
        [1455000, 0, 0.0454, 'flat'],
      ],
      owner: [
        [0, 0, 0.0028],
        [260000, 728, 0.022],
        [300000, 1608, 0.034],
        [500000, 8408, 0.0432],
        [750000, 19208, 0.059],
        [1000000, 33958, 0.064],
        [1455000, 0, 0.0454, 'flat'],
      ],
      fhbFull: true, // Home Buyer Concession Scheme: price and income caps removed in the 2026-27 Budget
      source: 'https://www.revenue.act.gov.au/rates-and-property-charges/conveyance-duty-stamp-duty/conveyance-duty-for-non-commercial-property',
    },
    NT: {
      label: 'Stamp duty (Stamp Duty Act 1978 (NT) s 56)',
      formula: true, // V <= $525,000: D = 0.06571441 V^2 + 15V, V = value / 1000; then flat 4.95% / 5.75% / 5.95%
      source: 'https://legislation.nt.gov.au/api/sitecore/Act/PDF?id=11906',
    },
  },

  landTax: {
    NSW: { brackets: [[0, 0, 0], [1075000, 100, 0.016], [6571000, 88036, 0.02]], source: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/land-tax/understanding-land-tax/thresholds-and-rates' },
    VIC: {
      brackets: [[0, 0, 0], [50000, 500, 0], [100000, 975, 0], [300000, 1350, 0.003], [600000, 2250, 0.006], [1000000, 4650, 0.009], [1800000, 11850, 0.0165], [3000000, 31650, 0.0265]],
      source: 'https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-tax-current-rates',
    },
    QLD: { brackets: [[0, 0, 0], [600000, 500, 0.01], [1000000, 4500, 0.0165], [3000000, 37500, 0.0125], [5000000, 62500, 0.0175], [10000000, 150000, 0.0225]], source: 'https://qro.qld.gov.au/land-tax/calculate/individual/' },
    WA: {
      brackets: [[0, 0, 0], [300000, 300, 0], [420000, 300, 0.0025], [1000000, 1750, 0.009], [1800000, 8950, 0.018], [5000000, 66550, 0.02], [11000000, 186550, 0.0267]],
      mrit: { from: 300000, rate: 0.0014, note: 'Metropolitan Region Improvement Tax, Perth metro only' },
      source: 'https://www.wa.gov.au/organisation/department-of-treasury-and-finance/land-tax-assessment',
    },
    SA: { brackets: [[0, 0, 0], [936000, 0, 0.005], [1504000, 2840, 0.01], [2188000, 9680, 0.02], [3504000, 36000, 0.024]], source: 'https://www.revenuesa.sa.gov.au/land-tax/rates-and-thresholds' },
    TAS: { brackets: [[0, 0, 0], [125000, 50, 0.0045], [500000, 1737.5, 0.015]], source: 'https://www.sro.tas.gov.au/land-tax/rates-of-land-tax' },
    ACT: {
      fixed: 1778,
      brackets: [[0, 0, 0.0054], [150000, 810, 0.0064], [275000, 1610, 0.0124], [1000000, 10600, 0.0125], [2000000, 23100, 0.0126]],
      approx: true,
      note: 'Applies to every rented residential property in the ACT (no threshold), charged on average unimproved value.',
      source: 'https://www.revenue.act.gov.au/rates-and-property-charges/land-tax/how-land-tax-is-calculated',
    },
    NT: { none: true, note: 'The Northern Territory has no land tax.' },
  },

  // 2026-27 resident rates (ATO). Medicare levy 2% on top. Low income tax offset applied separately.
  incomeTax: {
    year: '2026-27',
    brackets: [[0, 0, 0], [18200, 0, 0.15], [45000, 4020, 0.3], [135000, 31020, 0.37], [190000, 51370, 0.45]],
    medicare: 0.02,
    lito: { max: 700, fullTo: 37500, step1To: 45000, step1Rate: 0.05, step2To: 66667, step2Rate: 0.015 },
    source: 'https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents',
  },

  // Treasury Laws Amendment (Tax Reform No. 1) Act 2026: announced 12 May 2026, in force 1 July 2027.
  reform: {
    announced: '2026-05-12',
    start: '2027-07-01',
    minCgtRate: 0.3,
    summary:
      'From 1 July 2027 negative gearing on residential property is limited to new builds. Established properties bought after 7:30pm AEST 12 May 2026 can offset rental losses against other income only until 30 June 2027; after that, losses are carried forward against residential property income and capital gains. The 50% CGT discount is replaced for gains accruing from 1 July 2027 by CPI indexation of the cost base and a 30% minimum tax rate. New builds keep negative gearing and can choose the 50% discount or indexation.',
    source: 'https://www.ato.gov.au/about-ato/new-legislation/in-detail/individuals/tax-reform-boosting-home-ownership-reforming-negative-gearing-and-capital-gains-tax',
    factsheet: 'https://budget.gov.au/content/factsheets/download/tax-explainers-negative-gearing-capital-gains-tax.pdf',
  },

  depreciation: {
    capitalWorks: 0.025, // Division 43: 2.5% a year of construction cost for residential buildings built after 15 Sep 1987
    plantNewOnly: true, // Division 40: second-hand plant in residential property bought after 9 May 2017 is not deductible
  },

  // Indicative LMI premium (% of loan), one major lender's full-doc table; LVR upper bounds x loan-size bands.
  lmi: {
    loanBands: [300000, 500000, 600000, 750000, 1000000],
    rows: [
      [81, [0.475, 0.568, 0.904, 0.904, 0.913]],
      [82, [0.485, 0.568, 0.904, 0.904, 0.913]],
      [83, [0.596, 0.699, 0.932, 1.09, 1.109]],
      [84, [0.662, 0.829, 0.96, 1.09, 1.146]],
      [85, [0.727, 0.969, 1.165, 1.333, 1.407]],
      [86, [0.876, 1.081, 1.258, 1.407, 1.463]],
      [87, [0.932, 1.146, 1.407, 1.631, 1.733]],
      [88, [1.062, 1.305, 1.463, 1.631, 1.752]],
      [89, [1.295, 1.621, 1.948, 2.218, 2.395]],
      [90, [1.463, 1.873, 2.18, 2.367, 2.516]],
      [91, [2.013, 2.618, 3.513, 3.783, 3.82]],
      [92, [2.013, 2.674, 3.569, 3.867, 3.932]],
      [93, [2.33, 3.028, 3.802, 4.081, 4.156]],
      [94, [2.376, 3.028, 3.802, 4.286, 4.324]],
      [95, [2.609, 3.345, 3.998, 4.613, 4.603]],
    ],
    stampDuty: { NSW: 0, VIC: 0.1, QLD: 0.09, SA: 0.11, WA: 0.1, ACT: 0.06, NT: 0.1, TAS: 0.1 },
    source: 'https://www.homeloanexperts.com.au/lenders-mortgage-insurance/lmi-premium-rates/',
  },

  // Lender serviceability: APRA expects a buffer of at least 3 percentage points over the loan rate.
  serviceability: { buffer: 3.0, rentShading: 0.8 },
};

export const STATES = {
  NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland', WA: 'Western Australia',
  SA: 'South Australia', TAS: 'Tasmania', ACT: 'Australian Capital Territory', NT: 'Northern Territory',
};

/**
 * Australian Government 5% Deposit Scheme (First Home Guarantee), from 1 October 2025:
 * no income caps, unlimited places, 5% deposit with no LMI (government guarantees the rest to 80%).
 * Price caps: capital city and regional centres / rest of state. Confirm with a participating lender.
 * Source: Housing Australia via MFAA, "Changes to the Australian Government 5% Deposit Scheme".
 */
export const HOME_GUARANTEE = {
  caps: { NSW: [1500000, 800000], VIC: [950000, 650000], QLD: [1000000, 700000], WA: [850000, 600000], SA: [900000, 500000], TAS: [700000, 550000], ACT: [1000000, 1000000], NT: [600000, 600000] },
  // regional centres that take the capital-city cap
  centres: ['Newcastle', 'Lake Macquarie', 'Wollongong', 'Shellharbour', 'Kiama', 'Greater Geelong', 'Gold Coast', 'Sunshine Coast'],
  capitals: ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'HBA', 'CBR', 'DRW'],
  source: 'https://www.mfaa.com.au/news/changes-to-the-australian-government-5-deposit-scheme-what-brokers-need-to-know',
};

/** 5% Deposit Scheme price cap for a suburb (index row with s, rg, lga). */
export function guaranteeCap(s) {
  const c = HOME_GUARANTEE.caps[s.s];
  if (!c) return 0;
  const metro = HOME_GUARANTEE.capitals.includes(s.rg) || HOME_GUARANTEE.centres.some((n) => (s.lga || '').startsWith(n));
  return metro ? c[0] : c[1];
}

/** RBA Monetary Policy Board decision days (announced 2.30pm AEST/AEDT on the second day). Source: RBA media release 25-02. */
export const RBA_DECISIONS = ['2026-02-03', '2026-03-17', '2026-05-05', '2026-06-16', '2026-08-11', '2026-09-29', '2026-11-03', '2026-12-08'];
/** Optional outlook for the next decision; shown only until that date passes. */
export const RBA_OUTLOOK = {
  date: '2026-09-29',
  text: 'Major-bank economists expect a 0.25-point rise to 4.60% (CommBank, September 2026). Market pricing changes daily: the ASX RBA Rate Tracker shows the current implied chance of a move.',
  links: [['CommBank economists', 'https://www.commbank.com.au/articles/newsroom/2026/09/rba-expected-to-lift-interest-rates-next-week.html'], ['ASX RBA Rate Tracker', 'https://www.asx.com.au/markets/trade-our-derivatives-market/futures-market/rba-rate-tracker']],
  source: 'https://www.commbank.com.au/articles/newsroom/2026/09/rba-expected-to-lift-interest-rates-next-week.html',
};

/**
 * Help to Buy (shared equity), Housing Australia: the government contributes up to 40% (new) or 30% (existing)
 * of the price; the buyer needs a 2% deposit and no LMI. Income limits and price caps apply; 10,000 places a year.
 * Sources: firsthomebuyers.gov.au (income limits), money.com.au Sept 2026 (price caps). Confirm with a participating lender.
 */
export const HELP_TO_BUY = {
  share: { existing: 0.3, new: 0.4 },
  deposit: 0.02,
  income: { single: 103000, joint: 165000 },
  caps: { NSW: [1300000, 800000], VIC: [950000, 650000], QLD: [1000000, 700000], WA: [850000, 600000], SA: [900000, 500000], TAS: [700000, 550000], ACT: [1000000, 1000000], NT: [600000, 600000] },
};

export function helpToBuyCap(s) {
  const c = HELP_TO_BUY.caps[s.s];
  if (!c) return 0;
  const metro = HOME_GUARANTEE.capitals.includes(s.rg) || HOME_GUARANTEE.centres.some((n) => (s.lga || '').startsWith(n));
  return metro ? c[0] : c[1];
}

/** First Home Owner Grant by state, September 2026 (see the buying guide). [amount, what it applies to]. Confirm with the state revenue office. */
export const FHOG = {
  NSW: [10000, 'new homes up to $600,000 (house and land up to $750,000)'],
  VIC: [10000, 'new homes up to $750,000'],
  QLD: [15000, 'new homes up to $750,000'],
  WA: [10000, 'new homes up to $800,000 (south of the 26th parallel)'],
  SA: [15000, 'new homes, no price cap'],
  TAS: [10000, 'new homes, no price cap'],
  NT: [50000, 'new homes ($10,000 for established homes)'],
  ACT: [0, 'no grant; a stamp duty concession instead'],
};

/**
 * Default price growth used in every projection (% a year). Base follows the major-bank consensus for 2026-27
 * (CommBank forecasts about 3% dwelling growth in both years); bear and bull are shown alongside with equal weight.
 */
export const GROWTH = { bear: 1, base: 3, bull: 5, source: 'CommBank economists, September 2026: about 3% dwelling price growth in 2026 and 2027' };
