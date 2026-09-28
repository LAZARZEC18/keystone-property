// Short silent demo clips of each tool (site/assets/media/clips). They play muted and looped while on screen,
// and stay paused with controls for people who prefer reduced motion.
import { esc } from './ui.js';

export const CLIPS = {
  intro: '11,042 suburbs across Australia, priced and scored: each dot is a suburb, coloured by its typical house price.',
  afford: 'Savings and income in: a price ceiling in every state and territory, the schemes you qualify for and the suburbs that fit.',
  calculator: 'The 2026 tax-change calculator: change the price or rent and the weekly cost after tax updates.',
  estimate: 'A suburb estimate for a typical home: price range, how far to trust it, and the cash you need.',
  suburb: 'A suburb report: prices and the direction they are heading, rents, new building nearby and the numbers of buying there.',
  rates: 'Every lender’s advertised rate, filtered for your loan, with the repayment on your loan amount.',
  firsthome: 'First home tools: how long to save, rent versus buy, and the First Home Super Saver scheme.',
};

export function demo(name, { caption = CLIPS[name] || '', label = '' } = {}) {
  return `<figure class="demo"><video muted loop playsinline preload="none" poster="/assets/media/clips/${name}.jpg" data-demo aria-label="${esc(label || caption)}"><source src="/assets/media/clips/${name}.mp4" type="video/mp4"></video>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
}

let io = null;
export function wireDemos(root) {
  const vids = root.querySelectorAll('video[data-demo]:not([data-wired])');
  if (!vids.length) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  io ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting) {
        if (v.preload === 'none') v.preload = 'auto';
        v.play().catch(() => {});
      } else v.pause();
    }
  }, { threshold: 0.35 });
  vids.forEach((v) => {
    v.dataset.wired = '1';
    if (reduce) v.controls = true;
    else io.observe(v);
  });
}
