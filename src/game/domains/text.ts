// text.ts
// Short typeable codes — sector designations, callsigns, routes.
//
// Kept short on purpose: the text widget asks the player to type these, and a
// long string turns a deduction puzzle into a typing test.
// See docs/WrongUInverse-technical-design.md §6.

import { buildCodeSet } from '../../content/words.ts';
import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { defineDomain, indexToPosition, positionToIndex } from './defineDomain.ts';

export function generateTextDomain(rng: Rng): AnyDomain {
  const values = buildCodeSet(rng, rng.int(3, 6));
  const target = rng.pick(values);

  return defineDomain<string>({
    type: 'text',
    target,
    values,
    display: (value) => value,
    normalize: (value) => {
      const index = values.indexOf(value);
      return indexToPosition(index < 0 ? 0 : index, values.length);
    },
    denormalize: (position) => values[positionToIndex(position, values.length)]!,
    equals: (a, b) => a === b,
  });
}
