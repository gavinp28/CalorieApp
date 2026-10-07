/**
 * Daily puzzle calendar. Puzzle #1 is Aug 15, 2026 in the player's *local* calendar,
 * so everyone sees the same puzzle on the same calendar date, and a new one unlocks
 * at local midnight.
 *
 * All day arithmetic goes through `dayNumber` (days since the Unix epoch for a
 * calendar date, computed in UTC), so DST shifts never produce off-by-one days.
 */

export const LAUNCH = { year: 2026, month: 8, day: 15 } as const;
export const FREE_ARCHIVE_DAYS = 5;

const MS_PER_DAY = 86_400_000;

export interface CalendarDate {
  year: number;
  /** 1-12 */
  month: number;
  day: number;
}

export function dayNumber({ year, month, day }: CalendarDate): number {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

const LAUNCH_DAY = dayNumber(LAUNCH);

/** The calendar date the player is in, using the device's local time zone. */
export function localCalendarDate(now: Date): CalendarDate {
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
}

/** The calendar date at a fixed UTC offset (in hours). Used server-side. */
export function calendarDateAtOffset(nowMs: number, offsetHours: number): CalendarDate {
  const d = new Date(nowMs + offsetHours * 3_600_000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function puzzleNumberForDate(date: CalendarDate): number {
  return dayNumber(date) - LAUNCH_DAY + 1;
}

/** Today's puzzle number for the player. Zero or negative means "before launch". */
export function todaysPuzzleNumber(now: Date = new Date()): number {
  return puzzleNumberForDate(localCalendarDate(now));
}

export function dateForPuzzle(n: number): CalendarDate {
  const d = new Date((LAUNCH_DAY + n - 1) * MS_PER_DAY);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function isoDate({ year, month, day }: CalendarDate): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Milliseconds until the next local midnight (DST-safe: built from local components). */
export function msUntilNextLocalMidnight(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return next.getTime() - now.getTime();
}

/** "HH:MM:SS" countdown text. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Maps a daily puzzle number to an index in a daily list. The list cycles once
 * every entry has been used (puzzle #366 reuses entry 0).
 */
export function dailyIndex(n: number, length: number): number {
  return (((n - 1) % length) + length) % length;
}

/** Past puzzles a player can open for free, given their today. */
export function isFreeArchive(n: number, today: number): boolean {
  return n >= 1 && n < today && n >= today - FREE_ARCHIVE_DAYS;
}

/**
 * Server-side view of "today": real time zones span UTC-12 to UTC+14, so at any
 * instant players can be on one of two (sometimes three) calendar dates.
 */
export function possibleTodayRange(nowMs: number): { min: number; max: number } {
  return {
    min: puzzleNumberForDate(calendarDateAtOffset(nowMs, -12)),
    max: puzzleNumberForDate(calendarDateAtOffset(nowMs, 14)),
  };
}

/**
 * Whether a daily puzzle may be served without an unlock token: today (in any
 * time zone) or one of the free archive days before it.
 */
export function isPublicDaily(n: number, nowMs: number): boolean {
  const { min, max } = possibleTodayRange(nowMs);
  return n >= 1 && n <= max && n >= min - FREE_ARCHIVE_DAYS;
}
