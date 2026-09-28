import test from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../site/assets/validate.js';
import { analyse, incomeFor, borrowingPower } from '../site/assets/engine.js';
import { runningCosts, comfortableWeekly, STATE_COSTS } from '../site/assets/rules.js';

test('nonsense deal inputs are rejected, never swapped', () => {
  const r = check({ price: '0', rent: '-100', dep: '150', inc: '-5' }, { price: 'price', rent: 'rent', dep: 'deposit', inc: 'income' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['dep', 'inc', 'price', 'rent']);
  assert.match(r.errors.rent, /negative/);
  assert.equal(check({ price: 'abc' }, { price: 'price' }).ok, false);
  assert.equal(check({ price: '850000' }, { price: 'price' }).ok, true);
  assert.equal(check({ x: '' }, { x: { field: 'otherland', optional: true } }).ok, true);
});

test('unknown build year claims no building depreciation', () => {
  const a = analyse({ state: 'NSW', price: 850000, weeklyRent: 650 });
  assert.equal(a.rows[0].depreciation, 0);
  const b = analyse({ state: 'NSW', price: 850000, weeklyRent: 650, buildYear: 2005 });
  assert.ok(b.rows[0].depreciation > 0);
});

test('losses offset rental profit from other properties under the 2026 rules', () => {
  const base = { state: 'WA', price: 900000, weeklyRent: 600, purchaseDate: '2026-09-01', income: 150000, hold: 10 };
  const a = analyse(base);
  const b = analyse({ ...base, otherRental: 15000 });
  assert.ok(b.rows[2].usedOther > 0);
  assert.ok(b.rows[2].taxEffect > a.rows[2].taxEffect);
  assert.ok(b.rows.at(-1).carried <= a.rows.at(-1).carried);
});

test('running costs respond to state and type', () => {
  assert.notEqual(runningCosts('NT', 'h').waterIns, runningCosts('VIC', 'h').waterIns);
  assert.ok(runningCosts('WA', 'u').waterIns < runningCosts('WA', 'h').waterIns);
  assert.equal(Object.keys(STATE_COSTS).length, 8);
});

test('stress threshold and income needed', () => {
  assert.equal(Math.round(comfortableWeekly(104000)), 600);
  const inc = incomeFor(600000, 6.2);
  assert.ok(borrowingPower({ grossIncome: inc, couple: true, ratePct: 6.2 }).amount >= 599000);
});
