// Printable reports. Agent/broker branding was removed (review #5): an agent's name must not sit on
// untested, modelled estimates built on third-party data Keyzing isn't licensed to redistribute.
import { esc } from './ui.js';

/** Header line for a printed report. */
export function printHeader(title) {
  const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<div class="print-only report-brand"><div class="report-head">${esc(title)} · ${date} · Keyzing (${esc(location.host || 'Keyzing')}) · general information, modelled estimates, not a valuation or appraisal</div></div>`;
}

/** Print / save-as-PDF button (for your own records). */
export function brandPanel(label = 'Print or save as PDF') {
  return label ? `<div class="brand-panel no-print"><button class="btn sm" type="button" data-print>${esc(label)}</button><span class="fine">For your own records.</span></div>` : '';
}

export function wireBrand(root) {
  root.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-print]')) window.print();
  });
}
