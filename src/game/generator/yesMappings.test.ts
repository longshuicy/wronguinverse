// yesMappings.test.ts
// Milestone 3 deliverable: every YES cell in the compatibility table must be a
// genuinely playable pairing, not merely a declared one.
//
// A YES pair that renders but cannot express its own target, or that collapses
// to a single reachable value, is an unwinnable puzzle waiting for a seed to
// find it. See docs/WrongUInverse-technical-design.md §18.

import { describe, expect, it } from 'vitest';
import { generateDomain, hasDomainGenerator } from '../domains/index.ts';
import { conventionalSemantic, pairsWithCompatibility } from './compatibility.ts';
import { createRng } from './seededRandom.ts';
import { generateRun } from './mappingGenerator.ts';
import { implementedWidgets, reachableValues, supports } from '../../widgets/registry.ts';
import type { SemanticType, WidgetType } from '../state/types.ts';

/** Every YES pair whose widget and semantic both exist today. */
const LIVE_YES_PAIRS = pairsWithCompatibility('yes').filter(
  ({ widget, semantic }) => implementedWidgets().includes(widget) && hasDomainGenerator(semantic),
);

const SEEDS = Array.from({ length: 25 }, (_, i) => `yes-pair-${i}`);

function label(widget: WidgetType, semantic: SemanticType) {
  return `${widget} → ${semantic}`;
}

describe('every YES pairing is playable', () => {
  it('covers the whole V0 vocabulary', () => {
    // Guards against the suite silently shrinking if a registry entry is lost.
    expect(implementedWidgets()).toHaveLength(8);
    expect(LIVE_YES_PAIRS.length).toBeGreaterThanOrEqual(30);
  });

  it.each(LIVE_YES_PAIRS.map((p) => [label(p.widget, p.semantic), p] as const))(
    '%s',
    (_name, pair) => {
      const { widget, semantic } = pair;

      // Declared renderable.
      expect(supports(widget, semantic)).toBe(true);

      // Never a conventional pairing — those belong to calibration only.
      expect(semantic).not.toBe(conventionalSemantic(widget));

      for (const seed of SEEDS) {
        const domain = generateDomain(semantic, createRng(seed));
        const reachable = reachableValues(widget, domain);

        // Offers a real choice rather than one stuck value.
        expect(reachable.length).toBeGreaterThanOrEqual(2);

        // Round-trips: every reachable value survives normalize/denormalize,
        // so the control can actually hold what the player set.
        for (const value of reachable.slice(0, 12)) {
          const again = domain.denormalize(domain.normalize(value));
          expect(domain.equals(value, again)).toBe(true);
        }

        // Renders as something readable.
        for (const value of reachable.slice(0, 12)) {
          expect(String(domain.display(value)).length).toBeGreaterThan(0);
        }
      }
    },
  );
});

describe('generated runs across the full vocabulary', () => {
  const runs = Array.from({ length: 300 }, (_, i) => generateRun({ seed: `full-${i}`, count: 5 }));

  it('always produces a reachable target for the mapped widget', () => {
    for (const run of runs) {
      for (const { widget, domain } of run.mappings) {
        const reachable = reachableValues(widget, domain);
        expect(reachable.some((v) => domain.equals(v, domain.target))).toBe(true);
      }
    }
  });

  it('uses more than one shape of universe', () => {
    const shapes = new Set(
      runs.map((r) =>
        r.mappings
          .map((m) => `${m.widget}:${m.semantic}`)
          .sort()
          .join('|'),
      ),
    );
    // With 8 widgets and 7 semantics this should be in the hundreds; a low
    // number means the generator has collapsed onto a few assignments.
    expect(shapes.size).toBeGreaterThan(100);
  });
});
