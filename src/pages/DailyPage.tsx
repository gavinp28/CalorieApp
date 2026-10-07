import { useState } from 'react';
import { dateForPuzzle, formatCountdown, msUntilNextLocalMidnight } from '../../shared/dates';
import { DIRECTION_LABEL, MAX_GUESSES, SCALE_MAX, TIER_LABEL } from '../../shared/grading';
import type { FoodPuzzle, Mode, PlatePuzzle } from '../../shared/types';
import { FoodCard } from '../components/FoodCard';
import { PlateBreakdown, revealDuration } from '../components/PlateBreakdown';
import { PlateCard } from '../components/PlateCard';
import { GuessInput } from '../components/GuessInput';
import { GuessList } from '../components/GuessList';
import { ModeTabs } from '../components/ModeTabs';
import { RangeBar } from '../components/RangeBar';
import { ResultPanel } from '../components/ResultPanel';
import { haptic } from '../lib/feedback';
import { useGame } from '../lib/useGame';
import { useNow, useToday } from '../lib/useToday';

const longDate = (n: number) => {
  const { year, month, day } = dateForPuzzle(n);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

export function DailyPage({ mode }: { mode: Mode }) {
  const today = useToday();
  return (
    <>
      <ModeTabs today={today} />
      {today < 1 ? <PreLaunch /> : <DailyGame key={`${mode}-${today}`} mode={mode} number={today} today={today} />}
    </>
  );
}

const NOUN: Record<Mode, string> = { food: 'food', plate: 'plate' };

function DailyGame({ mode, number, today }: { mode: Mode; number: number; today: number }) {
  const game = useGame(mode, 'daily', number, today);
  const [shakeKey, setShakeKey] = useState(0);
  const [justFinished, setJustFinished] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  if (game.load.state === 'loading') return <Skeleton />;
  if (game.load.state === 'error' && game.load.code === 'not_found') {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-5xl" aria-hidden>
          🍳
        </p>
        <h1 className="font-display mt-3 text-2xl">Today's {NOUN[mode]} is still cooking</h1>
        <p className="mt-2 text-muted">A fresh puzzle is on its way. Check back soon.</p>
      </div>
    );
  }
  if (game.load.state === 'error') {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <p className="text-5xl" aria-hidden>
          🥄
        </p>
        <h1 className="font-display mt-3 text-2xl">Couldn't load today's {NOUN[mode]}</h1>
        <p className="mt-2 text-muted">Check your connection and try again.</p>
        <button type="button" className="btn btn-primary mt-5 h-12 px-6" onClick={game.retry}>
          Try again
        </button>
      </div>
    );
  }

  const puzzle = game.puzzle!;
  const done = game.status !== 'playing';

  const eyebrow = `${mode === 'plate' ? 'Daily plate' : 'Daily'} #${puzzle.number} · ${longDate(puzzle.number)}`;

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
    <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2" aria-busy="true" aria-label="Loading today's puzzle">
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

function PreLaunch() {
  const now = useNow();
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <p className="text-6xl" aria-hidden>
        ⏳
      </p>
      <h1 className="font-display mt-3 text-3xl">Puzzle #1 arrives Aug 15, 2026</h1>
      <p className="font-display mt-4 text-2xl tabular-nums text-primary">{formatCountdown(msUntilNextLocalMidnight(now))}</p>
      <p className="mt-1 text-sm text-muted">until midnight</p>
    </div>
  );
}
