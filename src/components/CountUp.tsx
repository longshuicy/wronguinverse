// CountUp.tsx
// A number that arrives rather than one that is simply there.
//
// Only worth it for figures the player is meant to READ. A number that counts
// up is a number that gets looked at, which is the entire problem with a stats
// row: six values in identical type, all present from the first frame, and no
// reason for the eye to stop on any of them.
//
// Integers only, and it always lands exactly on the target — a counter that
// eases and stops at 67 when the answer is 68 is worse than no counter.

import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  /** Held at 0 until this turns true, so it can be part of a staged reveal. */
  start?: boolean;
  durationMs?: number;
  /** Rendered around the number, e.g. a percent sign. */
  suffix?: string;
}

export function CountUp({ value, start = true, durationMs = 520, suffix = '' }: CountUpProps) {
  const [reducedMotion] = useState(
    () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [counted, setCounted] = useState(0);

  // Derived during render rather than pushed into state by an effect: when
  // there is nothing to animate, the answer IS the value, and writing it into
  // state would only schedule a second render to say the same thing.
  const animating = start && !reducedMotion;
  const shown = animating ? counted : value;

  useEffect(() => {
    if (!animating || value === 0) return;

    let frame = 0;
    let began = 0;
    const tick = (now: number) => {
      if (began === 0) began = now;
      const progress = Math.min(1, (now - began) / durationMs);
      setCounted(Math.round(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, animating, durationMs]);

  return (
    <>
      {shown}
      {suffix}
    </>
  );
}
