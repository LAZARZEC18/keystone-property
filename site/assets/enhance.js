import { wireDemos } from './demo.js';
// Page-wide enhancements applied after every render: plain-English explanations for jargon,
// and a scroll hint on tables wider than the screen.

export const JARGON = {
  LVR: 'Loan-to-value ratio: the loan as a share of the price. A 20% deposit means an 80% LVR.',
  LMI: 'Lenders mortgage insurance: a one-off fee, usually added to the loan, when you borrow more than about 80% of the price. It protects the lender, not you.',
  IRR: 'Internal rate of return: the average yearly return on the cash you put in, after costs, tax and selling.',
  'P&I': 'Principal and interest: each repayment pays off some of the loan as well as the interest.',
  CGT: 'Capital gains tax: tax on the profit when you sell an investment property.',
  SA2: 'An ABS statistical area of about 10,000 people, roughly a suburb or a group of small suburbs.',
  'R²': 'A measure of how well a model fits: 1 means it explains every difference, 0 means none.',
  FHSS: 'First Home Super Saver scheme: save a deposit inside super with a tax discount, then withdraw it to buy.',
  HEM: 'Household Expenditure Measure: the benchmark living costs lenders use when you claim to spend less.',
  'gross yield': 'A year’s rent as a percentage of the price, before any costs.',
  'rental yield': 'A year’s rent as a percentage of the price, before any costs.',
  'negative gearing': 'When rent doesn’t cover the loan interest and costs, the loss can reduce the tax on your salary (limited for established homes bought after 12 May 2026).',
  'comparison rate': 'The interest rate with most fees built in, for a $150,000 loan over 25 years. Handy for comparing, but not the exact cost of your loan.',
  'stamp duty': 'A state tax on buying property, paid at settlement. First home buyers often pay less or none.',
  'interest only': 'Repayments cover only the interest, so the loan doesn’t go down. Usually for a set number of years.',
  'offset account': 'A savings account linked to the loan: its balance is subtracted from the loan before interest is charged.',
  'depreciation': 'A tax deduction for the wear on a rental’s building and fittings, largest for new builds.',
  'Modelled': 'No official sales series for this suburb, so the figure is estimated from similar suburbs and the city trend.',
};
const SKIP = new Set(['A', 'ABBR', 'BUTTON', 'INPUT', 'SELECT', 'OPTION', 'TEXTAREA', 'SCRIPT', 'STYLE', 'CODE', 'SVG', 'LABEL', 'H1', 'SUMMARY']);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const reFor = (t) => new RegExp(`(^|[^\\w])(${t.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&')})(?![\\w²])`, /^[A-Z&²]+$/.test(t) ? '' : 'i');
const TERMS = Object.keys(JARGON).map((t) => [t, reFor(t)]);

/** Wrap the first use of each term in the page with an explanation (hover, focus or tap). */
export function explainJargon(root) {
  const done = new Set([...root.querySelectorAll('abbr.jargon')].map((a) => a.dataset.term));
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      for (let p = n.parentElement; p && p !== root; p = p.parentElement) if (SKIP.has(p.tagName) || p.closest?.('.leaflet-container, .no-jargon')) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    for (const [term, re] of TERMS) {
      if (done.has(term.toLowerCase())) continue;
      const m = node.nodeValue.match(re);
      if (!m) continue;
      const start = m.index + m[1].length;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + m[2].length);
      const ab = document.createElement('abbr');
      ab.className = 'jargon';
      ab.dataset.term = term.toLowerCase();
      ab.title = JARGON[term];
      ab.tabIndex = 0;
      range.surroundContents(ab);
      done.add(term.toLowerCase());
      break; // this text node was split; later terms are picked up on the next pass
    }
  }
  return done.size;
}

/** Mark tables that scroll sideways and add a one-line hint under them. */
export function tableHints(root) {
  for (const w of root.querySelectorAll('.tbl-wrap')) {
    const scrolls = w.scrollWidth > w.clientWidth + 4;
    w.classList.toggle('scrolls', scrolls);
    if (scrolls && !(w.nextElementSibling?.classList.contains('scroll-hint'))) w.insertAdjacentHTML('afterend', '<div class="scroll-hint" aria-hidden="true"><span class="sh-touch">Swipe the table sideways to see more →</span><span class="sh-mouse">Scroll the table sideways to see more →</span></div>');
  }
}

let tip = null;
export function wireJargonTips() {
  const show = (ab) => {
    tip ??= Object.assign(document.createElement('div'), { className: 'jargon-tip', role: 'tooltip' });
    tip.textContent = ab.title || JARGON[ab.dataset.term] || '';
    document.body.appendChild(tip);
    const r = ab.getBoundingClientRect();
    tip.style.left = `${Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - 296))}px`;
    tip.style.top = `${window.scrollY + r.bottom + 6}px`;
  };
  const hide = () => tip?.remove();
  document.addEventListener('click', (e) => {
    const ab = e.target.closest?.('abbr.jargon');
    if (ab) show(ab);
    else hide();
  });
  document.addEventListener('focusin', (e) => (e.target.matches?.('abbr.jargon') ? show(e.target) : hide()));
  window.addEventListener('scroll', hide, { passive: true });
}

export function enhance(root) {
  wireDemos(root);
  // repeat until no new terms are found (each pass may split text nodes)
  for (let i = 0; i < 4; i++) {
    const before = root.querySelectorAll('abbr.jargon').length;
    explainJargon(root);
    if (root.querySelectorAll('abbr.jargon').length === before) break;
  }
  tableHints(root);
}
