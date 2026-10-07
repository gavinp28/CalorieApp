import { MAX_GUESSES } from './grading';

/** A daily finished on its own day: the only games that count toward stats (same rule as the prototype). */
export interface DayResult {
  number: number;
  won: boolean;
  guessCount: number;
}

/** Stats carried over from the prototype, which stored running totals rather than per-day history. */
export interface LegacyStats {
  played: number;
  wins: number;
  streak: number;
  best: number;
  /** Puzzle number of the last daily counted. */
  lastDay: number;
  dist: number[];
}

export interface Stats {
  played: number;
  wins: number;
  winPct: number;
  /** Consecutive daily wins, still alive if the last win was today or yesterday. */
  streak: number;
  best: number;
  /** Wins by guess count, index 0 = solved in 1. */
  dist: number[];
}

export function computeStats(results: DayResult[], today: number, legacy?: LegacyStats): Stats {
  const base = legacy ?? { played: 0, wins: 0, streak: 0, best: 0, lastDay: 0, dist: [] };
  const days = [...new Map(results.filter((r) => r.number > base.lastDay).map((r) => [r.number, r])).values()].sort(
    (a, b) => a.number - b.number,
  );

  const dist = Array.from({ length: MAX_GUESSES }, (_, i) => base.dist[i] ?? 0);
  let played = base.played;
  let wins = base.wins;
  let best = base.best;
  // The run we are extending, and the day it last advanced on.
  let run = base.streak;
  let runDay = base.lastDay;

  for (const r of days) {
    played++;
    if (r.won) {
      wins++;
      dist[r.guessCount - 1]++;
      run = runDay === r.number - 1 ? run + 1 : 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
    runDay = r.number;
  }

  const streak = runDay >= today - 1 ? run : 0;
  return { played, wins, winPct: played ? Math.round((wins / played) * 100) : 0, streak, best, dist };
}
