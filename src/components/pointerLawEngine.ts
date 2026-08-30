// pointerLawEngine.ts
// The DOM half of Tier 3: what a "commit" physically is, and one handler per
// law deciding when the player has earned one.
//
// Kept out of `PointerLaw.tsx` because the component's job is to mount things
// and draw the cursor, while this is where the awkward parts live — a range
// input that has to be set by hand, a React onChange that only listens for
// `input` events, a label that forwards a second click nobody asked for.
//
// Every law is implemented the same way: swallow what the pointer natively
// does to a control, then re-issue it on the law's own terms. That is why the
// laws compose with Tier 1 for free — none of them knows what any control
// MEANS, only how it may be touched.

import type { PointerLawConfig, PointerLawId } from '../game/pointerLaw.ts';

/**
 * What the law governs: anything the pointer can operate.
 *
 * `label` is in the list because leaving it out is a silent hole: clicking a
 * label's TEXT is a click on the label, which then forwards a second,
 * pointer-less click to the input it wraps — and pointer-less is exactly what
 * these laws wave through. Refusing the label refuses the forward with it.
 */
export const GOVERNED =
  'button, [role="button"], a[href], summary, label, input, textarea, select, [role="radio"], [role="checkbox"], [role="slider"]';

/**
 * Controls whose value is a POSITION, and so mean something while the pointer
 * is still moving over them.
 *
 * Everything else commits once and is done: a button pressed halfway through a
 * drag is still just pressed. This is the whole set of controls for which a law
 * has to keep a grip after the commit rather than letting go of it.
 */
export function isDraggable(element: Element): boolean {
  return element instanceof HTMLInputElement && element.type === 'range';
}

/** Opt-out for anything that must stay reachable, e.g. a law-freezing dialog. */
export const IMMUNE = '[data-law-immune]';

/** The governed control under a point, or null. */
export function governedAt(node: Element | null): Element | null {
  if (!node || node.closest(IMMUNE)) return null;
  const governed = node.closest(GOVERNED);
  if (!governed) return null;
  return (governed as HTMLButtonElement).disabled ? null : governed;
}

/**
 * Write a value the way a user would, so React hears it.
 *
 * React subscribes to `input` and tracks the last value it set on the node; a
 * plain `el.value = x` is invisible to both. Going through the prototype setter
 * updates the node without React's tracker noticing, and the dispatched event
 * then reads as a genuine edit.
 */
function setNativeValue(element: HTMLInputElement | HTMLSelectElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element) as object,
    'value',
  )?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Where along a range input a given x falls, snapped to its step. */
function rangeValueAt(input: HTMLInputElement, clientX: number): string {
  const rect = input.getBoundingClientRect();
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const step = Number(input.step) || 1;
  // Horizontal only. Every slider in the game is, and guessing at writing mode
  // or orientation here would be inventing a case to get wrong.
  const ratio = rect.width === 0 ? 0 : Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  const raw = min + ratio * (max - min);
  const snapped = Math.round((raw - min) / step) * step + min;
  return String(Math.min(max, Math.max(min, snapped)));
}

/**
 * Do to a control what a normal press would have done, at this point.
 *
 * The position matters: under every one of these laws the player's press has
 * already been swallowed, so a slider has no idea where the pointer was unless
 * we tell it. "Commit at x" rather than "commit" is what lets a continuous
 * control be governed at all.
 */
export function commitAt(element: Element, clientX: number, clientY: number): void {
  if (element instanceof HTMLInputElement && element.type === 'range') {
    setNativeValue(element, rangeValueAt(element, clientX));
    return;
  }

  // A text or number field's commit is the caret arriving: typing is keyboard
  // work, and the keyboard is never governed.
  if (
    (element instanceof HTMLInputElement && ['text', 'number', 'search'].includes(element.type)) ||
    element instanceof HTMLTextAreaElement
  ) {
    element.focus();
    return;
  }

  if (element instanceof HTMLSelectElement) {
    // A native option list is drawn by the OS, and opening one needs a user
    // activation that a synthetic commit does not have — so under a law the
    // list simply cannot be opened with the mouse.
    //
    // Rather than leave one control mouse-dead (or exempt it, and have the one
    // control that still obeys the player read as a bug), a commit STEPS it.
    // The dropdown becomes a stepper for the duration: still governed, still
    // uniform, and it gives away nothing about what the options mean. The list
    // is still there for the keyboard, which no law touches.
    const options = element.options;
    if (options.length === 0) return;
    const next = options[(element.selectedIndex + 1) % options.length];
    if (next) setNativeValue(element, next.value);
    return;
  }

  void clientY;
  (element as HTMLElement).click();
}

/** What a law may do to the cursor, and to the page. */
export interface LawContext {
  /** Commit the given control at the pointer's current position. */
  commit: (element: Element) => void;
  /** Say no, visibly. Silence is indistinguishable from a broken build. */
  refuse: () => void;
  /**
   * Fill the cursor's arc, `0`–`1`.
   *
   * Every law drives this, because every law needs to answer "what is about to
   * happen" BEFORE it happens. Tier 2 can flinch after a wrong gesture; Tier 3
   * cannot, since its failure mode is an accidental success.
   */
  progress: (value: number) => void;
  /** Toggle a cursor state class, e.g. `is-armed`. */
  flag: (name: string, on: boolean) => void;
  /** The law's own numbers. */
  config: PointerLawConfig;
}

/**
 * A law, as a set of things that may happen to a pointer.
 *
 * Handlers return `true` to let the browser's own behaviour stand. Anything
 * else is swallowed — which is the default, because "the pointer no longer does
 * what it used to" is the whole tier.
 */
export interface LawHandler {
  /**
   * How a drag this law granted comes to an end.
   *
   * `release` for every law whose commit comes from a press — the drag lasts as
   * long as the button is down, which is what dragging has always meant.
   * `leave` for `hoverCommit`, which has no press to hold: there the control is
   * picked up by dwelling on it and put down by stepping off it.
   */
  dragEnds?: 'release' | 'leave';
  /** The pointer came up. Only laws that judge the press need this. */
  onRelease?: (event: PointerEvent) => void;
  /**
   * Where this law's commits actually land, given where the pointer is.
   *
   * Only `offsetCursor` implements it, but it belongs on the interface rather
   * than in a special case: "the pointer is not where it says it is" is a
   * category of law, and the next one in that category should not have to
   * reopen the component to be written.
   */
  aim?: (x: number, y: number) => { x: number; y: number };
  onMove?: (element: Element | null, event: PointerEvent) => void;
  onDown?: (element: Element, event: PointerEvent) => void;
  /** Called every animation frame while a law is in force. */
  onFrame?: (now: number) => void;
}

export function createLawHandler(law: PointerLawId, ctx: LawContext): LawHandler {
  switch (law) {
    case 'hoverCommit':
      return hoverCommit(ctx);
    case 'doubleRequired':
      return doubleRequired(ctx);
    case 'offsetCursor':
      return offsetCursor(ctx);
    case 'invertedPointer':
      return invertedPointer(ctx);
    case 'calmHand':
      return calmHand(ctx);
  }
}

function hoverCommit(ctx: LawContext): LawHandler {
  let target: Element | null = null;
  let since = 0;

  return {
    // No press to hold, so a dragged control is picked up by dwelling on it and
    // dropped by stepping off it.
    dragEnds: 'leave',
    onMove(element, event) {
      if (element === target) return;
      // Any change of target restarts the dwell, including leaving for nothing:
      // sliding along a row of buttons must not accumulate credit across them.
      target = element;
      since = event.timeStamp;
      ctx.flag('is-dwelling', element !== null);
      ctx.progress(0);
    },
    onDown() {
      ctx.refuse();
    },
    onFrame(now) {
      if (!target) return;
      const progress = Math.min(1, (now - since) / ctx.config.windowMs);
      ctx.progress(progress);
      if (progress < 1) return;

      // Spend the target before committing. A commit that re-armed itself would
      // fire again next frame and hold the control down forever.
      const element = target;
      target = null;
      ctx.flag('is-dwelling', false);
      ctx.commit(element);
    },
  };
}

function doubleRequired(ctx: LawContext): LawHandler {
  let armed: Element | null = null;
  let armedAt = 0;

  const disarm = () => {
    armed = null;
    ctx.flag('is-armed', false);
    ctx.progress(0);
  };

  return {
    dragEnds: 'release',
    onMove(element) {
      // Leaving the control forgets it. This is the real guard against two
      // unrelated presses counting as a pair, and it lets the WINDOW be
      // generous — which it has to be, because the second press is often the
      // start of a drag, and a drag is a slower, more deliberate motion than
      // the double-click the window was first sized for.
      if (armed && element !== armed) disarm();
    },
    onDown(element, event) {
      if (armed === element && event.timeStamp - armedAt <= ctx.config.windowMs) {
        disarm();
        ctx.commit(element);
        return;
      }
      // Arming a DIFFERENT control resets rather than commits: two presses on
      // two neighbours are two first presses, not one accepted pair.
      armed = element;
      armedAt = event.timeStamp;
      ctx.flag('is-armed', true);
      ctx.progress(1);
    },
    onFrame(now) {
      if (!armed) return;
      const left = 1 - (now - armedAt) / ctx.config.windowMs;
      if (left <= 0) {
        // The window closing is the refusal: it is the moment the player's
        // first press stopped counting, and they need to see it expire.
        disarm();
        ctx.refuse();
        return;
      }
      // Drains rather than fills, so the arc reads as time running out.
      ctx.progress(left);
    },
  };
}

function offsetCursor(ctx: LawContext): LawHandler {
  const offset = ctx.config.offset ?? { x: 0, y: 0 };

  return {
    dragEnds: 'release',
    aim: (x, y) => ({ x: x + offset.x, y: y + offset.y }),
    onMove(element) {
      // The ring is already sitting on the true point; this only says whether
      // anything is under it. Half the skill of the law is reading that.
      ctx.flag('is-dwelling', element !== null);
      ctx.progress(element ? 1 : 0);
    },
    onDown(element) {
      ctx.commit(element);
    },
  };
}

function invertedPointer(ctx: LawContext): LawHandler {
  /**
   * A virtual cursor that moves opposite to the real one.
   *
   * Deliberately integrated from the player's MOVEMENT rather than mirrored
   * about the screen (`x' = width - x`): a mirror is a fixed map the player can
   * learn to read positionally, while a negated delta means the two cursors
   * drift apart and the only way to steer is to keep watching the ring. It also
   * degrades gracefully — the OS cursor can be parked anywhere, and the virtual
   * one is still wherever the player drove it.
   */
  let real: { x: number; y: number } | null = null;
  let virtual = { x: 0, y: 0 };

  return {
    dragEnds: 'release',
    aim: (x, y) => {
      const previous = real;
      real = { x, y };
      if (!previous) {
        // First sighting: the two cursors start together, so the player sees
        // the ring appear under their hand before it starts running away.
        virtual = { x, y };
        return virtual;
      }
      // Clamped to the viewport, or a run of movement in one direction parks
      // the virtual cursor off-screen where nothing can be aimed at and the
      // law looks broken rather than cruel.
      virtual = {
        x: Math.min(window.innerWidth - 1, Math.max(0, virtual.x - (x - previous.x))),
        y: Math.min(window.innerHeight - 1, Math.max(0, virtual.y - (y - previous.y))),
      };
      return virtual;
    },
    onMove(element) {
      ctx.flag('is-dwelling', element !== null);
      ctx.progress(element ? 1 : 0);
    },
    onDown(element) {
      ctx.commit(element);
    },
  };
}

function calmHand(ctx: LawContext): LawHandler {
  /**
   * The control answers a pointer that has been STILL, and nothing else.
   *
   * Two earlier models failed, both for the same reason — they measured hurry
   * against a speed, and then had to pick one:
   *
   *   1. Instantaneous speed at the moment of the press. Human pointing
   *      decelerates into its target, so the press always landed during the
   *      slow part, and a press after the wildest flick read as calm.
   *   2. Accumulated heat, shed at a fixed cooling rate. Anything slower than
   *      the cooling rate added nothing at all — which is most real mouse
   *      movement — so the ring could fill, be dragged clear across the bench,
   *      and still be full on arrival.
   *
   * There is no threshold speed that separates "hurried" from "settled",
   * because the distinction was never about speed. It is about whether the
   * pointer has come to rest. So: any movement past a jitter deadzone resets
   * the fill, and only time spent motionless fills it back. Moving the ring
   * away now destabilizes it by definition rather than by arithmetic.
   */

  /** Hand tremor and sensor noise, which must not count as movement. */
  const DEADZONE = 3;

  let anchor: { x: number; y: number } | null = null;
  let restingSince = 0;
  let settled = false;

  const disturb = (at: number) => {
    restingSince = at;
    settled = false;
  };

  return {
    dragEnds: 'release',
    onMove(_element, event) {
      const from = anchor;
      if (!from) {
        anchor = { x: event.clientX, y: event.clientY };
        disturb(event.timeStamp);
        return;
      }
      // Measured from where the pointer came to rest, not from the previous
      // event: a slow creep is still travel, and letting each tiny step fall
      // under the deadzone would let a player walk the cursor anywhere for
      // free, one pixel at a time.
      if (Math.hypot(event.clientX - from.x, event.clientY - from.y) <= DEADZONE) return;
      anchor = { x: event.clientX, y: event.clientY };
      disturb(event.timeStamp);
    },
    onFrame(now) {
      if (anchor === null) return;
      const progress = Math.min(1, (now - restingSince) / ctx.config.windowMs);
      settled = progress >= 1;
      ctx.progress(progress);
      ctx.flag('is-hot', !settled);
    },
    onDown(element, event) {
      // Pressing is itself a disturbance, so a burst of clicks can never
      // outrun the settle — and the natural response to being ignored (press
      // again, harder) is the one thing that keeps it ignoring you.
      const wasSettled = settled;
      disturb(event.timeStamp);
      if (!wasSettled) {
        ctx.refuse();
        return;
      }
      ctx.commit(element);
    },
    onRelease(event) {
      // A drag is not re-judged while it runs — movement during one is the
      // player working the control, not hurrying — but the hand that just
      // finished dragging is by definition in motion, so the next press has to
      // be earned again.
      disturb(event.timeStamp);
    },
  };
}
