// Haptic feedback on phones that support the Vibration API (Android Chrome;
// iOS Safari ignores it). Sound arrives in Phase 5 behind an opt-in toggle.

type Pattern = 'tap' | 'miss' | 'win' | 'lose';

const PATTERNS: Record<Pattern, number | number[]> = {
  tap: 8,
  miss: [18, 40, 18],
  win: [20, 60, 30, 60, 60],
  lose: [60, 80, 120],
};

export function haptic(p: Pattern) {
  try {
    navigator.vibrate?.(PATTERNS[p]);
  } catch {
    /* unsupported */
  }
}
