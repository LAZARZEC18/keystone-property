import { esc, ago, setMeta, date } from '../ui.js';
import { loadStaleFirst } from '../data.js';

export default async function newsPage(main) {
  setMeta({ title: 'Australian housing news', description: 'Headlines on prices, rates, rents and housing policy from Australian publishers.' });
  // show the stored headlines straight away, then swap in the live list when the feeds answer
  const { stored, live } = loadStaleFirst('news');
  let news = await stored;
  const tags = ['All', 'Rates', 'Prices', 'Rents', 'Policy', 'Supply', 'Lending'];
  const sources = [...new Set(news.items.map((x) => x.source))].sort();
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">News</div><h1>Housing news</h1>
  <p>A short list of headlines about prices, rates, rents, lending and housing policy, from ${new Set(news.items.map((i) => i.source)).size} publishers. Celebrity, sport and crime stories are filtered out, and no publisher gets more than a few slots. <span id="n-when">Last updated ${ago(news.updated)}.</span> Links open the publisher's site.</p></div>
  <div class="toolbar"><div class="seg" id="nt">${tags.map((t, i) => `<button data-t="${t}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>
  <label class="field">Source<select id="ns"><option value="">All sources</option>${sources.map((s) => `<option>${esc(s)}</option>`).join('')}</select></label></div>
  <div class="card"><div class="news-list" id="nl"></div></div>
  <p class="fine" style="margin-top:10px">Ownaroo shows headlines only and links to the original article. The list is refreshed from the publishers' feeds several times a day; if they're slow to answer you see the last stored copy first.</p>`;
  let tag = 'All';
  const draw = () => {
    const src = main.querySelector('#ns').value;
    const items = news.items.filter((x) => (tag === 'All' || x.tags.includes(tag)) && (!src || x.source === src));
    main.querySelector('#nl').innerHTML = items.length
      ? items.map((x) => `<div class="news-item"><div><a href="${esc(x.link)}" target="_blank" rel="noopener">${esc(x.title)}</a><div class="meta"><span>${esc(x.source)}</span><span>·</span><span>${ago(x.date)}</span>${x.tags.map((t) => `<span class="tag tag-news">${t}</span>`).join('')}</div></div></div>`).join('')
      : '<p class="empty">No headlines in this category right now.</p>';
  };
  main.querySelector('#nt').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    tag = b.dataset.t;
    main.querySelectorAll('#nt button').forEach((x) => x.classList.toggle('on', x === b));
    draw();
  });
  main.querySelector('#ns').addEventListener('change', draw);
  draw();
  live.then((d) => {
    if (!d || !main.isConnected || !d.items?.length || Date.parse(d.updated) <= Date.parse(news.updated)) return;
    news = d;
    const w = main.querySelector('#n-when');
    if (w) w.textContent = `Last updated ${ago(news.updated)}.`;
    draw();
  });
}
