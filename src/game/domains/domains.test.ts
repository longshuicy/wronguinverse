// domains.test.ts
// Every domain must round-trip through the normalized layer, because that layer
// is the only thing a widget ever touches. See technical design §5, §18.

import { describe, expect, it } from 'vitest';
import { createRng } from '../generator/seededRandom.ts';
import { formatDate, fromDayNumber, toDayNumber } from './dateUtils.ts';
import { enumerateDomain, generateDomain, implementedSemantics, initialValue } from './index.ts';

const SEEDS = Array.from({ length: 60 }, (_, i) => `domain-seed-${i}`);

describe.each(implementedSemantics())('%s domain', (semantic) => {
  const domains = SEEDS.map((seed) => generateDomain(semantic, createRng(seed)));

  it('reports its own semantic type', () => {
    for (const domain of domains) expect(domain.type).toBe(semantic);
  });

  it('normalizes every reachable value into [0, 1]', () => {
    for (const domain of domains) {
      for (let step = 0; step <= 20; step += 1) {
        const position = domain.normalize(domain.denormalize(step / 20));
        expect(position).toBeGreaterThanOrEqual(0);
        expect(position).toBeLessThanOrEqual(1);
      }
    }
  });

  it('round-trips denormalize -> normalize -> denormalize to a stable value', () => {
    for (const domain of domains) {
      for (let step = 0; step <= 20; step += 1) {
        const value = domain.denormalize(step / 20);
        const again = domain.denormalize(domain.normalize(value));
        expect(domain.equals(value, again)).toBe(true);
      }
    }
  });

  it('always produces a target that is reachable from some position', () => {
    // The challenge generator may only ask for values the player can actually
    // enter — technical design §14.
    for (const domain of domains) {
      const reachable = Array.from({ length: 401 }, (_, i) => domain.denormalize(i / 400));
      expect(reachable.some((value) => domain.equals(value, domain.target))).toBe(true);
    }
  });

  it('displays every value as a non-empty string', () => {
    for (const domain of domains) {
      for (let step = 0; step <= 10; step += 1) {
        expect(domain.display(domain.denormalize(step / 10))).toBeTruthy();
      }
      expect(domain.display(domain.target)).toBeTruthy();
    }
  });

  it('enumerates a usable, label-distinct option set', () => {
    for (const domain of domains) {
      const options = enumerateDomain(domain);
      expect(options.length).toBeGreaterThanOrEqual(2);
      const labels = options.map((option) => domain.display(option));
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it('starts at a valid value', () => {
    for (const domain of domains) {
      expect(domain.display(initialValue(domain))).toBeTruthy();
    }
  });

  it('is fully reproducible from its seed', () => {
    const a = generateDomain(semantic, createRng('repeat-me'));
    const b = generateDomain(semantic, createRng('repeat-me'));
    expect(a.target).toEqual(b.target);
    expect(a.values).toEqual(b.values);
    expect(a.display(a.target)).toBe(b.display(b.target));
  });
});

describe('choice domain', () => {
  it('generates 3-6 distinct labels', () => {
    for (const seed of SEEDS) {
      const domain = generateDomain('choice', createRng(seed));
      const values = domain.values!;
      expect(values.length).toBeGreaterThanOrEqual(3);
      expect(values.length).toBeLessThanOrEqual(6);
      expect(new Set(values).size).toBe(values.length);
    }
  });
});

describe('boolean domain', () => {
  it('has exactly two states with distinct labels', () => {
    for (const seed of SEEDS) {
      const domain = generateDomain('boolean', createRng(seed));
      expect(domain.values).toEqual([false, true]);
      expect(domain.display(false)).not.toBe(domain.display(true));
    }
  });
});

describe('quantity domain', () => {
  it('keeps the target on the step grid and inside the range', () => {
    for (const seed of SEEDS) {
      const domain = generateDomain('quantity', createRng(seed));
      const target = domain.target as number;
      const { min, max, step } = domain as { min: number; max: number; step: number };
      expect(target).toBeGreaterThanOrEqual(min);
      expect(target).toBeLessThanOrEqual(max);
      expect(Math.abs((target - min) / step - Math.round((target - min) / step))).toBeLessThan(
        1e-9,
      );
    }
  });
});

describe('date utilities', () => {
  it('round-trips ISO dates through day numbers', () => {
    for (const iso of ['2090-01-01', '2096-02-29', '2097-08-29', '2099-12-31']) {
      expect(fromDayNumber(toDayNumber(iso))).toBe(iso);
    }
  });

  it('formats unambiguously with a month name', () => {
    expect(formatDate('2097-08-29')).toBe('AUG 29, 2097');
    expect(formatDate('2090-01-01')).toBe('JAN 1, 2090');
  });

  it('is timezone independent', () => {
    // A local-time implementation would drift by a day either side of midnight.
    expect(toDayNumber('2097-08-29') - toDayNumber('2097-08-28')).toBe(1);
  });
});
