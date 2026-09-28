import test from 'node:test';
import assert from 'node:assert/strict';
import { guaranteeCap, HOME_GUARANTEE } from '../site/assets/rules.js';
import { suburbScore, stampDuty } from '../site/assets/engine.js';
import { aud } from '../site/assets/ui.js';
import { sensitivity, nextDecision } from '../site/assets/ratewatch.js';

test('5% Deposit Scheme caps: capital, regional centre and rest of state', () => {
  assert.equal(guaranteeCap({ s: 'WA', rg: 'PER', lga: 'Bayswater' }), 850000);
  assert.equal(guaranteeCap({ s: 'WA', rg: 'RWA', lga: 'Port Hedland' }), 600000);
  assert.equal(guaranteeCap({ s: 'QLD', rg: 'RQLD', lga: 'Gold Coast' }), 1000000);
  assert.equal(guaranteeCap({ s: 'NSW', rg: 'RNSW', lga: 'Newcastle' }), 1500000);
  assert.equal(HOME_GUARANTEE.caps.VIC[1], 650000);
});

test('concentration risk lowers the score, low risk does not', () => {
  const sc = { cash: 90, momentum: 70, growth: 60, demand: 70, afford: 80, stability: 40 };
  const base = suburbScore({ ...sc, risk: 0 });
  assert.equal(suburbScore({ ...sc, risk: 15 }), base);
  assert.equal(suburbScore({ ...sc, risk: 100 }), base - 30);
});

test('first home duty explains when a price is above the concession cap', () => {
  const d = stampDuty('WA', 925000, { buyer: 'fhb' });
  assert.equal(d.duty, d.general);
  assert.match(d.notes.join(' '), /above the \$800,000 first home buyer cap/i);
});

test('compact currency never shows $1000k', () => {
  assert.equal(aud(999987, { compact: true }), '$1.00m');
  assert.equal(aud(999400, { compact: true }), '$999k');
});

test('rate watch: +0.25% on $750k at 6.2% is about $122 a month', () => {
  const r = sensitivity(6.2).find((x) => x.loan === 750000);
  assert.ok(Math.abs(r.up25 - 122) < 2);
  assert.equal(nextDecision(new Date('2026-09-26T00:00:00Z')), '2026-09-29');
  assert.equal(nextDecision(new Date('2026-09-30T00:00:00Z')), '2026-11-03');
});
