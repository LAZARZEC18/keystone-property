import test from 'node:test';
import assert from 'node:assert/strict';
import { dealPercentile, suburbScore, PROFILE_FILTERS } from '../site/assets/engine.js';
import { cashWeek } from '../site/assets/ui.js';
import { membersOnly, notPurchase } from '../site/assets/rate-rules.js';
import { summarise } from '../scripts/rates.mjs';
import { accuracy } from '../site/assets/accuracy.js';
import { regionMoves, applyLiveGrowth } from '../site/assets/live.js';

test('deal grade percentile is relative and mid-ranks ties', () => {
  const bands = { q: [0, 0, 10, 10, 10, 10, 20, 30, 40, 50] };
  assert.equal(dealPercentile(-5, bands), 0);
  assert.equal(dealPercentile(10, bands), 40); // 2 below + half of 4 ties
  assert.equal(dealPercentile(99, bands), 100);
  assert.equal(dealPercentile(10, null), null);
});

test('modelled suburbs are shrunk toward 50', () => {
  const sc = { cash: 90, momentum: null, growth: 90, demand: 90, afford: 90, stability: 90, risk: 0 };
  assert.equal(suburbScore(sc), 90);
  assert.equal(suburbScore({ ...sc, modelled: true }), 84);
});

test('new-build strategy only includes areas approving new homes', () => {
  assert.equal(PROFILE_FILTERS.newbuild({ sup: 2, pg5: 5 }), true);
  assert.equal(PROFILE_FILTERS.newbuild({ sup: 0.4, pg5: 5 }), false);
});

test('weekly cash in words, no double negative', () => {
  assert.equal(cashWeek(-491), 'You pay $491/wk');
  assert.equal(cashWeek(120), 'You receive $120/wk');
});

test('members-only and non-purchase products never headline the best rate', () => {
  assert.ok(membersOnly({ lender: 'Police Bank', product: 'Value Home Loan' }));
  assert.ok(membersOnly({ lender: 'Unity Bank', product: 'Essential Worker Home Loan' }));
  assert.ok(!membersOnly({ lender: 'ING', product: 'Mortgage Simplifier' }));
  assert.ok(notPurchase({ product: 'Home Equity Loan' }));
  const row = (lender, product, rate) => ({ lender, product, rate, comparison: rate, type: 'variable', purpose: 'OO', repay: 'PI', lvrMax: 80, tailored: false, special: false, url: 'https://x' });
  const s = summarise([row('Police Bank', 'Police Value Home Loan', 5.1), row('Big Bank', 'Home Equity Loan', 5.2), row('Open Bank', 'Basic', 5.9)]);
  assert.equal(s.best.OO_PI_variable[0].lender, 'Open Bank');
});

test('valuation accuracy is stated per state', () => {
  const model = { model: { holdout: { VIC: { medianAbsPctError: 11.9, within20pct: 70.9 } }, unitR2: 0.48 } };
  assert.equal(accuracy({ s: 'WA', conf: 'medium-low' }, 'h', model).level, 'untested');
  assert.equal(accuracy({ s: 'VIC', conf: 'medium-low' }, 'h', model).level, 'tested');
  assert.equal(accuracy({ s: 'VIC', conf: 'high' }, 'h', model).level, 'measured');
  assert.match(accuracy({ s: 'WA', conf: 'low' }, 'u', model).text, /Unit estimates are weaker/);
});

test('month-end figures only, 3-month change first with a trend word', () => {
  const market = { indexMonth: '31 August 2026', regions: { PER: { name: 'Perth', annualPct: 15.6, quarterPct: -3.2 } } };
  assert.equal(regionMoves('PER', null, market).year, 15.6);
  const s = applyLiveGrowth({ rg: 'PER', g1: 15.6, g1s: 'region' }, null, market);
  assert.equal(s.g1, 15.6);
  assert.equal(s.g3, -3.2);
  assert.equal(s.trend, 'Falling');
  assert.match(s.g1p, /Perth-wide/);
});
