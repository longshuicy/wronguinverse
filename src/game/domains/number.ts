// number.ts
// An exact integer target.
//
// Deliberately distinct from Quantity in presentation: a quantity reads as a
// measurement ("73%", "12 KV"), a number is a bare integer. The challenge card
// has to be unambiguous about which reading it wants.
// See docs/WrongUInverse-technical-design.md §6.

import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { clamp01, defineDomain } from './defineDomain.ts';

/** Integer ranges only for V0; decimals can come later. */
const RANGES: [number, number][] = [
  [0, 9],
  [0, 20],
  [0, 50],
  [0, 99],
  [100, 199],
];

export function generateNumberDomain(rng: Rng): AnyDomain {
  const [min, max] = rng.pick(RANGES);
  const span = max - min;

  return defineDomain<number>({
    type: 'number',
    target: rng.int(min, max),
    min,
    max,
    step: 1,
    display: (value) => String(value),
    normalize: (value) => clamp01((value - min) / span),
    denormalize: (position) => min + Math.round(clamp01(position) * span),
    equals: (a, b) => a === b,
  });
}
