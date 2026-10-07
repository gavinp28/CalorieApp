import { describe, expect, it } from 'vitest';
import { answerRange, gameStatus, gradeGuess, parseGuess } from './grading';

describe('gradeGuess tiers', () => {
  const answer = 400; // 5% = 20, 10% = 40, 25% = 100

  it('wins within 5% (inclusive)', () => {
    expect(gradeGuess(400, answer).tier).toBe('win');
    expect(gradeGuess(380, answer).tier).toBe('win');
    expect(gradeGuess(420, answer).tier).toBe('win');
  });
  it('is very close within 10% (inclusive)', () => {
    expect(gradeGuess(379, answer).tier).toBe('very-close');
    expect(gradeGuess(440, answer).tier).toBe('very-close');
    expect(gradeGuess(360, answer).tier).toBe('very-close');
  });
  it('is warm within 25% (inclusive)', () => {
    expect(gradeGuess(441, answer).tier).toBe('warm');
    expect(gradeGuess(300, answer).tier).toBe('warm');
    expect(gradeGuess(500, answer).tier).toBe('warm');
  });
  it('is not close beyond 25%', () => {
    expect(gradeGuess(299, answer).tier).toBe('cold');
    expect(gradeGuess(501, answer).tier).toBe('cold');
    expect(gradeGuess(1, answer).tier).toBe('cold');
  });
  it('handles boundaries that are not whole numbers', () => {
    // answer 105: 5% = 5.25 → 100 wins, 99 (5.71%) does not
    expect(gradeGuess(100, 105).tier).toBe('win');
    expect(gradeGuess(99, 105).tier).toBe('very-close');
  });
  it('reports direction toward the answer', () => {
    expect(gradeGuess(100, answer).direction).toBe('higher');
    expect(gradeGuess(900, answer).direction).toBe('lower');
    expect(gradeGuess(400, answer).direction).toBe('exact');
    expect(gradeGuess(390, answer).direction).toBe('higher'); // a win can still point a way
  });
  it('reports the fractional error', () => {
    expect(gradeGuess(300, answer).off).toBeCloseTo(0.25);
  });
});

describe('answerRange', () => {
  it('starts open at the top', () => {
    expect(answerRange([], 300)).toEqual({ low: 0, high: Infinity });
  });
  it('narrows from both sides and never widens', () => {
    expect(answerRange([100, 800, 200, 900, 500], 300)).toEqual({ low: 200, high: 500 });
  });
  it('collapses on an exact guess', () => {
    expect(answerRange([100, 300], 300)).toEqual({ low: 300, high: 300 });
  });
  it('stays consistent when the answer is above the scale', () => {
    expect(answerRange([1000], 1240)).toEqual({ low: 1000, high: Infinity });
  });
});

describe('gameStatus', () => {
  it('plays until 5 guesses or a win', () => {
    expect(gameStatus([], 300)).toBe('playing');
    expect(gameStatus([100, 200], 300)).toBe('playing');
    expect(gameStatus([100, 290], 300)).toBe('won');
    expect(gameStatus([1, 2, 3, 4, 5], 300)).toBe('lost');
    expect(gameStatus([1, 2, 3, 4, 300], 300)).toBe('won');
  });
});

describe('parseGuess', () => {
  it('accepts plain and formatted numbers', () => {
    expect(parseGuess('320')).toBe(320);
    expect(parseGuess(' 1,250 ')).toBe(1250);
    expect(parseGuess('320 kcal')).toBe(320);
  });
  it('rejects junk, zero and out-of-range values', () => {
    expect(parseGuess('')).toBeNull();
    expect(parseGuess('abc')).toBeNull();
    expect(parseGuess('12.5')).toBeNull();
    expect(parseGuess('-4')).toBeNull();
    expect(parseGuess('0')).toBeNull();
    expect(parseGuess('10000')).toBeNull();
  });
});
