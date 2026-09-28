// Short silent demo clips of each tool (site/assets/media/clips), recorded in full HD. They play muted and looped
// while on screen, with a play/pause button, a progress bar you can click or drag, and a link to try the real tool.
// People who prefer reduced motion get them paused.
import { esc } from './ui.js';

export const CLIPS = {
  budgetmap: ['Drag the budget and every suburb with a typical home under it lights up. Zoom into a city, hover for prices, click through to the suburb.', '/', 'Try the map'],
  afford: ['Where you want to buy, savings and income in: a comfortable price, the most you could stretch to, the schemes you qualify for and the suburbs that fit.', '/afford?buyer=fhb', 'Work out what I can afford'],
  calculator: ['The 2026 tax-change calculator: change the price or rent and the weekly cost after tax and the 10-year return update.', '/analyse', 'Open the calculator'],
  estimate: ['A price range for a typical home like the one you’re looking at, how far to trust it, and the cash you need.', '/property', 'Try an address'],
  suburb: ['A suburb report: month-end prices and their direction, rents, new building nearby and the cost of buying there.', '/suburb/wa/cottesloe-6011', 'Open a suburb report'],
  rates: ['Advertised rates from more than 90 lenders, filtered for your loan, with offset accounts, fees and your repayment.', '/rates', 'Compare rates'],
  firsthome: ['First home tools: how long to save, rent versus buy, and the First Home Super Saver scheme.', '/first-home', 'Open the first home tools'],
};

export function demo(name, { caption, label = '' } = {}) {
  const [cap, href, cta] = CLIPS[name] || ['', '', ''];
  const text = caption ?? cap;
  return `<figure class="demo" data-demo-fig>
    <div class="demo-media"><video muted loop playsinline preload="none" poster="/assets/media/clips/${name}.jpg" data-demo aria-label="${esc(label || text)}"><source src="/assets/media/clips/${name}-720.mp4" type="video/mp4" media="(max-width: 900px)"><source src="/assets/media/clips/${name}.mp4" type="video/mp4"></video>
      <div class="demo-bar"><button type="button" class="demo-play" aria-label="Pause">❚❚</button><div class="demo-prog" role="slider" aria-label="Position in the clip" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0"><i></i></div>${href ? `<a class="demo-try" href="${href}" data-link>${esc(cta)} →</a>` : ''}</div>
    </div>
    ${text ? `<figcaption>${esc(text)}</figcaption>` : ''}</figure>`;
}

let io = null;
export function wireDemos(root) {
  const vids = root.querySelectorAll('video[data-demo]:not([data-wired])');
  if (!vids.length) return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  io ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      const v = e.target;
      if (e.isIntersecting && !v.dataset.userPaused && !reduce) {
        if (v.preload === 'none') v.preload = 'auto';
        v.play().catch(() => {});
      } else v.pause();
    }
  }, { threshold: 0.35 });
  vids.forEach((v) => {
    v.dataset.wired = '1';
    const fig = v.closest('[data-demo-fig]');
    const btn = fig?.querySelector('.demo-play');
    const prog = fig?.querySelector('.demo-prog');
    const bar = prog?.querySelector('i');
    const sync = () => {
      if (!btn) return;
      btn.textContent = v.paused ? '▶' : '❚❚';
      btn.setAttribute('aria-label', v.paused ? 'Play' : 'Pause');
    };
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    v.addEventListener('timeupdate', () => {
      if (!bar || !v.duration) return;
      const pc = (v.currentTime / v.duration) * 100;
      bar.style.width = `${pc}%`;
      prog.setAttribute('aria-valuenow', Math.round(pc));
    });
    const toggle = () => {
      if (v.paused) {
        delete v.dataset.userPaused;
        if (v.preload === 'none') v.preload = 'auto';
        v.play().catch(() => {});
      } else {
        v.dataset.userPaused = '1';
        v.pause();
      }
    };
    btn?.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    const seek = (e) => {
      const r = prog.getBoundingClientRect();
      const t = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (v.duration) v.currentTime = t * v.duration;
      else {
        v.preload = 'auto';
        v.addEventListener('loadedmetadata', () => (v.currentTime = t * v.duration), { once: true });
      }
    };
    prog?.addEventListener('pointerdown', (e) => {
      seek(e);
      prog.setPointerCapture(e.pointerId);
      const move = (ev) => seek(ev);
      prog.addEventListener('pointermove', move);
      prog.addEventListener('pointerup', () => prog.removeEventListener('pointermove', move), { once: true });
    });
    prog?.addEventListener('keydown', (e) => {
      if (!v.duration) return;
      if (e.key === 'ArrowRight') v.currentTime = Math.min(v.duration, v.currentTime + 2);
      if (e.key === 'ArrowLeft') v.currentTime = Math.max(0, v.currentTime - 2);
    });
    sync();
    if (reduce) v.controls = false;
    else io.observe(v);
  });
}
