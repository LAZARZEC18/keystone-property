// Builds the ~90-second tour: a title card before each composed clip, joined into one 1080p MP4,
// plus WebVTT chapters and captions and a poster. Run after clips.mjs + compose.py.
//   node scripts/media/tour.mjs <clips dir> <out dir>
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

import { resolve } from 'node:path';
const [CLIPS, OUT] = process.argv.slice(2).map((x) => resolve(x));
const TMP = `${OUT}/tour-tmp`;
mkdirSync(TMP, { recursive: true });
const CH = [
  ['budgetmap', 'Where does your budget reach?', 'Drag a price and every suburb with a typical home under it lights up.'],
  ['afford', 'What can you comfortably afford?', 'A comfortable price where you want to buy, the stretch price, and the schemes you qualify for.'],
  ['estimate', 'What would a home like this cost?', 'A price range for a typical home like it, how far to trust it, and the cash you need.'],
  ['calculator', 'The 2026 tax changes, in dollars', 'The weekly cost after tax and the 10-year return under the new negative gearing and CGT rules.'],
  ['suburb', 'Everything about a suburb', 'Month-end prices, rents, new building, the people, the risks and the cost to buy.'],
  ['rates', 'Every lender’s rate', 'Read from the banks’ own feeds several times a day, with offset accounts and fees.'],
];
const CARD = 2.2;
const b = await chromium.launch({ args: [`--proxy-server=${process.env.HTTPS_PROXY}`, '--proxy-bypass-list=localhost;127.0.0.1'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
const card = (i, [, t, s]) => `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:1920px;height:1080px;background:radial-gradient(circle at 70% 40%,#12303a,#07141b 70%);color:#e8f3f1;font-family:'IBM Plex Sans',sans-serif;overflow:hidden}
.w{position:absolute;left:150px;top:370px;right:150px}.n{font:500 30px 'IBM Plex Mono';letter-spacing:.2em;color:#34d3a6}.t{font:600 104px/1.05 Fraunces;margin:18px 0 26px;letter-spacing:-.01em}.s{font-size:40px;color:#a9c4bf;max-width:1400px;line-height:1.35}
.k{position:absolute;right:150px;bottom:90px;font:500 26px 'IBM Plex Mono';letter-spacing:.24em;color:#7fa39d}</style></head><body><div class="w"><div class="n">${String(i + 1).padStart(2, '0')} / ${String(CH.length).padStart(2, '0')}</div><div class="t">${t}</div><div class="s">${s}</div></div><div class="k">KEYZING</div></body></html>`;
const parts = [];
const chapters = [];
const captions = [];
let t = 0;
const dur = (f) => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
const ts = (x) => new Date(x * 1000).toISOString().slice(11, 23);
for (const [i, ch] of CH.entries()) {
  await p.setContent(card(i, ch), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${TMP}/card${i}.png` });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-loop', '1', '-t', String(CARD), '-i', `${TMP}/card${i}.png`, '-vf', `fps=30,format=yuv420p,fade=t=in:st=0:d=0.35,fade=t=out:st=${CARD - 0.35}:d=0.35`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'stillimage', `${TMP}/c${i}.mp4`]);
  const clip = `${CLIPS}/${ch[0]}.mp4`;
  const d = dur(clip);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', clip, '-vf', `fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=${(d - 0.3).toFixed(2)}:d=0.3`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', `${TMP}/v${i}.mp4`]);
  parts.push(`${TMP}/c${i}.mp4`, `${TMP}/v${i}.mp4`);
  chapters.push(`${i + 1}\n${ts(t)} --> ${ts(t + CARD + d)}\n${ch[1]}`);
  captions.push(`${i + 1}\n${ts(t + 0.2)} --> ${ts(t + CARD + d - 0.2)}\n${ch[1]} ${ch[2]}`);
  t += CARD + d;
}
await b.close();
writeFileSync(`${TMP}/list.txt`, parts.map((f) => `file '${f}'`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${TMP}/list.txt`, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${OUT}/keyzing-tour.mp4`]);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(CARD + 4), '-i', `${OUT}/keyzing-tour.mp4`, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', `${OUT}/tour-poster.jpg`]);
writeFileSync(`${OUT}/keyzing-tour.chapters.vtt`, `WEBVTT\n\n${chapters.join('\n\n')}\n`);
writeFileSync(`${OUT}/keyzing-tour.en.vtt`, `WEBVTT\n\n${captions.join('\n\n')}\n`);
writeFileSync(`${OUT}/keyzing-tour.json`, JSON.stringify(CH.map(([id, title], i) => ({ id, title, start: +chapters[i].split('\n')[1].split(' --> ')[0].split(':').reduce((a, v) => a * 60 + +v, 0) }))));
console.log('tour', t.toFixed(1), 's');
