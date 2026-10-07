import { describe, expect, it } from 'vitest';
import { shareText } from './share';

const base = { brand: 'Forkcast', url: 'https://forkcast.test', answer: 400 } as const;

describe('shareText', () => {
  it('formats a daily win with tier squares and arrows', () => {
    expect(shareText({ ...base, mode: 'food', kind: 'daily', number: 54, guesses: [200, 460, 410] })).toBe(
      'Forkcast 🍎 #54 3/5\n⬛⬆️\n🟧⬇️\n🟩✅\nhttps://forkcast.test',
    );
  });
  it('marks a loss with X and uses the very-close square', () => {
    const text = shareText({ ...base, mode: 'plate', kind: 'daily', number: 7, guesses: [100, 900, 370, 435, 360] });
    expect(text).toBe('Forkcast 🍽️ #7 X/5\n⬛⬆️\n⬛⬇️\n🟨⬆️\n🟨⬇️\n🟨⬆️\nhttps://forkcast.test');
  });
  it('labels bonus puzzles', () => {
    expect(shareText({ ...base, mode: 'food', kind: 'bonus', number: 3, guesses: [400] }).split('\n')[0]).toBe('Forkcast 🍎 Bonus 3 1/5');
  });
  it('never includes the answer or the guesses', () => {
    const text = shareText({ ...base, mode: 'food', kind: 'daily', number: 1, guesses: [123, 400] });
    expect(text).not.toMatch(/123|400/);
  });
});
