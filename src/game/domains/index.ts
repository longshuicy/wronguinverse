// index.ts
// The semantic domain registry, plus the generic capability helpers widgets use
// to interrogate a domain they know nothing about.

import type { Rng } from '../generator/seededRandom.ts';
import type { AnyDomain, SemanticType } from '../state/types.ts';
import { generateBooleanDomain } from './boolean.ts';
import { generateChoiceDomain } from './choice.ts';
import { generateColorDomain } from './color.ts';
import { generateDateDomain } from './date.ts';
import { indexToPosition } from './defineDomain.ts';
import { generateNumberDomain } from './number.ts';
import { generateQuantityDomain } from './quantity.ts';
import { generateTextDomain } from './text.ts';
import { generateTimeDomain } from './time.ts';

export type DomainGenerator = (rng: Rng) => AnyDomain;

/**
 * Sparse: only the semantics implemented so far appear. `generateDomain` throws
 * on anything missing, and `implementedSemantics()` is what the mapping
 * generator draws from, so an unimplemented semantic can never reach a player.
 */
/** The full V0 semantic vocabulary — game design §7. */
const DOMAIN_GENERATORS: Partial<Record<SemanticType, DomainGenerator>> = {
  boolean: generateBooleanDomain,
  choice: generateChoiceDomain,
  quantity: generateQuantityDomain,
  number: generateNumberDomain,
  text: generateTextDomain,
  date: generateDateDomain,
  time: generateTimeDomain,
  color: generateColorDomain,
};

export function implementedSemantics(): SemanticType[] {
  return Object.keys(DOMAIN_GENERATORS) as SemanticType[];
}

export function hasDomainGenerator(semantic: SemanticType): boolean {
  return semantic in DOMAIN_GENERATORS;
}

export function generateDomain(semantic: SemanticType, rng: Rng): AnyDomain {
  const generator = DOMAIN_GENERATORS[semantic];
  if (!generator) {
    throw new Error(`No domain generator registered for semantic "${semantic}"`);
  }
  return generator(rng);
}

/** A domain is discrete when it ships an explicit value list. */
export function isDiscrete(domain: AnyDomain): boolean {
  return Array.isArray(domain.values) && domain.values.length > 0;
}

/**
 * Candidate values for a widget that can only show a finite list — a dropdown's
 * options, a checkbox group's rows.
 *
 * Discrete domains hand back their own values. Continuous ones get sampled
 * evenly across `[0, 1]` and de-duplicated, so a 0-100 quantity becomes a
 * sensible option list without the widget knowing it is a quantity at all.
 */
export function enumerateDomain(domain: AnyDomain, maxItems = 12): unknown[] {
  if (isDiscrete(domain)) {
    return domain.values!.slice(0, maxItems);
  }

  const slots = Math.max(2, maxItems);
  const seen = new Set<string>();
  const out: unknown[] = [];
  for (let i = 0; i < slots; i += 1) {
    const value = domain.denormalize(indexToPosition(i, slots));
    const key = domain.display(value);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

/** The value a widget should start on before the player touches it. */
export function initialValue(domain: AnyDomain): unknown {
  return domain.denormalize(0);
}
