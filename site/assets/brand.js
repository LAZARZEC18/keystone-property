// Branded, printable reports for agents and brokers. Details are kept in this browser only and appear on
// printed or saved-as-PDF reports; nothing is sent to Keyzing.
import { esc } from './ui.js';

const KEY = 'keyzing.brand';
export function brandKit() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || {};
  } catch {
    return {};
  }
}
function saveBrand(b) {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {}
}

const SITE_HOST = () => location.host || 'Keyzing';

/** Header line for a printed report, with the agent's details if they've added them. */
export function printHeader(title) {
  const b = brandKit();
  const who = [b.name, b.agency].filter(Boolean).map(esc).join(', ');
  const contact = [b.phone, b.email].filter(Boolean).map(esc).join(' · ');
  const date = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
  return `<div class="print-only report-brand">${who ? `<div class="rb-who"><b>${who}</b>${contact ? ` · ${contact}` : ''}</div>` : ''}<div class="report-head">${esc(title)} · ${date} · independent estimates from Keyzing (${esc(SITE_HOST())})</div></div>`;
}

/** Small form to add agent/broker details to printed reports, plus the print button. */
export function brandPanel(label = 'Download or print this report') {
  const b = brandKit();
  return `<div class="brand-panel no-print">
    ${label ? `<button class="btn sm" type="button" data-print>${esc(label)}</button>` : ''}
    <details class="brand-details"><summary>Agents and brokers: add your details to the printed report</summary>
      <div class="fields" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));margin-top:10px">
        <label class="field">Your name<input data-b="name" value="${esc(b.name || '')}" autocomplete="name"></label>
        <label class="field">Agency or business<input data-b="agency" value="${esc(b.agency || '')}" autocomplete="organization"></label>
        <label class="field">Phone<input data-b="phone" value="${esc(b.phone || '')}" autocomplete="tel"></label>
        <label class="field">Email<input data-b="email" value="${esc(b.email || '')}" autocomplete="email"></label>
      </div>
      <p class="fine" style="margin-top:6px">Saved in this browser only and printed at the top of the report. The figures stay Keyzing's independent estimates, labelled as such.</p>
    </details></div>`;
}

/** Wire the print button and detail fields once per page (delegated, so re-rendered content keeps working). */
export function wireBrand(root, title) {
  const t = () => (typeof title === 'function' ? title() : title);
  root.addEventListener('input', (e) => {
    const i = e.target.closest?.('[data-b]');
    if (!i) return;
    const b = brandKit();
    b[i.dataset.b] = i.value.trim();
    saveBrand(b);
    root.querySelectorAll('.report-brand').forEach((el) => (el.outerHTML = printHeader(t())));
  });
  root.addEventListener('click', (e) => {
    if (e.target.closest?.('[data-print]')) window.print();
  });
}
