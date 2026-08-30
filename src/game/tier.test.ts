// tier.test.ts
// The tier LADDER's shape, which is a design decision rather than an
// implementation detail — and the one most likely to be undone by accident
// later, since "tier 3 is the hardest so it should have everything" is the
// obvious reading and the wrong one.

import { describe, expect, it } from 'vitest';
import { createRng } from './generator/seededRandom.ts';
import { getPointerLaw, pickPointerLaw } from './pointerLaw.ts';
import { availableTiers, getTier } from './tier.ts';

describe('tiers', () => {
  it('layers the operation shift on tier 2 only', () => {
    expect(getTier(1).operationShift).toBe(false);
    expect(getTier(2).operationShift).toBe(true);
  });

  it('keeps tier 3 off the operation shift', () => {
    // Tier 3 branches off tier 1. Stacking a pointer law on top of per-widget
    // gestures produces pairings with no readable behaviour — a checkbox that
    // wants a drag, under a law that already committed it on hover. If this
    // ever needs to change, it is a deliberate feature with an exclusion list,
    // not a flag flip. See the note at the top of `tier.ts`.
    expect(getTier(3).operationShift).toBe(false);
    expect(getTier(3).pointerLaws?.length).toBeGreaterThan(0);
  });

  it('gives no tier below 3 a pointer law', () => {
    expect(getTier(1).pointerLaws).toBeUndefined();
    expect(getTier(2).pointerLaws).toBeUndefined();
  });

  it('names only real laws, each of which the player is told for free', () => {
    for (const tier of availableTiers()) {
      for (const id of tier.pointerLaws ?? []) {
        const law = getPointerLaw(id);
        expect(law).toBeDefined();
        // The strip is the whole disclosure: a law with nothing printed on it
        // would be a rule the player can only discover by losing to it.
        expect(law.strip.length).toBeGreaterThan(0);
        expect(law.advice.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('drawing a law', () => {
  const pool = getTier(3).pointerLaws ?? [];

  it('is reproducible from a seed', () => {
    // `?seed=` has to reproduce the cursor as well as the mappings, or a Tier 3
    // bug cannot be handed to anyone else.
    expect(pickPointerLaw(pool, createRng('REALITY-AAAA::law'))).toBe(
      pickPointerLaw(pool, createRng('REALITY-AAAA::law')),
    );
  });

  it('reaches every law in the pool', () => {
    // Guards the draw itself: an off-by-one that made the last law unreachable
    // would just look like bad luck.
    const seen = new Set(
      Array.from({ length: 200 }, (_, i) => pickPointerLaw(pool, createRng(`seed-${i}::law`))),
    );
    expect(seen.size).toBe(pool.length);
  });
});
