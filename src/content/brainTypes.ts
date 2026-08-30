// brainTypes.ts
// Interface Brain Types, and the creature that represents each one.
//
// This is the single place a brain type is defined: its id, the name and blurb
// shown on the result screen, and the specimen that stands in for it. The
// classification logic in game/metrics.ts returns an id and nothing else, so a
// type can never end up with a name here and different wording there.
//
// Kept as a typed module rather than a JSON file on purpose: JSON would have to
// be fetched or imported untyped, and every AssetId here needs to be checked
// against the asset manifest at build time — a typo in a creature name should
// fail the build, not render a missing image to a player.
//
// These are comedy outputs, not a psychological assessment. See
// docs/WrongUInverse-game-design.md §11.

import type { AssetId } from './assets.ts';

export type BrainTypeId =
  'poker' | 'reasonable' | 'uxDesigner' | 'engineer' | 'theorist' | 'normie';

export interface BrainType {
  id: BrainTypeId;
  name: string;
  blurb: string;
  /** The specimen shown beside the diagnosis. */
  creature: AssetId;
  /** Why this creature, so the pairing is not re-rolled on a whim. */
  because: string;
}

export const BRAIN_TYPES: Record<BrainTypeId, BrainType> = {
  poker: {
    id: 'poker',
    name: 'THE POKER',
    blurb: 'Touched everything until reality gave up.',
    creature: 'creature_quonk',
    because: 'A squat blob with two tiny floating hands. Built for prodding.',
  },
  reasonable: {
    id: 'reasonable',
    name: 'REASONABLE HUMAN BEING',
    blurb: 'Used hints instead of arguing with a calendar.',
    creature: 'creature_noxu',
    because: 'A floating jelly with a steady blinking core. Unbothered.',
  },
  uxDesigner: {
    id: 'uxDesigner',
    name: 'THE UX DESIGNER',
    blurb: 'Immediately assumed the interface was wrong.',
    creature: 'creature_velori',
    because: 'Tall, crescent-headed, faintly above it all.',
  },
  engineer: {
    id: 'engineer',
    name: 'THE ENGINEER',
    blurb: 'Brute-forced the semantic space, methodically.',
    creature: 'creature_mip',
    because: 'Three eyes and a cursor for a tail. Scans everything in order.',
  },
  theorist: {
    id: 'theorist',
    name: 'THE THEORIST',
    blurb: 'Barely touched anything. Just knew.',
    creature: 'creature_plim',
    because: 'A cube whose face moves between surfaces. Thinks in boxes.',
  },
  normie: {
    id: 'normie',
    name: 'THE NORMIE',
    blurb: 'Attempted to use every control correctly. Adorable.',
    // Zorblet doubles up here because there are six brain types and only five
    // secondary creatures. A sixth creature would give THE NORMIE its own.
    creature: 'mascot_zorblet_idle',
    because: 'The lab assistant who still believes the labels.',
  },
};
