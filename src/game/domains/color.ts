// color.ts
// A finite palette. Values carry their own fictional alias, so the player
// matches "GLIMMER VIOLET" and never needs to reason about RGB.
// See docs/WrongUInverse-technical-design.md §6.

import { COLOR_PALETTE, type ColorValue } from '../../content/colors.ts';
import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { defineDomain, indexToPosition, positionToIndex } from './defineDomain.ts';

export function generateColorDomain(rng: Rng): AnyDomain {
  const values = rng.sample(COLOR_PALETTE, rng.int(3, 6));
  const target = rng.pick(values);

  return defineDomain<ColorValue>({
    type: 'color',
    target,
    values,
    display: (value) => value.alias,
    normalize: (value) => {
      // Compare by hex: colour values are objects, so identity comparison would
      // fail across a structuredClone or a re-render that copies them.
      const index = values.findIndex((candidate) => candidate.hex === value.hex);
      return indexToPosition(index < 0 ? 0 : index, values.length);
    },
    denormalize: (position) => values[positionToIndex(position, values.length)]!,
    equals: (a, b) => a.hex === b.hex,
  });
}
