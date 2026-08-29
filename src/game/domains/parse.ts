// parse.ts
// Turning typed text back into a domain value.
//
// The design doc asks for forgiving parsing: the puzzle is working out WHAT to
// enter, never spelling it perfectly. Case, spacing and punctuation are all
// ignored, and an unambiguous prefix is accepted.
// See docs/WrongUInverse-technical-design.md §10.

import type { AnyDomain } from '../state/types.ts';
import { clamp01 } from './defineDomain.ts';
import { enumerateDomain } from './index.ts';
import { toDayNumber } from './dateUtils.ts';

/** How many samples to take when matching against a continuous domain. */
const PARSE_RESOLUTION = 500;

/** Uppercase and strip everything that is not alphanumeric. */
function key(text: string): string {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isNumericDomain(domain: AnyDomain): boolean {
  return (
    typeof domain.min === 'number' &&
    typeof domain.max === 'number' &&
    typeof domain.denormalize(0) === 'number'
  );
}

/**
 * Parse `raw` into a value of `domain`, or `undefined` if it does not resolve.
 *
 * `undefined` means "keep typing", not "wrong" — callers should leave the
 * player's draft text alone rather than snapping it to something else.
 */
export function parseIntoDomain(domain: AnyDomain, raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;

  const candidates = enumerateDomain(domain, PARSE_RESOLUTION);
  const wanted = key(trimmed);

  // 1. Exact match on the rendered label, ignoring case and punctuation.
  const exact = candidates.filter((value) => key(domain.display(value)) === wanted);
  if (exact.length === 1) return exact[0];

  // 2. A prefix that identifies exactly one option. Ambiguous prefixes are
  //    rejected rather than guessed — silently picking one would be worse
  //    than asking for another character.
  const prefixed = candidates.filter((value) => key(domain.display(value)).startsWith(wanted));
  if (prefixed.length === 1) return prefixed[0];

  // 3. Numeric domains accept the number itself.
  if (isNumericDomain(domain)) {
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed)) {
      const min = domain.min as number;
      const max = domain.max as number;
      return domain.denormalize(clamp01((parsed - min) / (max - min)));
    }
  }

  // 4. Date domains additionally accept ISO input, which is what a player who
  //    has seen the raw value is most likely to try.
  if (ISO_DATE.test(trimmed) && typeof domain.min === 'number' && typeof domain.max === 'number') {
    const probe = domain.denormalize(0);
    if (typeof probe === 'string' && ISO_DATE.test(probe)) {
      const day = toDayNumber(trimmed);
      const span = domain.max - domain.min;
      if (span > 0) return domain.denormalize(clamp01((day - domain.min) / span));
    }
  }

  return undefined;
}

/** Every value a free-text control can reach: anything with a distinct label. */
export function textReachableValues(domain: AnyDomain): unknown[] {
  return enumerateDomain(domain, PARSE_RESOLUTION);
}
