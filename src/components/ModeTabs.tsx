import { NavLink } from 'react-router';
import { puzzleId, type Mode } from '../../shared/types';
import { resultsKey, type GameResult } from '../lib/useGame';
import { useStored } from '../lib/storage';
import { CheckIcon } from './Icons';

const TABS: { to: string; mode: Mode; label: string; emoji: string }[] = [
  { to: '/', mode: 'food', label: 'Single food', emoji: '🍎' },
  { to: '/plate', mode: 'plate', label: 'Full plate', emoji: '🍽️' },
];

/** Switches between today's two daily puzzles; ticks the ones already finished. */
export function ModeTabs({ today }: { today: number }) {
  const results = {
    food: useStored<Record<string, GameResult>>(resultsKey('food'), {}),
    plate: useStored<Record<string, GameResult>>(resultsKey('plate'), {}),
  };
  return (
    <nav aria-label="Game mode" className="mx-auto mb-4 flex w-full max-w-md rounded-full bg-surface-2 p-1">
      {TABS.map((t) => {
        const done = !!results[t.mode][puzzleId(t.mode, 'daily', today)];
        return (
          <NavLink
            key={t.to}
            to={t.to}
            end
            className={({ isActive }) =>
              `flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition ${
                isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
              }`
            }
          >
            <span aria-hidden>{t.emoji}</span>
            {t.label}
            {done && (
              <span className="grid size-5 place-items-center rounded-full tier-win" title="Played today">
                <CheckIcon className="size-3" />
                <span className="sr-only">(played today)</span>
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
