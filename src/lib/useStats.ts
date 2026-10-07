import { computeStats, type LegacyStats, type Stats } from '../../shared/stats';
import type { Mode } from '../../shared/types';
import { useStored } from './storage';
import { resultsKey, type GameResult } from './useGame';

export function useResults(mode: Mode) {
  return useStored<Record<string, GameResult>>(resultsKey(mode), {});
}

export function useModeStats(mode: Mode, today: number): Stats {
  const results = useResults(mode);
  const legacy = useStored<LegacyStats | null>(`legacyStats:${mode}`, null);
  const days = Object.values(results)
    .filter((r) => r.kind === 'daily' && r.onTheDay)
    .map((r) => ({ number: r.number, won: r.won, guessCount: r.guesses.length }));
  return computeStats(days, today, legacy ?? undefined);
}
