// Checks for the tenth review: current rules, rate defaults, rate-feed parsing, deal labels and the 2027 split.
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse } from '../site/assets/engine.js';
import { guaranteeCap, FHOG, FHSS, fhssRate, HOME_GUARANTEE } from '../site/assets/rules.js';
import { typicalRate } from '../site/assets/data.js';
import { lvrFromName, normaliseRate, isNational, notPurchase } from '../site/assets/rate-rules.js';
import { productExtras } from '../scripts/rates.mjs';

test('first home rules are current', () => {
  assert.equal(FHSS.concessionalCap, 32500);
  assert.equal(FHSS.afterSigningDays, 90);
  assert.deepEqual(fhssRate('2026-09-29'), { rate: 7.43, label: 'July to September 2026' });
  assert.equal(fhssRate('2026-10-01').rate, 7.51);
  assert.equal(FHOG.QLD[0], 30000);
  assert.equal(FHOG.TAS[0], 20000);
  assert.deepEqual(HOME_GUARANTEE.caps.NT, [750000, 600000]);
  assert.equal(guaranteeCap({ s: 'NT', rg: 'DRW', lga: 'Darwin' }), 750000);
  assert.equal(guaranteeCap({ s: 'NT', rg: 'RNT', lga: 'Alice Springs' }), 600000);
  for (const lga of ['Central Coast', 'Coffs Harbour', 'Port Macquarie-Hastings', 'Tweed']) assert.equal(guaranteeCap({ s: 'NSW', rg: 'RNSW', lga }), 1500000, lga);
  assert.equal(guaranteeCap({ s: 'NSW', rg: 'RNSW', lga: 'Mid-Western' }), 800000);
});

test('the default rate adds RBA moves made after the latest monthly average', () => {
  const rba = { actual: { newOOVariable: [['2026-07-31', 6.24]] }, cashRate: { decisions: [{ date: '2026-05-06', change: 25 }, { date: '2026-09-30', change: 25 }] } };
  const t = typicalRate(rba, 'OO');
  assert.equal(t.rate, 6.49);
  assert.equal(t.base, 6.24);
  assert.match(t.label, /July average.*6\.24%.*0\.25-point rise/);
});

test('LVR bands in product names override the feed', () => {
  assert.deepEqual(lvrFromName('Basic Variable HL LVR >60-70'), { min: 60, max: 70 });
  assert.deepEqual(lvrFromName('myBlue Fix (60.01 - 80.00% LVR)'), { min: 60, max: 80 });
  assert.deepEqual(lvrFromName('Classic Home Loan Variable 80-90 LVR PI'), { min: 80, max: 90 });
  assert.deepEqual(lvrFromName('Offset Home Loan LVR >80'), { min: 80, max: null });
  const r = normaliseRate({ lender: 'P&N Bank', product: 'Basic Variable HL LVR >60-70', lvrMin: null, lvrMax: null, type: 'variable', purpose: 'OO', repay: 'PI' });
  assert.ok(r.lvrMin > 60 && r.lvrMin < 61);
  assert.equal(r.lvrMax, 70);
});

test('open to anyone includes customer-owned banks that lend Australia-wide; refinance offers are not purchase loans', () => {
  assert.ok(isNational({ lender: 'Greater Bank' }));
  assert.ok(isNational({ lender: 'Newcastle Permanent' }));
  assert.ok(!isNational({ lender: 'BOQ Specialist' }));
  assert.ok(notPurchase({ product: 'Refi Special Owner Occupied' }));
});

test('missing offset or fees are unknown, never "no" or $0', () => {
  assert.deepEqual(productExtras({}), { offset: null, redraw: null, annualFee: null, upfrontFee: null });
  const x = productExtras({ features: [{ featureType: 'OFFSET' }], fees: [{ feeType: 'PERIODIC', amount: '395.00', additionalValue: 'P1Y', name: 'Package Fee' }, { feeType: 'UPFRONT', amount: '445', name: 'Loan Establishment Fee' }, { feeType: 'UPFRONT', amount: '204', name: 'Reg of Mortgage fee - SA' }] });
  assert.deepEqual(x, { offset: 1, redraw: 0, annualFee: 395, upfrontFee: 445 });
});

test('an established home bought now shows its weekly cost before and after 1 July 2027', () => {
  const base = { state: 'WA', price: 900000, weeklyRent: 650, deposit: 0.2, ratePct: 6.65, income: 120000, purchaseDate: '2026-09-29', growth: 3 };
  const est = analyse({ ...base, newBuild: false }).summary;
  assert.ok(est.split2027);
  assert.ok(est.split2027.after < est.split2027.before, 'losing the salary offset costs more each week');
  assert.equal(analyse({ ...base, newBuild: true, buildYear: 2026 }).summary.split2027, null);
});

test('interest-only ends and the repayment jumps', () => {
  const s = analyse({ state: 'VIC', price: 800000, weeklyRent: 600, deposit: 0.2, ratePct: 6.5, interestOnly: true, income: 150000 }).summary;
  assert.equal(s.interestOnlyYears, 5);
  assert.ok(s.monthlyAfterIo > s.monthlyRepayment + 500);
});
