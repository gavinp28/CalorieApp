import { useEffect, useRef, useState } from 'react';

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates from 0 to `target` with an ease-out curve, optionally after a delay.
 * Jumps straight there when disabled or under reduced motion.
 */
export function useCountUp(target: number, durationMs = 1100, enabled = true, delayMs = 0) {
  const animate = enabled && !prefersReducedMotion();
  const [value, setValue] = useState(animate ? 0 : target);
  const frame = useRef(0);

  useEffect(() => {
    if (!animate) {
      setValue(target);
      return;
    }
    setValue(0);
    let start = 0;
    const tick = (t: number) => {
      start ||= t;
      const p = Math.min(1, (t - start) / durationMs);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 4))));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => (frame.current = requestAnimationFrame(tick)), delayMs);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs, animate, delayMs]);

  return value;
}

/**
 * Reveals `count` items one at a time, `stepMs` apart. Returns how many are
 * visible. Shows everything at once when disabled or under reduced motion.
 */
export function useStaggerReveal(count: number, stepMs: number, enabled = true, startDelayMs = 0) {
  const animate = enabled && !prefersReducedMotion();
  const [shown, setShown] = useState(animate ? 0 : count);

  useEffect(() => {
    if (!animate) {
      setShown(count);
      return;
    }
    setShown(0);
    const timers = Array.from({ length: count }, (_, i) => setTimeout(() => setShown(i + 1), startDelayMs + i * stepMs));
    return () => timers.forEach(clearTimeout);
  }, [count, stepMs, animate, startDelayMs]);

  return shown;
}
