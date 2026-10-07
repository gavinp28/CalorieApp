import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import foods from './foods.json';
import foodBonus from './foods-bonus.json';
import plates from './plates.json';
import plateBonus from './plates-bonus.json';
import lib from './plate-lib.json';

const isSample = existsSync(new URL('./SAMPLE_DATA', import.meta.url));

describe('puzzle data', () => {
  it('has well-formed food rows', () => {
    for (const r of [...foods, ...foodBonus]) {
      expect(r).toHaveLength(4);
      expect(typeof r[1]).toBe('string');
      expect(r[3]).toBeGreaterThan(0);
    }
  });
  it('has plates that reference existing library entries', () => {
    for (const [, , ix] of [...plates, ...plateBonus] as [string, string, number[]][]) {
      expect(ix.length).toBeGreaterThan(0);
      for (const i of ix) expect(lib[i]).toBeDefined();
    }
  });
  it.skipIf(isSample)('has 365 dailies and 40 bonus puzzles per mode', () => {
    expect(foods).toHaveLength(365);
    expect(foodBonus).toHaveLength(40);
    expect(plates).toHaveLength(365);
    expect(plateBonus).toHaveLength(40);
  });
});
