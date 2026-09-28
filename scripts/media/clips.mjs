// Records the product demo clips in full HD: Chrome renders at 1.5x (1920x1080) and every changed frame is captured
// through the DevTools screencast, then encoded at a constant 30 fps. compose.py adds the backdrop.
//   node scripts/serve.mjs &   then   node scripts/media/clips.mjs   (ONLY=afford,rates to record some)
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { mkdirSync, rmSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const B = process.env.BASE || 'http://127.0.0.1:8788';
const OUT = process.cwd() + '/clips-raw';
if (!process.env.ONLY) rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] });
const offsets = existsSync(`${OUT}/offsets.json`) ? JSON.parse(readFileSync(`${OUT}/offsets.json`, 'utf8')) : {};

async function clip(name, url, act) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return;
  const dir = `${OUT}/${name}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir);
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, colorScheme: 'light' });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  const frames = [];
  cdp.on('Page.screencastFrame', async (f) => {
    const i = frames.length;
    writeFileSync(`${dir}/${String(i).padStart(5, '0')}.jpg`, Buffer.from(f.data, 'base64'));
    frames.push(f.metadata.timestamp);
    await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }).catch(() => {});
  });
  await p.goto(B + url, { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: '.demo{display:none!important} .page-head.with-demo{grid-template-columns:1fr!important} .ticker{display:none!important} html{scroll-behavior:auto} .bmap-hint{display:none!important}' });
  await p.waitForTimeout(900);
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  const t0 = Date.now() / 1000;
  const wait = (ms) => p.waitForTimeout(ms);
  const scroll = async (px, steps = 30, ms = 40) => { for (let i = 0; i < steps; i++) { await p.mouse.wheel(0, px / steps); await wait(ms); } };
  const type = async (sel, text, delay = 70) => { await p.click(sel, { clickCount: 3 }); await p.keyboard.press('Backspace'); await p.type(sel, text, { delay }); };
  // a small tick keeps frames flowing while nothing changes, so pauses keep their length
  await p.evaluate(() => { const d = document.createElement('i'); d.id = 'rec-tick'; d.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:.01;pointer-events:none;z-index:9999'; document.body.append(d); let k = 0; setInterval(() => { d.style.background = (k++ % 2) ? '#000' : '#fff'; }, 33); });
  await wait(400);
  await act({ p, wait, scroll, type });
  await wait(300);
  await cdp.send('Page.stopScreencast');
  const end = Date.now() / 1000;
  await ctx.close();
  // constant-rate video from the frame timestamps
  const list = frames.map((t, i) => `file '${dir}/${String(i).padStart(5, '0')}.jpg'\nduration ${Math.max(0.001, (frames[i + 1] ?? end) - t).toFixed(4)}`).join('\n');
  writeFileSync(`${dir}/list.txt`, `${list}\nfile '${dir}/${String(frames.length - 1).padStart(5, '0')}.jpg'\n`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${dir}/list.txt`, '-vf', 'fps=30,scale=1920:1080:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '12', `${OUT}/${name}.mp4`]);
  rmSync(dir, { recursive: true, force: true });
  offsets[name] = { ready: 0.3, end: end - t0 };
  console.log(name, frames.length, 'frames', (end - t0).toFixed(1), 's');
}

await clip('budgetmap', '/', async ({ p, wait }) => {
  await wait(900);
  const s = await p.$('.bmap input[type=range]');
  const box = await s.boundingBox();
  const at = (t) => [box.x + box.width * t, box.y + box.height / 2];
  await p.mouse.move(...at(0.41)); await p.mouse.down();
  for (let t = 0.41; t >= 0.2; t -= 0.01) { await p.mouse.move(...at(t)); await wait(35); }
  for (let t = 0.2; t <= 0.62; t += 0.01) { await p.mouse.move(...at(t)); await wait(35); }
  await p.mouse.up(); await wait(700);
  await p.click('.bmap [data-city="PER"]'); await wait(1800);
  const c = await (await p.$('.bmap canvas')).boundingBox();
  for (let k = 0; k <= 24; k++) { await p.mouse.move(c.x + c.width * (0.3 + k * 0.012), c.y + c.height * (0.45 + Math.sin(k / 4) * 0.08)); await wait(70); }
  await wait(1200);
  await p.click('.bmap [data-t="u"]'); await wait(1400);
  await p.click('.bmap [data-city="SYD"]'); await wait(2200);
});
await clip('afford', '/afford?buyer=fhb', async ({ p, wait, scroll, type }) => {
  await wait(500); await p.selectOption('[name=where]', 'r:PER'); await wait(500);
  await type('[name=savings]', '110000'); await wait(250); await type('[name=income]', '95000'); await wait(250); await type('[name=income2]', '60000'); await wait(300);
  await p.click('#go'); await wait(1800);
  await scroll(420, 30, 45); await wait(1800); await scroll(620, 36, 45); await wait(2000); await scroll(760, 40, 45); await wait(1600);
});
await clip('calculator', '/analyse?state=WA&price=720000&rent=680&built=2008', async ({ p, wait, scroll, type }) => {
  await wait(700); await scroll(240, 20, 40); await wait(700);
  await type('#a-price', '650000', 100); await p.press('#a-price', 'Tab'); await wait(1300);
  await type('#a-rent', '720', 130); await p.press('#a-rent', 'Tab'); await wait(1500);
  await scroll(700, 40, 45); await wait(1500); await scroll(600, 36, 45); await wait(1500);
});
await clip('estimate', '/property', async ({ p, wait, scroll, type }) => {
  await wait(400); await type('#pq', '20 Grant Street, Cottesloe WA 6011', 50); await wait(300); await p.press('#pq', 'Enter');
  await wait(3600); await scroll(300, 20, 45); await wait(700);
  await type('[name=asking]', '2150000', 100); await p.dispatchEvent('[name=asking]', 'input'); await wait(1800);
  await scroll(420, 30, 45); await wait(2000);
});
await clip('suburb', '/suburb/wa/cottesloe-6011', async ({ wait, scroll }) => {
  await wait(2400); await scroll(300, 24, 45); await wait(1800); await scroll(600, 36, 45); await wait(1600); await scroll(700, 40, 45); await wait(1600);
});
await clip('rates', '/rates', async ({ p, wait, scroll }) => {
  await wait(700); await scroll(380, 24, 45); await wait(700);
  await p.selectOption('#r-purpose', 'OO'); await wait(1200); await p.check('#r-offset').catch(() => {}); await wait(1300);
  await p.selectOption('#r-type', 'fixed'); await wait(1200); await p.selectOption('#r-term', '2'); await wait(1300);
  await scroll(460, 30, 45); await wait(1800);
});
await clip('firsthome', '/first-home', async ({ wait, scroll }) => {
  await wait(900); await scroll(500, 30, 45); await wait(1800); await scroll(700, 40, 45); await wait(2000); await scroll(700, 40, 45); await wait(1800);
});
await b.close();
writeFileSync(`${OUT}/offsets.json`, JSON.stringify(offsets));
