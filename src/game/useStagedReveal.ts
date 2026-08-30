// useStagedReveal.ts
// Deal a screen out one section at a time, and let the player cut the deck.
//
// The result screen used to arrive complete and instant, which is how a web
// page behaves and not how a machine reporting a result behaves. Nothing about
// its CONTENT was wrong; it simply had no pacing, so the verdict, the read, the
// numbers and the rules all landed in the same moment and none of them got a
// beat of their own.
//
// Two rules this follows, both learned the hard way elsewhere in the game:
//
//   1. It must always be skippable, and by anything. A player who has seen the
//      report forty times should never be made to watch it again; the briefing
//      makes the same promise with its "Show it all" button.
//   2. Reduced motion means NO stagger at all, not a faster one. An animation
//      the reader cannot turn off is exactly what that preference is asking us
//      not to do.

import { useEffect, useState } from 'react';

export interface StagedReveal {
  /** How many steps have landed so far. */
  shown: number;
  /** Everything is out; nothing further will change. */
  done: boolean;
}

/**
 * `startAt` is how many beats are already out on the first frame, and it should
 * almost always be at least 1. A staged reveal that begins with NOTHING on
 * screen does not read as pacing; it reads as a page that failed to load, and
 * the player spends the first beat wondering whether the game broke rather than
 * reading the first thing it had to say.
 */
export function useStagedReveal(steps: number, stepMs = 420, startAt = 1): StagedReveal {
  const [reducedMotion] = useState(
    () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [shown, setShown] = useState(reducedMotion ? steps : Math.min(startAt, steps));

  useEffect(() => {
    if (shown >= steps) return;
    const timer = setTimeout(() => setShown((n) => n + 1), stepMs);
    return () => clearTimeout(timer);
  }, [shown, steps, stepMs]);

  // Any press or key finishes it. Bound to the window rather than to a "skip"
  // control: the impatient player is already reaching for the mouse to hit
  // "try again", and asking them to find a second button first is worse than
  // the wait.
  useEffect(() => {
    if (shown >= steps) return;
    const finish = () => setShown(steps);
    window.addEventListener('pointerdown', finish);
    window.addEventListener('keydown', finish);
    return () => {
      window.removeEventListener('pointerdown', finish);
      window.removeEventListener('keydown', finish);
    };
  }, [shown, steps]);

  return { shown, done: shown >= steps };
}
