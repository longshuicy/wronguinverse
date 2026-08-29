// ShiftTransition.tsx
// The moment the rules change. A short glitch, then straight into exploration.
//
// The mapping was already generated when the run began — this stage only
// reveals that it happened. See technical design §12.

import { useEffect, useState } from 'react';
import { SHIFT_HEADLINE, SHIFT_SUBHEAD } from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';

const GLITCH_MS = 1800;

export function ShiftTransition() {
  const beginExplore = useGameStore((s) => s.beginExplore);
  const [reducedMotion] = useState(
    () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const timer = setTimeout(beginExplore, GLITCH_MS);
    return () => clearTimeout(timer);
  }, [beginExplore]);

  return (
    <main className="wui-screen wui-shift">
      {/* The glitch is decorative; respecting reduced-motion drops the animation
          but keeps the message and the timing identical. */}
      <div className={reducedMotion ? 'wui-shift-panel' : 'wui-shift-panel wui-shift-animated'}>
        <p className="wui-shift-headline">{SHIFT_HEADLINE}</p>
        <p className="wui-shift-subhead">{SHIFT_SUBHEAD}</p>
      </div>
      <button type="button" className="wui-ghost" onClick={beginExplore}>
        Skip
      </button>
    </main>
  );
}
