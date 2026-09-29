// Interactive "where does my budget reach?" map. Every suburb is a dot; drag the budget and the suburbs with a
// typical home under it light up. Hover or tap for the figures, click to open the suburb, zoom and pan freely.
import { esc, aud } from './ui.js';
import { cleanName } from './data.js';

const CITIES = {
  AU: { name: 'Australia', lat: -28.2, lng: 134, z: 1 },
  SYD: { name: 'Sydney', lat: -33.83, lng: 151.0, z: 34 },
  MEL: { name: 'Melbourne', lat: -37.83, lng: 145.05, z: 32 },
  BNE: { name: 'Brisbane', lat: -27.5, lng: 153.02, z: 30 },
  PER: { name: 'Perth', lat: -31.98, lng: 115.87, z: 34 },
  ADL: { name: 'Adelaide', lat: -34.9, lng: 138.62, z: 46 },
  CBR: { name: 'Canberra', lat: -35.28, lng: 149.1, z: 60 },
  HBA: { name: 'Hobart', lat: -42.86, lng: 147.33, z: 60 },
  DRW: { name: 'Darwin', lat: -12.43, lng: 130.9, z: 56 },
};
const K = Math.cos((27 * Math.PI) / 180);
const proj = (lat, lng) => [(lng - 134) * K, -(lat + 28.2)];
const logB = (v) => Math.log(v);
const MIN = 250000;
const MAX = 3000000;
const fromSlider = (t) => Math.round(Math.exp(logB(MIN) + (logB(MAX) - logB(MIN)) * t) / 10000) * 10000;
const toSlider = (v) => (logB(v) - logB(MIN)) / (logB(MAX) - logB(MIN));

export function budgetMapHtml({ budget = 750000, city = 'AU' } = {}) {
  return `<div class="bmap" data-bmap>
    <div class="bmap-top">
      <div class="bmap-chips" role="group" aria-label="Zoom to a city">${Object.entries(CITIES).map(([k, c]) => `<button type="button" class="chip${k === city ? ' on' : ''}" data-city="${k}" aria-pressed="${k === city}">${c.name}</button>`).join('')}</div>
    </div>
    <div class="bmap-canvas-wrap"><canvas aria-label="Map of Australian suburbs. Suburbs with a typical home under your budget are highlighted." role="img"></canvas>
      <div class="bmap-tip" hidden></div>
      <div class="bmap-count" aria-live="polite"></div>
      <div class="bmap-hint">Drag to move · scroll or pinch to zoom · tap a dot</div>
    </div>
    <div class="bmap-controls">
      <label class="bmap-budget"><span>Budget</span><b class="bmap-val">${aud(budget, { compact: true })}</b><input type="range" min="0" max="1000" step="1" value="${Math.round(toSlider(budget) * 1000)}" aria-label="Budget"></label>
      <div class="seg bmap-type" role="group" aria-label="Home type"><button type="button" data-t="h" class="on" aria-pressed="true">Houses</button><button type="button" data-t="u" aria-pressed="false">Units and townhouses</button></div>
    </div>
    <div class="bmap-legend"><span><i class="in"></i>Typical home within budget</span><span><i class="near"></i>Within 10% over</span><span><i class="out"></i>Above budget</span><span class="fine">Typical prices at the latest month-end; most are modelled estimates.</span></div>
  </div>`;
}

export function wireBudgetMap(root, list, { onPick, onChange, budget = 750000, city = 'AU' } = {}) {
  const wrap = root.querySelector('[data-bmap]');
  if (!wrap) return () => {};
  const cv = wrap.querySelector('canvas');
  const g = cv.getContext('2d');
  const tip = wrap.querySelector('.bmap-tip');
  const countEl = wrap.querySelector('.bmap-count');
  const pts = list.filter((s) => s.lat && s.lng && (s.h || s.u)).map((s) => {
    const [x, y] = proj(s.lat, s.lng);
    return { s, x, y, r: 0.7 + Math.min(1.8, Math.sqrt(s.pop || 0) / 70) };
  });
  const st = { budget, type: 'h', city, hover: null, W: 0, H: 0, dpr: 1 };
  const cam = { x: 0, y: 0, z: 1 };
  const target = { x: 0, y: 0, z: 1 };
  let base = 1; // pixels per projected degree at z = 1
  const setCity = (k, instant = false) => {
    st.city = k;
    const c = CITIES[k];
    const [x, y] = proj(c.lat, c.lng);
    Object.assign(target, { x, y, z: c.z });
    if (instant) Object.assign(cam, target);
    wrap.querySelectorAll('[data-city]').forEach((b) => {
      b.classList.toggle('on', b.dataset.city === k);
      b.setAttribute('aria-pressed', String(b.dataset.city === k));
    });
    kick();
  };
  const size = () => {
    const r = cv.parentElement.getBoundingClientRect();
    st.dpr = Math.min(2, window.devicePixelRatio || 1);
    st.W = r.width;
    st.H = r.height;
    cv.width = Math.round(r.width * st.dpr);
    cv.height = Math.round(r.height * st.dpr);
    base = Math.min(st.W / 42, st.H / 34);
    kick();
  };
  const toScreen = (p) => [st.W / 2 + (p.x - cam.x) * base * cam.z, st.H / 2 + (p.y - cam.y) * base * cam.z];
  const priceOf = (s) => (st.type === 'u' ? s.u || null : s.h || null);
  const css = getComputedStyle(document.documentElement);
  const col = { in: '#34d3a6', near: '#f2c14e', out: '#5b6b78' };

  function draw() {
    g.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    const bg = g.createRadialGradient(st.W * 0.55, st.H * 0.45, 20, st.W * 0.55, st.H * 0.45, Math.max(st.W, st.H));
    bg.addColorStop(0, '#12303a');
    bg.addColorStop(1, '#07141b');
    g.fillStyle = bg;
    g.fillRect(0, 0, st.W, st.H);
    const zr = Math.min(2.2, 0.8 + Math.log2(cam.z) * 0.3);
    let n = 0;
    let nIn = 0;
    const lit = [];
    g.globalCompositeOperation = 'source-over';
    for (const p of pts) {
      const price = priceOf(p.s);
      if (!price) continue;
      const [X, Y] = toScreen(p);
      if (X < -10 || Y < -10 || X > st.W + 10 || Y > st.H + 10) continue;
      n++;
      const cls = price <= st.budget ? 'in' : price <= st.budget * 1.1 ? 'near' : 'out';
      if (cls === 'out') {
        g.fillStyle = col.out;
        g.globalAlpha = 0.35;
        g.fillRect(X - 0.8 * zr, Y - 0.8 * zr, 1.6 * zr, 1.6 * zr);
      } else {
        lit.push([X, Y, p, cls]);
        if (cls === 'in') nIn++;
      }
    }
    g.globalAlpha = 1;
    // additive glow reads well for the whole country; at city zoom plain dots stay legible
    g.globalCompositeOperation = cam.z < 6 ? 'lighter' : 'source-over';
    for (const [X, Y, p, cls] of lit) {
      g.fillStyle = cls === 'in' ? 'rgba(52,211,166,0.85)' : 'rgba(242,193,78,0.8)';
      g.beginPath();
      g.arc(X, Y, p.r * zr, 0, 6.283);
      g.fill();
      if (p.s.pop > 15000 && cam.z < 4) {
        g.fillStyle = cls === 'in' ? 'rgba(52,211,166,0.06)' : 'rgba(242,193,78,0.05)';
        g.beginPath();
        g.arc(X, Y, p.r * zr * 5, 0, 6.283);
        g.fill();
      }
    }
    g.globalCompositeOperation = 'source-over';
    // labels for the biggest visible suburbs when zoomed in
    if (cam.z >= 10) {
      const vis = pts.filter((p) => priceOf(p.s)).map((p) => [p, toScreen(p)]).filter(([, [X, Y]]) => X > 40 && Y > 20 && X < st.W - 40 && Y < st.H - 20).sort((a, b) => (b[0].s.pop || 0) - (a[0].s.pop || 0)).slice(0, cam.z >= 30 ? 18 : 10);
      g.font = '600 12px "IBM Plex Sans", system-ui, sans-serif';
      g.textAlign = 'center';
      const placed = [];
      for (const [p, [X, Y]] of vis) {
        if (placed.some(([a, b]) => Math.abs(a - X) < 90 && Math.abs(b - Y) < 18)) continue;
        placed.push([X, Y]);
        const t = cleanName(p.s.n);
        g.fillStyle = '#07141bcc';
        g.fillText(t, X + 1, Y - 8);
        g.fillStyle = '#e8f3f1';
        g.fillText(t, X, Y - 9);
      }
    }
    if (st.hover) {
      const [X, Y] = toScreen(st.hover);
      g.strokeStyle = '#fff';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(X, Y, st.hover.r * zr + 4, 0, 6.283);
      g.stroke();
    }
    const where = st.city === 'AU' ? 'across Australia' : `in and around ${CITIES[st.city].name}`;
    // across Australia, count against every suburb Ownaroo covers so the total matches the explorer
    const total = st.city === 'AU' ? list.length : n;
    countEl.innerHTML = st.city === 'AU'
      ? `<b>${nIn.toLocaleString()}</b> of Australia's ${total.toLocaleString()} suburbs have a typical ${st.type === 'u' ? 'unit' : 'house'} under <b>${aud(st.budget, { compact: true })}</b>`
      : `<b>${nIn.toLocaleString()}</b> of the ${n.toLocaleString()} suburbs ${where} with a ${st.type === 'u' ? 'unit' : 'house'} price have a typical ${st.type === 'u' ? 'unit' : 'house'} under <b>${aud(st.budget, { compact: true })}</b>`;
  }

  let raf = 0;
  function frame() {
    raf = 0;
    let moving = false;
    const zoomingIn = target.z > cam.z * 1.01;
    const kxy = zoomingIn ? 0.24 : 0.13;
    const panLeft = Math.hypot(target.x - cam.x, target.y - cam.y) * base * cam.z; // pixels still to pan
    const kz = zoomingIn ? (panLeft > 40 ? 0.03 : 0.16) : 0.2;
    for (const a of ['x', 'y']) {
      const d = target[a] - cam[a];
      if (Math.abs(d) * base * cam.z > 0.3) {
        cam[a] += d * kxy;
        moving = true;
      } else cam[a] = target[a];
    }
    const lz = Math.log(target.z) - Math.log(cam.z);
    if (Math.abs(lz) > 0.004) {
      cam.z = Math.exp(Math.log(cam.z) + lz * kz);
      moving = true;
    } else cam.z = target.z;
    draw();
    if (moving) kick();
  }
  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  // hover / tap
  const nearest = (mx, my) => {
    let best = null;
    let bd = 14 * 14;
    for (const p of pts) {
      if (!priceOf(p.s)) continue;
      const [X, Y] = toScreen(p);
      const d = (X - mx) ** 2 + (Y - my) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  };
  const showTip = (p, mx, my) => {
    st.hover = p;
    if (!p) {
      tip.hidden = true;
      cv.style.cursor = 'grab';
      kick();
      return;
    }
    const s = p.s;
    const price = priceOf(s);
    const diff = price - st.budget;
    tip.innerHTML = `<b>${esc(cleanName(s.n))}</b> <span>${s.s} ${s.pc || ''}</span><div>Typical house ${s.h ? aud(s.h, { compact: true }) : '—'} · unit ${s.u ? aud(s.u, { compact: true }) : '—'}</div><div class="${diff <= 0 ? 'up' : 'down'}">${diff <= 0 ? `Within budget by ${aud(-diff, { compact: true })}` : `${aud(diff, { compact: true })} over budget`}</div><small>${(s.pop || 0).toLocaleString()} residents · click for the suburb report</small>`;
    tip.hidden = false;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    tip.style.left = `${Math.max(6, Math.min(st.W - tw - 6, mx + 14))}px`;
    tip.style.top = `${Math.max(6, Math.min(st.H - th - 6, my - th - 10))}px`;
    cv.style.cursor = 'pointer';
    kick();
  };

  // pan, zoom, pinch
  const pointers = new Map();
  let drag = null;
  let pinch = null;
  const local = (e) => {
    const r = cv.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, local(e));
    if (pointers.size === 1) drag = { start: local(e), cam: { ...target }, moved: false };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: target.z };
      drag = null;
    }
  });
  cv.addEventListener('pointermove', (e) => {
    const [mx, my] = local(e);
    if (pointers.has(e.pointerId)) pointers.set(e.pointerId, [mx, my]);
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      target.z = Math.max(0.8, Math.min(160, (pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d));
      cam.z = target.z;
      kick();
      return;
    }
    if (drag && pointers.size === 1) {
      const dx = mx - drag.start[0];
      const dy = my - drag.start[1];
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      if (drag.moved) {
        target.x = drag.cam.x - dx / (base * target.z);
        target.y = drag.cam.y - dy / (base * target.z);
        Object.assign(cam, { x: target.x, y: target.y });
        tip.hidden = true;
        cv.style.cursor = 'grabbing';
        kick();
        return;
      }
    }
    if (e.pointerType === 'mouse') showTip(nearest(mx, my), mx, my);
  });
  const end = (e) => {
    const [mx, my] = local(e);
    const wasTap = drag && !drag.moved;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (wasTap) {
      const p = nearest(mx, my);
      if (p && (e.pointerType === 'mouse' || st.hover === p)) onPick?.(p.s);
      else showTip(p, mx, my);
    }
    drag = null;
    cv.style.cursor = st.hover ? 'pointer' : 'grab';
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', (e) => {
    pointers.delete(e.pointerId);
    drag = null;
    pinch = null;
  });
  cv.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && showTip(null));
  cv.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const [mx, my] = local(e);
      const f = e.deltaY < 0 ? 1.25 : 0.8;
      const nz = Math.max(0.8, Math.min(160, target.z * f));
      // keep the point under the cursor fixed
      const wx = target.x + (mx - st.W / 2) / (base * target.z);
      const wy = target.y + (my - st.H / 2) / (base * target.z);
      target.x = wx - (mx - st.W / 2) / (base * nz);
      target.y = wy - (my - st.H / 2) / (base * nz);
      target.z = nz;
      kick();
    },
    { passive: false },
  );

  // controls
  const slider = wrap.querySelector('input[type=range]');
  const val = wrap.querySelector('.bmap-val');
  slider.addEventListener('input', () => {
    st.budget = fromSlider(+slider.value / 1000);
    val.textContent = aud(st.budget, { compact: true });
    onChange?.(st);
    kick();
  });
  wrap.querySelector('.bmap-type').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    st.type = b.dataset.t;
    wrap.querySelectorAll('.bmap-type button').forEach((x) => {
      x.classList.toggle('on', x === b);
      x.setAttribute('aria-pressed', String(x === b));
    });
    onChange?.(st);
    kick();
  });
  wrap.querySelector('.bmap-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-city]');
    if (!b) return;
    setCity(b.dataset.city);
    onChange?.(st);
  });
  const ro = new ResizeObserver(size);
  ro.observe(cv.parentElement);
  size();
  setCity(city, true);
  void css;
  return () => {
    ro.disconnect();
    cancelAnimationFrame(raf);
  };
}
