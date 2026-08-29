// time.ts
// A clock reading. Values are minutes since midnight; the display is 24-hour
// so it never depends on locale, matching the date domain's reasoning.
// See docs/WrongUInverse-technical-design.md §6.
//
// This is the eighth semantic, and the one that makes an eight-mapping run
// possible at all: a run assigns each widget a distinct semantic, so eight
// widgets need eight semantics to draw from.

import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { clamp01, defineDomain } from './defineDomain.ts';

const MINUTES_PER_DAY = 24 * 60;

/** Five-minute grid: 288 readings, and the times look like real clock values. */
const STEP_MINUTES = 5;
const STEPS = MINUTES_PER_DAY / STEP_MINUTES - 1;

function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generateTimeDomain(rng: Rng): AnyDomain {
  return defineDomain<number>({
    type: 'time',
    target: rng.int(0, STEPS) * STEP_MINUTES,
    min: 0,
    max: STEPS * STEP_MINUTES,
    step: STEP_MINUTES,
    display: formatClock,
    normalize: (value) => clamp01(value / (STEPS * STEP_MINUTES)),
    denormalize: (position) => Math.round(clamp01(position) * STEPS) * STEP_MINUTES,
    equals: (a, b) => a === b,
  });
}
