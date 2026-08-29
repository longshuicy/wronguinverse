// compatibility.ts
// Which widgets may stand in for which semantics, as data.
//
// This table is the ONLY place pairings are decided. Generation logic reads it;
// nothing anywhere else may branch on a specific widget/semantic combination.
// See docs/WrongUInverse-technical-design.md §7 and the matrix in
// docs/WrongUInverse-game-design.md §8.

import type { Compatibility, SemanticType, WidgetType } from '../state/types.ts';

type CompatibilityRow = Partial<Record<SemanticType, Compatibility>>;

/**
 * Sparse by design: any cell left out is treated as `no`. That keeps the table
 * readable and means adding a widget or semantic to the type unions cannot
 * silently open up untested pairings.
 */
const COMPATIBILITY: Partial<Record<WidgetType, CompatibilityRow>> = {
  slider: {
    boolean: 'yes',
    choice: 'yes',
    quantity: 'normal',
    number: 'yes',
    text: 'no',
    date: 'yes',
    color: 'yes',
  },
  checkbox: {
    boolean: 'normal',
    choice: 'yes',
    quantity: 'yes',
    number: 'yes',
    text: 'no',
    date: 'no',
    color: 'maybe',
  },
  radio: {
    boolean: 'yes',
    choice: 'normal',
    quantity: 'yes',
    number: 'yes',
    text: 'maybe',
    date: 'yes',
    color: 'yes',
  },
  dropdown: {
    boolean: 'yes',
    choice: 'normal',
    quantity: 'yes',
    number: 'yes',
    text: 'yes',
    date: 'yes',
    color: 'yes',
  },
  number: {
    boolean: 'yes',
    choice: 'yes',
    quantity: 'yes',
    number: 'normal',
    text: 'maybe',
    date: 'yes',
    color: 'yes',
  },
  text: {
    boolean: 'yes',
    choice: 'yes',
    quantity: 'yes',
    number: 'yes',
    text: 'normal',
    date: 'yes',
    color: 'yes',
  },
  date: {
    boolean: 'yes',
    choice: 'yes',
    quantity: 'yes',
    number: 'yes',
    text: 'no',
    date: 'normal',
    color: 'maybe',
  },
  color: {
    boolean: 'yes',
    choice: 'yes',
    quantity: 'yes',
    number: 'yes',
    text: 'no',
    date: 'maybe',
    color: 'normal',
  },
};

/** Compatibility for a pair. Unlisted pairs are `no`. */
export function getCompatibility(widget: WidgetType, semantic: SemanticType): Compatibility {
  return COMPATIBILITY[widget]?.[semantic] ?? 'no';
}

/** The conventional partner for a widget — the `normal` cell in its row, if any. */
export function conventionalSemantic(widget: WidgetType): SemanticType | undefined {
  const row = COMPATIBILITY[widget];
  if (!row) return undefined;
  for (const [semantic, value] of Object.entries(row) as [SemanticType, Compatibility][]) {
    if (value === 'normal') return semantic;
  }
  return undefined;
}

/** Every pair at a given compatibility level. Used by tests and the generator. */
export function pairsWithCompatibility(
  level: Compatibility,
): { widget: WidgetType; semantic: SemanticType }[] {
  const out: { widget: WidgetType; semantic: SemanticType }[] = [];
  for (const [widget, row] of Object.entries(COMPATIBILITY) as [WidgetType, CompatibilityRow][]) {
    for (const [semantic, value] of Object.entries(row) as [SemanticType, Compatibility][]) {
      if (value === level) out.push({ widget, semantic });
    }
  }
  return out;
}

/** Widgets that appear in the table at all. */
export function widgetsInTable(): WidgetType[] {
  return Object.keys(COMPATIBILITY) as WidgetType[];
}
