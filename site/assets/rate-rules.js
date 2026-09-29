// Which advertised rates can be a headline "lowest rate". Shared by scripts/rates.mjs (summary) and the rates page.

// Lenders whose loans are only open to people in a particular job or organisation. Their rates stay in the full
// table with a "Members only" tag, but never headline the lowest-rate figures most people can't get.
export const MEMBERS_ONLY_LENDER = /^(Police Bank|Border Bank|Police Credit Union|BankVic|Fire Service Credit Union|Firefighters Mutual Bank|Teachers Mutual Bank|UniBank|Health Professionals Bank|Woolworths Team Bank)\b/i;
// Products restricted to an occupation even at an open lender.
export const MEMBERS_ONLY_PRODUCT = /\b(police|customs|essential worker|nurses?|teachers?|emergency services?|first responders?|defence force|health professionals?|members? only)\b/i;
// Not a loan to buy a home: equity loans, lines of credit, refinance-only offers.
export const NOT_PURCHASE = /equity loan|home equity|line of credit|equity access|refinanc|\brefi\b|switch(ing)? offer/i;

export const membersOnly = (r) => MEMBERS_ONLY_LENDER.test(r.lenderRaw || r.lender || '') || MEMBERS_ONLY_LENDER.test(r.lender || '') || MEMBERS_ONLY_PRODUCT.test(r.product || '');
export const notPurchase = (r) => NOT_PURCHASE.test(r.product || '');

/**
 * Correct a rate row where the product NAME contradicts the lender's CDR fields: fixed products filed as variable,
 * interest-only filed as P&I, and LVR limits written into the name ("up to 60% LVR", "LVR <70") but missing from the
 * LVR fields. Keeps the stricter reading so nobody sees a rate they can't get.
 */
// Legal names in the bank feeds -> the names people know
const LENDER_NAMES = { 'NRMA HOME LOANS': 'NRMA Home Loans', 'TMCU': 'TMCU', 'GMCU': 'GMCU', 'CAIRNS BANK': 'Cairns Bank', 'BNK BANK (GOLDFIELDS MONEY/BCHL)': 'BNK Bank', 'QANTAS MONEY BASIC/OFFSET HOME LOANS': 'Qantas Money', 'AMP - MY AMP': 'AMP', 'ME BANK - ME GO': 'ME Bank', 'COMMFCU': 'Community First Bank', 'BANKWAW': 'Bank WAW', 'CENTRAL WEST CUL': 'Central West Credit Union', 'NATIONAL AUSTRALIA BANK': 'NAB', 'COMMONWEALTH BANK OF AUSTRALIA': 'CommBank', 'COMMONWEALTH BANK': 'CommBank', 'WESTPAC BANKING CORPORATION': 'Westpac', 'AUSTRALIA AND NEW ZEALAND BANKING GROUP': 'ANZ', 'BANK OF QUEENSLAND': 'Bank of Queensland' };
const SHORT_UPPER = new Set(['NAB', 'ANZ', 'ING', 'AMP', 'BOQ', 'ME', 'HSBC', 'LVR', 'P&I', 'IO', 'SMSF', 'ABN', 'RAMS', 'UBANK', 'BCU', 'QBANK', 'CUA', 'IMB', 'P1', 'P2', 'INV', 'OO', 'SMSF', 'LVR', 'CUL', 'BOQ', 'AMP', 'ANZ', 'ING', 'NAB', 'CBA', 'RACQ', 'P&I', 'I/O']);
const titleCase = (n) => n.toLowerCase().replace(/(^|[\s/(-])([a-z][a-z&']*)/g, (m, pre, w) => pre + (SHORT_UPPER.has(w.toUpperCase()) ? w.toUpperCase() : ['and', 'of', 'for', 'with', 'to', 'the', 'or', 'in'].includes(w) && pre ? w : w.charAt(0).toUpperCase() + w.slice(1)));
const shouty = (n) => n === n.toUpperCase() && /[A-Z]{4}/.test(n);
/** 'NATIONAL AUSTRALIA BANK' -> 'NAB'; other all-caps names in title case. */
export function lenderName(raw = '') {
  const n = String(raw).trim();
  const clean = n.replace(/\s+(Limited|Ltd\.?|Pty\.? Ltd\.?)$/i, '').replace(/\s*\(Australia\)$/i, '');
  if (LENDER_NAMES[clean.toUpperCase()]) return LENDER_NAMES[clean.toUpperCase()];
  if (shouty(clean)) return titleCase(clean);
  // 'ING BANK' -> 'ING Bank': fix long all-caps words, keep known acronyms
  return clean.replace(/\b[A-Z]{4,}\b/g, (w) => (SHORT_UPPER.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()));
}
/** 'STREET SMART VARIABLE HOME LOAN SPECIAL' -> 'Street Smart Variable Home Loan Special'; drops ': Our lowest…' marketing text and a repeated lender name. */
export function productName(raw = '', lender = '') {
  let n = String(raw).trim().replace(/\s+/g, ' ');
  n = n.replace(/\s+[:|–—-]\s+(our|the|get|enjoy|save|great|low(est)?|special offer|limited|new customers?)\b.*?(?=\s*\((?:owner|investor|investment|oo|inv)[^)]*\)\s*$|$)/i, '');
  // word by word, so 'STREET SMART VARIABLE - INVESTMENT (Principal and Interest)' is fixed too
  const capsWords = (n.match(/\b[A-Z][A-Z'&]{2,}\b/g) || []).filter((w) => !SHORT_UPPER.has(w));
  if (capsWords.length) {
    n = n.replace(/\b[A-Z][A-Z'&]{2,}\b/g, (w, i) => (SHORT_UPPER.has(w) ? w : i && ['AND', 'FOR', 'WITH', 'THE'].includes(w) ? w.toLowerCase() : w.charAt(0) + w.slice(1).toLowerCase()));
  }
  const l = lenderName(lender);
  if (l && n.toLowerCase().startsWith(`${l.toLowerCase()} `) && n.length > l.length + 8) n = n.slice(l.length + 1);
  return n.charAt(0).toUpperCase() + n.slice(1);
}

const N = '(\\d{2}(?:\\.\\d+)?)';
/** LVR band written in a product name: 'LVR >60-70', '(60.01 - 80.00% LVR)', '60-80LVR', 'LVR<80%', 'up to 60% LVR', '>90 LVR'. */
export function lvrFromName(name = '') {
  const n = String(name);
  if (!/LVR|loan[- ]to[- ]value/i.test(n)) return null;
  const pick = (re) => n.match(new RegExp(re, 'i'));
  const range = pick(`LVR\\s*[:>]?\\s*${N}\\s*%?\\s*(?:-|–|to)\\s*${N}`) || pick(`>?\\s*${N}\\s*%?\\s*(?:-|–|to)\\s*${N}\\s*%?\\s*LVR`);
  if (range) return { min: Math.round(+range[1]), max: Math.round(+range[2]) };
  const min = pick(`(?:>|over|above|more than)\\s*${N}\\s*%?\\s*LVR`) || pick(`LVR\\s*(?:>|over|above)\\s*${N}`);
  if (min) return { min: Math.round(+min[1]), max: null };
  const max = pick(`(?:up to|<=?|≤|max(?:imum)?|under|below)\\s*${N}\\s*%?\\s*LVR`) || pick(`LVR\\s*(?:of\\s*)?(?:<=?|≤|up to|max(?:imum)?|under|below)?\\s*${N}\\s*%?`) || pick(`${N}\\s*%?\\s*LVR`);
  if (max) return { min: null, max: Math.round(+max[1]) };
  return null;
}

export function normaliseRate(r) {
  const n = String(r.product || '');
  const o = { ...r, lenderRaw: r.lender, lender: lenderName(r.lender), product: productName(r.product, r.lender) };
  if (o.type === 'variable' && /\bfixed\b/i.test(n) && !/\bvariable\b/i.test(n)) {
    o.type = 'fixed';
    const m = n.match(/(\d+(?:\.\d+)?)\s*(years?|yrs?|y\b)/i) || n.match(/(\d+)\s*(months?|mths?)/i);
    if (m) o.term = /mo|mth/i.test(m[2]) ? Math.round((+m[1] / 12) * 100) / 100 : +m[1];
  }
  // a first home buyer product filed as an investment loan is a feed error: keep it out of the lists
  if (o.purpose === 'INV' && /first home/i.test(n)) o.suspect = true;
  if (o.repay === 'PI' && /interest[\s-]*only|\bI\/?O\b/i.test(n) && !/principal/i.test(n)) o.repay = 'IO';
  // a variable loan's comparison rate far below its own rate is a feed error (it belongs to another tier): don't show it
  if (o.comparison != null && o.type === 'variable' && o.comparison < o.rate - 0.25) {
    o.comparison = null;
    o.cmpBad = true;
  }
  // an LVR band written in the product name is more specific than the feed's tiers, so it wins
  const band = lvrFromName(n);
  if (band) {
    o.lvrFeed = [o.lvrMin, o.lvrMax];
    const [fMin, fMax] = o.lvrFeed;
    if (band.min != null) {
      o.lvrMin = band.min + 0.01; // "60-70" and ">60" mean above 60%
      o.lvrMax = band.max ?? (fMax != null && fMax > band.min ? fMax : null);
    } else {
      o.lvrMax = band.max;
      o.lvrMin = fMin != null && fMin < band.max ? fMin : 0;
    }
  }
  return o;
}

// Lenders anyone in Australia can apply to, online, by phone or through brokers, with no job, employer or regional
// membership test. Includes customer-owned banks that lend Australia-wide (joining is part of opening the loan).
export const NATIONAL_LENDER = /^(CommBank|Westpac|NATIONAL AUSTRALIA BANK|NAB|ANZ|ANZ Plus|ING|Macquarie|St\.?George|Bank of Melbourne|BankSA|Bankwest|Suncorp|Bank of Queensland|BOQ\b(?! Specialist)|Bendigo|UBank|Up$|ME Bank|AMP|Virgin Money|Great Southern Bank|Unloan|Tiimely|Qantas Money|Aussie|Liberty|Bank Australia|Beyond Bank|HSBC|Citi|Athena|Bank of us|Greater Bank|Newcastle Permanent|People First|Heritage|People'?s Choice|IMB|Hume Bank|Bank First|MyState|Auswide|Qudos|Regional Australia Bank|BCU)/i;
export const isNational = (r) => NATIONAL_LENDER.test(r.lender || '') || NATIONAL_LENDER.test(r.lenderRaw || '');
/**
 * Customer-owned and regional lenders (credit unions, mutuals, regional banks): you usually join as a member, and some
 * lend only in their region or through branches. Their rates are real but may not be open to a buyer elsewhere.
 */
export const checkEligibility = (r) => !isNational(r) && !membersOnly(r);
