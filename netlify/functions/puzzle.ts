import type { Config } from '@netlify/functions';
import { isPublicDaily, possibleTodayRange } from '../../shared/dates';
import type { Mode, PuzzleKind } from '../../shared/types';
import { guard, json } from '../lib/http';
import { getPuzzle } from '../lib/puzzles';
import { unlockFromRequest } from '../lib/unlock';

/**
 * GET /api/puzzle?mode=food|plate&kind=daily|bonus&n=54
 *
 * Today's daily (in any time zone) and the 5 free archive days are public.
 * Older dailies and bonus puzzles need "Authorization: Bearer <unlock token>".
 * Future dailies are never served.
 */
export async function handlePuzzle(req: Request, now: number): Promise<Response> {
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode');
  const kind = url.searchParams.get('kind') ?? 'daily';
  const n = Number(url.searchParams.get('n'));

  if ((mode !== 'food' && mode !== 'plate') || (kind !== 'daily' && kind !== 'bonus') || !Number.isInteger(n) || n < 1) {
    return json(400, { error: 'bad_request' });
  }
  if (kind === 'daily' && n > possibleTodayRange(now).max) return json(404, { error: 'not_released' });

  const isPublic = kind === 'daily' && isPublicDaily(n, now);
  if (!isPublic) {
    const hasHeader = req.headers.has('authorization');
    if (!(await unlockFromRequest(req))) return json(hasHeader ? 401 : 403, { error: hasHeader ? 'invalid_token' : 'locked' });
  }

  const puzzle = getPuzzle(mode as Mode, kind as PuzzleKind, n);
  if (!puzzle) return json(404, { error: 'not_found' });
  // Locked puzzles must never land in a shared cache.
  return json(200, puzzle, { 'cache-control': isPublic ? 'public, max-age=300' : 'private, max-age=3600', vary: 'authorization' });
}

export default guard((req) => handlePuzzle(req, Date.now()));
export const config: Config = { path: '/api/puzzle' };
