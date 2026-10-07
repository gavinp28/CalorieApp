import { describe, expect, it } from 'vitest';
import { convertLegacy } from './migrate';

const at = '2026-10-07T00:00:00.000Z';

describe('convertLegacy', () => {
  const raw = JSON.stringify({
    unlocked: true,
    unlockedBy: 'code',
    res: {
      fd53: { guesses: [200, 70], done: true, won: true },
      pd52: { guesses: [1, 2, 3, 4, 5], done: true, won: false },
      fd54: { guesses: [300], done: false, won: false },
      fb3: { guesses: [120], done: true, won: true },
      junk: { guesses: [1] },
      fd9: { guesses: [], done: false },
    },
    stats: {
      f: { played: 12, wins: 10, streak: 3, best: 5, lastDay: 53, dist: [0, 2, 4, 3, 1] },
      p: { played: 0, wins: 0, streak: 0, best: 0, lastDay: 0, dist: [0, 0, 0, 0, 0] },
    },
  });
  const out = convertLegacy(raw, at);

  it('carries over every game with guesses, including ones in progress', () => {
    expect(out.games).toEqual({
      'food-daily-53': { guesses: [200, 70] },
      'plate-daily-52': { guesses: [1, 2, 3, 4, 5] },
      'food-daily-54': { guesses: [300] },
      'food-bonus-3': { guesses: [120] },
    });
  });

  it('records finished games as results that do not re-count toward stats', () => {
    expect(Object.keys(out.results.food).sort()).toEqual(['food-bonus-3', 'food-daily-53']);
    expect(out.results.food['food-daily-53']).toMatchObject({ won: true, onTheDay: false, number: 53, kind: 'daily' });
    expect(out.results.plate['plate-daily-52']).toMatchObject({ won: false });
  });

  it('keeps the prototype stat totals and skips empty ones', () => {
    expect(out.legacyStats.food).toEqual({ played: 12, wins: 10, streak: 3, best: 5, lastDay: 53, dist: [0, 2, 4, 3, 1] });
    expect(out.legacyStats.plate).toBeUndefined();
  });

  it('survives garbage', () => {
    expect(convertLegacy('not json', at)).toEqual({ games: {}, results: { food: {}, plate: {} }, legacyStats: {} });
    expect(convertLegacy('null', at).games).toEqual({});
  });
});
