import type { Config } from '@netlify/functions';
import { isPublicDaily, possibleTodayRange } from '../../shared/dates';
import type { Mode, PuzzleKind } from '../../shared/types';
import { getPuzzle } from '../lib/puzzles';

const json = (status: number, body: unknown, cacheSeconds = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheSeconds ? `public, max-age=${cacheSeconds}` : 'no-store',
    },
  });

/**
 * GET /api/puzzle?mode=food|plate&kind=daily|bonus&n=54
 *
 * Today's daily (in any time zone) and the free archive days are public.
 * Future dailies are never served. Everything else requires an unlock token
 * (wired up in Phase 4) and returns 403 until then.
 */
export function handlePuzzle(req: Request, now: number): Response {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const kind = url.searchParams.get('kind') ?? 'daily';
  const n = Number(url.searchParams.get('n'));

  if ((mode !== 'food' && mode !== 'plate') || (kind !== 'daily' && kind !== 'bonus') || !Number.isInteger(n) || n < 1) {
    return json(400, { error: 'bad_request' });
  }
  if (kind === 'daily') {
    if (n > possibleTodayRange(now).max) return json(404, { error: 'not_released' });
    if (!isPublicDaily(n, now)) return json(403, { error: 'locked' });
  } else {
    return json(403, { error: 'locked' });
  }

  const puzzle = getPuzzle(mode as Mode, kind as PuzzleKind, n);
  if (!puzzle) return json(404, { error: 'not_found' });
  return json(200, puzzle, 300);
}

export default async (req: Request) => handlePuzzle(req, Date.now());

export const config: Config = { path: '/api/puzzle' };
