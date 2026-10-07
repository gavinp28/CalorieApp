import type { Grade, Range } from '../../shared/grading';

interface Props {
  scale: number;
  range: Range;
  guesses: number[];
  grades: Grade[];
  /** Shown once the game is over. */
  answer?: number;
}

const pct = (v: number, scale: number) => `${(Math.min(Math.max(v, 0), scale) / scale) * 100}%`;
const fmt = (n: number) => n.toLocaleString();

export function RangeBar({ scale, range, guesses, grades, answer }: Props) {
  const openTop = !Number.isFinite(range.high);
  const highLabel = openTop ? `${fmt(scale)}+` : fmt(range.high);
  const label =
    answer != null
      ? `The answer was ${fmt(answer)} calories.`
      : openTop && range.low === 0
        ? 'No hints yet. The answer could be anything.'
        : openTop
          ? `The answer is above ${fmt(range.low)} calories.`
          : `The answer is between ${fmt(range.low)} and ${fmt(range.high)} calories.`;

  return (
    <div className="card px-5 py-4">
      <div className="mb-3 flex items-baseline justify-between text-sm font-semibold">
        <span className="text-muted">Answer range</span>
        <span className="font-display text-lg tabular-nums text-ink" aria-hidden>
          {range.low === range.high ? fmt(range.low) : `${fmt(range.low)} – ${highLabel}`}
        </span>
      </div>
      <div role="img" aria-label={label} className="relative h-4 rounded-full bg-surface-2">
        <div
          className="range-fill absolute inset-y-0 rounded-full bg-primary"
          style={{ left: pct(range.low, scale), right: `calc(100% - ${pct(openTop ? scale : range.high, scale)})` }}
        />
        {guesses.map((g, i) => (
          <span
            key={i}
            className={`animate-pop absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface tier-${grades[i].tier}`}
            style={{ left: pct(g, scale) }}
            aria-hidden
          />
        ))}
        {answer != null && (
          <span
            className="animate-pop absolute -top-2 bottom-[-0.5rem] w-1 -translate-x-1/2 rounded-full bg-ink"
            style={{ left: pct(answer, scale) }}
            aria-hidden
          />
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs font-medium tabular-nums text-muted" aria-hidden>
        <span>0</span>
        <span>{fmt(scale / 2)}</span>
        <span>{fmt(scale)}+</span>
      </div>
    </div>
  );
}
