import type { LegacyStats } from '../../shared/stats';
import { puzzleId, type Mode, type PuzzleKind } from '../../shared/types';
import type { GameResult } from './useGame';

/** localStorage key the prototype (calorie-guesser.html) saved to. Same domain, so it's readable here. */
export const LEGACY_KEY = 'calorieguesser:v2';

interface LegacyState {
  res?: Record<string, { guesses?: number[]; done?: boolean; won?: boolean }>;
  stats?: Partial<Record<'f' | 'p', Partial<LegacyStats>>>;
}

export interface Imported {
  games: Record<string, { guesses: number[] }>;
  results: Record<Mode, Record<string, GameResult>>;
  legacyStats: Partial<Record<Mode, LegacyStats>>;
}

const MODES = { f: 'food', p: 'plate' } as const;
const KINDS = { d: 'daily', b: 'bonus' } as const;

/**
 * Converts the prototype's saved state into ours. Its purchase flag is ignored on
 * purpose (the shared-code unlock is retired). Bad data is skipped, never thrown.
 */
export function convertLegacy(raw: string, importedAt: string): Imported {
  const out: Imported = { games: {}, results: { food: {}, plate: {} }, legacyStats: {} };
  let state: LegacyState;
  try {
    state = JSON.parse(raw) as LegacyState;
  } catch {
    return out;
  }
  if (!state || typeof state !== 'object') return out;

  for (const [pid, r] of Object.entries(state.res ?? {})) {
    const m = /^([fp])([db])(\d+)$/.exec(pid);
    const guesses = Array.isArray(r?.guesses) ? r.guesses.filter((g) => Number.isInteger(g) && g > 0) : [];
    if (!m || !guesses.length) continue;
    const mode: Mode = MODES[m[1] as 'f' | 'p'];
    const kind: PuzzleKind = KINDS[m[2] as 'd' | 'b'];
    const number = Number(m[3]);
    const id = puzzleId(mode, kind, number);
    out.games[id] = { guesses };
    if (r.done) {
      out.results[mode][id] = {
        id,
        mode,
        kind,
        number,
        won: !!r.won,
        guesses,
        // The prototype's own totals already include these days, so they don't count again.
        onTheDay: false,
        finishedAt: importedAt,
      };
    }
  }

  for (const [k, mode] of Object.entries(MODES)) {
    const s = state.stats?.[k as 'f' | 'p'];
    if (!s || !s.played) continue;
    out.legacyStats[mode] = {
      played: s.played ?? 0,
      wins: s.wins ?? 0,
      streak: s.streak ?? 0,
      best: s.best ?? 0,
      lastDay: s.lastDay ?? 0,
      dist: Array.isArray(s.dist) ? s.dist.slice(0, 5) : [0, 0, 0, 0, 0],
    };
  }
  return out;
}

/**
 * Runs once per browser, before the app renders. Merges without overwriting
 * anything already saved by this version, and leaves the prototype's data in
 * place so nothing is lost.
 */
export function migrateFromPrototype(load: <T>(k: string, f: T) => T, save: (k: string, v: unknown) => void) {
  if (load('migrated', false)) return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (raw) {
    const data = convertLegacy(raw, new Date().toISOString());
    for (const [id, game] of Object.entries(data.games)) {
      if (!load(`game:${id}`, null)) save(`game:${id}`, game);
    }
    for (const mode of ['food', 'plate'] as const) {
      const existing = load<Record<string, GameResult>>(`results:${mode}`, {});
      save(`results:${mode}`, { ...data.results[mode], ...existing });
      if (data.legacyStats[mode] && !load(`legacyStats:${mode}`, null)) save(`legacyStats:${mode}`, data.legacyStats[mode]);
    }
  }
  save('migrated', true);
}
