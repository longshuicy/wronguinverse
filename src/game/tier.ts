// tier.ts
// The tiers from game design §3: which RULE a run breaks.
//
// Distinct from a LEVEL (`difficulty.ts`), which is how hard a run is — how
// many controls, how much help. The two are independent: every tier is played
// at every level.
//
//   TIER 1  Semantic Shift   — the control means the wrong thing.
//   TIER 2  Operation Shift  — and it answers to the wrong gesture.
//   TIER 3  Gesture Shift    — and the pointer itself is remapped.
//
// The ladder is not a straight line. Tier 2 is additive on Tier 1. Tier 3 is a
// DIFFERENT second wrongness layered on the same semantic shift: it keeps Tier
// 1's meanings and leaves every gesture native. Neither contains the other.
//
// That is a deliberate refusal to stack all three. Stacked, each widget's
// shifted gesture would have to survive the run's pointer law, and half those
// pairings are not hard but incoherent — a checkbox that answers to a drag,
// under a law that already committed it on hover, has no readable behaviour at
// all. Asking the player to hold three simultaneous wrongnesses stops being
// deduction and starts being flailing. All three at once belongs later, as a
// modifier with the broken pairings excluded, not as the definition of a tier.

import type { PointerLawId } from './pointerLaw.ts';
import type { TierId } from './state/types.ts';

export interface TierConfig {
  id: TierId;
  /** Player-facing name, e.g. `SEMANTIC SHIFT`. */
  name: string;
  /** One line shown on the tier row. */
  blurb: string;
  /** Whether the tier is playable. An unavailable tier still renders, as a promise. */
  available: boolean;
  /** Whether runs of this tier remap each control's gesture. */
  operationShift: boolean;
  /**
   * The pool a run's page-wide pointer law is drawn from, if any.
   *
   * A POOL, drawn from once per run, rather than a law per widget: uniform is
   * more legible, more sinister, and a fraction of the code, while the draw is
   * what keeps a second Tier 3 run from being the first one again. See
   * `pointerLaw.ts`.
   */
  pointerLaws?: PointerLawId[];
}

/** All three, in the order the intro offers them. */
const TIERS: TierConfig[] = [
  {
    id: 1,
    name: 'SEMANTIC SHIFT',
    blurb: 'Wrong meanings.',
    available: true,
    operationShift: false,
  },
  {
    id: 2,
    name: 'OPERATION SHIFT',
    // Spelled out rather than "And wrong gestures." — the row is read as a
    // list of independent options, not top to bottom, so a blurb that only
    // makes sense as a continuation of the row above it does not survive.
    blurb: 'Wrong meanings, wrong gestures.',
    available: true,
    operationShift: true,
  },
  {
    id: 3,
    name: 'GESTURE SHIFT',
    blurb: 'Wrong meanings, wrong cursor.',
    available: true,
    // Not a typo. Tier 3 branches off Tier 1, per the note at the top.
    operationShift: false,
    pointerLaws: ['hoverCommit', 'doubleRequired', 'offsetCursor', 'invertedPointer', 'calmHand'],
  },
];

/** Nothing is promised any more; every tier in the row is playable. */
export const UNBUILT_TIERS: { name: string; blurb: string }[] = [];

export function availableTiers(): TierConfig[] {
  return TIERS;
}

export function getTier(id: TierId): TierConfig {
  const found = TIERS.find((tier) => tier.id === id);
  if (!found) throw new Error(`Unknown tier "${id}"`);
  return found;
}

/** Where a first-time player starts: the shift they can reason about. */
export const DEFAULT_TIER: TierId = 1;
