import { DIRECTION_LABEL, MAX_GUESSES, TIER_LABEL, type Grade } from '../../shared/grading';
import { ArrowDown, ArrowUp, CheckIcon } from './Icons';

interface Props {
  guesses: number[];
  grades: Grade[];
}

export function GuessList({ guesses, grades }: Props) {
  return (
    <ol aria-label="Your guesses" className="space-y-2">
      {Array.from({ length: MAX_GUESSES }, (_, i) => {
        const g = guesses[i];
        const grade = grades[i];
        if (g == null || !grade) {
          return (
            <li
              key={i}
              aria-hidden
              className="flex h-14 items-center rounded-2xl border-2 border-dashed px-4 text-sm font-semibold text-muted"
              style={{ borderColor: 'color-mix(in srgb, var(--ink) 14%, transparent)' }}
            >
              <span className="w-6 tabular-nums opacity-60">{i + 1}</span>
            </li>
          );
        }
        const won = grade.tier === 'win';
        return (
          <li key={i} className="animate-row-in flex h-14 items-center gap-3 rounded-2xl bg-surface px-4 shadow-sm ring-1 ring-black/5">
            <span className="w-6 text-sm font-semibold tabular-nums text-muted">{i + 1}</span>
            <span className="font-display text-xl tabular-nums text-ink">
              {g.toLocaleString()} <span className="text-sm font-sans font-semibold text-muted">kcal</span>
            </span>
            <span className={`ml-auto rounded-full px-3 py-1 text-sm font-bold tier-${grade.tier}`}>{TIER_LABEL[grade.tier]}</span>
            {won ? (
              <span className="grid size-9 place-items-center rounded-full tier-win" aria-hidden>
                <CheckIcon className="size-5" />
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1.5 text-sm font-bold text-bg">
                {grade.direction === 'higher' ? <ArrowUp className="size-4" /> : <ArrowDown className="size-4" />}
                <span>{DIRECTION_LABEL[grade.direction]}</span>
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
