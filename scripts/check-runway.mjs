// Runs before every build. Warns in the Netlify deploy log when the daily lists
// are close to running out, so new foods get appended in time.
import { readFileSync } from 'node:fs';

const WARN_DAYS = 45;
const launch = Date.UTC(2026, 7, 15);
const d = new Date();
const today = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - launch) / 86_400_000) + 1;

for (const file of ['foods', 'plates']) {
  const rows = JSON.parse(readFileSync(new URL(`../data/${file}.json`, import.meta.url), 'utf8')).length;
  const left = rows - today;
  const lastDay = new Date(launch + (rows - 1) * 86_400_000).toISOString().slice(0, 10);
  if (left < WARN_DAYS) {
    console.warn(`\n⚠️  data/${file}.json runs out on ${lastDay} (${Math.max(0, left)} days left). Append more rows to the end.\n`);
  } else {
    console.log(`data/${file}.json: ${rows} dailies, last one ${lastDay} (${left} days left)`);
  }
}
