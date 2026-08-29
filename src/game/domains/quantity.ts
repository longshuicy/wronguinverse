// quantity.ts
// A bounded numeric range on a step grid. Ranges stay readable — the semantic is
// about what is being represented, not arithmetic difficulty.
// See docs/WrongUInverse-technical-design.md §6.

import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { clamp01, defineDomain } from './defineDomain.ts';

interface Range {
  min: number;
  max: number;
  step: number;
  unit: string;
}

/**
 * Every quantity carries a unit.
 *
 * This is what keeps Quantity readable apart from Number on a challenge card:
 * a quantity is a measurement ("73%", "12 KV"), a number is a bare integer.
 * Two lines reading `REACTOR: 40` and `BERTH: 40` would be needlessly cruel.
 */
const RANGES: Range[] = [
  { min: 0, max: 10, step: 1, unit: ' KV' },
  { min: 0, max: 20, step: 1, unit: ' LM' },
  { min: 0, max: 100, step: 1, unit: '%' },
  { min: 0, max: 100, step: 5, unit: '%' },
  { min: -10, max: 10, step: 1, unit: '°' },
  { min: 0, max: 50, step: 5, unit: ' UNITS' },
];

export function generateQuantityDomain(rng: Rng): AnyDomain {
  const { min, max, step, unit } = rng.pick(RANGES);
  const stepCount = Math.round((max - min) / step);

  const snap = (position: number): number => {
    const raw = min + clamp01(position) * (max - min);
    const snapped = min + Math.round((raw - min) / step) * step;
    // Steps like 0.1 accumulate float error; round to the step's precision.
    const precision = Math.max(0, -Math.floor(Math.log10(step)));
    return Number(Math.min(max, Math.max(min, snapped)).toFixed(precision));
  };

  return defineDomain<number>({
    type: 'quantity',
    target: min + rng.int(0, stepCount) * step,
    min,
    max,
    step,
    display: (value) => `${value}${unit}`,
    normalize: (value) => clamp01((value - min) / (max - min)),
    denormalize: snap,
    equals: (a, b) => a === b,
  });
}
