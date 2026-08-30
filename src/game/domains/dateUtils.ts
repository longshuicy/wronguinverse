// dateUtils.ts
// Calendar helpers shared by the date domain and the date widget.
//
// Dates travel as plain `YYYY-MM-DD` strings and all arithmetic goes through
// UTC day numbers. Local-time `Date` objects would shift by a day either side of
// midnight depending on the player's timezone, which would make a seeded run
// non-reproducible across machines.

/** An ISO calendar date, `YYYY-MM-DD`. */
export type IsoDate = string;

const MS_PER_DAY = 86_400_000;

const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

/** Days since the Unix epoch, in UTC. */
export function toDayNumber(iso: IsoDate): number {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function fromDayNumber(dayNumber: number): IsoDate {
  const date = new Date(dayNumber * MS_PER_DAY);
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function makeIsoDate(year: number, month: number, day: number): IsoDate {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Month abbreviation for an ISO date's month, e.g. `AUG`. */
export function monthName(month: number): string {
  return MONTH_ABBREVIATIONS[month - 1]!;
}

/** `[year, month, day]` from an ISO date, with month 1-indexed. */
export function partsOf(iso: IsoDate): [number, number, number] {
  return iso.split('-').map(Number) as [number, number, number];
}

/** Days in a month, 1-indexed, leap years included. */
export function daysInMonth(year: number, month: number): number {
  return (
    toDayNumber(makeIsoDate(month === 12 ? year + 1 : year, (month % 12) + 1, 1)) -
    toDayNumber(makeIsoDate(year, month, 1))
  );
}

/** Weekday of an ISO date, 0 = Sunday. */
export function weekdayOf(iso: IsoDate): number {
  // The epoch, day 0, was a Thursday.
  return (((toDayNumber(iso) + 4) % 7) + 7) % 7;
}

/**
 * Unambiguous display, e.g. `AUG 29, 2097`.
 * Month names avoid the DD/MM vs MM/DD trap called out in the design doc.
 */
export function formatDate(iso: IsoDate): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  return `${MONTH_ABBREVIATIONS[month - 1]} ${day}, ${year}`;
}
