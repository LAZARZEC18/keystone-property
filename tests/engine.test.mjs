import test from 'node:test';
import assert from 'node:assert/strict';
import { stampDuty, landTax, incomeTax, lmi, repayment, analyse, capitalGainsTax, IRR, verdict, borrowingPower, ntDuty } from '../site/assets/engine.js';

const near = (a, b, tol = 1) => assert.ok(Math.abs(a - b) <= tol, `${a} != ${b}`);

test('investor stamp duty on $800,000 in every state matches the official schedules', () => {
  const want = { NSW: 30187, VIC: 43070, QLD: 29025, WA: 32316, SA: 37830, TAS: 31185, ACT: 25150 };
  for (const [st, v] of Object.entries(want)) near(stampDuty(st, 800000).duty, v, 1);
  near(stampDuty('NT', 500000).duty, 23929, 1);
  near(ntDuty(600000), 29700, 1);
});

test('VIC switches to 5.5% of the whole value above $960k and 6.5% marginal above $2m', () => {
  near(stampDuty('VIC', 1000000).duty, 55000, 1);
  near(stampDuty('VIC', 2500000).duty, 110000 + 0.065 * 500000, 1);
});

test('NSW premium property duty above $3.87m', () => {
  near(stampDuty('NSW', 4000000).duty, 194137 + 0.07 * 130000, 1);
});

test('first home buyer concessions', () => {
  assert.equal(stampDuty('NSW', 750000, { buyer: 'fhb' }).duty, 0);
  near(stampDuty('VIC', 675000, { buyer: 'fhb' }).duty, 17785, 1);
  assert.equal(stampDuty('VIC', 600000, { buyer: 'fhb' }).duty, 0);
  assert.equal(stampDuty('QLD', 650000, { buyer: 'fhb' }).duty, 0);
  assert.equal(stampDuty('QLD', 1500000, { buyer: 'fhb', newBuild: true }).duty, 0);
  assert.equal(stampDuty('SA', 900000, { buyer: 'fhb', newBuild: true }).duty, 0);
  assert.ok(stampDuty('SA', 900000, { buyer: 'fhb', newBuild: false }).duty > 40000);
  assert.equal(stampDuty('WA', 590000, { buyer: 'fhb' }).duty, 0);
  near(stampDuty('WA', 700000, { buyer: 'fhb' }).duty, 16150, 1);
  assert.equal(stampDuty('ACT', 900000, { buyer: 'fhb' }).duty, 0);
  // QLD home concession for owner-occupiers
  near(stampDuty('QLD', 800000, { buyer: 'owner' }).duty, 10150 + 0.045 * 260000, 1);
  // VIC PPR concession only to $550k
  near(stampDuty('VIC', 500000, { buyer: 'owner' }).duty, 18370 + 0.06 * 60000, 1);
});

test('land tax', () => {
  assert.equal(landTax('NSW', 900000).tax, 0);
  near(landTax('NSW', 1200000).tax, 100 + 0.016 * 125000, 1);
  near(landTax('QLD', 700000).tax, 1500, 1);
  near(landTax('VIC', 400000).tax, 1650, 1);
  near(landTax('WA', 500000).tax, 500, 1);
  assert.equal(landTax('NT', 900000).tax, 0);
  assert.ok(landTax('ACT', 400000).tax > 1778);
});

test('income tax 2026-27 incl. Medicare', () => {
  near(incomeTax(120000), 4020 + 0.3 * 75000 + 2400, 1);
  near(incomeTax(200000), 51370 + 0.45 * 10000 + 4000, 1);
  assert.ok(incomeTax(30000) < 2000);
});

test('LMI and repayments', () => {
  assert.equal(lmi(640000, 800000, 'NSW').premium, 0);
  const l = lmi(720000, 800000, 'VIC');
  near(l.premium, 720000 * 0.02367 * 1.1, 2);
  near(repayment(500000, 6, 30), 2997.75, 0.5);
  near(repayment(500000, 6, 30, true), 2500, 0.01);
});

test('IRR', () => {
  near(IRR([-100, 110]) * 100, 10, 0.01);
  near(IRR([-1000, 100, 100, 1100]) * 100, 10, 0.01);
});

test('CGT under the 2026 reform: split at 1 July 2027 and 30% minimum on post-reform real gains', () => {
  const r = capitalGainsTax({ purchaseDate: '2026-10-01', saleDate: '2036-10-01', salePrice: 1300000, sellCosts: 30000, costBase: 830000, growth: 5, cpi: 2.5, income: 120000 });
  assert.match(r.method, /Split/);
  assert.ok(r.tax > 0);
  // bought after the reform: whole real gain indexed
  const r2 = capitalGainsTax({ purchaseDate: '2027-08-01', saleDate: '2037-08-01', salePrice: 1300000, sellCosts: 30000, costBase: 830000, growth: 5, cpi: 2.5, income: 30000 });
  assert.ok(r2.tax >= 0.3 * r2.postRealGain - 1, 'minimum 30% applies to low-income sellers');
  // new build can pick the cheaper method
  const r3 = capitalGainsTax({ purchaseDate: '2027-08-01', saleDate: '2037-08-01', salePrice: 1300000, sellCosts: 30000, costBase: 830000, growth: 5, cpi: 2.5, income: 30000, newBuild: true });
  assert.ok(r3.tax <= r2.tax);
});

test('negative gearing: established purchase after 12 May 2026 loses the offset from 1 July 2027', () => {
  const base = { state: 'NSW', price: 900000, weeklyRent: 600, deposit: 0.2, ratePct: 6.3, income: 150000, purchaseDate: '2026-10-01', hold: 5 };
  const est = analyse(base);
  const nb = analyse({ ...base, newBuild: true, buildYear: 2026 });
  const old = analyse({ ...base, purchaseDate: '2025-10-01' });
  assert.equal(est.summary.negativeGearing, 'restricted');
  assert.ok(est.rows[2].quarantined > 0 && est.rows[2].taxEffect === 0, 'year 3 loss is quarantined');
  assert.ok(nb.rows[2].taxEffect > 0, 'new build still offsets');
  assert.ok(old.rows[2].taxEffect > 0, 'grandfathered property still offsets');
  assert.ok(est.rows[0].offsetShare > 0.7 && est.rows[0].offsetShare < 0.8, 'first year is ~9/12 before July 2027');
});

test('analyse returns a coherent model and verdict', () => {
  const r = analyse({ state: 'WA', price: 650000, weeklyRent: 700, deposit: 0.2, ratePct: 6.1, income: 110000, hold: 10, growth: 5 });
  assert.equal(r.rows.length, 10);
  assert.ok(r.summary.grossYield > 5.5);
  assert.ok(r.summary.irr > 5 && r.summary.irr < 40, `irr ${r.summary.irr}`);
  const v = verdict(r);
  assert.ok(['A', 'B', 'C', 'D'].includes(v.grade));
  assert.ok(v.reasons.length + v.risks.length >= 3);
});

test('borrowing power uses the 3-point buffer', () => {
  const b = borrowingPower({ grossIncome: 120000, ratePct: 6.2 });
  assert.equal(b.assessRate, 9.2);
  assert.ok(b.amount > 350000 && b.amount < 900000, `${b.amount}`);
});
