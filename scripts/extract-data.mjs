#!/usr/bin/env node
// Extracts the puzzle data from the original prototype (calorie-guesser.html)
// into /data/*.json. Daily order is preserved exactly, because puzzle numbers
// are derived from array position.
//
// Usage: npm run extract-data [-- path/to/calorie-guesser.html]

import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(process.argv[2] ?? resolve(root, 'calorie-guesser.html'));

if (!existsSync(src)) {
  console.error(`Prototype not found at ${src}`);
  process.exit(1);
}
const html = readFileSync(src, 'utf8');

/** Finds `const NAME = [ ... ]` and returns the literal source, bracket-matched. */
function findArrayLiteral(name) {
  const decl = new RegExp(`\\b(?:const|let|var)\\s+${name}\\s*=\\s*\\[`);
  const m = decl.exec(html);
  if (!m) throw new Error(`Could not find declaration of ${name}`);
  const start = m.index + m[0].length - 1;
  let depth = 0;
  let quote = null;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '[') depth++;
    else if (c === ']' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`Unterminated array literal for ${name}`);
}

function evalLiteral(name) {
  return vm.runInNewContext(`(${findArrayLiteral(name)})`, Object.create(null), { timeout: 2000 });
}

const FOODS = evalLiteral('FOODS');
const FOOD_BONUS = evalLiteral('FOOD_BONUS');
const PLATES = evalLiteral('PLATES');
const PLATE_BONUS = evalLiteral('PLATE_BONUS');
const LIB = evalLiteral('LIB');

const problems = [];
const check = (cond, msg) => cond || problems.push(msg);

for (const [label, rows] of [['FOODS', FOODS], ['FOOD_BONUS', FOOD_BONUS]]) {
  rows.forEach((r, i) =>
    check(
      Array.isArray(r) && r.length === 4 && typeof r[1] === 'string' && typeof r[2] === 'string' && Number.isFinite(r[3]),
      `${label}[${i}] is not [emoji, name, serving, kcal]: ${JSON.stringify(r)}`,
    ),
  );
}
LIB.forEach((r, i) =>
  check(
    Array.isArray(r) && r.length === 3 && typeof r[0] === 'string' && Number.isFinite(r[2]),
    `LIB[${i}] is not [food, measure, kcal]: ${JSON.stringify(r)}`,
  ),
);
for (const [label, rows] of [['PLATES', PLATES], ['PLATE_BONUS', PLATE_BONUS]]) {
  rows.forEach((r, i) => {
    const ok = Array.isArray(r) && r.length === 3 && Array.isArray(r[2]);
    check(ok, `${label}[${i}] is not [emoji, name, [LIB indexes]]: ${JSON.stringify(r)}`);
    if (ok) r[2].forEach((ix) => check(Number.isInteger(ix) && LIB[ix], `${label}[${i}] references missing LIB[${ix}]`));
  });
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

/** One row per line: diff-friendly and still valid JSON. */
const write = (file, rows) => {
  writeFileSync(resolve(root, 'data', file), `[\n${rows.map((r) => '  ' + JSON.stringify(r)).join(',\n')}\n]\n`);
};
write('foods.json', FOODS);
write('foods-bonus.json', FOOD_BONUS);
write('plates.json', PLATES);
write('plates-bonus.json', PLATE_BONUS);
write('plate-lib.json', LIB);
rmSync(resolve(root, 'data', 'SAMPLE_DATA'), { force: true });

console.log(
  `Extracted FOODS=${FOODS.length} FOOD_BONUS=${FOOD_BONUS.length} PLATES=${PLATES.length} ` +
    `PLATE_BONUS=${PLATE_BONUS.length} LIB=${LIB.length}`,
);
for (const [label, n, want] of [['FOODS', FOODS.length, 365], ['FOOD_BONUS', FOOD_BONUS.length, 40], ['PLATES', PLATES.length, 365], ['PLATE_BONUS', PLATE_BONUS.length, 40]]) {
  if (n !== want) console.warn(`warning: ${label} has ${n} entries, expected ${want}`);
}
