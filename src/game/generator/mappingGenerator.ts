// mappingGenerator.ts
// Chooses which widgets appear in a run and what each one secretly means.
//
// Uses backtracking search over a shuffled candidate order rather than repeated
// blind random retries, so a valid mapping is found whenever one exists.
// See docs/WrongUInverse-technical-design.md §8.

import {
  generateDomain,
  hasDomainGenerator,
  implementedSemantics,
  initialValue,
} from '../domains/index.ts';
import type {
  Compatibility,
  Mapping,
  RunConfig,
  SemanticType,
  WidgetType,
} from '../state/types.ts';
import { implementedWidgets, reachableValues, supports } from '../../widgets/registry.ts';
import { getCompatibility } from './compatibility.ts';
import { createRng, type Rng } from './seededRandom.ts';

export interface GenerateRunOptions {
  seed: string;
  /** How many widget/semantic pairs the universe contains. */
  count?: number;
  widgets?: WidgetType[];
  semantics?: SemanticType[];
  /**
   * Compatibility levels the generator may use. V0 shift mode accepts only
   * `yes`, which by construction excludes every conventional (`normal`) pairing.
   */
  accept?: Compatibility[];
}

export class MappingGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MappingGenerationError';
  }
}

/** Both gates: the pairing must be a good idea AND renderable. */
function isPairingAllowed(
  widget: WidgetType,
  semantic: SemanticType,
  accept: Compatibility[],
): boolean {
  return (
    accept.includes(getCompatibility(widget, semantic)) &&
    supports(widget, semantic) &&
    hasDomainGenerator(semantic)
  );
}

/**
 * Find `count` widget→semantic pairs, each widget and each semantic used at most
 * once.
 *
 * Walks the shuffled widget list assigning a semantic where possible and
 * skipping where not, backtracking on dead ends. Candidate order is shuffled
 * beforehand, so taking the first solution found is still a seeded random choice
 * rather than a biased one.
 */
function findAssignment(
  widgets: WidgetType[],
  semantics: SemanticType[],
  count: number,
  accept: Compatibility[],
): { widget: WidgetType; semantic: SemanticType }[] | null {
  const chosen: { widget: WidgetType; semantic: SemanticType }[] = [];
  const usedSemantics = new Set<SemanticType>();

  const search = (widgetIndex: number): boolean => {
    if (chosen.length === count) return true;
    // Prune: not enough widgets left to reach `count`.
    if (widgets.length - widgetIndex < count - chosen.length) return false;

    const widget = widgets[widgetIndex]!;

    for (const semantic of semantics) {
      if (usedSemantics.has(semantic)) continue;
      if (!isPairingAllowed(widget, semantic, accept)) continue;

      chosen.push({ widget, semantic });
      usedSemantics.add(semantic);
      if (search(widgetIndex + 1)) return true;
      chosen.pop();
      usedSemantics.delete(semantic);
    }

    // Leave this widget out of the run entirely.
    return search(widgetIndex + 1);
  };

  return search(0) ? chosen : null;
}

/**
 * Generate a complete universe from a seed.
 *
 * The same seed always yields the same widgets, semantics, labels and targets:
 * a single RNG stream drives selection and every domain generator in turn.
 */
export function generateRun(options: GenerateRunOptions): RunConfig {
  const {
    seed,
    count = 4,
    widgets = implementedWidgets(),
    semantics = implementedSemantics(),
    accept = ['yes'],
  } = options;

  const rng: Rng = createRng(seed);
  const assignment = findAssignment(rng.shuffle(widgets), rng.shuffle(semantics), count, accept);

  if (!assignment) {
    throw new MappingGenerationError(
      `Could not build ${count} mappings from ${widgets.length} widgets and ` +
        `${semantics.length} semantics at compatibility [${accept.join(', ')}]. ` +
        `Reduce the mapping count rather than weakening compatibility.`,
    );
  }

  const mappings: Mapping[] = assignment.map(({ widget, semantic }) => {
    const domain = generateDomain(semantic, rng);

    // A domain generates a target from its own full value space, but the widget
    // it landed on has finite resolution and may not be able to express it — a
    // 12-option dropdown cannot reach all 21 values of a -10..10 range. Re-draw
    // the target from what this widget can actually produce so the challenge is
    // always inputtable (technical design §14).
    const reachable = reachableValues(widget, domain);
    if (reachable.length === 0) {
      throw new MappingGenerationError(
        `Widget "${widget}" cannot reach any value of its "${semantic}" domain.`,
      );
    }

    // Exclude the widget's resting value. A target the control already sits on
    // is a requirement that satisfies itself before the player does anything —
    // it locks for free in the challenge and gives a calibration task with
    // nothing to do. Keep it only if the control has nowhere else to go.
    const resting = initialValue(domain);
    const candidates = reachable.filter((value) => !domain.equals(value, resting));
    const usable = candidates.length > 0 ? candidates : reachable;

    const target = usable.some((value) => domain.equals(value, domain.target))
      ? domain.target
      : rng.pick(usable);

    return { widget, semantic, domain: { ...domain, target } };
  });

  return { seed, mappings, stage: 'explore' };
}

/** Largest run size buildable from the given pool. Useful for difficulty tuning. */
export function maxMappingCount(
  widgets: WidgetType[] = implementedWidgets(),
  semantics: SemanticType[] = implementedSemantics(),
  accept: Compatibility[] = ['yes'],
): number {
  const ceiling = Math.min(widgets.length, semantics.length);
  for (let count = ceiling; count > 0; count -= 1) {
    if (findAssignment(widgets, semantics, count, accept)) return count;
  }
  return 0;
}
