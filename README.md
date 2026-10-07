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
returns today's daily (in any time zone) and the 5 free archive days without an unlock token;
everything else requires a valid signed token.

## Routes

| Path | Page |
| --- | --- |
| `/`, `/plate` | Today's Single food / Full plate daily |
| `/archive?mode=plate&view=bonus` | Archive (past days or bonus) per mode |
| `/play/:mode/:kind/:n` | An archive day or bonus puzzle, e.g. `/play/food/daily/53` |
| `/stats` | Per-mode stats |
| `/unlock?session_id=…` | Where Stripe returns buyers; verifies and unlocks |
| `/restore` | Restore by email, or with a personal restore link |

## Payments

One $3.99 Stripe payment unlocks the archive and bonus puzzles in both modes. No database: Stripe holds
the purchase history, and the server issues HMAC-signed unlock tokens. Setup steps for Stripe, Netlify
environment variables and Resend are in [docs/PAYMENTS-SETUP.md](docs/PAYMENTS-SETUP.md). For local
development, copy `.env.example` to `.env` and fill in **test** values.

Players' history from the prototype (`calorieguesser:v2` in localStorage, same domain) is imported once on
first load by `src/lib/migrate.ts`. The prototype's unlock code is not carried over.

## Layout

```
shared/              Pure logic used by client and functions (dates, grading, types) + tests
netlify/functions/   Netlify Functions (v2, routed by config.path)
netlify/lib/         Server-only helpers (puzzle lookup from /data)
src/                 React app
dev/                 Vite plugin that serves the functions during `npm run dev`
scripts/             Data extraction from the prototype
```
