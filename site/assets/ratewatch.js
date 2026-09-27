// "Rate watch": the next RBA decision and what a move does to repayments.
import { aud, pct, esc } from './ui.js';
import { repayment } from './engine.js';
import { RBA_DECISIONS, RBA_OUTLOOK } from './rules.js';

// Decisions are announced at 2.30pm Sydney time (04:30 UTC in AEST, 03:30 UTC in AEDT from October).
const announceAt = (d) => Date.parse(`${d}T${d >= '2026-10-04' && d < '2027-04-04' ? '03:30' : '04:30'}:00Z`);

/** Next decision date (YYYY-MM-DD) not yet announced, or null once the list runs out. */
export function nextDecision(now = new Date()) {
  return RBA_DECISIONS.find((d) => announceAt(d) > +now) || null;
}

/** The most recent decision if it was announced in the last 3 days. */
export function recentDecision(now = new Date()) {
  return [...RBA_DECISIONS].reverse().find((d) => announceAt(d) <= +now && +now - announceAt(d) < 3 * 864e5) || null;
}

const fmtDay = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

/** Monthly repayment change on typical loans for +0.25 and +0.50 points. */
export function sensitivity(rate, loans = [500000, 750000, 1000000]) {
  return loans.map((loan) => {
    const base = repayment(loan, rate, 30);
    return { loan, base, up25: repayment(loan, rate + 0.25, 30) - base, up50: repayment(loan, rate + 0.5, 30) - base };
  });
}

export function rateWatchCard(rba, { compact = false } = {}) {
  const next = nextDecision();
  const avg = rba.actual?.newOOVariable?.at(-1)?.[1] ?? 6.2;
  const rows = sensitivity(avg);
  // the outlook line is only shown before its decision is announced, so it can never go stale
  const outlook = next && RBA_OUTLOOK.date === next ? RBA_OUTLOOK : null;
  const recent = recentDecision();
  const moved = recent && rba.cashRate?.lastChange === recent;
  const justIn = recent ? (moved ? `On ${fmtDay(recent)} the RBA moved the cash rate to ${pct(rba.cashRate.current, 2)}.` : `The RBA announced its ${fmtDay(recent)} decision at 2.30pm; the cash rate shown (${pct(rba.cashRate.current, 2)}) is refreshed from the RBA within a few hours.`) : '';
  if (compact) {
    const mid = rows[1];
    return `<div class="callout rate-watch">${justIn ? `<b>${esc(justIn)}</b> ` : ''}<b>${next ? `Next RBA decision: ${fmtDay(next)}, 2.30pm Sydney time.` : 'RBA decisions.'}</b> ${outlook ? esc(outlook.text) + ' ' : ''}A 0.25-point rise adds about <b>${aud(mid.up25)} a month</b> to a ${aud(mid.loan, { compact: true })} loan at today's average ${pct(avg, 2)} variable rate. <a href="/weekly#rate-watch" data-link>What it does to your repayments →</a></div>`;
  }
  return `<div class="card" id="rate-watch"><div class="card-head"><h3>Rate watch</h3>${next ? `<span class="pill">Next decision ${fmtDay(next)}, 2.30pm Sydney time</span>` : ''}</div>
    <p class="note" style="margin-top:0">${justIn ? `<b>${esc(justIn)}</b> ` : ''}Cash rate ${pct(rba.cashRate.current, 2)}.${outlook ? ` ${esc(outlook.text)} <a href="${outlook.source}" target="_blank" rel="noopener">Source</a>.` : ''} Repayment changes below use the average new owner-occupier variable rate of ${pct(avg, 2)} (RBA F6), 30-year principal and interest.</p>
    <div class="tbl-wrap"><table><thead><tr><th>Loan</th><th class="n">Monthly now</th><th class="n">+0.25%</th><th class="n">+0.50%</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td>${aud(r.loan, { compact: true })}</td><td class="n">${aud(r.base)}</td><td class="n down">+${aud(r.up25)}</td><td class="n down">+${aud(r.up50)}</td></tr>`).join('')}
    </tbody></table></div>
    <p class="fine" style="margin-top:8px">Lenders usually pass a cash rate change on to variable loans within a few weeks. Fixed loans don't change until the fixed term ends.</p></div>`;
}
