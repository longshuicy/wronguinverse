// words.ts
// Finite, curated word banks. Combinatorics — not asset count — is what gives
// the game variety, so these stay small and get recombined procedurally.
// See docs/WrongUInverse-technical-design.md §6.

import type { Rng } from '../game/generator/seededRandom.ts';

/** Syllable banks for procedurally built creature/object names. */
export const NAME_PREFIXES = ['Zo', 'Mi', 'Qua', 'Vex', 'Plu', 'No', 'Fi', 'Glo', 'Wu', 'Tin'];
export const NAME_MIDDLES = ['rb', 'nk', 'zz', 'lor', 'mi', 'xa', 'pp', 'gl', 'rr', 'sk'];
export const NAME_SUFFIXES = ['et', 'on', 'ip', 'ix', 'ul', 'a', 'o', 'us', 'im', 'ok'];

/** Hand-written names from the design doc, mixed in so output stays charming. */
export const CURATED_NAMES = [
  'ZORBLET',
  'MIP',
  'QUONK',
  'VELORI',
  'PLIM',
  'WUBBIT',
  'NOXU',
  'FIZZLEPOD',
  'GLORP',
  'TINKI',
];

/** Label pairs for boolean domains. The underlying value stays a boolean. */
export const BOOLEAN_LABEL_PAIRS: { whenTrue: string; whenFalse: string }[] = [
  { whenTrue: 'YES', whenFalse: 'NO' },
  { whenTrue: 'OPEN', whenFalse: 'CLOSED' },
  { whenTrue: 'STABLE', whenFalse: 'UNSTABLE' },
  { whenTrue: 'ACTIVE', whenFalse: 'DORMANT' },
  { whenTrue: 'ENABLED', whenFalse: 'DISABLED' },
  { whenTrue: 'BOUND', whenFalse: 'ADRIFT' },
  { whenTrue: 'AWAKE', whenFalse: 'SLEEPING' },
];

/** Field labels the challenge screen uses when phrasing a requirement. */
export const CHALLENGE_FIELD_LABELS: Record<string, string[]> = {
  boolean: ['CONTAINMENT', 'AIRLOCK', 'BEACON', 'SHIELD'],
  choice: ['COMPANION', 'PASSENGER', 'SPECIMEN', 'WITNESS'],
  quantity: ['REACTOR', 'FLUX', 'PRESSURE', 'CHARGE'],
  date: ['ARRIVAL', 'DEPARTURE', 'ECLIPSE', 'THAW'],
};

/**
 * Build one procedural name, e.g. `ZOET`, `MIXAON`.
 *
 * Takes the seeded `Rng` rather than reaching for `Math.random` so that names
 * are reproducible from a run's seed.
 */
export function buildName(rng: Rng): string {
  const parts = [rng.pick(NAME_PREFIXES)];
  if (rng.next() < 0.6) parts.push(rng.pick(NAME_MIDDLES));
  parts.push(rng.pick(NAME_SUFFIXES));
  return parts.join('').toUpperCase();
}

/**
 * `count` distinct names, mixing curated and procedural sources.
 *
 * Retries on collision and falls back to procedural-only generation, so the
 * caller always gets exactly `count` unique labels.
 */
export function buildNameSet(rng: Rng, count: number): string[] {
  const out = new Set<string>();
  const curatedShare = rng.int(0, Math.min(count, CURATED_NAMES.length));
  for (const name of rng.sample(CURATED_NAMES, curatedShare)) {
    out.add(name);
  }

  let guard = 0;
  while (out.size < count && guard < 500) {
    out.add(buildName(rng));
    guard += 1;
  }
  // Deterministic last resort; only reachable if the banks collide pathologically.
  let suffix = 0;
  while (out.size < count) {
    out.add(`UNIT-${suffix}`);
    suffix += 1;
  }

  return rng.shuffle([...out]).slice(0, count);
}
