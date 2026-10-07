import type { ReactNode } from 'react';
import { formatCountdown, msUntilNextLocalMidnight } from '../../shared/dates';
import type { GameStatus } from '../../shared/grading';
import type { Mode } from '../../shared/types';
import { useCountUp } from '../lib/motion';
import { useNow } from '../lib/useToday';
import { Confetti } from './Confetti';

interface Props {
  mode: Mode;
  status: Exclude<GameStatus, 'playing'>;
  answer: number;
  guessCount: number;
  closest: number;
  /** Celebrate only when the game ended just now, not on a revisit. */
  justFinished: boolean;
  /** Wait this long before counting up the answer (lets the plate breakdown play first). */
  countDelayMs?: number;
  /** Extra content above the answer, e.g. the plate breakdown. */
  children?: ReactNode;
}

const WIN_TITLES = ['Bullseye!', 'Sharp!', 'Nicely done!', 'Close call!', 'Phew, just in time!'];

export function ResultPanel({ mode, status, answer, guessCount, closest, justFinished, countDelayMs = 0, children }: Props) {
  const shown = useCountUp(answer, 1200, justFinished, countDelayMs);
  const now = useNow();
  const won = status === 'won';
  const counted = shown === answer;

  return (
    <section aria-labelledby="result-title" className="card animate-fade-up relative overflow-visible px-5 py-7 text-center sm:px-6">
      {won && justFinished && counted && <Confetti />}
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{won ? `Solved in ${guessCount}/5` : 'Out of guesses'}</p>
      <h2 id="result-title" className="font-display mt-2 text-3xl text-ink">
        {won ? WIN_TITLES[guessCount - 1] : 'So close. Next time!'}
      </h2>
      {children}
      <p className="mt-5 text-sm font-semibold text-muted">{mode === 'plate' ? 'Plate total' : 'The answer'}</p>
      <p className="font-display text-6xl tabular-nums text-primary">
        {shown.toLocaleString()}
        <span className="ml-1 text-2xl text-muted">kcal</span>
      </p>
      <p className="sr-only" aria-live="polite">
        {counted ? `The ${mode === 'plate' ? 'plate total' : 'answer'} is ${answer} calories.` : ''}
      </p>
      {!won && (
        <p className="mt-2 text-sm text-muted">
          Your closest guess was <strong className="text-ink">{closest.toLocaleString()}</strong>.
        </p>
      )}
      <div className="mt-6 rounded-2xl bg-surface-2 px-4 py-3">
        <p className="text-sm font-semibold text-muted">Next {mode === 'plate' ? 'plate' : 'food'} in</p>
        <p className="font-display text-3xl tabular-nums text-ink" role="timer" aria-label="Time until the next puzzle">
          {formatCountdown(msUntilNextLocalMidnight(now))}
        </p>
      </div>
    </section>
  );
}
