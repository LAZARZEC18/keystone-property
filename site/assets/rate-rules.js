// Which advertised rates can be a headline "lowest rate". Shared by scripts/rates.mjs (summary) and the rates page.

// Lenders whose loans are only open to people in a particular job or organisation. Their rates stay in the full
// table with a "Members only" tag, but never headline the lowest-rate figures most people can't get.
export const MEMBERS_ONLY_LENDER = /^(Police Bank|Border Bank|Police Credit Union|BankVic|Fire Service Credit Union|Firefighters Mutual Bank|Teachers Mutual Bank|UniBank|Health Professionals Bank|Woolworths Team Bank)\b/i;
// Products restricted to an occupation even at an open lender.
export const MEMBERS_ONLY_PRODUCT = /\b(police|customs|essential worker|nurses?|teachers?|emergency services?|first responders?|defence force|health professionals?|members? only)\b/i;
// Not a loan to buy a home: equity loans, lines of credit, refinance-only offers.
export const NOT_PURCHASE = /equity loan|home equity|line of credit|equity access|refinanc/i;

export const membersOnly = (r) => MEMBERS_ONLY_LENDER.test(r.lender || '') || MEMBERS_ONLY_PRODUCT.test(r.product || '');
export const notPurchase = (r) => NOT_PURCHASE.test(r.product || '');

/**
 * Correct a rate row where the product NAME contradicts the lender's CDR fields: fixed products filed as variable,
 * interest-only filed as P&I, and LVR limits written into the name ("up to 60% LVR", "LVR <70") but missing from the
 * LVR fields. Keeps the stricter reading so nobody sees a rate they can't get.
 */
export function normaliseRate(r) {
  const n = String(r.product || '');
  const o = { ...r };
  if (o.type === 'variable' && /\bfixed\b/i.test(n) && !/\bvariable\b/i.test(n)) {
    o.type = 'fixed';
    const m = n.match(/(\d+(?:\.\d+)?)\s*(years?|yrs?|y\b)/i) || n.match(/(\d+)\s*(months?|mths?)/i);
    if (m) o.term = /mo|mth/i.test(m[2]) ? Math.round((+m[1] / 12) * 100) / 100 : +m[1];
  }
  if (o.repay === 'PI' && /interest[\s-]*only|\bI\/?O\b/i.test(n) && !/principal/i.test(n)) o.repay = 'IO';
  const range = n.match(/LVR\s*(\d{2})\s*%?\s*(?:-|–|to)\s*(\d{2})/i);
  const max = n.match(/(?:up to|<=?|≤|max(?:imum)?|under|below)\s*(\d{2})\s*%?\s*LVR/i) || n.match(/LVR\s*(?:of\s*)?(?:<=?|≤|up to|max(?:imum)?|under|below)?\s*(\d{2})\s*%?(?!\s*(?:-|–|to)\s*\d)/i) || n.match(/(\d{2})\s*%\s*LVR/i);
  const min = n.match(/(?:>|over|above|more than)\s*(\d{2})\s*%?\s*LVR/i) || n.match(/LVR\s*(?:>|over|above)\s*(\d{2})/i);
  if (range) {
    o.lvrMin = Math.max(o.lvrMin ?? 0, +range[1]);
    o.lvrMax = Math.min(o.lvrMax ?? 100, +range[2]);
  } else if (min) {
    o.lvrMin = Math.max(o.lvrMin ?? 0, +min[1]);
  } else if (max) {
    o.lvrMax = Math.min(o.lvrMax ?? 100, +max[1]);
  }
  return o;
}
