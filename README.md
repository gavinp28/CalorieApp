# Daily calorie puzzle

A daily calorie-guessing game. Vite + React + TypeScript + Tailwind, hosted on Netlify with Netlify Functions.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173  (the /api functions run inside Vite, no Netlify CLI needed)
npm test           # Vitest: date math, grading, puzzle API access rules, data shape
npm run build      # typecheck + production build into dist/
```

Preview the identity directions with `?brand=tomato`, `?brand=basil` or `?brand=neon`, or use the picker at the top of the page.

## Data

`data/*.json` holds the puzzles, extracted from the original prototype:

| File | Rows |
| --- | --- |
| `foods.json` | 365 daily single foods: `[emoji, name, serving, kcal]` |
| `foods-bonus.json` | 40 bonus single foods |
| `plates.json` | 365 daily plates: `[emoji, name, [plate-lib indexes]]` |
| `plates-bonus.json` | 40 bonus plates |
| `plate-lib.json` | Plate ingredients: `[food, measure, kcal]` |

Daily puzzle *n* uses row *n − 1* (puzzle #1 = Aug 15, 2026), so **never reorder or delete rows**.
To add more days, append rows to the end of `foods.json` / `plates.json` (plates can reference new
`plate-lib.json` rows, also appended). Lists never wrap around; every build prints how many days are
left and warns when fewer than 45 remain. If a list does run out, that day shows a "still cooking" message.

To (re)extract from the prototype: put `calorie-guesser.html` in the repo root and run `npm run extract-data`.
While `data/SAMPLE_DATA` exists, the data is a small placeholder set and must not be deployed.

The client never imports `/data`. Puzzles are served by `netlify/functions/puzzle.ts`, which only
returns today's daily (in any time zone) and the 5 free archive days without an unlock token.

## Layout

```
shared/              Pure logic used by client and functions (dates, grading, types) + tests
netlify/functions/   Netlify Functions (v2, routed by config.path)
netlify/lib/         Server-only helpers (puzzle lookup from /data)
src/                 React app
dev/                 Vite plugin that serves the functions during `npm run dev`
scripts/             Data extraction from the prototype
```
