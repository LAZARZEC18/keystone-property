// Keystone single-page app: router, global search, ticker, theme.
import { $, $$, esc, aud, pct, ago } from './ui.js';
import { load, suburbs, searchSuburbs, cleanName, suburbUrl } from './data.js';

const routes = [
  [/^\/$/, () => import('./pages/home.js')],
  [/^\/live\/?$/, () => import('./pages/live.js')],
  [/^\/markets\/?$/, () => import('./pages/markets.js')],
  [/^\/new-builds\/?$/, () => import('./pages/newbuilds.js')],
  [/^\/weekly\/?$/, () => import('./pages/weekly.js')],
  [/^\/suburbs\/?$/, () => import('./pages/suburbs.js')],
  [/^\/suburb\/(?<state>[a-z]+)\/(?<slug>[a-z0-9-]+)\/?$/, () => import('./pages/suburb.js')],
  [/^\/postcode\/(?<pc>\d{3,4})\/?$/, () => import('./pages/postcode.js')],
  [/^\/council\/(?<state>[a-z]+)\/(?<lga>[a-z0-9-]+)\/?$/, () => import('./pages/council.js')],
  [/^\/analyse\/?$/, () => import('./pages/analyse.js')],
  [/^\/rates\/?$/, () => import('./pages/rates.js')],
  [/^\/listings\/?$/, () => import('./pages/listings.js')],
  [/^\/news\/?$/, () => import('./pages/news.js')],
  [/^\/guide\/?$/, () => import('./pages/guide.js')],
  [/^\/compare\/?$/, () => import('./pages/compare.js')],
  [/^\/watchlist\/?$/, () => import('./pages/watchlist.js')],
  [/^\/borrowing\/?$/, () => import('./pages/borrowing.js')],
  [/^\/methodology\/?$/, () => import('./pages/methodology.js')],
];

let current = null;

async function render() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const main = $('#main');
  const match = routes.find(([re]) => re.test(path));
  $$('.nav a').forEach((a) => a.classList.toggle('on', path.startsWith(a.getAttribute('href')) && a.getAttribute('href') !== '/'));
  $('#menu').setAttribute('aria-expanded', 'false');
  $('.nav').classList.remove('open');
  if (current?.destroy) current.destroy();
  if (!match) {
    main.innerHTML = `<div class="empty"><h1>Page not found</h1><p>Try the <a href="/suburbs" data-link>suburb explorer</a> or search above.</p></div>`;
    return;
  }
  const params = path.match(match[0]).groups || {};
  const query = Object.fromEntries(new URLSearchParams(location.search));
  try {
    const mod = await match[1]();
    main.innerHTML = '<div class="loading">Loading…</div>';
    current = (await mod.default(main, params, query)) || null;
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="empty"><h2>Something went wrong loading this page.</h2><p class="muted">${esc(e.message)}</p><p><a href="/" data-link>Back to the home page</a></p></div>`;
  }
  if (!location.hash) window.scrollTo({ top: 0 });
}

export function navigate(url, replace = false) {
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  render();
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link], a[href^="/"]');
  if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  const href = a.getAttribute('href');
  if (!href || !href.startsWith('/') || href.startsWith('//') || href.startsWith('/data/') || href.startsWith('/.netlify')) return;
  e.preventDefault();
  navigate(href);
});
window.addEventListener('popstate', render);

// ---- theme
$('#theme').addEventListener('click', () => {
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  const cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem('keystone.theme', next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event('themechange'));
});
$('#menu').addEventListener('click', () => {
  const nav = $('.nav');
  nav.classList.toggle('open');
  $('#menu').setAttribute('aria-expanded', nav.classList.contains('open'));
});

// ---- suburb search (header + reusable)
export function attachSearch(input, box, onPick) {
  let items = [];
  let sel = -1;
  const show = async () => {
    const q = input.value;
    if (q.trim().length < 2) {
      box.hidden = true;
      return;
    }
    const { list } = await suburbs();
    items = searchSuburbs(list, q, 10);
    sel = -1;
    box.innerHTML = items.length
      ? items.map((s, i) => `<a href="${suburbUrl(s)}" data-i="${i}"><span>${esc(cleanName(s.n))} <span class="muted">${s.s} ${s.pc || ''}</span></span><small>${aud(s.pt === 'u' ? s.u : s.h, { compact: true })} · ${pct(s.y, 1)}</small></a>`).join('')
      : `<div class="note" style="padding:10px 12px">No suburb matches "${esc(q)}".</div>`;
    box.hidden = false;
  };
  input.addEventListener('input', show);
  input.addEventListener('focus', show);
  input.addEventListener('keydown', (e) => {
    const links = $$('a', box);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const pick = items[Math.max(0, sel)];
      if (pick) {
        box.hidden = true;
        input.blur();
        if (onPick) onPick(pick);
        else navigate(suburbUrl(pick));
      }
    } else if (e.key === 'Escape') box.hidden = true;
  });
  box.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-i]');
    if (!a) return;
    box.hidden = true;
    if (onPick) {
      e.preventDefault();
      e.stopPropagation();
      onPick(items[+a.dataset.i]);
    }
  });
  document.addEventListener('click', (e) => {
    if (!box.contains(e.target) && e.target !== input) box.hidden = true;
  });
}
attachSearch($('#q'), $('#ac'));
$('.quick').addEventListener('submit', (e) => e.preventDefault());

// ---- ticker
async function ticker() {
  try {
    const [rs, rba, market] = await Promise.all([load('rates-summary'), load('rba'), load('market')]);
    const bestInv = rs.best.INV_PI_variable?.[0];
    const bestOO = rs.best.OO_PI_variable?.[0];
    const n = market.national;
    const items = [
      `<span>RBA cash rate</span> <b>${pct(rba.cashRate.current, 2)}</b>`,
      bestInv && `<span>Lowest investor variable</span> <b>${pct(bestInv.rate, 2)}</b> <span>${esc(bestInv.lender)}</span>`,
      bestOO && `<span>Lowest owner-occupier variable</span> <b>${pct(bestOO.rate, 2)}</b> <span>${esc(bestOO.lender)}</span>`,
      `<span>National median dwelling</span> <b>${aud(n.medianDwelling, { compact: true })}</b> <span class="${n.annualPct >= 0 ? 'up' : 'down'}">${pct(n.annualPct, 1, true)} y/y</span>`,
      ...Object.values(market.regions)
        .filter((r) => r.capital)
        .map((r) => `<span>${r.name}</span> <b>${aud(r.medianDwelling, { compact: true })}</b> <span class="${r.annualPct >= 0 ? 'up' : 'down'}">${pct(r.annualPct, 1, true)}</span>`),
      `<span>Rates refreshed</span> <b>${ago(rs.updated)}</b>`,
    ].filter(Boolean);
    const html = items.map((i) => `<div>${i}</div>`).join('');
    $('#ticker').innerHTML = `<div class="ticker-in">${html}${html}</div>`;
  } catch (e) {
    console.warn('ticker', e);
  }
}
ticker();
render();
