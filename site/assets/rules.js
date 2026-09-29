// Ownaroo tax, duty and lending rules. Every figure is taken from the official source linked in
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
  caps: { NSW: [1500000, 800000], VIC: [950000, 650000], QLD: [1000000, 700000], WA: [850000, 600000], SA: [900000, 500000], TAS: [700000, 550000], ACT: [1000000, 1000000], NT: [750000, 600000] },
  // regional centres that take the capital-city cap (Darwin takes NT's higher cap). Local councils in each listed region:
  // NSW: Newcastle and Lake Macquarie, Illawarra, Central Coast, Coffs Harbour-Grafton, Mid North Coast, Richmond-Tweed.
  centres: ['Newcastle', 'Lake Macquarie', 'Wollongong', 'Shellharbour', 'Kiama', 'Central Coast', 'Coffs Harbour', 'Bellingen', 'Clarence Valley',
    'Kempsey', 'Nambucca Valley', 'Port Macquarie-Hastings', 'Mid-Coast', 'Tweed', 'Byron', 'Ballina', 'Lismore', 'Richmond Valley', 'Kyogle',
    'Greater Geelong', 'Gold Coast', 'Sunshine Coast'],
  capitals: ['SYD', 'MEL', 'BNE', 'PER', 'ADL', 'HBA', 'CBR', 'DRW'],
  source: 'https://firsthomebuyers.gov.au/australian-government-5-percent-deposit-scheme/property-price-caps',
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
  date: '2026-11-03',
  text: 'After the 29 September rise, CommBank, Westpac and NAB see it as the last rise for now; ANZ expects one more in November, to 4.85%. Market pricing changes daily: the ASX RBA Rate Tracker shows the current implied chance of a move.',
  links: [['Bank forecasts (YBR, 29 Sept 2026)', 'https://ybr.com.au/articles/rba-lifts-cash-rate-to-460-september-2026'], ['ASX RBA Rate Tracker', 'https://www.asx.com.au/markets/trade-our-derivatives-market/futures-market/rba-rate-tracker']],
  source: 'https://ybr.com.au/articles/rba-lifts-cash-rate-to-460-september-2026',
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

/**
 * First Home Super Saver. Release can be requested up to 90 days after signing a contract (since 15 Sept 2024).
 * Concessional cap $32,500 from 1 July 2026. Deemed earnings use the ATO shortfall interest charge (SIC) rate by quarter.
 * Source: ATO FHSS, concessional cap and SIC rate pages.
 */
export const FHSS = {
  yearly: 15000, total: 50000, concessionalCap: 32500, afterSigningDays: 90,
  sic: [['2026-07-01', 7.43, 'July to September 2026'], ['2026-10-01', 7.51, 'October to December 2026']],
  source: 'https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/early-access-to-super/first-home-super-saver-scheme',
};
/** The published SIC rate for today's quarter, or null when the table has run out (callers then use the bank bill rate + 3). */
export function fhssRate(today = new Date().toISOString().slice(0, 10)) {
  const hit = FHSS.sic.filter(([d]) => d <= today).pop();
  if (!hit) return null;
  const next = new Date(hit[0]); next.setMonth(next.getMonth() + 3);
  return today < next.toISOString().slice(0, 10) ? { rate: hit[1], label: hit[2] } : null;
}

/** First Home Owner Grant by state, September 2026 (see the buying guide). [amount, what it applies to]. Confirm with the state revenue office. */
export const FHOG = {
  NSW: [10000, 'new homes up to $600,000 (house and land up to $750,000)'],
  VIC: [10000, 'new homes up to $750,000'],
  QLD: [30000, 'new homes up to $750,000 (continued in the 2026-27 Budget with no end date)'],
  WA: [10000, 'new homes up to $800,000 (south of the 26th parallel)'],
  SA: [15000, 'new homes, no price cap'],
  TAS: [20000, 'new homes, contracts from 1 July 2026 to 30 June 2027, no price cap'],
  NT: [50000, 'new homes, to 30 September 2027 (the $10,000 established-home grant ended 30 September 2025)'],
  ACT: [0, 'no grant; a stamp duty concession instead'],
};

/** First Home Owner Grant price cap for a new home (null = no cap; 0 = no grant). Mirrors FHOG above. */
export const FHOG_CAP = { NSW: 600000, VIC: 750000, QLD: 750000, WA: 800000, SA: null, TAS: null, NT: null, ACT: 0 };

/**
 * Default price growth used in every projection (% a year). Base follows the major-bank consensus for 2026-27
 * (CommBank forecasts about 3% dwelling growth in both years); bear and bull are shown alongside with equal weight.
 */
export const GROWTH = { bear: 1, base: 3, bull: 5, source: 'A cautious long-run assumption; CommBank economists (September 2026) expect about 3% dwelling price growth in 2026 and 2027' };

/** Mortgage stress: the one threshold used on every page. */
export const STRESS = {
  share: 0.3,
  label: '30% of your before-tax income',
  note: 'Repayments above 30% of gross (before-tax) household income are widely treated as mortgage stress. Ownaroo uses this one threshold on every page.',
};
/**
 * Compulsory HELP (HECS) repayments, 2026-27 marginal system (ATO). Lenders count this as a monthly commitment worked
 * out from income, not from the balance owed, so the tools ask whether you have a study debt, not how much.
 */
export const HELP_REPAY = { year: '2026-27', min: 69528, t2: 129717, base2: 9028, r1: 0.15, r2: 0.17, top: 186051, rTop: 0.1, source: 'https://www.ato.gov.au/individuals-and-families/study-and-training-support-loans/study-and-training-loan-repayment-thresholds-and-rates' };
export function helpRepayment(income) {
  const h = HELP_REPAY;
  if (!income || income <= h.min) return 0;
  if (income >= h.top) return income * h.rTop;
  if (income <= h.t2) return (income - h.min) * h.r1;
  return h.base2 + (income - h.t2) * h.r2;
}
/** Keystart (WA Government lender) Low Deposit Home Loan: 2% deposit, no LMI. keystart.com.au, checked Sept 2026. */
export const KEYSTART = { cap: 860000, income: { single: 155000, couple: 228000 }, rate: 7.85, rateAsOf: 'September 2026', asOf: '15 April 2026', source: 'https://www.keystart.com.au/loans/low-deposit-home-loan' };

/** Lenders assess a credit card at about 3% of its limit a month, whether or not it's used. */
export const CARD_LIMIT_RATE = 0.03;

/** Comfortable repayments per week for a gross yearly income. */
export const comfortableWeekly = (grossIncome) => (grossIncome * STRESS.share) / 52;

/**
 * Typical yearly running costs for an investment home, by state: council rates, water service charges and landlord
 * insurance (building + landlord cover). Rough state-wide starting points; replace them with the property's own bills.
 * Insurance is higher in QLD and the NT for cyclone and flood cover; ACT rates are high because they replace stamp duty.
 */
export const STATE_COSTS = {
  NSW: { council: 1700, water: 1200, insHouse: 2000, insUnit: 550 },
  VIC: { council: 2100, water: 900, insHouse: 1700, insUnit: 500 },
  QLD: { council: 2300, water: 1300, insHouse: 2600, insUnit: 700 },
  WA: { council: 2000, water: 1400, insHouse: 1700, insUnit: 500 },
  SA: { council: 1900, water: 1100, insHouse: 1600, insUnit: 500 },
  TAS: { council: 1800, water: 1200, insHouse: 1500, insUnit: 500 },
  ACT: { council: 3200, water: 800, insHouse: 1600, insUnit: 500 },
  NT: { council: 1900, water: 1000, insHouse: 3800, insUnit: 1200 },
};
export const runningCosts = (state, type) => {
  const c = STATE_COSTS[state] || STATE_COSTS.NSW;
  return { council: c.council, waterIns: c.water + (type === 'u' ? c.insUnit : c.insHouse) };
};

/**
 * State-run lenders and shared-equity programs for first home buyers (on top of the federal schemes).
 * Figures are only given where the program's own site states them; everything else links there. Checked September 2026.
 */
export const STATE_SCHEMES = {
  WA: [
    { name: 'Keystart Low Deposit Loan', text: 'The WA Government’s home lender: from a 2% deposit with no lenders mortgage insurance, for homes up to $860,000. Income limits of $155,000 (single) and $228,000 (couples and families) apply from 15 April 2026, higher in the Pilbara and Kimberley, and Keystart’s variable rate is usually higher than the major banks’. Choose it under Deposit to see what it does for you.', url: 'https://www.keystart.com.au/loans/low-deposit-home-loan' },
    { name: 'Keystart shared equity (Urban Connect, Shared Ownership)', text: 'The state takes a share of the home (Urban Connect up to 35% or $250,000, for homes near transport), so you borrow less. Separate income and price limits.', url: 'https://www.keystart.com.au/' },
  ],
  SA: [
    { name: 'HomeStart Finance', text: 'The SA Government’s home lender, with no lenders mortgage insurance: a Low Deposit Loan from 3% for an existing home, the HomeStart Loan from 5%, a Graduate Loan from 2%, and a shared-equity option.', url: 'https://www.homestart.com.au/home-loans' },
  ],
  TAS: [
    { name: 'MyHome shared equity (Homes Tasmania)', text: 'Homes Tasmania owns part of the home so you need a smaller deposit and loan. Income and price limits apply.', url: 'https://www.homestasmania.com.au/' },
  ],
  NT: [
    { name: 'HomeBuild Access and HomeGrown Territory Grant', text: 'Low-deposit and shared-equity loans from the Territory Government, and a grant for buying or building a new home.', url: 'https://nt.gov.au/property/home-owner-assistance' },
  ],
  QLD: [
    { name: 'Queensland Housing Finance Loan', text: 'A government loan for people who can afford repayments but can’t get a bank loan, from a small deposit. Eligibility is tested.', url: 'https://www.qld.gov.au/housing/buying-owning-home/home-buyers-financial-help/government-home-loans/low-deposit-home-loan' },
  ],
  VIC: [
    { name: 'Victorian Homebuyer Fund (closed)', text: 'The state shared-equity fund is closed to new applicants. Victorian buyers now use the federal Help to Buy scheme and the state first home duty exemption.', url: 'https://www.sro.vic.gov.au/about-us/our-organisation/closed-taxes-levies-and-grants/victorian-homebuyer-fund' },
  ],
  NSW: [],
  ACT: [
    { name: 'ACT Home Buyer Concession Scheme', text: 'No stamp duty on a home to live in, at any price, from 1 July 2026, for first home buyers and anyone who hasn’t owned property in the last five years (Ownaroo’s duty figures apply it). You must live there for at least 12 months. No state low-deposit lender.', url: 'https://www.revenue.act.gov.au/home-buyer-assistance/home-buyer-concession-scheme/about-the-home-buyer-concession-scheme' },
  ],
};
