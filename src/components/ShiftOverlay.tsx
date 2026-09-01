// ShiftOverlay.tsx
// The drift and the explanation of what it leaves behind, as ONE layer over
// the bench.
//
// These were two full-screen moments in a row — a 2.4s glitch screen, then a
// card — and back to back they read as being clicked through rather than told
// something. They are now one overlay in two phases, mounted above the
// exploration bench: the clip plays over the (dimmed) controls, then the same
// violet panel stops shaking and becomes the practice card. Nothing swaps
// underneath, so it is one continuous beat with one dismissal at the end.
//
// The bench being visible the whole time is the point. Every line on the card
// describes the controls behind it.

import { useEffect, useRef } from 'react';
import {
  EXPLORE_BRIEF_DISMISS,
  EXPLORE_BRIEF_EXIT,
  EXPLORE_BRIEF_HEADLINE,
  EXPLORE_BRIEF_LINES,
  SHIFT_HEADLINE,
  SHIFT_SUBHEAD,
} from '../content/flavorText.ts';
import { AmbientClip } from './AmbientClip.tsx';

/** Matches the length the clip is trimmed to in scripts/clean-video.mjs. */
const GLITCH_MS = 2400;

interface ShiftOverlayProps {
  /** `glitch` is the drift itself; `brief` is the card it resolves into. */
  phase: 'glitch' | 'brief';
  /** Called when the glitch has run its length. Advances the stage to explore. */
  onGlitchEnd: () => void;
  /** Called when the player puts the card away. */
  onDismiss: () => void;
}

export function ShiftOverlay({ phase, onGlitchEnd, onDismiss }: ShiftOverlayProps) {
  const dismissRef = useRef<HTMLButtonElement>(null);
  const reducedMotion =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // No skip on the glitch. It is about two seconds and is the payoff the whole
  // first stage sets up; offering to cut it short invites missing the point.
  useEffect(() => {
    if (phase !== 'glitch') return;
    const timer = setTimeout(onGlitchEnd, GLITCH_MS);
    return () => clearTimeout(timer);
  }, [phase, onGlitchEnd]);

  // Focus lands on the card only once there is something to act on, so a
  // keyboard player is never focused on a button during the cutscene.
  useEffect(() => {
    if (phase !== 'brief') return;
    dismissRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onDismiss]);

  const glitching = phase === 'glitch';

  return (
    // Clicking anywhere dismisses the card. Clicks during the glitch land on
    // nothing on purpose: there is nothing to decide yet.
    <div
      className={glitching ? 'wui-brief-scrim is-drift' : 'wui-brief-scrim'}
      onClick={glitching ? undefined : onDismiss}
    >
      {glitching && <AmbientClip disabled={reducedMotion} />}

      {glitching ? (
        <div className={reducedMotion ? 'wui-shift-panel' : 'wui-shift-panel wui-shift-animated'}>
          <p className="wui-shift-headline">{SHIFT_HEADLINE}</p>
          <p className="wui-shift-subhead">{SHIFT_SUBHEAD}</p>
          {/* The tier's law is deliberately NOT printed here. This phase is two
              and a half seconds long and cannot be paused, so anything set on
              it is a line read against a clock, and a rule half-read is worse
              than one not read at all. The law lives in the chrome strip
              instead, which is permanent and can be reread at will. */}
        </div>
      ) : (
        <div
          className="wui-shift-panel wui-brief-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wui-brief-title"
        >
          <p className="wui-shift-headline" id="wui-brief-title">
            {EXPLORE_BRIEF_HEADLINE}
          </p>
          <ul className="wui-brief-list">
            {EXPLORE_BRIEF_LINES.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {EXPLORE_BRIEF_EXIT.map((line) => (
            <p className="wui-brief-exit" key={line}>
              {line}
            </p>
          ))}
          <button ref={dismissRef} type="button" className="wui-primary" onClick={onDismiss}>
            {EXPLORE_BRIEF_DISMISS}
          </button>
        </div>
      )}
    </div>
  );
}
