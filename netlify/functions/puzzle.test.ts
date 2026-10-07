import { describe, expect, it } from 'vitest';
import { handlePuzzle } from './puzzle';

const noon = Date.UTC(2026, 9, 7, 12); // players are on #54 or #55
const get = (qs: string) => handlePuzzle(new Request(`https://x.test/api/puzzle?${qs}`), noon);

describe('GET /api/puzzle', () => {
  it("serves today's daily for both modes", async () => {
    const food = get('mode=food&kind=daily&n=54');
    expect(food.status).toBe(200);
    expect(await food.json()).toMatchObject({ id: 'food-daily-54', mode: 'food', number: 54 });
    const plate = await get('mode=plate&kind=daily&n=55').json();
    expect(plate.items.length).toBeGreaterThan(0);
    expect(plate.kcal).toBe(plate.items.reduce((s: number, i: { kcal: number }) => s + i.kcal, 0));
  });
  it('serves the 5 free archive days', () => {
    expect(get('mode=food&kind=daily&n=49').status).toBe(200);
  });
  it('locks older dailies and all bonus puzzles', () => {
    expect(get('mode=food&kind=daily&n=48').status).toBe(403);
    expect(get('mode=food&kind=daily&n=1').status).toBe(403);
    expect(get('mode=food&kind=bonus&n=1').status).toBe(403);
  });
  it('never serves future dailies', () => {
    expect(get('mode=food&kind=daily&n=56').status).toBe(404);
  });
  it('rejects malformed requests', () => {
    expect(get('mode=soup&n=54').status).toBe(400);
    expect(get('mode=food&n=abc').status).toBe(400);
    expect(get('mode=food&n=0').status).toBe(400);
  });
});
