// registry.ts
// Which widgets exist, and which semantics each one can actually render.
//
// This is the second of two independent gates on a mapping:
//   - compatibility.ts says whether a pairing is a GOOD IDEA (design intent)
//   - this registry says whether it is BUILDABLE TODAY (implementation reality)
// The generator requires both, so an unimplemented pairing can never reach a
// player. See docs/WrongUInverse-technical-design.md §11.

import type { ComponentType } from 'react';
import type {
  AnyDomain,
  SemanticType,
  WidgetAdapterProps,
  WidgetType,
} from '../game/state/types.ts';
import { CheckboxWidget, checkboxPositions } from './CheckboxWidget.tsx';
import { DateWidget, datePositions } from './DateWidget.tsx';
import { DropdownWidget, dropdownPositions } from './DropdownWidget.tsx';
import { SliderWidget, sliderPositions } from './SliderWidget.tsx';

export interface WidgetDefinition {
  type: WidgetType;
  /** Player-facing name of the physical control. */
  label: string;
  component: ComponentType<WidgetAdapterProps>;
  /** Semantics this adapter can represent. */
  supports: SemanticType[];
  /**
   * Every normalized position this control can physically emit for a domain.
   *
   * A control has finite resolution — a dropdown lists 12 options, a slider has
   * 100 detents — so it cannot necessarily reach every value in its domain. The
   * generator uses this to keep targets inputtable.
   */
  positions: (domain: AnyDomain) => number[];
}

const DISCRETE_AND_RANGED: SemanticType[] = ['boolean', 'choice', 'quantity', 'number', 'date'];

/** Milestone 1 vocabulary: slider, checkbox, dropdown, date. */
const WIDGETS: Partial<Record<WidgetType, WidgetDefinition>> = {
  slider: {
    type: 'slider',
    label: 'Slider',
    component: SliderWidget,
    supports: [...DISCRETE_AND_RANGED, 'color'],
    positions: sliderPositions,
  },
  checkbox: {
    type: 'checkbox',
    label: 'Checkbox group',
    component: CheckboxWidget,
    // No date: a checkbox group cannot express a full calendar legibly.
    supports: ['boolean', 'choice', 'quantity', 'number'],
    positions: checkboxPositions,
  },
  dropdown: {
    type: 'dropdown',
    label: 'Dropdown',
    component: DropdownWidget,
    // A dropdown can list anything that can be enumerated.
    supports: [...DISCRETE_AND_RANGED, 'text', 'color'],
    positions: dropdownPositions,
  },
  date: {
    type: 'date',
    label: 'Date picker',
    component: DateWidget,
    supports: [...DISCRETE_AND_RANGED],
    positions: datePositions,
  },
};

export function getWidgetDefinition(widget: WidgetType): WidgetDefinition | undefined {
  return WIDGETS[widget];
}

/** Widgets with a working adapter. The generator draws only from these. */
export function implementedWidgets(): WidgetType[] {
  return Object.keys(WIDGETS) as WidgetType[];
}

/** Can this adapter render this semantic at all? */
export function supports(widget: WidgetType, semantic: SemanticType): boolean {
  return WIDGETS[widget]?.supports.includes(semantic) ?? false;
}

/**
 * The distinct domain values a player can actually produce with this widget.
 *
 * De-duplicated by display label: two positions that render identically are one
 * choice as far as the player is concerned. This is the set a challenge target
 * must be drawn from — see technical design §14, "do not generate a challenge
 * value that was impossible to discover or input".
 */
export function reachableValues(widget: WidgetType, domain: AnyDomain): unknown[] {
  const definition = WIDGETS[widget];
  if (!definition) return [];

  const seen = new Set<string>();
  const out: unknown[] = [];
  for (const position of definition.positions(domain)) {
    const value = domain.denormalize(position);
    const label = domain.display(value);
    if (seen.has(label)) continue;
    seen.add(label);
    out.push(value);
  }
  return out;
}
