// seededRandom.test.ts
// Determinism is load-bearing: seeds are shared, Daily Reality derives from the
// date, and every other test here assumes a reproducible stream.

import { describe, expect, it } from 'vitest';
import { createRng, createSeed, dailySeed, hashSeed } from './seededRandom.ts';

describe('hashSeed', () => {
  it('is stable for the same string', () => {
    expect(hashSeed('REALITY-Q7M2')).toBe(hashSeed('REALITY-Q7M2'));
  });

  it('separates seeds that differ by one character', () => {
    expect(hashSeed('REALITY-Q7M2')).not.toBe(hashSeed('REALITY-Q7M3'));
  });
});

describe('createRng', () => {
  it('replays an identical stream for the same seed', () => {
    const a = createRng('REALITY-Q7M2');
    const b = createRng('REALITY-Q7M2');
    const drawA = Array.from({ length: 50 }, () => a.next());
    const drawB = Array.from({ length: 50 }, () => b.next());
    expect(drawA).toEqual(drawB);
  });

  it('produces different streams for different seeds', () => {
    const a = Array.from({ length: 20 }, createRng('seed-a').next);
    const b = Array.from({ length: 20 }, createRng('seed-b').next);
    expect(a).not.toEqual(b);
  });

  it('stays within [0, 1)', () => {
    const rng = createRng('bounds');
    for (let i = 0; i < 5000; i += 1) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('returns integers inside an inclusive range, hitting both ends', () => {
    const rng = createRng('ints');
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      const value = rng.int(1, 6);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(6);
      seen.add(value);
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('shuffles without mutating the input or losing items', () => {
    const rng = createRng('shuffle');
    const input = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
    const shuffled = rng.shuffle(input);
    expect(shuffled).not.toBe(input);
    expect([...shuffled].sort((x, y) => x - y)).toEqual([...input]);
  });

  it('samples distinct items and rejects oversized requests', () => {
    const rng = createRng('sample');
    const sampled = rng.sample(['a', 'b', 'c', 'd'], 3);
    expect(sampled).toHaveLength(3);
    expect(new Set(sampled).size).toBe(3);
    expect(() => rng.sample(['a'], 2)).toThrow();
  });

  it('refuses to pick from an empty list rather than returning undefined', () => {
    expect(() => createRng('empty').pick([])).toThrow();
  });
});

describe('seed identifiers', () => {
  it('derives a stable seed from the local calendar day', () => {
    // Deliberately local, unlike the UTC arithmetic in the date domain: the
    // player's "today" is the one on their own wall calendar.
    expect(dailySeed(new Date(2026, 7, 29))).toBe('DAILY-2026-08-29');
    expect(dailySeed(new Date(2026, 0, 1))).toBe('DAILY-2026-01-01');
  });

  it('formats run seeds as REALITY-XXXX', () => {
    expect(createSeed(createRng('fixed'))).toMatch(/^REALITY-[A-Z2-9]{4}$/);
  });
});
