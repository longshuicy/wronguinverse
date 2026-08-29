// mappingGenerator.test.ts
// The generator is the one place that decides what a universe is. These are the
// invariants from technical design §18 — including the randomized/property pass.

import { describe, expect, it } from 'vitest';
import { implementedSemantics } from '../domains/index.ts';
import { implementedWidgets, reachableValues, supports } from '../../widgets/registry.ts';
import { conventionalSemantic, getCompatibility, pairsWithCompatibility } from './compatibility.ts';
import { generateRun, MappingGenerationError, maxMappingCount } from './mappingGenerator.ts';

const RUNS = Array.from({ length: 400 }, (_, i) => generateRun({ seed: `run-${i}` }));

describe('generateRun', () => {
  it('returns the requested number of mappings', () => {
    for (const run of RUNS) expect(run.mappings).toHaveLength(4);
  });

  it('never repeats a widget or a semantic within a run', () => {
    for (const run of RUNS) {
      expect(new Set(run.mappings.map((m) => m.widget)).size).toBe(run.mappings.length);
      expect(new Set(run.mappings.map((m) => m.semantic)).size).toBe(run.mappings.length);
    }
  });

  it('only ever emits YES pairings in shift mode', () => {
    for (const run of RUNS) {
      for (const { widget, semantic } of run.mappings) {
        expect(getCompatibility(widget, semantic)).toBe('yes');
      }
    }
  });

  it('never emits a conventional pairing', () => {
    // The whole premise breaks if a slider still means quantity.
    for (const run of RUNS) {
      for (const { widget, semantic } of run.mappings) {
        expect(semantic).not.toBe(conventionalSemantic(widget));
      }
    }
  });

  it('never emits a pairing the renderer cannot draw', () => {
    for (const run of RUNS) {
      for (const { widget, semantic } of run.mappings) {
        expect(supports(widget, semantic)).toBe(true);
      }
    }
  });

  it('attaches a domain matching each mapping semantic', () => {
    for (const run of RUNS) {
      for (const { semantic, domain } of run.mappings) {
        expect(domain.type).toBe(semantic);
      }
    }
  });

  it('produces a target the mapped widget can physically reach', () => {
    // The stricter of the two reachability checks: not merely "the domain can
    // represent this value" but "the player can enter it with THIS control".
    // A 12-option dropdown cannot reach all 21 values of a -10..10 quantity.
    for (const run of RUNS) {
      for (const { widget, domain } of run.mappings) {
        const reachable = reachableValues(widget, domain);
        expect(reachable.some((value) => domain.equals(value, domain.target))).toBe(true);
      }
    }
  });

  it('keeps every mapping target inside its own domain', () => {
    for (const run of RUNS) {
      for (const { domain } of run.mappings) {
        const position = domain.normalize(domain.target);
        expect(position).toBeGreaterThanOrEqual(0);
        expect(position).toBeLessThanOrEqual(1);
        expect(domain.equals(domain.denormalize(position), domain.target)).toBe(true);
      }
    }
  });

  it('is fully deterministic for a given seed', () => {
    const a = generateRun({ seed: 'REALITY-Q7M2' });
    const b = generateRun({ seed: 'REALITY-Q7M2' });
    expect(a.mappings.map((m) => [m.widget, m.semantic])).toEqual(
      b.mappings.map((m) => [m.widget, m.semantic]),
    );
    for (let i = 0; i < a.mappings.length; i += 1) {
      const left = a.mappings[i]!.domain;
      const right = b.mappings[i]!.domain;
      expect(left.target).toEqual(right.target);
      expect(left.display(left.target)).toBe(right.display(right.target));
    }
  });

  it('explores more than one universe shape across seeds', () => {
    // A generator that always returns the same assignment would pass every
    // invariant above while making the game pointless.
    const shapes = new Set(
      RUNS.map((run) =>
        run.mappings
          .map((m) => `${m.widget}:${m.semantic}`)
          .sort()
          .join('|'),
      ),
    );
    expect(shapes.size).toBeGreaterThan(1);
  });

  it('throws rather than weakening compatibility when no assignment exists', () => {
    expect(() => generateRun({ seed: 'impossible', count: 99 })).toThrow(MappingGenerationError);
  });

  it('honours an explicit widget pool', () => {
    const run = generateRun({ seed: 'pool', count: 2, widgets: ['slider', 'dropdown'] });
    expect(run.mappings.map((m) => m.widget).sort()).toEqual(['dropdown', 'slider']);
  });
});

describe('compatibility table', () => {
  it('gives every implemented widget exactly one conventional semantic', () => {
    for (const widget of implementedWidgets()) {
      expect(conventionalSemantic(widget)).toBeDefined();
    }
  });

  it('defaults unlisted pairings to no', () => {
    expect(getCompatibility('calculator', 'arithmetic')).toBe('no');
  });

  it('has a renderer for every YES pair among implemented widgets and semantics', () => {
    // Technical design §18: a YES cell the renderer cannot draw is a latent bug.
    const semantics = new Set<string>(implementedSemantics());
    const widgets = new Set<string>(implementedWidgets());
    const gaps = pairsWithCompatibility('yes')
      .filter(({ widget, semantic }) => widgets.has(widget) && semantics.has(semantic))
      .filter(({ widget, semantic }) => !supports(widget, semantic));
    expect(gaps).toEqual([]);
  });
});

describe('maxMappingCount', () => {
  it('reports a count the generator can actually deliver', () => {
    const max = maxMappingCount();
    expect(max).toBeGreaterThanOrEqual(4);
    expect(() => generateRun({ seed: 'max', count: max })).not.toThrow();
    expect(() => generateRun({ seed: 'max', count: max + 1 })).toThrow(MappingGenerationError);
  });
});
