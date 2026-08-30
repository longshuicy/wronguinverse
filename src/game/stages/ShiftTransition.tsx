// ShiftTransition.tsx
// The moment the rules change. Art guide §9 calls this a major identity
// moment, and it is the one screen with nothing to read and nothing to
// operate, so it is the only place a full-bleed rendered clip belongs.
//
// The mapping was already generated when the run began; this stage only
// reveals that it happened.

import { useEffect, useState } from 'react';
import { AmbientClip } from '../../components/AmbientClip.tsx';
import { SHIFT_HEADLINE, SHIFT_SUBHEAD } from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';

/** Matches the length the clip is trimmed to in scripts/clean-video.mjs. */
const GLITCH_MS = 2400;

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
      <AmbientClip disabled={reducedMotion} />

      <div className={reducedMotion ? 'wui-shift-panel' : 'wui-shift-panel wui-shift-animated'}>
        <p className="wui-shift-headline">{SHIFT_HEADLINE}</p>
        <p className="wui-shift-subhead">{SHIFT_SUBHEAD}</p>
        {/* Tier 3's law is deliberately NOT printed here. This screen is two
            and a half seconds long and cannot be paused, so anything set on it
            is a line the player is asked to read against a clock — and a rule
            half-read is worse than one not read at all. The law lives in the
            chrome strip instead, which is permanent and can be reread whenever
            the player wants it. */}
      </div>

      {/* No skip. The transition is about two seconds and is the payoff the
          whole first stage sets up; offering to cut it short invites the
          player to miss the point of the game. */}
    </main>
  );
}
