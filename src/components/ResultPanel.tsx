import type { ReactNode } from 'react';
import type { GameStatus } from '../../shared/grading';
import type { Stats } from '../../shared/stats';
import type { Mode } from '../../shared/types';
import { useCountUp } from '../lib/motion';
import { Confetti } from './Confetti';
import { ShareIcon } from './Icons';

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
  onShare: () => void;
  /** Shown for today's daily. */
  stats?: Stats;
  /** Extra content above the answer, e.g. the plate breakdown. */
  children?: ReactNode;
  /** Countdown for today's daily, navigation for archive puzzles. */
  footer: ReactNode;
}

const WIN_TITLES = ['Bullseye!', 'Sharp!', 'Nicely done!', 'Close call!', 'Phew, just in time!'];

export function ResultPanel(props: Props) {
  const { mode, status, answer, guessCount, closest, justFinished, countDelayMs = 0, onShare, stats, children, footer } = props;
  const shown = useCountUp(answer, 1200, justFinished, countDelayMs);
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

      <button type="button" onClick={onShare} className="btn btn-primary mt-6 h-14 w-full text-lg">
        <ShareIcon className="size-5" />
        Share result
      </button>

      {stats && (
        <dl className="mt-5 grid grid-cols-4 gap-2">
          {[
            [stats.played, 'Played'],
            [`${stats.winPct}%`, 'Win'],
            [stats.streak, 'Streak'],
            [stats.best, 'Best'],
          ].map(([v, label]) => (
            <div key={label} className="flex flex-col-reverse">
              <dt className="text-xs font-semibold text-muted">{label}</dt>
              <dd className="font-display text-2xl tabular-nums text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-5">{footer}</div>
    </section>
  );
}
