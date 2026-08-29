// challengeGenerator.ts
// Turns a run's mappings into the compound objective the player must execute.
//
// Requirements are drawn from the domains already assigned to this universe, so
// a challenge can only ever ask for something the player could have discovered
// and can physically enter. See docs/WrongUInverse-technical-design.md §14.

import { CHALLENGE_FIELD_LABELS } from '../../content/words.ts';
import type { Mapping, Requirement } from '../state/types.ts';
import type { Rng } from './seededRandom.ts';

const FALLBACK_LABELS = ['READING', 'CHANNEL', 'INDEX', 'VECTOR', 'PHASE', 'MARKER'];

/**
 * Build `count` requirements from the run's mappings.
 *
 * Targets are read straight off each domain — the mapping generator has already
 * guaranteed they are reachable through the widget they landed on, so no
 * unsolvable line can appear here.
 */
export function generateChallenge(mappings: Mapping[], count: number, rng: Rng): Requirement[] {
  const chosen = rng.sample(mappings, Math.min(count, mappings.length));
  const usedLabels = new Set<string>();

  return chosen.map((mapping) => {
    const candidates = CHALLENGE_FIELD_LABELS[mapping.semantic] ?? FALLBACK_LABELS;
    const free = candidates.filter((label) => !usedLabels.has(label));
    // Two mappings can share a semantic pool only once the vocabulary grows;
    // fall back rather than repeat a field name on the same card.
    const pool = free.length > 0 ? free : FALLBACK_LABELS.filter((l) => !usedLabels.has(l));
    const label = pool.length > 0 ? rng.pick(pool) : `READING ${usedLabels.size + 1}`;
    usedLabels.add(label);

    return {
      widget: mapping.widget,
      label,
      targetDisplay: mapping.domain.display(mapping.domain.target),
    };
  });
}

/** Is this requirement currently satisfied by the player's value for its widget? */
export function isRequirementSatisfied(
  requirement: Requirement,
  mappings: Mapping[],
  values: Partial<Record<string, unknown>>,
): boolean {
  const mapping = mappings.find((m) => m.widget === requirement.widget);
  if (!mapping) return false;
  const value = values[requirement.widget];
  if (value === undefined) return false;
  return mapping.domain.equals(value, mapping.domain.target);
}
