import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { mkdirSync, rmSync } from 'node:fs';
const [,, page, out, secs = '12', fps = '30'] = process.argv;
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
const b = await chromium.launch({ args: [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(page, { waitUntil: 'networkidle' });
await p.waitForFunction(() => window.READY === true, null, { timeout: 30000 });
const n = Math.round(+secs * +fps);
for (let i = 0; i < n; i++) {
  await p.evaluate((t) => window.draw(t), i / +fps);
  await p.locator('canvas').screenshot({ path: `${out}/f${String(i).padStart(4, '0')}.png` });
}
await b.close();
console.log('frames', n);
