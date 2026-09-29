

// chapter starts in seconds (scripts/media/tour.mjs writes the same list to ownaroo-tour.json)
const TOUR_CH = [['Where your budget reaches', 0], ['What you can comfortably afford', 18.33], ['A price range for a home', 39.27], ['The 2026 tax changes', 56.2], ['A suburb report', 74.23], ['Lender rates', 89.63]];

export const WHO = [
  ['First home buyers', 'See exactly what you can afford with the 5% Deposit Scheme, Help to Buy, grants and duty concessions for your state; how long it will take to save; whether to keep renting; and which suburbs near work fit your budget.', '/afford?buyer=fhb'],
  ['Upgraders and downsizers', 'See a price range for your current home and the one you want, see the true cash cost of moving (duty, fees, loan) and compare suburbs on the things that matter for living there.', '/property'],
  ['Investors', 'Rank suburbs by strategy, test any deal against the 2026 negative gearing and CGT rules, model joint ownership and land tax across your holdings, and compare advertised rates from more than 90 lenders.', '/analyse'],
];


/** The two-minute tour with chapter buttons (used on the About page). */
export function tourFigure() {
  return `<figure class="why-video">
      <video id="tour" controls playsinline preload="metadata" poster="/assets/media/tour-poster.jpg" aria-label="Two-minute tour of Ownaroo">
        <source src="/assets/media/ownaroo-tour-720.mp4" type="video/mp4" media="(max-width: 900px)">
        <source src="/assets/media/ownaroo-tour.mp4" type="video/mp4">
        <track kind="captions" src="/assets/media/ownaroo-tour.en.vtt" srclang="en" label="English">
        <track kind="chapters" src="/assets/media/ownaroo-tour.chapters.vtt" srclang="en" label="Chapters" default>
      </video>
      <div class="tour-chapters" role="group" aria-label="Jump to a chapter">${TOUR_CH.map(([t, sec], i) => `<button type="button" data-t="${sec}" class="${i ? '' : 'on'}"><span>${String(i + 1).padStart(2, '0')}</span>${t}</button>`).join('')}</div>
      <figcaption class="fine">A two-minute tour in six chapters. Pick a chapter to jump to it.</figcaption>
    </figure>`;
}

export function wireTour(main) {
  const v = main.querySelector('#tour');
  const btns = [...main.querySelectorAll('.tour-chapters button')];
  btns.forEach((b) => b.addEventListener('click', () => {
    v.currentTime = +b.dataset.t + 0.05;
    btns.forEach((x) => x.classList.toggle('on', x === b));
    v.play().catch(() => {});
  }));
  v?.addEventListener('timeupdate', () => {
    let k = 0;
    TOUR_CH.forEach(([, sec], i) => { if (v.currentTime >= sec) k = i; });
    btns.forEach((b, i) => b.classList.toggle('on', i === k));
  });
}

// /why was merged into /about
export default async function whyPage() {
  const { navigate } = await import('../app.js');
  navigate('/about', true);
}
