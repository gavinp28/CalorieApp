import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { dateForPuzzle } from '../../shared/dates';
import { DIRECTION_LABEL, MAX_GUESSES, SCALE_MAX, TIER_LABEL } from '../../shared/grading';
import type { FoodPuzzle, Mode, PlatePuzzle, PuzzleKind } from '../../shared/types';
import { haptic } from '../lib/feedback';
import { copyResult } from '../lib/share';
import { useGame } from '../lib/useGame';
import { useModeStats } from '../lib/useStats';
import { Countdown } from './Countdown';
import { FoodCard } from './FoodCard';
import { GuessInput } from './GuessInput';
import { GuessList } from './GuessList';
import { ChevronLeft } from './Icons';
import { PlateBreakdown, revealDuration } from './PlateBreakdown';
import { PlateCard } from './PlateCard';
import { RangeBar } from './RangeBar';
import { ResultPanel } from './ResultPanel';
import { useToast } from './Toast';
import { UnlockSheet } from './UnlockSheet';

/** Bonus puzzles per mode. Matches data/*-bonus.json (checked by data.test.ts). */
export const BONUS_COUNT = 40;

export const playPath = (mode: Mode, kind: PuzzleKind, n: number) => `/play/${mode}/${kind}/${n}`;
export const label = (kind: PuzzleKind, n: number) => (kind === 'bonus' ? `Bonus #${n}` : `#${n}`);

export const longDate = (n: number) => {
  const { year, month, day } = dateForPuzzle(n);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

function Notice({ emoji, title, children }: { emoji: string; title: string; children: ReactNode }) {
  return (
    <div className="card animate-fade-up mx-auto max-w-md p-8 text-center">
      <p className="text-5xl" aria-hidden>
        {emoji}
      </p>
      <h1 className="font-display mt-3 text-2xl">{title}</h1>
      {children}
    </div>
  );
}

const NOUN: Record<Mode, string> = { food: 'food', plate: 'plate' };

interface GameViewProps {
  mode: Mode;
  kind: PuzzleKind;
  number: number;
  today: number;
}

/** One playable puzzle: today's daily, an archive day, or a bonus puzzle. */
export function GameView({ mode, kind, number, today }: GameViewProps) {
  const game = useGame(mode, kind, number, today);
  const toast = useToast();
  const isToday = kind === 'daily' && number === today;
  const stats = useModeStats(mode, today);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  if (game.load.state === 'loading') return <Skeleton />;
  if (game.load.state === 'error') {
    const code = game.load.code;
    if (code === 'locked') {
      return (
        <Notice emoji="🔒" title={`${label(kind, number)} is locked`}>
          <p className="mt-2 text-muted">
            {kind === 'bonus' ? 'Bonus puzzles' : 'Days older than the last 5'} unlock with a one-time purchase that covers both modes.
          </p>
          <button type="button" className="btn btn-primary mt-5 h-12 px-6" onClick={() => setUnlockOpen(true)}>
            See what's included
          </button>
          <UnlockSheet open={unlockOpen} onClose={() => setUnlockOpen(false)} />
        </Notice>
      );
    }
    if (code === 'not_found' || code === 'not_released') {
      return (
        <Notice emoji="🍳" title={isToday ? `Today's ${NOUN[mode]} is still cooking` : 'Not on the menu yet'}>
          <p className="mt-2 text-muted">{isToday ? 'A fresh puzzle is on its way. Check back soon.' : "This puzzle isn't out yet."}</p>
        </Notice>
      );
    }
    return (
      <Notice emoji="🥄" title={`Couldn't load this ${NOUN[mode]}`}>
        <p className="mt-2 text-muted">Check your connection and try again.</p>
        <button type="button" className="btn btn-primary mt-5 h-12 px-6" onClick={game.retry}>
          Try again
        </button>
      </Notice>
    );
  }

  const puzzle = game.puzzle!;
  const next = kind === 'bonus' ? (number < BONUS_COUNT ? number + 1 : null) : number > 1 ? number - 1 : null;
  const done = game.status !== 'playing';

  const eyebrow =
    kind === 'bonus'
      ? `${mode === 'plate' ? 'Bonus plate' : 'Bonus food'} #${number}`
      : `${isToday ? (mode === 'plate' ? 'Daily plate' : 'Daily') : 'Archive'} #${number} · ${longDate(number)}`;

  const onShare = async () => {
    const ok = await copyResult({ mode, kind, number, guesses: game.guesses, answer: puzzle.kcal });
    toast(ok ? 'Result copied to clipboard' : "Couldn't copy. Try again.");
    if (ok) haptic('tap');
  };

  const footer = isToday ? (
    <Countdown label={`Next ${NOUN[mode]} in`} />
  ) : (
    <div className="flex gap-2">
      <Link to={`/archive?mode=${mode}${kind === 'bonus' ? '&view=bonus' : ''}`} className="btn h-12 flex-1 bg-surface-2 text-ink">
        <ChevronLeft className="size-5" /> {kind === 'bonus' ? 'Bonus' : 'Archive'}
      </Link>
      {next && (
        <Link to={playPath(mode, kind, next)} className="btn h-12 flex-1 bg-ink text-bg">
          {label(kind, next)} →
        </Link>
      )}
    </div>
  );

  const rangeBar = (
    <RangeBar
      scale={SCALE_MAX[mode]}
      range={done ? { low: puzzle.kcal, high: puzzle.kcal } : game.range}
      guesses={game.guesses}
      grades={game.grades}
      answer={done ? puzzle.kcal : undefined}
    />
  );

  const onGuess = (n: number) => {
    const grade = game.submit(n);
    if (!grade) return;
    const count = game.guesses.length + 1;
    if (grade.tier === 'win') {
      haptic('win');
      setJustFinished(true);
      setAnnouncement(`${n} calories. Correct! The answer is ${puzzle.kcal} calories.`);
      return;
    }
    setShakeKey((k) => k + 1);
    if (count >= MAX_GUESSES) {
      haptic('lose');
      setJustFinished(true);
      setAnnouncement(`${n} calories. ${TIER_LABEL[grade.tier]}. Out of guesses. The answer was ${puzzle.kcal} calories.`);
    } else {
      haptic('miss');
      setAnnouncement(
        `${n} calories: ${TIER_LABEL[grade.tier]}, go ${DIRECTION_LABEL[grade.direction].toLowerCase()}. ${MAX_GUESSES - count} guesses left.`,
      );
    }
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[1.05fr_1fr] md:items-start md:gap-6">
      <p className="sr-only" aria-live="assertive">
        {announcement}
      </p>
      <div className="space-y-4 md:sticky md:top-20">
        {puzzle.mode === 'food' ? (
          <FoodCard puzzle={puzzle as FoodPuzzle} eyebrow={eyebrow} shakeKey={shakeKey} />
        ) : (
          <PlateCard puzzle={puzzle as PlatePuzzle} eyebrow={eyebrow} shakeKey={shakeKey} showKcal={done && !justFinished} />
        )}
        <div className="hidden md:block">{rangeBar}</div>
      </div>
      <div className="space-y-4">
        {done ? (
          <ResultPanel
            mode={mode}
            status={game.status as 'won' | 'lost'}
            answer={puzzle.kcal}
            guessCount={game.guesses.length}
            closest={closestGuess(game.guesses, puzzle.kcal)}
            justFinished={justFinished}
            countDelayMs={puzzle.mode === 'plate' && justFinished ? revealDuration(puzzle.items.length) : 0}
            onShare={onShare}
            stats={isToday ? stats : undefined}
            footer={footer}
          >
            {puzzle.mode === 'plate' && <PlateBreakdown items={puzzle.items} animate={justFinished} />}
          </ResultPanel>
        ) : (
          <GuessInput guessCount={game.guesses.length} previous={game.guesses} onGuess={onGuess} />
        )}
        {/* On phones the range bar sits under the guess box so guessing needs no scrolling. */}
        <div className="md:hidden">{rangeBar}</div>
        <GuessList guesses={game.guesses} grades={game.grades} />
      </div>
    </div>
  );
}

const closestGuess = (guesses: number[], answer: number) =>
  guesses.reduce((best, g) => (Math.abs(g - answer) < Math.abs(best - answer) ? g : best), guesses[0] ?? 0);

function Skeleton() {
  return (
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading puzzle">
      <div className="card h-[26rem] animate-pulse" />
      <div className="space-y-2">
        <div className="card h-24 animate-pulse" />
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
