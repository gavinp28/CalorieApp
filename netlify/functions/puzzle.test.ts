import { beforeAll, describe, expect, it } from 'vitest';
import { signToken } from '../../shared/token';
import { handlePuzzle } from './puzzle';

const SECRET = 'puzzle-test-secret-0123456789abcdef';
const noon = Date.UTC(2026, 9, 7, 12); // players are on #54 or #55
let token = '';

beforeAll(async () => {
  process.env.UNLOCK_SECRET = SECRET;
  token = await signToken({ typ: 'unlock', email: 'jo@example.com', sid: 'cs_test_x', iat: 0 }, SECRET);
});

const get = (qs: string, auth?: string, now = noon) =>
  handlePuzzle(new Request(`https://x.test/api/puzzle?${qs}`, { headers: auth ? { authorization: `Bearer ${auth}` } : {} }), now);

describe('GET /api/puzzle', () => {
  it("serves today's daily for both modes, publicly cacheable", async () => {
    const food = await get('mode=food&kind=daily&n=54');
    expect(food.status).toBe(200);
    expect(food.headers.get('cache-control')).toMatch(/^public/);
    expect(await food.json()).toMatchObject({ id: 'food-daily-54', mode: 'food', number: 54 });
    const plate = await (await get('mode=plate&kind=daily&n=55')).json();
    expect(plate.items.length).toBeGreaterThan(0);
    expect(plate.kcal).toBe(plate.items.reduce((s: number, i: { kcal: number }) => s + i.kcal, 0));
  });

  it('serves the 5 free archive days', async () => {
    expect((await get('mode=food&kind=daily&n=49')).status).toBe(200);
  });

  it('locks older dailies and all bonus puzzles without a token', async () => {
    expect((await get('mode=food&kind=daily&n=48')).status).toBe(403);
    expect((await get('mode=food&kind=daily&n=1')).status).toBe(403);
    expect((await get('mode=food&kind=bonus&n=1')).status).toBe(403);
  });

  it('serves locked puzzles with a valid unlock token, privately', async () => {
    const res = await get('mode=plate&kind=bonus&n=40', token);
    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toMatch(/^private/);
    expect((await get('mode=food&kind=daily&n=1', token)).status).toBe(200);
  });

  it('rejects forged or foreign tokens with 401', async () => {
    const other = await signToken({ typ: 'unlock', email: 'x@y.z', sid: 'cs_test_y', iat: 0 }, SECRET + '-other');
    expect((await get('mode=food&kind=bonus&n=1', other)).status).toBe(401);
    expect((await get('mode=food&kind=bonus&n=1', 'nonsense')).status).toBe(401);
    const restore = await signToken({ typ: 'restore', email: 'x@y.z', exp: noon + 60_000 }, SECRET);
    expect((await get('mode=food&kind=bonus&n=1', restore)).status).toBe(401);
  });

  it('never serves future dailies, even with a token', async () => {
    expect((await get('mode=food&kind=daily&n=56', token)).status).toBe(404);
  });

  it('returns not_found past the end of the data', async () => {
    const res = await get('mode=food&kind=bonus&n=41', token);
    expect(res.status).toBe(404);
    const day366 = await get('mode=food&kind=daily&n=366', undefined, Date.UTC(2027, 7, 15, 12));
    expect(await day366.json()).toEqual({ error: 'not_found' });
  });

  it('rejects malformed requests', async () => {
    expect((await get('mode=soup&n=54')).status).toBe(400);
    expect((await get('mode=food&n=abc')).status).toBe(400);
    expect((await get('mode=food&n=0')).status).toBe(400);
  });
});
