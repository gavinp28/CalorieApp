import { formatCountdown, msUntilNextLocalMidnight } from '../../shared/dates';
import type { GameStatus } from '../../shared/grading';
import { useCountUp } from '../lib/motion';
import { useNow } from '../lib/useToday';
import { Confetti } from './Confetti';

interface Props {
  status: Exclude<GameStatus, 'playing'>;
  answer: number;
  guessCount: number;
  closest: number;
  /** Celebrate only when the game ended just now, not on a revisit. */
  justFinished: boolean;
}

export function ResultPanel({ status, answer, guessCount, closest, justFinished }: Props) {
  const shown = useCountUp(answer, 1200, justFinished);
  const now = useNow();
  const won = status === 'won';

  return (
    <section aria-labelledby="result-title" className="card animate-fade-up relative overflow-visible px-6 py-7 text-center">
      {won && justFinished && <Confetti />}
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{won ? `Solved in ${guessCount}/5` : 'Out of guesses'}</p>
      <h2 id="result-title" className="font-display mt-2 text-3xl text-ink">
        {won ? ['Bullseye!', 'Sharp!', 'Nicely done!', 'Close call!', 'Phew, just in time!'][guessCount - 1] : 'So close. Next time!'}
      </h2>
      <p className="mt-5 text-sm font-semibold text-muted">The answer</p>
      <p className="font-display text-6xl tabular-nums text-primary" aria-live="polite">
        {shown.toLocaleString()}
        <span className="ml-1 text-2xl text-muted">kcal</span>
      </p>
      {!won && (
        <p className="mt-2 text-sm text-muted">
          Your closest guess was <strong className="text-ink">{closest.toLocaleString()}</strong>.
        </p>
      )}
      <div className="mt-6 rounded-2xl bg-surface-2 px-4 py-3">
        <p className="text-sm font-semibold text-muted">Next food in</p>
        <p className="font-display text-3xl tabular-nums text-ink" role="timer" aria-label="Time until the next puzzle">
          {formatCountdown(msUntilNextLocalMidnight(now))}
        </p>
      </div>
    </section>
  );
}
