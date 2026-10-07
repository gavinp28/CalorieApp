import type { Mode } from './types';

export const MAX_GUESSES = 5;
export const SCALE_MAX: Record<Mode, number> = { food: 1000, plate: 1500 };
/** Highest number the guess input accepts. */
export const GUESS_MAX = 9999;

export type Tier = 'win' | 'very-close' | 'warm' | 'cold';
/** Which way the answer lies relative to the guess. */
export type Direction = 'higher' | 'lower' | 'exact';

export interface Grade {
  tier: Tier;
  direction: Direction;
  /** Absolute error as a fraction of the answer (0.12 = 12% off). */
  off: number;
}

/**
 * Tier boundaries are inclusive: exactly 5% off still wins, exactly 10% is
 * "very close", exactly 25% is "warm". Integer math avoids float edge cases.
 */
export function gradeGuess(guess: number, answer: number): Grade {
  const diff = Math.abs(guess - answer);
  const direction: Direction = guess < answer ? 'higher' : guess > answer ? 'lower' : 'exact';
  const off = answer === 0 ? (diff === 0 ? 0 : Infinity) : diff / answer;
  let tier: Tier;
  if (diff * 100 <= answer * 5) tier = 'win';
  else if (diff * 100 <= answer * 10) tier = 'very-close';
  else if (diff * 100 <= answer * 25) tier = 'warm';
  else tier = 'cold';
  return { tier, direction, off };
}

export const TIER_LABEL: Record<Tier, string> = {
  win: 'Got it!',
  'very-close': 'Very close',
  warm: 'Warm',
  cold: 'Not close',
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  higher: 'Higher',
  lower: 'Lower',
  exact: 'Exact',
};

export interface Range {
  low: number;
  high: number;
}

/**
 * The window the answer must be in after the given guesses: a "higher" guess
 * raises the floor, a "lower" one drops the ceiling. The ceiling starts open
 * (Infinity) rather than at the scale max, so a rare answer above the scale never
 * contradicts the hints and the starting bar never leaks anything. The UI draws
 * the bar over 0..SCALE_MAX and labels an open ceiling as "1000+".
 */
export function answerRange(guesses: number[], answer: number): Range {
  let low = 0;
  let high = Infinity;
  for (const g of guesses) {
    if (g < answer) low = Math.max(low, g);
    else if (g > answer) high = Math.min(high, g);
    else low = high = g;
  }
  return { low, high };
}

export type GameStatus = 'playing' | 'won' | 'lost';

export function gameStatus(guesses: number[], answer: number): GameStatus {
  if (guesses.some((g) => gradeGuess(g, answer).tier === 'win')) return 'won';
  return guesses.length >= MAX_GUESSES ? 'lost' : 'playing';
}

/** Parses free-form input like "1,250" or " 320 kcal" into a guess, or null if invalid. */
export function parseGuess(input: string): number | null {
  const digits = input.replace(/[,\s]|kcal|cal/gi, '');
  if (!/^\d+$/.test(digits)) return null;
  const n = Number(digits);
  return n >= 1 && n <= GUESS_MAX ? n : null;
}
