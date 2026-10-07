import { Link } from 'react-router';
import { MAX_GUESSES } from '../../shared/grading';
import { puzzleId, type Mode } from '../../shared/types';
import { Countdown } from '../components/Countdown';
import { useModeStats, useResults } from '../lib/useStats';
import { useToday } from '../lib/useToday';

export function StatsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-4xl text-ink">Stats</h1>
      <p className="mt-1 text-muted">Counted from dailies played on their own day.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <ModeStats mode="food" />
        <ModeStats mode="plate" />
      </div>
      <Countdown label="Next puzzles in" className="mx-auto mt-6 max-w-xs" />
    </div>
  );
}

function ModeStats({ mode }: { mode: Mode }) {
  const today = useToday();
  const stats = useModeStats(mode, today);
  const todays = useResults(mode)[puzzleId(mode, 'daily', today)];
  const max = Math.max(1, ...stats.dist);
  const highlight = todays?.won && todays.onTheDay ? todays.guesses.length - 1 : -1;
  const title = mode === 'plate' ? 'Full plate' : 'Single food';

  return (
    <section className="card p-6" aria-labelledby={`stats-${mode}`}>
      <h2 id={`stats-${mode}`} className="font-display flex items-center gap-2 text-2xl text-ink">
        <span aria-hidden>{mode === 'plate' ? '🍽️' : '🍎'}</span> {title}
      </h2>
      <dl className="mt-5 grid grid-cols-4 gap-2 text-center">
        {[
          [stats.played, 'Played'],
          [`${stats.winPct}%`, 'Win'],
          [stats.streak, 'Streak'],
          [stats.best, 'Best'],
        ].map(([v, l]) => (
          <div key={l} className="flex flex-col-reverse rounded-2xl bg-surface-2 py-3">
            <dt className="text-xs font-semibold text-muted">{l}</dt>
            <dd className="font-display text-3xl tabular-nums text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <h3 className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-muted">Guess distribution</h3>
      {stats.wins === 0 ? (
        <p className="mt-3 text-sm text-muted">
          No wins yet.{' '}
          <Link to={mode === 'plate' ? '/plate' : '/'} className="font-semibold text-primary underline-offset-2 hover:underline">
            Play today's {mode === 'plate' ? 'plate' : 'food'}
          </Link>
        </p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {Array.from({ length: MAX_GUESSES }, (_, i) => (
            <li key={i} className="flex items-center gap-3">
              <span className="w-3 text-sm font-bold tabular-nums text-muted">{i + 1}</span>
              <div className="h-7 flex-1">
                <div
                  className={`range-fill flex h-full min-w-8 items-center justify-end rounded-lg px-2 text-sm font-bold tabular-nums transition-[width] duration-700 ${
                    i === highlight ? 'bg-primary text-primary-ink' : 'bg-surface-2 text-ink'
                  }`}
                  style={{ width: `${(stats.dist[i] / max) * 100}%` }}
                  aria-label={`Solved in ${i + 1}: ${stats.dist[i]} ${stats.dist[i] === 1 ? 'time' : 'times'}`}
                >
                  {stats.dist[i]}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
