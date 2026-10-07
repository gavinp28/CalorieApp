import { gradeGuess, MAX_GUESSES, type Tier } from './grading';
import type { Mode, PuzzleKind } from './types';

const SQUARE: Record<Tier, string> = { win: '🟩', 'very-close': '🟨', warm: '🟧', cold: '⬛' };
const MODE_EMOJI: Record<Mode, string> = { food: '🍎', plate: '🍽️' };

export interface ShareInput {
  brand: string;
  mode: Mode;
  kind: PuzzleKind;
  number: number;
  guesses: number[];
  answer: number;
  url: string;
}

/**
 * Spoiler-free result, e.g.
 *   Forkcast 🍎 #54 3/5
 *   🟧⬆️
 *   🟨⬇️
 *   🟩✅
 *   https://example.com
 */
export function shareText({ brand, mode, kind, number, guesses, answer, url }: ShareInput): string {
  const grades = guesses.map((g) => gradeGuess(g, answer));
  const won = grades.some((g) => g.tier === 'win');
  const title = kind === 'daily' ? `#${number}` : `Bonus ${number}`;
  const lines = grades.map((g) => SQUARE[g.tier] + (g.tier === 'win' ? '✅' : g.direction === 'higher' ? '⬆️' : '⬇️'));
  return [`${brand} ${MODE_EMOJI[mode]} ${title} ${won ? guesses.length : 'X'}/${MAX_GUESSES}`, ...lines, url].join('\n');
}
