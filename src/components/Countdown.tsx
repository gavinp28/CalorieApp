import { formatCountdown, msUntilNextLocalMidnight } from '../../shared/dates';
import { useNow } from '../lib/useToday';

export function Countdown({ label, className = '' }: { label: string; className?: string }) {
  const now = useNow();
  return (
    <div className={`rounded-2xl bg-surface-2 px-4 py-3 text-center ${className}`}>
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p
        className="font-display text-3xl tabular-nums text-ink"
        role="timer"
        aria-label={`${label}: ${formatCountdown(msUntilNextLocalMidnight(now))}`}
      >
        {formatCountdown(msUntilNextLocalMidnight(now))}
      </p>
    </div>
  );
}
