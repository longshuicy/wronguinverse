// seededRandom.ts
// Deterministic PRNG. The same seed must reproduce the mapping, the generated
// labels, the target values and the challenge sequence.
// See docs/WrongUInverse-technical-design.md §9.

/** A seeded random source. Every draw advances the stream. */
export interface Rng {
  /** Float in `[0, 1)`. */
  next(): number;
  /** Integer in `[min, max]`, inclusive. */
  int(min: number, max: number): number;
  /** Float in `[min, max)`. */
  float(min: number, max: number): number;
  bool(): boolean;
  /** Uniform pick. Throws on an empty list rather than returning undefined. */
  pick<T>(items: readonly T[]): T;
  /** Fisher-Yates into a new array; the input is not mutated. */
  shuffle<T>(items: readonly T[]): T[];
  /** `count` distinct items, in random order. Throws if `count` exceeds size. */
  sample<T>(items: readonly T[], count: number): T[];
}

/**
 * xmur3 string hash — spreads a seed string across 32 bits so that visually
 * similar seeds ("REALITY-Q7M2" / "REALITY-Q7M3") produce unrelated streams.
 */
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — small, fast, and good enough for gameplay randomness. */
function mulberry32(state: number): () => number {
  let a = state >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string | number): Rng {
  const next = mulberry32(typeof seed === 'number' ? seed >>> 0 : hashSeed(seed));

  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    float: (min, max) => min + next() * (max - min),
    bool: () => next() < 0.5,
    pick: (items) => {
      if (items.length === 0) {
        throw new Error('rng.pick: cannot pick from an empty list');
      }
      return items[Math.floor(next() * items.length)]!;
    },
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j]!, out[i]!];
      }
      return out;
    },
    sample: (items, count) => {
      if (count > items.length) {
        throw new Error(`rng.sample: asked for ${count} of ${items.length} items`);
      }
      return rng.shuffle(items).slice(0, count);
    },
  };

  return rng;
}

const SEED_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — unambiguous when shared

/**
 * A shareable run identifier, e.g. `REALITY-Q7M2`.
 *
 * Uses `Math.random` by default because this is where a run's determinism
 * *starts*; pass an `Rng` when a seed must itself be reproducible.
 */
export function createSeed(rng?: Rng): string {
  const draw = rng ? () => rng.next() : Math.random;
  let out = '';
  for (let i = 0; i < 4; i += 1) {
    out += SEED_ALPHABET[Math.floor(draw() * SEED_ALPHABET.length)];
  }
  return `REALITY-${out}`;
}

/**
 * A seed supplied in the URL, e.g. `?seed=REALITY-Q7M2`.
 *
 * Technical design §9 wants seeds so bugs can be reproduced and interesting
 * universes shared; this is the link that makes both possible. Returns null
 * when absent or unusable, in which case the caller draws a fresh seed.
 */
export function seedFromLocation(search = globalThis.location?.search ?? ''): string | null {
  const raw = new URLSearchParams(search).get('seed')?.trim();
  if (!raw) return null;
  // Cap the length: the seed is echoed back on screen and only ever hashed.
  return raw.slice(0, 64).toUpperCase();
}

/**
 * The deterministic seed for a given calendar day, e.g. `DAILY-2026-08-29`.
 *
 * Reads the LOCAL date on purpose — the player's Daily Reality should match the
 * date on their own wall calendar. (Date *domain* arithmetic is UTC instead, so
 * that a shared seed reproduces identically across timezones.)
 */
export function dailySeed(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `DAILY-${y}-${m}-${d}`;
}
