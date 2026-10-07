import { useEffect } from 'react';
import type { PlateItem } from '../../shared/types';
import { haptic } from '../lib/feedback';
import { useCountUp, useStaggerReveal } from '../lib/motion';

export const REVEAL_STEP_MS = 650;
export const REVEAL_START_MS = 350;

/** Total time the per-item reveal takes, so the total can count up right after it. */
export const revealDuration = (count: number) => REVEAL_START_MS + count * REVEAL_STEP_MS;

interface Props {
  items: PlateItem[];
  animate: boolean;
}

/** After a plate round: each food's calories, revealed one by one. */
export function PlateBreakdown({ items, animate }: Props) {
  const shown = useStaggerReveal(items.length, REVEAL_STEP_MS, animate, REVEAL_START_MS);
  const top = items.reduce((best, it, i) => (it.kcal > items[best].kcal ? i : best), 0);
  const done = shown >= items.length;

  useEffect(() => {
    if (animate && shown > 0) haptic('tap');
  }, [shown, animate]);

  return (
    <div className="mt-5 text-left">
      <h3 className="text-center text-sm font-semibold text-muted">How it adds up</h3>
      <ol className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-500 ${
              done && i === top ? 'bg-accent text-accent-ink' : 'bg-surface-2'
            }`}
          >
            <span className="min-w-0 flex-1 truncate text-sm font-semibold">
              {item.food}
              {done && i === top && <span className="ml-2 text-xs font-bold uppercase tracking-wider opacity-75">Biggest</span>}
            </span>
            {i < shown ? (
              <ItemKcal kcal={item.kcal} animate={animate} />
            ) : (
              <span className="font-display tabular-nums text-muted" aria-hidden>
                ???
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function ItemKcal({ kcal, animate }: { kcal: number; animate: boolean }) {
  const v = useCountUp(kcal, 500, animate);
  return (
    <span className="animate-pop font-display tabular-nums">
      {v.toLocaleString()} <span className="font-sans text-xs font-semibold opacity-70">kcal</span>
    </span>
  );
}
