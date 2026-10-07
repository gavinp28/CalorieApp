import type { PlatePuzzle } from '../../shared/types';

interface Props {
  puzzle: PlatePuzzle;
  eyebrow: string;
  shakeKey: number;
  /** Show each item's calories (after the round). */
  showKcal: boolean;
}

export function PlateCard({ puzzle, eyebrow, shakeKey, showKcal }: Props) {
  return (
    <section
      key={shakeKey}
      aria-labelledby="plate-name"
      className={`card relative overflow-hidden px-5 pb-5 pt-6 sm:px-6 ${shakeKey > 0 ? 'animate-shake' : ''}`}
    >
      <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative grid size-20 shrink-0 place-items-center sm:size-28">
          <div className="blob absolute inset-0 rounded-[42%_58%_55%_45%/48%_42%_58%_52%]" aria-hidden />
          <span className="animate-float relative text-5xl leading-none sm:text-7xl" role="img" aria-label="">
            {puzzle.emoji}
          </span>
        </div>
        <h1 id="plate-name" className="font-display text-balance text-[1.45rem] leading-[1.1] text-ink sm:text-[2rem]">
          {puzzle.name}
        </h1>
      </div>

      <h2 className="sr-only">On the plate</h2>
      <ul className="mt-4 divide-y rounded-2xl bg-surface-2 px-4">
        {puzzle.items.map((item, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 py-2"
            style={{ borderColor: 'color-mix(in srgb, var(--ink) 9%, transparent)' }}
          >
            <span className="min-w-0 flex-1">
              <span className="font-semibold leading-snug text-ink">{item.food}</span>{' '}
              <span className="whitespace-nowrap text-sm text-muted">· {item.measure}</span>
            </span>
            {showKcal && (
              <span className="animate-pop shrink-0 font-display tabular-nums text-ink">
                {item.kcal.toLocaleString()} <span className="font-sans text-xs font-semibold text-muted">kcal</span>
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-sm font-medium text-muted">
        {puzzle.items.length} items · guess the total
      </p>
    </section>
  );
}
