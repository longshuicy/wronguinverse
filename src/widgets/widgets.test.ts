// widgets.test.ts
// Adapter-level invariants.
//
// The conventional pairings matter most here: Stage 1 calibration exists to
// feel completely ordinary, so a date picker driven by a date domain must show
// that domain's real calendar rather than a position on its own.

import { describe, expect, it } from 'vitest';
import { generateDomain, implementedSemantics } from '../game/domains/index.ts';
import { conventionalSemantic } from '../game/generator/compatibility.ts';
import { createRng } from '../game/generator/seededRandom.ts';
import { generateRun } from '../game/generator/mappingGenerator.ts';
import { calendarRegions } from './DateWidget.tsx';
import { implementedWidgets, reachableValues, supports } from './registry.ts';

const SEEDS = Array.from({ length: 40 }, (_, i) => `widget-seed-${i}`);

describe('widget adapters', () => {
  it('declare positions for every semantic they support', () => {
    for (const widget of implementedWidgets()) {
      for (const semantic of implementedSemantics()) {
        if (!supports(widget, semantic)) continue;
        const domain = generateDomain(semantic, createRng(`${widget}-${semantic}`));
        expect(reachableValues(widget, domain).length).toBeGreaterThan(0);
      }
    }
  });

  it('can reach at least two distinct values for every supported pairing', () => {
    // A control stuck on one value is unplayable regardless of what it means.
    for (const widget of implementedWidgets()) {
      for (const semantic of implementedSemantics()) {
        if (!supports(widget, semantic)) continue;
        for (const seed of SEEDS.slice(0, 10)) {
          const domain = generateDomain(semantic, createRng(seed));
          expect(reachableValues(widget, domain).length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('conventional pairings (Stage 1 calibration)', () => {
  it('lets each widget reach every value of its conventional domain', () => {
    // Calibration asks for an exact value with no trickery. If the widget
    // cannot express its own conventional domain exactly, the tutorial breaks.
    for (const widget of implementedWidgets()) {
      const semantic = conventionalSemantic(widget);
      if (!semantic || !implementedSemantics().includes(semantic)) continue;

      for (const seed of SEEDS) {
        const domain = generateDomain(semantic, createRng(seed));
        const reachable = reachableValues(widget, domain);
        expect(reachable.some((value) => domain.equals(value, domain.target))).toBe(true);
      }
    }
  });

  it('shows a date domain on its own calendar, not the widget span', () => {
    // Regression: the date widget used a hardcoded 2097 span, so a 2092 date
    // domain rendered as 01/01/2097 while reading as JAN 1, 2092.
    for (const seed of SEEDS) {
      const domain = generateDomain('date', createRng(seed));
      const reachable = reachableValues('date', domain) as string[];
      const target = domain.target as string;
      expect(reachable).toContain(target);
      // Every reachable day belongs to the domain's own year, not the widget's.
      const domainYear = target.slice(0, 4);
      for (const value of reachable) expect(value.slice(0, 4)).toBe(domainYear);
    }
  });

  it('builds a full calibration run of conventional pairings only', () => {
    const calibration = generateRun({ seed: 'HOME-UNIVERSE', count: 4, accept: ['normal'] });
    expect(calibration.mappings).toHaveLength(4);
    for (const mapping of calibration.mappings) {
      expect(mapping.semantic).toBe(conventionalSemantic(mapping.widget));
      const reachable = reachableValues(mapping.widget, mapping.domain);
      expect(reachable.some((v) => mapping.domain.equals(v, mapping.domain.target))).toBe(true);
    }
  });
});

describe('calendar regions', () => {
  // A date picker driven by a discrete domain turns a whole year into a handful
  // of values, so most date changes do nothing and the boundaries are invisible.
  // The region strip is the calendar's equivalent of the slider's detents.
  it('marks one region per distinct value when the year collapses', () => {
    for (const semantic of ['boolean', 'choice'] as const) {
      for (const seed of SEEDS.slice(0, 12)) {
        const domain = generateDomain(semantic, createRng(seed));
        const regions = calendarRegions(domain);
        const distinct = reachableValues('date', domain).length;

        expect(regions.length).toBe(distinct);
        expect(regions.length).toBeGreaterThan(1);
        // Every region resolves to a different reading, and clicking one
        // actually produces that reading.
        expect(new Set(regions.map((r) => r.label)).size).toBe(regions.length);
        for (const region of regions) {
          expect(domain.display(domain.denormalize(region.position))).toBe(region.label);
        }
      }
    }
  });

  it('stays out of the way when the calendar is dense enough to scrub', () => {
    // A real date domain changes value almost every day, and a 0-100 quantity
    // changes every few days. Both give continuous feedback while dragging, so
    // a strip of hairline segments would be noise rather than help.
    for (const seed of SEEDS.slice(0, 8)) {
      expect(calendarRegions(generateDomain('date', createRng(seed)))).toEqual([]);
    }
    const dense = generateDomain('number', createRng('dense-number'));
    if (reachableValues('date', dense).length > 32) {
      expect(calendarRegions(dense)).toEqual([]);
    }
  });
});
