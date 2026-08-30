// operationShift.ts
// The mechanics Tier 2 adapters share: refusing a gesture visibly, listening
// for a wheel the browser would rather scroll with, and holding a press.
//
// Kept out of the adapters so eight controls do not each reinvent them, and so
// the awkward parts (the passive-listener problem below) are solved once.

import { useCallback, useEffect, useRef, useState } from 'react';

/** Long enough to read as a flinch, short enough not to gate the next attempt. */
const REFUSAL_MS = 220;

/**
 * A control's flinch when the player uses the gesture it no longer answers to.
 *
 * Doing nothing at all is indistinguishable from being broken, and "is this a
 * bug?" is the one thought the game cannot afford. So refusal is *visible*: the
 * control twitches, which reads as a refusal rather than a failure.
 */
export function useRefusal(): { refusing: boolean; refuse: () => void } {
  const [refusing, setRefusing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const refuse = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    // Drop the class first so a second refusal restarts the animation rather
    // than landing mid-cycle and appearing to do nothing.
    setRefusing(false);
    timer.current = setTimeout(() => {
      setRefusing(true);
      timer.current = setTimeout(() => setRefusing(false), REFUSAL_MS);
    }, 0);
  }, []);

  return { refusing, refuse };
}

/**
 * Wheel handling that can actually stop the page scrolling.
 *
 * React attaches `onWheel` at the root as a PASSIVE listener, so calling
 * `preventDefault()` inside it is silently ignored and the page scrolls away
 * under the control. Every `wheelCycle` operation therefore has to bind its own
 * non-passive listener, which is what this does.
 */
export function useNonPassiveWheel(
  ref: React.RefObject<HTMLElement | null>,
  handler: (delta: number) => void,
  enabled: boolean,
): void {
  // Held in a ref and synced in an effect rather than assigned during render:
  // the listener below is bound once, so it must be able to see the newest
  // handler without the binding itself depending on it.
  const latest = useRef(handler);
  useEffect(() => {
    latest.current = handler;
  }, [handler]);

  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (event.deltaY === 0) return;
      latest.current(event.deltaY > 0 ? 1 : -1);
    };

    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [ref, enabled]);
}

/** How long a press has to last to count as deliberate. */
export const HOLD_MS = 450;

/**
 * Press-and-hold, as pointer handlers ready to spread onto a control.
 *
 * `onPointerLeave` and `onPointerCancel` both cancel: a hold the player slid
 * out of should not fire, or holding one option would select its neighbour.
 */
export function usePressHold(onFire: () => void, ms: number = HOLD_MS) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const latest = useRef(onFire);
  useEffect(() => {
    latest.current = onFire;
  }, [onFire]);

  const cancel = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  const start = useCallback(() => {
    cancel();
    fired.current = false;
    timer.current = setTimeout(() => {
      fired.current = true;
      latest.current();
    }, ms);
  }, [cancel, ms]);

  return {
    /** True once this press has committed, so the adapter can skip refusing it. */
    didFire: () => fired.current,
    handlers: {
      onPointerDown: start,
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
    },
  };
}

/** Distance a pointer must travel before it counts as a drag rather than a click. */
export const DRAG_THRESHOLD_PX = 24;

/** Distance beyond which a press on a click-only control is clearly an attempted drag. */
export const DRAG_DETECT_PX = 6;
