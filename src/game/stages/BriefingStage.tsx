// BriefingStage.tsx
// The Reality Index. The lore lives here rather than on the landing page,
// where it competed with the thing the player came to press.
//
// Typed out rather than dumped, so it is read at the pace of a terminal
// printing it. That is a deliberate cost: it is the only screen that asks the
// player to slow down, and the fiction only lands if somebody reads it.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AmbientClip } from '../../components/AmbientClip.tsx';
import { briefingParagraphs } from '../../content/flavorText.ts';
import { useGameStore } from '../state/gameStore.ts';

/** Milliseconds per character. Fast enough to read along with, not wait for. */
const CHAR_MS = 14;
/** A beat between paragraphs, so they do not run together. */
const PARAGRAPH_MS = 320;

export function BriefingStage() {
  const returnToIntro = useGameStore((s) => s.returnToIntro);
  const beginRun = useGameStore((s) => s.beginRun);
  // The index describes the rules the player is about to meet, so it follows
  // the tier they picked on the way in.
  const tier = useGameStore((s) => s.tier);
  const fullText = useMemo(() => briefingParagraphs(tier.id).join('\n'), [tier.id]);

  const [reducedMotion] = useState(
    () =>
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  // Reduced motion gets the whole text at once: an animation the reader cannot
  // turn off is exactly what that preference is asking us not to do.
  const [revealed, setRevealed] = useState(reducedMotion ? fullText.length : 0);
  const done = revealed >= fullText.length;
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done) return;
    // Pause a little longer at a line break than mid-sentence.
    const atBreak = fullText[revealed] === '\n';
    const timer = setTimeout(() => setRevealed((n) => n + 1), atBreak ? PARAGRAPH_MS : CHAR_MS);
    return () => clearTimeout(timer);
  }, [revealed, done, fullText]);

  // Keep the newest line in view without yanking the page around.
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [revealed]);

  const shown = fullText.slice(0, revealed).split('\n');

  return (
    <main className="wui-screen wui-briefing">
      {/* Looped here, unlike the shift: this page is read at the player's own
          pace, and a clip that stopped halfway through would just look broken. */}
      <AmbientClip disabled={reducedMotion} loop />

      <h1 className="wui-briefing-title">REALITY INDEX</h1>

      <div className="wui-briefing-body" ref={bodyRef}>
        {shown.map((paragraph, i) => (
          // Index keys are safe here: this list only ever grows at the end.
          <p key={i} className="wui-briefing-line">
            {paragraph}
            {i === shown.length - 1 && !done && <span className="wui-caret" aria-hidden="true" />}
          </p>
        ))}
      </div>

      <div className="wui-actions wui-actions-centred">
        {/* Always available: a player who does not want the lore should not
            have to sit through it to reach the game. */}
        <button type="button" className="wui-start" onClick={() => beginRun()}>
          Begin calibration
        </button>
        {/* Fills the text in without moving on, for a reader who is ahead of
            the typing but still wants to read it. */}
        {!done && (
          <button type="button" className="wui-ghost" onClick={() => setRevealed(fullText.length)}>
            Show it all
          </button>
        )}
        <button type="button" className="wui-ghost" onClick={returnToIntro}>
          Back
        </button>
      </div>
    </main>
  );
}
