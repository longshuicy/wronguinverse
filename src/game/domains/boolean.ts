// boolean.ts
// A two-state domain. The underlying value stays a real boolean; only the
// player-facing labels are generated.
// See docs/WrongUInverse-technical-design.md §6.

import { BOOLEAN_LABEL_PAIRS } from '../../content/words.ts';
import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { defineDomain } from './defineDomain.ts';

export function generateBooleanDomain(rng: Rng): AnyDomain {
  const labels = rng.pick(BOOLEAN_LABEL_PAIRS);
  const target = rng.bool();

  return defineDomain<boolean>({
    type: 'boolean',
    target,
    values: [false, true],
    display: (value) => (value ? labels.whenTrue : labels.whenFalse),
    normalize: (value) => (value ? 1 : 0),
    denormalize: (position) => position >= 0.5,
    equals: (a, b) => a === b,
  });
}
