import { formatCountdown, msUntilNextLocalMidnight } from '../../shared/dates';
import type { Mode } from '../../shared/types';
import { GameView } from '../components/GameView';
import { ModeTabs } from '../components/ModeTabs';
import { useNow, useToday } from '../lib/useToday';

export function DailyPage({ mode }: { mode: Mode }) {
  const today = useToday();
  return (
    <>
      <ModeTabs today={today} />
      {today < 1 ? <PreLaunch /> : <GameView key={`${mode}-${today}`} mode={mode} kind="daily" number={today} today={today} />}
    </>
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
