// pointerLaw.ts
// Tier 3 "Gesture Shift": one law per run, applied to the whole page.
//
// Distinct from an OPERATION (`src/widgets/operations.ts`), which is per-widget
// and decided by the generator. A pointer law is not a property of any control
// — it is a property of the pointer, so it holds over buttons, links, the
// chrome and the bench alike. That universality is the teaching mechanism: a
// player who dwells on a heading and watches it commit has learned the law
// without spending a hint on it.
//
// Three invariants the rest of the tier depends on:
//
//   1. The law touches the POINTER ONLY. The keyboard is outside the room's
//      jurisdiction — which is what keeps hints reachable, Escape honest, and
//      the tier playable without a mouse-accurate hand.
//   2. The law is never a hint. It is printed in the chrome, costs nothing, and
//      cannot be bought. Knowing how the cursor commits tells the player
//      nothing about what the slider MEANS, so the Tier 1 puzzle survives it.
//   3. ONE law per run, uniform across the page. A different law per widget
//      would be indistinguishable from a broken build, and eight laws at once
//      is not deduction, it is flailing.
//
// Tier 3 layers on Tier 1's semantic shift and NOT on Tier 2's operation shift.
// See `tier.ts` for why.

import type { Rng } from './generator/seededRandom.ts';

export type PointerLawId =
  'hoverCommit' | 'doubleRequired' | 'offsetCursor' | 'invertedPointer' | 'calmHand';

export interface PointerLawConfig {
  id: PointerLawId;
  /** Printed permanently in the run chrome, free, never purchasable. */
  strip: string;
  /** How to work the thing, in one line, given away on the shift screen. */
  advice: string;
  /**
   * The law's one timing, in milliseconds. What it times differs by law —
   * dwell before commit, the window a second press must land in — but every
   * law has exactly one, which keeps them tunable next to each other.
   */
  windowMs: number;
  /** How far a commit lands from the pointer. Only `offsetCursor` uses it. */
  offset?: { x: number; y: number };
}

const LAWS: Record<PointerLawId, PointerLawConfig> = {
  /**
   * Dwell commits; pressing does not. The cursor itself becomes dangerous, and
   * crossing the bench to reach one control disturbs everything on the way.
   */
  hoverCommit: {
    id: 'hoverCommit',
    strip: 'THIS UNIVERSE: THE CURSOR COMMITS',
    advice: 'Rest on it. Pressing it will not help.',
    // Long enough that crossing the screen is survivable, short enough that
    // waiting never feels like the game has stopped. Tuned by feel, not theory.
    windowMs: 620,
  },

  /**
   * The mildest of the four, and the one to meet first: every commit needs two
   * presses inside a window. Nothing is unlearned, only doubled.
   */
  doubleRequired: {
    id: 'doubleRequired',
    strip: 'THIS UNIVERSE: ONCE IS NOT ENOUGH',
    advice: 'Press it twice. The first press only wakes it.',
    // Generous, because the second press is often the beginning of a drag and
    // that is a slower motion than a double-click. The pointer leaving the
    // control forgets it anyway (see `doubleRequired`), so the window does not
    // have to be the thing keeping two unrelated presses apart.
    windowMs: 1600,
  },

  /**
   * The pointer reports a position it is not at: a press lands somewhere else
   * entirely, and the player has to aim off-target to hit anything.
   *
   * This replaced a "commits on release" law, which read beautifully and did
   * nothing — a normal click IS a press and a release on one control, so the
   * only case where the two differed was a drag off the target, which nobody
   * does by accident. A law has to change the common case or it is scenery.
   *
   * The cursor ring is drawn at the TRUE point rather than under the pointer,
   * which is what keeps this a handicap to compensate for instead of a guessing
   * game: the player can see exactly where they are about to land.
   */
  offsetCursor: {
    id: 'offsetCursor',
    strip: 'THIS UNIVERSE: THE CURSOR IS NOT WHERE YOU LEFT IT',
    advice: 'It lands down and to the right. Aim short.',
    windowMs: 0,
    // Far enough to miss a control you are pointing at, close enough that the
    // thing you DO hit is usually its neighbour rather than the far wall —
    // near-misses teach the offset, wild ones just look broken.
    offset: { x: 58, y: 38 },
  },

  /**
   * Nothing answers a pointer in motion. Arriving is not enough — the player
   * has to arrive, stop, and stay stopped while the ring fills, and any
   * movement (or any press) empties it again. See `calmHand` in
   * `pointerLawEngine.ts` for why this is a stillness timer rather than a
   * speed threshold; two attempts at measuring speed both failed.
   *
   * The only law of the four that is a physical skill rather than a rule to
   * memorize, which is why it earns its place: it stays interesting after the
   * player has understood it.
   */
  /**
   * The pointer runs backwards: push the mouse right and the thing that
   * commits moves left.
   *
   * Sibling to `offsetCursor` — both lie about where the pointer is — but a
   * constant offset is learned once and then simply carried, while an inverted
   * axis has to be fought on every single movement. It is the pool's chaos
   * entry, and the one law that never stops costing something.
   */
  invertedPointer: {
    id: 'invertedPointer',
    strip: 'THIS UNIVERSE: THE POINTER RUNS BACKWARDS',
    advice: 'The ring is your real cursor. Push away from what you want.',
    windowMs: 0,
  },

  calmHand: {
    id: 'calmHand',
    strip: 'THIS UNIVERSE: A HURRIED HAND IS IGNORED',
    advice: 'Come to a stop, wait for the ring to fill, then press once.',
    // How long the pointer must hold still. Long enough to be a real beat the
    // player has to sit through — the pause IS the law, and a fill quick enough
    // to be absorbed into the approach would not be felt at all.
    windowMs: 900,
  },
};

export function getPointerLaw(id: PointerLawId): PointerLawConfig {
  return LAWS[id];
}

/** One law for one run, drawn from the tier's pool. */
export function pickPointerLaw(pool: PointerLawId[], rng: Rng): PointerLawId {
  return pool[Math.floor(rng.next() * pool.length)] ?? pool[0];
}

/**
 * A law named in the URL, e.g. `?law=calmHand`. Development only.
 *
 * Overrides both the tier's pool and the seed's draw, so a law can be opened
 * straight from the address bar instead of by rerolling universes until the
 * right one comes up. Unknown names are ignored rather than thrown: a typo in a
 * debug flag should not take the game down.
 */
export function pointerLawFromLocation(
  search = globalThis.location?.search ?? '',
): PointerLawId | null {
  const raw = new URLSearchParams(search).get('law')?.trim();
  if (!raw) return null;
  return raw in LAWS ? (raw as PointerLawId) : null;
}

/**
 * Whether this device can be governed at all.
 *
 * A pointer law needs a pointer. On touch there is no dwell to measure, no
 * hover to draw and no cursor speed to read, so the law stands down rather than
 * locking the player out of the tier — the intro already says to bring a mouse.
 */
export function pointerLawSupported(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(hover: hover)').matches;
}
