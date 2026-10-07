import type { Mode, Puzzle, PuzzleKind } from '../../shared/types';
import { clearUnlock, getUnlock, type Unlock } from './entitlement';

export type PuzzleErrorCode = 'locked' | 'not_released' | 'not_found' | 'network' | 'server';

export class PuzzleError extends Error {
  code: PuzzleErrorCode;
  constructor(code: PuzzleErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function fetchPuzzle(mode: Mode, kind: PuzzleKind, n: number, signal?: AbortSignal): Promise<Puzzle> {
  const unlock = getUnlock();
  let res: Response;
  try {
    res = await fetch(`/api/puzzle?mode=${mode}&kind=${kind}&n=${n}`, {
      signal,
      headers: unlock ? { authorization: `Bearer ${unlock.token}` } : {},
    });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new PuzzleError('network');
  }
  if (res.ok) return (await res.json()) as Puzzle;
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (body.error === 'invalid_token') {
    // The signing secret was rotated or the token is corrupt: forget it so the
    // player sees the normal locked screen and can restore.
    clearUnlock();
    throw new PuzzleError('locked');
  }
  if (body.error === 'locked' || body.error === 'not_released' || body.error === 'not_found') throw new PuzzleError(body.error);
  throw new PuzzleError('server');
}

export type UnlockErrorCode = 'not_paid' | 'not_found' | 'wrong_product' | 'refunded' | 'link_expired' | 'bad_email' | 'network' | 'server';

export class UnlockError extends Error {
  code: UnlockErrorCode;
  constructor(code: UnlockErrorCode) {
    super(code);
    this.code = code;
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  } catch {
    throw new UnlockError('network');
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: UnlockErrorCode };
  if (!res.ok) {
    const known: UnlockErrorCode[] = ['not_paid', 'not_found', 'wrong_product', 'refunded', 'link_expired', 'bad_email'];
    throw new UnlockError(data.error && known.includes(data.error) ? data.error : 'server');
  }
  return data;
}

export const unlockWithSession = async (sessionId: string): Promise<Unlock> => ({
  ...(await post<{ token: string; email: string }>('/api/unlock', { session_id: sessionId })),
  sessionId,
});

export const unlockWithEmailLink = (token: string): Promise<Unlock> => post<Unlock>('/api/restore-link', { token });

export const requestRestoreEmail = (email: string) => post<{ ok: true }>('/api/restore-email', { email });
