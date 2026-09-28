// Fails (exit 1) when any data job has failed three hourly runs in a row, so GitHub emails the repository owner.
// Runs as the last workflow step, after the data is committed, so a failing source never blocks the others.
import { readFile } from 'node:fs/promises';

const health = JSON.parse(await readFile(new URL('../data/history/health.json', import.meta.url), 'utf8').catch(() => '{}'));
const stuck = Object.entries(health).filter(([, n]) => n >= 3);
if (stuck.length) {
  console.error(`Data jobs failing 3 or more runs in a row: ${stuck.map(([k, n]) => `${k} (${n})`).join(', ')}. The site keeps the last good data.`);
  process.exit(1);
}
console.log('All data jobs healthy.');
