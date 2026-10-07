import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { dateForPuzzle, FREE_ARCHIVE_DAYS, isFreeArchive } from '../../shared/dates';
import { MAX_GUESSES } from '../../shared/grading';
import { puzzleId, type Mode, type PuzzleKind } from '../../shared/types';
import { Countdown } from '../components/Countdown';
import { BONUS_COUNT, playPath } from '../components/GameView';
import { CheckIcon, LockIcon, XIcon } from '../components/Icons';
import { UnlockSheet } from '../components/UnlockSheet';
import { PRICE, useUnlock } from '../lib/entitlement';
import { load } from '../lib/storage';
import type { GameResult } from '../lib/useGame';
import { useResults } from '../lib/useStats';
import { useToday } from '../lib/useToday';

type View = 'days' | 'bonus';

const shortDate = (n: number) => {
  const { year, month, day } = dateForPuzzle(n);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function ArchivePage() {
  const [params, setParams] = useSearchParams();
  const mode: Mode = params.get('mode') === 'plate' ? 'plate' : 'food';
  const view: View = params.get('view') === 'bonus' ? 'bonus' : 'days';
  const today = useToday();
  const unlock = useUnlock();
  const unlocked = !!unlock;
  const results = useResults(mode);
  const [sheet, setSheet] = useState(false);

  const set = (next: { mode?: Mode; view?: View }) => {
    const m = next.mode ?? mode;
    const v = next.view ?? view;
    setParams({ ...(m === 'plate' && { mode: m }), ...(v === 'bonus' && { view: v }) }, { replace: true });
  };

  const past = Array.from({ length: Math.max(0, today - 1) }, (_, i) => today - 1 - i);
  const free = past.filter((n) => isFreeArchive(n, today));
  const older = past.filter((n) => !isFreeArchive(n, today));
  const bonus = Array.from({ length: BONUS_COUNT }, (_, i) => i + 1);
  const noun = mode === 'plate' ? 'plates' : 'foods';

  const tile = (kind: PuzzleKind, n: number, locked: boolean) => (
    <Tile key={n} mode={mode} kind={kind} n={n} locked={locked} result={results[puzzleId(mode, kind, n)]} onLocked={() => setSheet(true)} />
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-ink">Archive</h1>
          <p className="mt-1 text-muted">
            {view === 'days'
              ? `${past.length} past ${noun}. ${unlocked ? 'All unlocked.' : `The last ${FREE_ARCHIVE_DAYS} days are free.`}`
              : `${BONUS_COUNT} extra ${noun} that never appear as dailies.`}
          </p>
        </div>
        <Countdown label="Next daily in" className="hidden py-2 sm:block" />
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Segmented
          label="Mode"
          value={mode}
          onChange={(m) => set({ mode: m })}
          options={[
            ['food', '🍎 Single food'],
            ['plate', '🍽️ Full plate'],
          ]}
        />
        <Segmented
          label="Puzzles"
          value={view}
          onChange={(v) => set({ view: v })}
          options={[
            ['days', 'Past days'],
            ['bonus', 'Bonus'],
          ]}
        />
      </div>

      {view === 'days' ? (
        <>
          {past.length === 0 && <p className="card mt-6 p-6 text-center text-muted">No past puzzles yet. Come back tomorrow!</p>}
          {free.length > 0 && (
            <Section title={unlocked ? 'This week' : 'Free this week'}>{free.map((n) => tile('daily', n, false))}</Section>
          )}
          {older.length > 0 && (
            <>
              {!unlocked && <UnlockBanner onClick={() => setSheet(true)} />}
              <Section title="Older days">{older.map((n) => tile('daily', n, !unlocked))}</Section>
            </>
          )}
        </>
      ) : (
        <>
          {!unlocked && <UnlockBanner onClick={() => setSheet(true)} />}
          <Section title={`Bonus ${noun}`}>{bonus.map((n) => tile('bonus', n, !unlocked))}</Section>
        </>
      )}

      <UnlockSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-1 rounded-full bg-surface-2 p-1">
      {options.map(([v, text]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={`flex-1 rounded-full py-2.5 text-sm font-bold transition ${value === v ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'}`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">{title}</h2>
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">{children}</ul>
    </section>
  );
}

function UnlockBanner({ onClick }: { onClick: () => void }) {
  return (
    <div
      className="card mt-7 flex flex-col items-start gap-3 bg-accent p-5 sm:flex-row sm:items-center"
      style={{ background: 'var(--accent)' }}
    >
      <div className="flex-1 text-accent-ink">
        <p className="font-display text-xl">Unlock every past day + 80 bonus puzzles</p>
        <p className="text-sm font-medium opacity-80">One-time {PRICE}. Covers Single food and Full plate.</p>
      </div>
      <button type="button" onClick={onClick} className="btn btn-primary h-12 px-6">
        Unlock
      </button>
    </div>
  );
}

interface TileProps {
  mode: Mode;
  kind: PuzzleKind;
  n: number;
  locked: boolean;
  result?: GameResult;
  onLocked: () => void;
}

function Tile({ mode, kind, n, locked, result, onLocked }: TileProps) {
  const inProgress = !result ? (load<{ guesses: number[] } | null>(`game:${puzzleId(mode, kind, n)}`, null)?.guesses.length ?? 0) : 0;
  const title = kind === 'bonus' ? `Bonus #${n}` : `#${n}`;
  const sub = kind === 'bonus' ? (result?.name ?? 'Extra') : shortDate(n);
  const status = locked
    ? 'locked'
    : result
      ? result.won
        ? `solved in ${result.guesses.length}`
        : 'not solved'
      : inProgress
        ? `in progress, ${inProgress} of ${MAX_GUESSES} guesses used`
        : 'not played';

  const body = (
    <>
      <span className="flex items-start justify-between">
        <span className="font-display text-lg leading-none text-ink">{title}</span>
        {locked ? (
          <LockIcon className="size-4 text-muted" />
        ) : result ? (
          <span className={`grid size-5 place-items-center rounded-full ${result.won ? 'tier-win' : 'tier-cold'}`}>
            {result.won ? <CheckIcon className="size-3" /> : <XIcon className="size-3" />}
          </span>
        ) : inProgress ? (
          <span className="size-2.5 rounded-full bg-primary" />
        ) : null}
      </span>
      <span className="mt-auto flex items-end justify-between gap-1">
        <span className="truncate text-xs font-semibold text-muted">{sub}</span>
        {result?.emoji ? (
          <span className="text-2xl leading-none" aria-hidden>
            {result.emoji}
          </span>
        ) : result?.won ? (
          <span className="text-xs font-bold text-ink">{result.guesses.length}/5</span>
        ) : null}
      </span>
    </>
  );

  const cls = `flex h-24 w-full flex-col rounded-2xl p-3 text-left transition active:scale-[0.97] ${
    locked
      ? 'bg-surface-2/60 opacity-75 hover:opacity-100'
      : 'bg-surface shadow-sm ring-1 ring-black/5 hover:-translate-y-0.5 hover:shadow-md'
  }`;

  return (
    <li>
      {locked ? (
        <button type="button" onClick={onLocked} className={cls} aria-label={`${title}, ${sub}: locked`}>
          {body}
        </button>
      ) : (
        <Link to={playPath(mode, kind, n)} className={cls} aria-label={`${title}, ${sub}: ${status}`}>
          {body}
        </Link>
      )}
    </li>
  );
}
