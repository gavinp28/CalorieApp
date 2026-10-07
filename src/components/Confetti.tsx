import { useMemo } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const PIECES = ['🎉', '✨', '⭐', '🟩', '🎊', '💥'];
const COLORS = ['var(--primary)', 'var(--accent)', 'var(--tier-win)', 'var(--tier-close)'];

/** A one-shot burst of shapes and emoji from the center of its container. */
export function Confetti({ count = 36 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
        const dist = 120 + Math.random() * 160;
        return {
          dx: `${Math.cos(angle) * dist}px`,
          dy: `${Math.sin(angle) * dist - 60}px`,
          rot: `${Math.random() * 540 - 270}deg`,
          delay: `${Math.random() * 120}ms`,
          emoji: i % 3 === 0 ? PIECES[i % PIECES.length] : null,
          color: COLORS[i % COLORS.length],
        };
      }),
    [count],
  );
  if (prefersReducedMotion()) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/3"
          style={{
            ['--dx' as string]: b.dx,
            ['--dy' as string]: b.dy,
            ['--rot' as string]: b.rot,
            animation: `burst 1.3s cubic-bezier(.15,.7,.3,1) ${b.delay} both`,
          }}
        >
          {b.emoji ? (
            <span className="text-xl">{b.emoji}</span>
          ) : (
            <span className="block h-2.5 w-1.5 rounded-sm" style={{ background: b.color }} />
          )}
        </span>
      ))}
    </div>
  );
}
