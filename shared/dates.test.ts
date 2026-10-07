import { describe, expect, it } from 'vitest';
import {
  dailyIndex,
  dateForPuzzle,
  dayNumber,
  formatCountdown,
  isFreeArchive,
  isPublicDaily,
  isoDate,
  msUntilNextLocalMidnight,
  possibleTodayRange,
  puzzleNumberForDate,
  todaysPuzzleNumber,
} from './dates';

describe('puzzle numbering', () => {
  it('puzzle #1 is Aug 15, 2026', () => {
    expect(puzzleNumberForDate({ year: 2026, month: 8, day: 15 })).toBe(1);
    expect(isoDate(dateForPuzzle(1))).toBe('2026-08-15');
  });

  it('counts across month and year boundaries', () => {
    expect(puzzleNumberForDate({ year: 2026, month: 8, day: 31 })).toBe(17);
    expect(puzzleNumberForDate({ year: 2026, month: 9, day: 1 })).toBe(18);
    expect(puzzleNumberForDate({ year: 2026, month: 10, day: 7 })).toBe(54);
    expect(puzzleNumberForDate({ year: 2027, month: 1, day: 1 })).toBe(140);
    expect(puzzleNumberForDate({ year: 2027, month: 8, day: 14 })).toBe(365);
    expect(puzzleNumberForDate({ year: 2027, month: 8, day: 15 })).toBe(366);
  });

  it('handles the 2028 leap day', () => {
    const feb28 = puzzleNumberForDate({ year: 2028, month: 2, day: 28 });
    expect(puzzleNumberForDate({ year: 2028, month: 2, day: 29 })).toBe(feb28 + 1);
    expect(puzzleNumberForDate({ year: 2028, month: 3, day: 1 })).toBe(feb28 + 2);
  });

  it('is zero or negative before launch', () => {
    expect(puzzleNumberForDate({ year: 2026, month: 8, day: 14 })).toBe(0);
    expect(puzzleNumberForDate({ year: 2026, month: 1, day: 1 })).toBeLessThan(0);
  });

  it('round-trips dateForPuzzle', () => {
    for (let n = -30; n < 1200; n += 7) expect(puzzleNumberForDate(dateForPuzzle(n))).toBe(n);
  });

  it('uses the local calendar date, not UTC', () => {
    // Constructed from local components, so this is 23:59 local wherever tests run.
    expect(todaysPuzzleNumber(new Date(2026, 9, 7, 23, 59, 59))).toBe(54);
    expect(todaysPuzzleNumber(new Date(2026, 9, 8, 0, 0, 0))).toBe(55);
  });

  it('dayNumber is not affected by DST transitions', () => {
    // US DST ends Nov 1 2026, EU DST ends Oct 25 2026.
    expect(dayNumber({ year: 2026, month: 11, day: 2 }) - dayNumber({ year: 2026, month: 11, day: 1 })).toBe(1);
    expect(dayNumber({ year: 2026, month: 10, day: 26 }) - dayNumber({ year: 2026, month: 10, day: 25 })).toBe(1);
  });
});

describe('dailyIndex', () => {
  it('maps puzzle numbers to list positions in order', () => {
    expect(dailyIndex(1, 365)).toBe(0);
    expect(dailyIndex(54, 365)).toBe(53);
    expect(dailyIndex(365, 365)).toBe(364);
  });
  it('does not wrap past the end of the list (days are added by appending)', () => {
    expect(dailyIndex(366, 365)).toBe(-1);
    expect(dailyIndex(366, 400)).toBe(365);
    expect(dailyIndex(0, 365)).toBe(-1);
  });
});

describe('countdown', () => {
  it('measures to the next local midnight', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 9, 7, 23, 0, 0))).toBe(3_600_000);
    expect(msUntilNextLocalMidnight(new Date(2026, 9, 7, 0, 0, 0))).toBe(86_400_000);
  });
  it('formats as HH:MM:SS', () => {
    expect(formatCountdown(3_600_000)).toBe('01:00:00');
    expect(formatCountdown(61_500)).toBe('00:01:02');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
});

describe('archive access', () => {
  it('frees the 5 days before today only', () => {
    const today = 54;
    expect(isFreeArchive(54, today)).toBe(false); // today is the daily, not archive
    expect([53, 52, 51, 50, 49].every((n) => isFreeArchive(n, today))).toBe(true);
    expect(isFreeArchive(48, today)).toBe(false);
    expect(isFreeArchive(55, today)).toBe(false);
  });
  it('never frees puzzles before #1', () => {
    expect(isFreeArchive(0, 3)).toBe(false);
  });
});

describe('server-side public window', () => {
  // 2026-10-07 12:00 UTC: UTC-12 is on Oct 7 00:00, UTC+14 is on Oct 8 02:00.
  const noon = Date.UTC(2026, 9, 7, 12);

  it('spans every real time zone', () => {
    expect(possibleTodayRange(noon)).toEqual({ min: 54, max: 55 });
    // 2026-10-07 05:00 UTC: UTC-12 is still Oct 6, UTC+14 is already Oct 7.
    expect(possibleTodayRange(Date.UTC(2026, 9, 7, 5))).toEqual({ min: 53, max: 54 });
  });

  it('serves today and the free days, but not future or older days', () => {
    expect(isPublicDaily(55, noon)).toBe(true); // already "today" in Kiribati
    expect(isPublicDaily(56, noon)).toBe(false);
    expect(isPublicDaily(49, noon)).toBe(true);
    expect(isPublicDaily(48, noon)).toBe(false);
    expect(isPublicDaily(0, noon)).toBe(false);
  });
});
