// Server-only: builds puzzles from /data. Never import this from src/ —
// locked archive and bonus data must not reach the public bundle.
import foods from '../../data/foods.json' with { type: 'json' };
import foodBonus from '../../data/foods-bonus.json' with { type: 'json' };
import plates from '../../data/plates.json' with { type: 'json' };
import plateBonus from '../../data/plates-bonus.json' with { type: 'json' };
import plateLib from '../../data/plate-lib.json' with { type: 'json' };
import { dailyIndex } from '../../shared/dates';
import { puzzleId, type FoodRow, type LibRow, type Mode, type PlateRow, type Puzzle, type PuzzleKind } from '../../shared/types';

const FOODS = foods as FoodRow[];
const FOOD_BONUS = foodBonus as FoodRow[];
const PLATES = plates as PlateRow[];
const PLATE_BONUS = plateBonus as PlateRow[];
const LIB = plateLib as LibRow[];

/** Last daily puzzle number each mode has data for. */
export const DAILY_COUNT: Record<Mode, number> = { food: FOODS.length, plate: PLATES.length };

export const BONUS_COUNT: Record<Mode, number> = { food: FOOD_BONUS.length, plate: PLATE_BONUS.length };

/** Returns the puzzle, or null if the number is out of range. Does not check access. */
export function getPuzzle(mode: Mode, kind: PuzzleKind, number: number): Puzzle | null {
  if (!Number.isInteger(number) || number < 1) return null;
  const id = puzzleId(mode, kind, number);
  if (mode === 'food') {
    const row =
      kind === 'daily' ? (FOODS[dailyIndex(number, FOODS.length)] as FoodRow | undefined) : (FOOD_BONUS[number - 1] as FoodRow | undefined);
    if (!row) return null;
    const [emoji, name, serving, kcal] = row;
    return { id, mode, kind, number, emoji, name, serving, kcal };
  }
  const row =
    kind === 'daily'
      ? (PLATES[dailyIndex(number, PLATES.length)] as PlateRow | undefined)
      : (PLATE_BONUS[number - 1] as PlateRow | undefined);
  if (!row) return null;
  const [emoji, name, indexes] = row;
  const items = indexes.map((i) => {
    const [food, measure, kcal] = LIB[i];
    return { food, measure, kcal };
  });
  return { id, mode, kind, number, emoji, name, items, kcal: items.reduce((sum, it) => sum + it.kcal, 0) };
}
