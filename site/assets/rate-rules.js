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
