import { describe, expect, it } from 'vitest';
import { computeStats, type DayResult } from './stats';

const win = (number: number, guessCount = 3): DayResult => ({ number, won: true, guessCount });
const loss = (number: number): DayResult => ({ number, won: false, guessCount: 5 });

describe('computeStats', () => {
  it('is empty for a new player', () => {
    expect(computeStats([], 54)).toEqual({ played: 0, wins: 0, winPct: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0] });
  });

  it('counts plays, wins, win % and the distribution of winning guess counts', () => {
    const s = computeStats([win(50, 1), win(51, 3), loss(52), win(53, 3)], 54);
    expect(s).toMatchObject({ played: 4, wins: 3, winPct: 75, dist: [1, 0, 2, 0, 0] });
  });

  it('builds streaks from consecutive daily wins', () => {
    expect(computeStats([win(50), win(51), win(52), win(53)], 54)).toMatchObject({ streak: 4, best: 4 });
  });

  it('keeps the streak alive until today is played', () => {
    expect(computeStats([win(52), win(53)], 54).streak).toBe(2);
    expect(computeStats([win(52), win(53), win(54)], 54).streak).toBe(3);
  });

  it('breaks the streak on a loss or a missed day, but keeps the best', () => {
    expect(computeStats([win(48), win(49), win(50), loss(51), win(52)], 53)).toMatchObject({ streak: 1, best: 3 });
    expect(computeStats([win(48), win(49), win(50), win(52)], 53)).toMatchObject({ streak: 1, best: 3 });
    expect(computeStats([win(50), win(51)], 54)).toMatchObject({ streak: 0, best: 2 });
    expect(computeStats([win(53), loss(54)], 54).streak).toBe(0);
  });

  it('ignores duplicates and order', () => {
    expect(computeStats([win(53), win(52), win(53)], 54)).toMatchObject({ played: 2, streak: 2 });
  });

  describe('with stats imported from the prototype', () => {
    const legacy = { played: 10, wins: 8, streak: 4, best: 6, lastDay: 50, dist: [1, 2, 3, 1, 1] };

    it('starts from the imported totals', () => {
      expect(computeStats([], 51, legacy)).toEqual({ played: 10, wins: 8, winPct: 80, streak: 4, best: 6, dist: [1, 2, 3, 1, 1] });
    });
    it('continues the imported streak on the next day', () => {
      expect(computeStats([win(51, 2), win(52, 2), win(53, 2)], 54, legacy)).toMatchObject({
        played: 13,
        wins: 11,
        streak: 7,
        best: 7,
        dist: [1, 5, 3, 1, 1],
      });
    });
    it('lets an imported streak lapse after a missed day', () => {
      expect(computeStats([], 53, legacy).streak).toBe(0);
      expect(computeStats([win(53)], 54, legacy).streak).toBe(1);
    });
    it('never double-counts days the prototype already counted', () => {
      expect(computeStats([win(50), win(51)], 52, legacy)).toMatchObject({ played: 11, streak: 5 });
    });
  });
});
