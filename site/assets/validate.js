// One set of input limits for every calculator. Values from the form and from the page link are checked the same way:
// anything outside these ranges stops the calculation and says which field to fix. Nothing is silently replaced.

const money = (v) => `$${Math.round(v).toLocaleString('en-AU')}`;
const plain = (v) => String(v);

/** Limits per field. unit formats the bound in messages. */
export const FIELDS = {
  price: { label: 'Purchase price', min: 50000, max: 20000000, fmt: money },
  rent: { label: 'Weekly rent', min: 0, max: 10000, fmt: money },
  deposit: { label: 'Deposit', min: 2, max: 100, fmt: (v) => `${v}%` },
  rate: { label: 'Interest rate', min: 1, max: 20, fmt: (v) => `${v}%` },
  term: { label: 'Loan term', min: 5, max: 40, fmt: (v) => `${v} years` },
  income: { label: 'Income', min: 0, max: 5000000, fmt: money },
  income2: { label: 'Other income', min: 0, max: 5000000, fmt: money },
  savings: { label: 'Savings', min: 0, max: 20000000, fmt: money },
  debts: { label: 'Other debts', min: 0, max: 100000, fmt: money },
  deps: { label: 'Dependants', min: 0, max: 10, fmt: plain, int: true },
  growth: { label: 'Capital growth', min: -10, max: 15, fmt: (v) => `${v}%` },
  rentGrowth: { label: 'Rent growth', min: -10, max: 15, fmt: (v) => `${v}%` },
  cpi: { label: 'Inflation', min: 0, max: 15, fmt: (v) => `${v}%` },
  vacancy: { label: 'Vacancy', min: 0, max: 52, fmt: (v) => `${v} weeks` },
  mgmt: { label: 'Property management', min: 0, max: 20, fmt: (v) => `${v}%` },
  hold: { label: 'Years before selling', min: 1, max: 30, fmt: (v) => `${v} years`, int: true },
  built: { label: 'Year built', min: 1800, max: 2031, fmt: plain, int: true },
  council: { label: 'Council rates', min: 0, max: 50000, fmt: money },
  strata: { label: 'Strata levies', min: 0, max: 100000, fmt: money },
  share: { label: 'Your share', min: 1, max: 99, fmt: (v) => `${v}%` },
  otherland: { label: 'Other investment land', min: 0, max: 100000000, fmt: money },
  otherRental: { label: 'Rental profit from other properties', min: 0, max: 5000000, fmt: money },
  weekly: { label: 'Max weekly repayment', min: 50, max: 20000, fmt: money },
  pop: { label: 'Minimum population', min: 0, max: 1000000, fmt: plain, int: true },
  beds: { label: 'Bedrooms', min: 0, max: 10, fmt: plain, int: true },
  baths: { label: 'Bathrooms', min: 1, max: 8, fmt: plain, int: true },
  cars: { label: 'Car spaces', min: 0, max: 8, fmt: plain, int: true },
  land: { label: 'Land size', min: 20, max: 200000, fmt: (v) => `${v} m²` },
  myrent: { label: 'Rent you pay now', min: 0, max: 10000, fmt: money },
  monthly: { label: 'Monthly saving', min: 0, max: 100000, fmt: money },
  pctReturn: { label: 'Rate', min: 0, max: 20, fmt: (v) => `${v}%` },
  ownCost: { label: 'Owner costs', min: 0, max: 10, fmt: (v) => `${v}%` },
  super: { label: 'Extra to super', min: 0, max: 50000, fmt: money },
  years10: { label: 'Years', min: 1, max: 10, fmt: plain, int: true },
  asking: { label: 'Asking price', min: 50000, max: 50000000, fmt: money },
};

/**
 * Check raw values (strings from a form or a URL) against FIELDS.
 * spec maps a key in `raw` to a field name, or to { field, optional: true } when an empty value is allowed.
 * Returns { ok, errors: { key: message }, values: { key: number|null } }.
 */
export function check(raw, spec) {
  const errors = {};
  const values = {};
  for (const [key, s] of Object.entries(spec)) {
    const { field, optional = false } = typeof s === 'string' ? { field: s } : s;
    const f = FIELDS[field];
    const r = raw[key];
    const empty = r === undefined || r === null || String(r).trim() === '';
    if (empty) {
      values[key] = null;
      if (!optional) errors[key] = `${f.label}: enter a number.`;
      continue;
    }
    const v = Number(String(r).replace(/[$,\s]/g, ''));
    if (!Number.isFinite(v)) errors[key] = `${f.label}: "${String(r).slice(0, 20)}" isn't a number.`;
    else if (v < f.min) errors[key] = f.min === 0 ? `${f.label} can't be negative.` : `${f.label} must be at least ${f.fmt(f.min)}.`;
    else if (v > f.max) errors[key] = `${f.label} can't be more than ${f.fmt(f.max)}.`;
    else if (f.int && !Number.isInteger(v)) errors[key] = `${f.label} must be a whole number.`;
    values[key] = Number.isFinite(v) ? v : null;
  }
  return { ok: !Object.keys(errors).length, errors, values };
}

/** A URL value for a form field: the raw string when present (even "0" or "-5"), otherwise the default. */
export const fromQuery = (query, key, def = '') => (query[key] !== undefined ? query[key] : def);

/**
 * Show errors on the form: mark each input and list the problems in `box`.
 * ids maps a key to the input element's selector. Returns true when there were errors.
 */
export function showErrors(root, errors, ids, box) {
  root.querySelectorAll('[aria-invalid="true"]').forEach((el) => el.removeAttribute('aria-invalid'));
  root.querySelectorAll('.field-err').forEach((el) => el.remove());
  const keys = Object.keys(errors);
  for (const k of keys) {
    const el = ids[k] && root.querySelector(ids[k]);
    if (!el) continue;
    el.setAttribute('aria-invalid', 'true');
    el.insertAdjacentHTML('afterend', `<span class="field-err" role="alert">${errors[k].replace(/</g, '&lt;')}</span>`);
  }
  if (box) {
    box.innerHTML = keys.length
      ? `<div class="card callout warn-box"><b>Check ${keys.length === 1 ? 'this input' : 'these inputs'} before Keyzing runs the numbers</b><ul>${keys.map((k) => `<li>${errors[k].replace(/</g, '&lt;')}</li>`).join('')}</ul><p class="fine" style="margin:6px 0 0">Nothing is calculated until every value is in a realistic range, so a result always matches what you entered.</p></div>`
      : '';
  }
  return keys.length > 0;
}
