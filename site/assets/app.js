// Keyzing single-page app: router, global search, ticker, theme.
import { $, $$, esc, aud, pct, ago } from './ui.js';
import { load, suburbs, searchSuburbs, cleanName, suburbUrl } from './data.js';
import { looksLikeAddress } from './intent.js';

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
  [/^\/afford\/?$/, () => import('./pages/afford.js')],
  [/^\/rates\/?$/, () => import('./pages/rates.js')],
  [/^\/listings\/?$/, () => Promise.resolve({ default: () => navigate(`/property${location.search.includes('q=') ? location.search : ''}`, true) })],
  [/^\/news\/?$/, () => import('./pages/news.js')],
  [/^\/guide\/?$/, () => import('./pages/guide.js')],
  [/^\/compare\/?$/, () => import('./pages/compare.js')],
  [/^\/watchlist\/?$/, () => import('./pages/watchlist.js')],
  [/^\/borrowing\/?$/, () => import('./pages/borrowing.js')],
  [/^\/methodology\/?$/, () => import('./pages/methodology.js')],
  [/^\/find\/?$/, () => import('./pages/find.js')],
  [/^\/property\/?$/, () => import('./pages/property.js')],
  [/^\/map\/?$/, () => import('./pages/topmap.js')],
  [/^\/(?<page>about|privacy|terms|contact)\/?$/, () => import('./pages/about.js')],
  [/^\/first-home\/?$/, () => import('./pages/firsthome.js')],
  [/^\/why\/?$/, () => import('./pages/why.js')],
];

let current = null;
let firstRender = true;

async function render() {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const main = $('#main');
  const match = routes.find(([re]) => re.test(path));
  $$('.nav a').forEach((a) => {
    const h = a.getAttribute('href').split(/[?#]/)[0];
    a.classList.toggle('on', h !== '/' && (path === h || path.startsWith(`${h}/`)));
  });
  $$('.nav-group').forEach((g) => {
    g.classList.toggle('on', !!g.querySelector('a.on'));
    g.classList.remove('open');
    g.querySelector('.nav-top')?.setAttribute('aria-expanded', 'false');
  });
  if (document.activeElement?.closest?.('.nav')) document.activeElement.blur();
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
    // keep the static home hero from index.html on screen until the live page is ready
    if (!(firstRender && path === '/')) main.innerHTML = '<div class="loading">Loading…</div>';
    firstRender = false;
    current = (await mod.default(main, params, query)) || null;
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="empty"><h2>Something went wrong loading this page.</h2><p class="muted">${esc(e.message)}</p><p><a href="/" data-link>Back to the home page</a></p></div>`;
  }
  if (!location.hash) window.scrollTo({ top: 0 });
  else document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
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
$$('.nav-top').forEach((b) =>
  b.addEventListener('click', () => {
    const g = b.closest('.nav-group');
    const open = !g.classList.contains('open');
    $$('.nav-group').forEach((x) => x !== g && x.classList.remove('open'));
    g.classList.toggle('open', open);
    b.setAttribute('aria-expanded', String(open));
  }),
);
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-group')) $$('.nav-group').forEach((x) => x.classList.remove('open'));
});
$('#menu').addEventListener('click', () => {
  const nav = $('.nav');
  nav.classList.toggle('open');
  $('#menu').setAttribute('aria-expanded', nav.classList.contains('open'));
});

// ---- search (header, hero + reusable suburb pickers)
const DESCRIPTIVE = /\b(bed|beds|bedroom|under|below|between|near|close to|within|yield|cash ?flow|growth|house|houses|home|unit|units|apartment|townhouse|first home|beach|coast|cbd|city|regional|budget|cheap|affordable|invest)\b|\$|\d+\s*k\b/i;
/** Where free text typed into a smart search box should go: an address, a described search, or a suburb. */
export function routeQuery(q, items = []) {
  const t = q.trim();
  if (!t) return null;
  if (looksLikeAddress(t)) return `/property?q=${encodeURIComponent(t)}`;
  if (DESCRIPTIVE.test(t) || !items.length) return `/find?q=${encodeURIComponent(t)}`;
  return suburbUrl(items[0]);
}

export function attachSearch(input, box, onPick) {
  const smart = !onPick;
  let items = [];
  let sel = -1;
  const show = async () => {
    const q = input.value;
    if (q.trim().length < 2) {
      box.hidden = true;
      return;
    }
    const { list } = await suburbs();
    items = searchSuburbs(list, q, smart ? 8 : 10);
    sel = -1;
    let head = '';
    if (smart) {
      const enc = encodeURIComponent(q.trim());
      if (looksLikeAddress(q)) head = `<a href="/property?q=${enc}" data-x="1" class="ac-act"><span><b>Value this property</b> <span class="muted">${esc(q.trim())}</span></span><small>Address →</small></a>`;
      else if (DESCRIPTIVE.test(q) || q.trim().split(/\s+/).length >= 3) head = `<a href="/find?q=${enc}" data-x="1" class="ac-act"><span><b>Smart search</b> <span class="muted">"${esc(q.trim())}"</span></span><small>Search →</small></a>`;
    }
    box.innerHTML =
      head +
      (items.length
        ? items.map((s, i) => `<a href="${suburbUrl(s)}" data-i="${i}"><span>${esc(cleanName(s.n))} <span class="muted">${s.s} ${s.pc || ''}</span></span><small>${aud(s.pt === 'u' ? s.u : s.h, { compact: true })} · ${pct(s.y, 1)}</small></a>`).join('')
        : head
          ? ''
          : `<div class="note" style="padding:10px 12px">No suburb matches "${esc(q)}".${smart ? ' Press Enter to run a smart search.' : ''}</div>`);
    box.hidden = false;
  };
  input.addEventListener('input', show);
  input.addEventListener('focus', show);
  input.addEventListener('keydown', (e) => {
    const links = $$('a', box);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!links.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('sel', i === sel));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = sel >= 0 ? links[sel] : null;
      box.hidden = true;
      if (chosen && chosen.dataset.x) {
        input.blur();
        return navigate(chosen.getAttribute('href'));
      }
      const pick = chosen ? items[+chosen.dataset.i] : null;
      if (onPick) {
        const p = pick || items[0];
        if (p) {
          input.blur();
          onPick(p);
        }
        return;
      }
      const url = pick ? suburbUrl(pick) : routeQuery(input.value, items);
      if (url) {
        input.blur();
        navigate(url);
      }
    } else if (e.key === 'Escape') box.hidden = true;
  });
  box.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-i]');
    box.hidden = true;
    if (!a) return;
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
