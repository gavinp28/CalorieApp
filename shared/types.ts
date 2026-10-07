export type Mode = 'food' | 'plate';
export type PuzzleKind = 'daily' | 'bonus';

/** Raw rows exactly as stored in /data. */
export type FoodRow = [emoji: string, name: string, serving: string, kcal: number];
export type PlateRow = [emoji: string, name: string, libIndexes: number[]];
export type LibRow = [food: string, measure: string, kcal: number];

interface PuzzleBase {
  /** Stable id, e.g. "food-daily-54" or "plate-bonus-3". */
  id: string;
  mode: Mode;
  kind: PuzzleKind;
  /** Daily: puzzle number (1 = Aug 15 2026). Bonus: 1..40. */
  number: number;
  emoji: string;
  name: string;
  /** The answer, in kcal. */
  kcal: number;
}

export interface FoodPuzzle extends PuzzleBase {
  mode: 'food';
  serving: string;
}

export interface PlateItem {
  food: string;
  measure: string;
  kcal: number;
}

export interface PlatePuzzle extends PuzzleBase {
  mode: 'plate';
  items: PlateItem[];
}

export type Puzzle = FoodPuzzle | PlatePuzzle;

export const puzzleId = (mode: Mode, kind: PuzzleKind, number: number) => `${mode}-${kind}-${number}`;
