import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { mkdirSync, rmSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
const B = 'http://127.0.0.1:8788';
const OUT = process.cwd() + '/clips-raw';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] });
const offsets = {};
async function clip(name, url, act) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return;
  const dir = `${OUT}/${name}`; mkdirSync(dir);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir, size: { width: 1280, height: 720 } }, colorScheme: 'light' });
  const p = await ctx.newPage();
  const t0 = Date.now();
  await p.goto(B + url, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.demo{display:none!important} .page-head.with-demo{grid-template-columns:1fr!important} .ticker{display:none!important} html{scroll-behavior:auto}' });
  await p.waitForTimeout(1200);
  const ready = (Date.now() - t0) / 1000;
  const wait = (ms) => p.waitForTimeout(ms);
  const scroll = async (px, steps = 30, ms = 40) => { for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, px / steps); await wait(ms); } };
  const type = async (sel, text, delay = 70) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, text, { delay }); };
  await act({ p, wait, scroll, type });
  const end = (Date.now() - t0) / 1000;
  await ctx.close();
  const f = readdirSync(dir).find((x) => x.endsWith('.webm'));
  renameSync(`${dir}/${f}`, `${OUT}/${name}.webm`);
  offsets[name] = { ready, end };
  console.log(name, ready.toFixed(1), end.toFixed(1));
}
await clip('afford', '/afford?buyer=fhb', async ({ p, wait, scroll, type }) => {
  await wait(600); await type('[name=savings]', '85000'); await wait(300); await type('[name=income]', '105000'); await wait(400);
  await p.click('#go'); await wait(1200);
  await p.click('[data-where="r:PER"]').catch(() => {}); await wait(1600);
  await scroll(520, 30, 45); await wait(1600); await scroll(620, 36, 45); await wait(2200); await scroll(700, 40, 45); await wait(1800);
});
await clip('calculator', '/analyse?state=WA&price=720000&rent=680', async ({ p, wait, scroll, type }) => {
  await wait(800); await scroll(260, 20, 40); await wait(900);
  await type('#a-price', '650000', 110); await p.press('#a-price', 'Tab'); await wait(1400);
  await type('#a-rent', '720', 140); await p.press('#a-rent', 'Tab'); await wait(1600);
  await scroll(700, 40, 45); await wait(1600); await scroll(600, 36, 45); await wait(1600);
});
await clip('estimate', '/property', async ({ p, wait, scroll, type }) => {
  await wait(500); await type('#pq', '7 Russell Street, Morley WA 6062', 55); await wait(300); await p.press('#pq', 'Enter');
  await wait(3800); await scroll(260, 20, 45); await wait(800);
  await type('[name=asking]', '899000', 110); await p.dispatchEvent('[name=asking]', 'input'); await wait(1800);
  await scroll(420, 30, 45); await wait(2200);
});
await clip('suburb', '/suburb/wa/cottesloe-6011', async ({ wait, scroll }) => {
  await wait(3000); await scroll(300, 24, 45); await wait(2200); await scroll(600, 36, 45); await wait(1800); await scroll(700, 40, 45); await wait(1800);
});
await clip('rates', '/rates', async ({ p, wait, scroll }) => {
  await wait(800); await scroll(380, 24, 45); await wait(800);
  await p.selectOption('#r-purpose', 'OO'); await wait(1400); await p.selectOption('#r-type', 'fixed'); await wait(1400); await p.selectOption('#r-term', '2'); await wait(1400);
  await scroll(500, 30, 45); await wait(2000);
});
await clip('firsthome', '/first-home', async ({ wait, scroll }) => {
  await wait(1000); await scroll(500, 30, 45); await wait(2000); await scroll(700, 40, 45); await wait(2200); await scroll(700, 40, 45); await wait(2000);
});
await b.close();
writeFileSync(`${OUT}/offsets.json`, JSON.stringify(offsets));
