// PointerLaw.tsx
// The enforcer for Tier 3. Mounted once, above every stage, because the law is
// a property of the pointer rather than of any screen.
//
// It does two jobs that have to stay together:
//
//   ENFORCE  — swallow what the pointer natively does, and re-issue it on the
//              run's own terms (`pointerLawEngine.ts` holds the terms).
//   DISCLOSE — the cursor carries an arc showing what is about to happen.
//
// The disclosure half is not decoration. Tier 2's `useRefusal` can say "you did
// the wrong thing" AFTER the fact, because its failure mode is a gesture that
// does nothing. Tier 3's failure mode is the opposite — an accidental SUCCESS
// — and there is no after in which to warn about it. So the arc is drawn before
// the commit, always, and a law without one would read as a bug rather than as
// a rule. If these two halves are ever split apart, split them back.

import { useEffect, useRef } from 'react';
import { playSfx } from '../audio/audioManager.ts';
import { getPointerLaw, pointerLawSupported, type PointerLawId } from '../game/pointerLaw.ts';
import {
  commitAt,
  createLawHandler,
  governedAt,
  isDraggable,
  type LawContext,
} from './pointerLawEngine.ts';

/** How long the commit and refusal flashes stay on the cursor. */
const FLASH_MS = 220;

export function PointerLaw({ law }: { law: PointerLawId }) {
  const ringRef = useRef<HTMLDivElement>(null);
  const config = getPointerLaw(law);

  useEffect(() => {
    if (!pointerLawSupported()) return;
    const ring = ringRef.current;
    if (!ring) return;

    let frame = 0;
    // The pointer's last known position, and OURS to remember: every law
    // swallows the press, so by the time a commit is issued no control has been
    // told where the pointer was. Continuous controls are governable only
    // because this is kept.
    let at = { x: 0, y: 0 };
    // Set only while we dispatch a commit, so the capture handlers below can
    // tell OUR events from the player's. `detail === 0` cannot: a programmatic
    // click and a keyboard-activated one look identical.
    let committing = false;
    /**
     * The control the pointer has a grip on, if any.
     *
     * Every law swallows the press, which also swallowed the drag that used to
     * follow it — so a slider could only ever be placed one press at a time.
     * A law granting a commit on a positional control now grants a GRIP on it
     * as well, and movement keeps committing until the grip ends. Dragging is
     * how sliders have always worked; a law is meant to change what the pointer
     * does, not to take a whole gesture off the table.
     */
    let dragging: Element | null = null;
    const flashes: ReturnType<typeof setTimeout>[] = [];

    // The whole terminal flinches, not just the cursor.
    const shell = document.querySelector('.wui-shell');

    const flash = (name: string) => {
      ring.classList.add(name);
      flashes.push(setTimeout(() => ring.classList.remove(name), FLASH_MS));
    };

    const context: LawContext = {
      config,
      progress: (value) => ring.style.setProperty('--dwell', String(value)),
      flag: (name, on) => ring.classList.toggle(name, on),
      refuse: () => {
        // Loud on purpose. A refusal that only twitched the cursor was being
        // missed entirely — the player's eyes are on the control they aimed
        // at, not on the pointer — and a law nobody notices refusing them
        // reads as a dead control rather than as a rule.
        flash('is-refusing');
        shell?.classList.add('wui-law-shock');
        flashes.push(setTimeout(() => shell?.classList.remove('wui-law-shock'), FLASH_MS));
        playSfx('mismatch');
      },
      commit: (element) => {
        flash('is-committing');
        committing = true;
        commitAt(element, at.x, at.y);
        committing = false;
        if (isDraggable(element)) dragging = element;
      },
    };

    const handler = createLawHandler(law, context);

    /**
     * Where the pointer really is, as far as the law is concerned, and what is
     * under it.
     *
     * A law that moves the aim point cannot use `event.target` — the browser
     * reports what is under the CURSOR, and the whole point of such a law is
     * that those are different places. Hit-testing the aimed point is the only
     * answer that stays true for both kinds of law.
     */
    const resolve = (event: PointerEvent): Element | null => {
      const aimed = handler.aim?.(event.clientX, event.clientY) ?? {
        x: event.clientX,
        y: event.clientY,
      };
      at = aimed;
      // Written straight to the element rather than kept in React: the ring has
      // to sit on its point on the same frame the pointer moved, or the dwell
      // it is reporting looks like someone else's.
      ring.style.transform = `translate(${aimed.x}px, ${aimed.y}px)`;
      return handler.aim
        ? governedAt(document.elementFromPoint(aimed.x, aimed.y))
        : governedAt(event.target as Element | null);
    };

    const onMove = (event: PointerEvent) => {
      const element = resolve(event);

      if (dragging) {
        // A dwell-granted grip is held by staying on the control, since there
        // is no button to hold; a press-granted one is held by the button and
        // survives wandering off, exactly as a native drag does.
        if (handler.dragEnds === 'leave' && element !== dragging) dragging = null;
        else {
          committing = true;
          commitAt(dragging, at.x, at.y);
          committing = false;
          // The law does not get to re-judge a drag it already allowed: under
          // `calmHand` every frame of one would otherwise read as hurry.
          return;
        }
      }

      handler.onMove?.(element, event);
    };

    const onDown = (event: PointerEvent) => {
      if (committing) return;
      const aimed = resolve(event);
      // Under a law that moves the aim point these are two DIFFERENT controls:
      // the one the press will act on, and the one the player's hand is
      // physically over. Both have to be handled, and forgetting the second is
      // what made `invertedPointer` feel dead — a press over a real button,
      // aimed at empty space, escaped this handler untouched and was then
      // swallowed by `onClick`, so nothing happened and nothing said why.
      const under = governedAt(event.target as Element | null);
      if (!aimed && !under) return;

      // Swallowed here, in the capture phase, before the control's own handlers
      // and before the browser's default activation. Everything a law allows is
      // re-issued afterwards by `commitAt`. Note this fires even when only
      // `under` matched: otherwise the control beneath the hand would start a
      // native drag or take focus behind the law's back.
      event.preventDefault();
      event.stopPropagation();

      if (aimed) handler.onDown?.(aimed, event);
      // Aimed at nothing. Silence here reads as a broken button, so the law
      // says no out loud instead.
      else context.refuse();
    };

    const onUp = (event: PointerEvent) => {
      if (committing) return;
      if (dragging && handler.dragEnds !== 'leave') dragging = null;
      handler.onRelease?.(event);
    };

    const onClick = (event: MouseEvent) => {
      if (committing) return;
      // The keyboard is not governed (`pointerLaw.ts`), and this is where that
      // promise is kept: Enter and Space on a focused control report no
      // pointer, and pass through untouched.
      if (event.detail === 0) return;
      // Deliberately NOT conditioned on the target being governed. Every law
      // issues its own commits, so any click still standing here came from a
      // press this handler already swallowed — and asking "is the target
      // governed?" gets the wrong answer under a law that moves the aim point,
      // because the browser reports the control under the HAND.
      event.preventDefault();
      event.stopPropagation();
    };

    // A backgrounded tab stops serving frames, so a dwell begun before the
    // player tabbed away would still be "running" on their return and commit on
    // the first frame back. Reaching for the tab bar must not cost a reading.
    const onLeave = () => {
      handler.onMove?.(null, new PointerEvent('pointermove', { clientX: at.x, clientY: at.y }));
    };
    const onHide = () => {
      if (document.hidden) onLeave();
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      handler.onFrame?.(now);
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onHide);
    // Capture phase throughout, so a law lands before any handler a control has.
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('pointerup', onUp, true);
    document.addEventListener('click', onClick, true);
    // Presses are governed, so the menu a right-click opens would be a way out.
    document.addEventListener('contextmenu', onClick, true);
    frame = requestAnimationFrame(tick);
    document.body.classList.add('wui-under-law');

    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onHide);
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('pointerup', onUp, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('contextmenu', onClick, true);
      cancelAnimationFrame(frame);
      flashes.forEach(clearTimeout);
      shell?.classList.remove('wui-law-shock');
      document.body.classList.remove('wui-under-law');
      document.body.classList.remove(`wui-law-${law}`);
    };
    // `config` is a constant looked up from `law`, so the law alone is the
    // real dependency; listing the object would re-bind every render for no
    // reason.
  }, [law, config]);

  return (
    <>
      <div className={`wui-cursor-ring wui-law-${law}`} ref={ringRef} aria-hidden="true" />
      {/* Free, permanent, unpurchasable. The law is framing, not content: the
          hint economy in `metrics.ts` stays for what a control MEANS.
          Carries the advice as well as the name, because this is the only
          place either can be read without a clock running. */}
      <p className="wui-law-strip" role="status">
        {config.strip}
        <span className="wui-law-strip-advice">{config.advice}</span>
      </p>
    </>
  );
}
