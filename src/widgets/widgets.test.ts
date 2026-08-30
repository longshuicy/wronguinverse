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
import { shiftableWidgets, shiftedOperations, supportsOperation } from './operations.ts';
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

describe('operation shift (tier 2)', () => {
  it('every implemented widget has a shifted gesture to offer', () => {
    // A tier 2 run shifts EVERY control. A widget with an empty row would
    // silently fall back to `native` and quietly hand the player a free one.
    for (const widget of implementedWidgets()) {
      expect(shiftedOperations(widget).length).toBeGreaterThan(0);
    }
  });

  it('never offers a gesture the adapter does not implement', () => {
    for (const widget of implementedWidgets()) {
      for (const operation of shiftedOperations(widget)) {
        expect(operation).not.toBe('native');
        expect(supportsOperation(widget, operation)).toBe(true);
      }
    }
  });

  it('leaves at least two values reachable under every shifted gesture', () => {
    // Coarsening a control is fine; stranding it on one value is not.
    for (const widget of shiftableWidgets()) {
      for (const operation of shiftedOperations(widget)) {
        for (const semantic of implementedSemantics()) {
          if (!supports(widget, semantic)) continue;
          for (const seed of SEEDS.slice(0, 10)) {
            const domain = generateDomain(semantic, createRng(seed));
            expect(reachableValues(widget, domain, operation).length).toBeGreaterThanOrEqual(2);
          }
        }
      }
    }
  });

  it('never invents a value the native control could not reach', () => {
    // A gesture may take reach AWAY — a clicked slider is coarser than a
    // dragged one — but it must never open up a value the control cannot
    // otherwise express, or the shift would be changing the domain rather
    // than the gesture.
    for (const widget of shiftableWidgets()) {
      for (const operation of shiftedOperations(widget)) {
        for (const semantic of implementedSemantics()) {
          if (!supports(widget, semantic)) continue;
          const domain = generateDomain(semantic, createRng(`${widget}-${semantic}-subset`));
          const native = new Set(
            reachableValues(widget, domain).map((value) => domain.display(value)),
          );
          for (const value of reachableValues(widget, domain, operation)) {
            expect(native.has(domain.display(value))).toBe(true);
          }
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
  // The regions are the days that mean something; every other day snaps to the
  // nearest of them, which is how the calendar refuses a dead date given that a
  // native date input cannot grey individual days out.
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

  it('covers the whole year, so every date snaps to a meaningful one', () => {
    // Regions are found by walking consecutive days, so they tile the span with
    // no gaps: whatever day a player picks falls inside one, and the nearest
    // region start is always a day that changes the reading.
    for (const semantic of ['boolean', 'choice'] as const) {
      for (const seed of SEEDS.slice(0, 12)) {
        const domain = generateDomain(semantic, createRng(seed));
        const regions = calendarRegions(domain);

        expect(regions[0]!.position).toBe(0);
        const covered = regions.reduce((total, region) => total + region.days, 0);
        // 2097 is not a leap year, and the walk includes both endpoints.
        expect(covered).toBe(365);
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
