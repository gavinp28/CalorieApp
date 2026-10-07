import type { Mode, Puzzle, PuzzleKind } from '../../shared/types';

export type PuzzleErrorCode = 'locked' | 'not_released' | 'not_found' | 'network' | 'server';

export class PuzzleError extends Error {
  code: PuzzleErrorCode;
  constructor(code: PuzzleErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function fetchPuzzle(mode: Mode, kind: PuzzleKind, n: number, signal?: AbortSignal): Promise<Puzzle> {
  let res: Response;
  try {
    res = await fetch(`/api/puzzle?mode=${mode}&kind=${kind}&n=${n}`, { signal });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new PuzzleError('network');
  }
  if (res.ok) return (await res.json()) as Puzzle;
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  if (body.error === 'locked' || body.error === 'not_released' || body.error === 'not_found') throw new PuzzleError(body.error);
  throw new PuzzleError('server');
}
