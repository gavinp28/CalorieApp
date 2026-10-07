import type { FoodPuzzle } from '../../shared/types';

interface Props {
  puzzle: FoodPuzzle;
  eyebrow: string;
  /** Changing this replays the miss shake. */
  shakeKey: number;
}

export function FoodCard({ puzzle, eyebrow, shakeKey }: Props) {
  return (
    <section
      key={shakeKey}
      aria-labelledby="food-name"
      className={`card relative overflow-hidden px-6 pb-7 pt-6 text-center ${shakeKey > 0 ? 'animate-shake' : ''}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
      <div className="relative mx-auto my-5 grid size-36 place-items-center sm:size-44">
        <div className="blob absolute inset-0 rounded-[42%_58%_55%_45%/48%_42%_58%_52%]" aria-hidden />
        <span
          className="animate-float relative text-[5.5rem] leading-none drop-shadow-sm sm:text-[6.75rem]"
          role="img"
          aria-label={puzzle.name}
        >
          {puzzle.emoji}
        </span>
      </div>
      <h1 id="food-name" className="font-display text-balance text-[2.35rem] leading-[1.02] text-ink sm:text-5xl">
        {puzzle.name}
      </h1>
      <p className="mt-4 inline-flex max-w-full items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-[0.95rem] font-semibold text-ink">
        <span className="text-muted">Serving</span>
        <span className="truncate">{puzzle.serving}</span>
      </p>
    </section>
  );
}
