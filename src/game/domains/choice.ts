// choice.ts
// 3-6 unique invented labels. Meaningless names are the point: the player must
// read the interface rather than lean on real-world semantics.
// See docs/WrongUInverse-technical-design.md §6.

import { buildNameSet } from '../../content/words.ts';
import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { defineDomain, indexToPosition, positionToIndex } from './defineDomain.ts';

export function generateChoiceDomain(rng: Rng): AnyDomain {
  const values = buildNameSet(rng, rng.int(3, 6));
  const target = rng.pick(values);

  return defineDomain<string>({
    type: 'choice',
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
