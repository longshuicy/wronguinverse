// operations.ts
// Which gesture each control may be given, as data.
//
// Tier 2 "Operation Shift" remaps HOW a control is worked rather than what it
// means: a slider you click instead of drag, a checkbox you drag instead of
// click. This table is the only place those pairings are decided — it is to
// gestures what `generator/compatibility.ts` is to semantics.
//
// See docs/WrongUInverse-game-design.md §3.

import type { OperationType, WidgetType } from '../game/state/types.ts';

/**
 * The shifted gestures available per widget.
 *
 * Sparse by design, and `native` deliberately appears in no row: a row lists
 * what the SHIFT may choose, so adding an operation to the type union cannot
 * silently hand players a gesture no adapter implements.
 */
const OPERATIONS: Partial<Record<WidgetType, OperationType[]>> = {
  slider: ['clickStep'],
  checkbox: ['dragToggle'],
  radio: ['holdToSelect'],
  dropdown: ['wheelCycle'],
  number: ['wheelCycle'],
  text: ['commitOnEnter'],
  date: ['stepArrows'],
  color: ['holdToSelect'],
};

/** Gestures the shift may give this widget. Empty means it is never shifted. */
export function shiftedOperations(widget: WidgetType): OperationType[] {
  return OPERATIONS[widget] ?? [];
}

/** Is this a gesture the widget's adapter actually implements? */
export function supportsOperation(widget: WidgetType, operation: OperationType): boolean {
  return operation === 'native' || shiftedOperations(widget).includes(operation);
}

/** Widgets that can carry an operation shift at all. Used by tests. */
export function shiftableWidgets(): WidgetType[] {
  return (Object.keys(OPERATIONS) as WidgetType[]).filter(
    (widget) => shiftedOperations(widget).length > 0,
  );
}
