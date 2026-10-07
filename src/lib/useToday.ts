import { useEffect, useState } from 'react';
import { msUntilNextLocalMidnight, todaysPuzzleNumber } from '../../shared/dates';

/** Today's puzzle number; re-renders at local midnight and when the tab wakes up. */
export function useToday(): number {
  const [today, setToday] = useState(() => todaysPuzzleNumber());

  useEffect(() => {
    const check = () => setToday(todaysPuzzleNumber());
    // +250 ms so we land safely after midnight.
    const timer = setTimeout(check, msUntilNextLocalMidnight() + 250);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', check);
    };
  }, [today]);

  return today;
}

/** Re-renders every second; for countdowns. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
