import test from 'node:test';
import assert from 'node:assert/strict';
import { normaliseRate } from '../site/assets/rate-rules.js';
import { valueCall } from '../site/assets/valuecall.js';
import { analyse, verdict } from '../site/assets/engine.js';

test('rate rows follow the product name when it contradicts the feed', () => {
  const base = { type: 'variable', repay: 'PI', lvrMin: null, lvrMax: null };
  assert.equal(normaliseRate({ ...base, product: '1 Year Fixed Rate' }).type, 'fixed');
  assert.equal(normaliseRate({ ...base, product: 'Fixed 36 mths' }).term, 3);
  assert.equal(normaliseRate({ ...base, product: 'Investment Home Loan - Interest Only' }).repay, 'IO');
  assert.equal(normaliseRate({ ...base, product: 'Home Loan up to 60% LVR' }).lvrMax, 60);
  assert.equal(normaliseRate({ ...base, product: 'Basic Variable LVR <70' }).lvrMax, 70);
  assert.equal(normaliseRate({ ...base, product: 'Fixed to Variable Split' }).type, 'variable');
});

test('a modelled estimate never places a price inside its range', () => {
  const est = { value: 900000, low: 760000, high: 1040000 };
  assert.equal(valueCall(800000, est, { measured: false }).key, 'within');
  assert.equal(valueCall(800000, est, { measured: true }).key, 'lower');
  assert.equal(valueCall(700000, est, { measured: false }).key, 'below');
});

test('deals carry an absolute term-deposit test and break-even excludes principal', () => {
  const r = analyse({ state: 'NSW', price: 850000, weeklyRent: 650, deposit: 0.2, ratePct: 6.4, income: 120000, hold: 10, growth: 5 });
  const v = verdict(r, null, null, { depositRate: 4.35 });
  assert.equal(typeof v.beatsDeposit, 'boolean');
  assert.ok(v.tdAfterTax > 2 && v.tdAfterTax < 4);
  assert.ok(r.summary.breakEvenRent < r.summary.breakEvenRentCash);
  assert.match(v.label, /%/); // a rank, never a bare letter
});
