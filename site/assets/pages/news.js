import { esc, ago, setMeta, date } from '../ui.js';
import { load } from '../data.js';

export default async function newsPage(main) {
  setMeta({ title: 'Australian housing news, updated through the day', description: 'Headlines on house prices, interest rates, rents and property policy from across Australia, checked about every hour.' });
  const news = await load('news');
  const tags = ['All', 'Rates', 'Prices', 'Rents', 'Policy', 'Supply', 'Lending'];
  const sources = [...new Set(news.items.map((x) => x.source))].sort();
  main.innerHTML = `
  <div class="page-head"><div class="eyebrow">News</div><h1>Housing news</h1>
  <p>A short list of headlines about prices, rates, rents, lending and housing policy, from ${new Set(news.items.map((i) => i.source)).size} publishers. Celebrity, sport and crime stories are filtered out, and no publisher gets more than a few slots. Checked about every hour; last update ${ago(news.updated)}. Links open the publisher's site.</p></div>
  <div class="toolbar"><div class="seg" id="nt">${tags.map((t, i) => `<button data-t="${t}" class="${i ? '' : 'on'}">${t}</button>`).join('')}</div>
  <label class="field">Source<select id="ns"><option value="">All sources</option>${sources.map((s) => `<option>${esc(s)}</option>`).join('')}</select></label></div>
  <div class="card"><div class="news-list" id="nl"></div></div>
  <p class="fine" style="margin-top:10px">Keyzing shows headlines only and links to the original article. Updated ${date(news.updated)}.</p>`;
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
}
