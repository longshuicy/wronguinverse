// tier.ts
// The tiers from game design §3: which RULE a run breaks.
//
// Distinct from a LEVEL (`difficulty.ts`), which is how hard a run is — how
// many controls, how much help. The two are independent: every tier is played
// at every level.
//
//   TIER 1  Semantic Shift   — the control means the wrong thing.
//   TIER 2  Operation Shift  — and it answers to the wrong gesture.
//   TIER 3  Gesture Shift    — not built.
//
// Tier 2 is additive: it keeps Tier 1's semantic shift and layers the gesture
// shift on top, so it is strictly the harder reading of the same universe.

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
}

/**
 * All three, including the one that does not exist.
 *
 * Showing the locked tier is the point: it makes clear that this is two thirds
 * of an idea rather than the whole of it.
 */
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
    blurb: 'And wrong gestures.',
    available: true,
    operationShift: true,
  },
];

/** Tier 3 has no config because it has no behaviour; the row is drawn from this. */
export const UNBUILT_TIERS = [{ name: 'GESTURE SHIFT', blurb: 'Wrong gestures.' }];

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
