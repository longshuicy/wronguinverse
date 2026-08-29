// date.ts
// A calendar span. Values are ISO `YYYY-MM-DD` strings; the normalized position
// is the day's offset within the generated range.
// See docs/WrongUInverse-technical-design.md §6.

import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain } from '../state/types.ts';
import { clamp01, defineDomain } from './defineDomain.ts';
import { formatDate, fromDayNumber, makeIsoDate, toDayNumber } from './dateUtils.ts';

/** Far-future years keep the fiction consistent and dodge "is that today?" doubt. */
const YEAR_RANGE: [number, number] = [2090, 2099];

export function generateDateDomain(rng: Rng): AnyDomain {
  const year = rng.int(YEAR_RANGE[0], YEAR_RANGE[1]);
  const firstDay = toDayNumber(makeIsoDate(year, 1, 1));
  const lastDay = toDayNumber(makeIsoDate(year, 12, 31));
  const spanDays = lastDay - firstDay;

  return defineDomain<string>({
    type: 'date',
    target: fromDayNumber(firstDay + rng.int(0, spanDays)),
    min: firstDay,
    max: lastDay,
    display: formatDate,
    normalize: (value) => clamp01((toDayNumber(value) - firstDay) / spanDays),
    denormalize: (position) => fromDayNumber(firstDay + Math.round(clamp01(position) * spanDays)),
    equals: (a, b) => a === b,
  });
}
